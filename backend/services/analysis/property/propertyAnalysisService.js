// backend/services/analysis/property/propertyAnalysisService.js

const { analyzeRulesV1 } = require("./engines/rulesV1Analyzer");
const { createPropertyAnalysis, getPropertyAnalysisById } = require("../../firestore/analysisRepository");

const { getPropertySnapshotByAddress, ProviderError } = require("../../providers/rentcast/rentcastClient");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function makeBadRequestError(message, details) {
  const err = new Error(message);
  err.name = "BadRequestError";
  err.statusCode = 400;
  err.details = details || [];
  return err;
}

function makeBadGatewayError(message, details) {
  const err = new Error(message);
  err.name = "BadGatewayError";
  err.statusCode = 502;
  err.details = details || [];
  return err;
}

function makeNotFoundError(message) {
  const err = new Error(message || "Not Found");
  err.name = "NotFoundError";
  err.statusCode = 404;
  return err;
}

function hasAddressMinimum(a) {
  return (
    a &&
    typeof a === "object" &&
    typeof a.line1 === "string" &&
    a.line1.trim().length > 0 &&
    typeof a.city === "string" &&
    a.city.trim().length > 0 &&
    typeof a.state === "string" &&
    a.state.trim().length > 0 &&
    typeof a.postalCode === "string" &&
    a.postalCode.trim().length > 0
  );
}

function shouldEnrichWithRentCast(payload, options) {
  if (options && options.enrichProvider === "rentcast") return true;
  const enrich = payload && payload.enrich;
  return enrich && enrich.provider === "rentcast";
}

/**
 * If requested and enabled, fetch provider data and attach it to a non-destructive location:
 * enriched.raw.provider.rentcastSnapshot = <raw provider response>
 *
 * Additionally, backfill canonical-shaped fields (address.county, geo, characteristics, etc.)
 * from RentCast when missing so the analyzer can use them.
 *
 * Returns: { enrichedProperty, sources }
 */
async function maybeEnrichWithRentCast(payload, rawPropertyInput, options) {
  const enabled = process.env.USE_RENTCAST === "true";
  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";

  if (!shouldEnrichWithRentCast(payload, options)) {
    return { enrichedProperty: rawPropertyInput, sources: null };
  }

  if (!enabled || isProd) {
    throw makeBadRequestError("Provider enrichment is not enabled.", [
      {
        field: "enrich.provider",
        message: "rentcast enrichment is not available in this environment.",
      },
    ]);
  }

  const address = rawPropertyInput && rawPropertyInput.address;
  if (!hasAddressMinimum(address)) {
    throw makeBadRequestError("RentCast enrichment requires address minimum.", [
      { field: "address", message: "Provide line1, city, state, and postalCode." },
    ]);
  }

  const fetchedAtIso = new Date().toISOString();

  try {
    const snapshot = await getPropertySnapshotByAddress(address, { timeoutMs: 8000 });

    // Do not overwrite user-provided fields. Attach provider payload as raw reference only.
    const enrichedProperty = { ...rawPropertyInput };
    enrichedProperty.raw =
      enrichedProperty.raw && typeof enrichedProperty.raw === "object" ? { ...enrichedProperty.raw } : {};
    enrichedProperty.raw.provider =
      enrichedProperty.raw.provider && typeof enrichedProperty.raw.provider === "object"
        ? { ...enrichedProperty.raw.provider }
        : {};
    enrichedProperty.raw.provider.rentcastSnapshot = snapshot;

    // Backfill canonical-shaped fields from RentCast when missing (non-destructive).
    // RentCast snapshot is typically an array; use first result.
    const rc = Array.isArray(snapshot) ? snapshot[0] : snapshot;

    if (rc && typeof rc === "object") {
      // address.county
      const addr =
        enrichedProperty.address && typeof enrichedProperty.address === "object" ? { ...enrichedProperty.address } : {};
      if (!isNonEmptyString(addr.county) && isNonEmptyString(rc.county)) {
        addr.county = rc.county;
      }
      enrichedProperty.address = addr;

      // geo (store as { lat, lng } to match canonical expectations)
      const hasGeo = enrichedProperty.geo && typeof enrichedProperty.geo === "object";
      const hasLat = typeof rc.latitude === "number" && Number.isFinite(rc.latitude);
      const hasLng = typeof rc.longitude === "number" && Number.isFinite(rc.longitude);
      if (!hasGeo && hasLat && hasLng) {
        enrichedProperty.geo = { lat: rc.latitude, lng: rc.longitude };
      }

      // characteristics: yearBuilt, bedrooms, bathrooms
      const ch =
        enrichedProperty.characteristics && typeof enrichedProperty.characteristics === "object"
          ? { ...enrichedProperty.characteristics }
          : {};
      if ((ch.yearBuilt === null || ch.yearBuilt === undefined) && Number.isFinite(rc.yearBuilt)) {
        ch.yearBuilt = rc.yearBuilt;
      }
      if ((ch.bedrooms === null || ch.bedrooms === undefined) && Number.isFinite(rc.bedrooms)) {
        ch.bedrooms = rc.bedrooms;
      }
      if (
        (ch.bathrooms === null || ch.bathrooms === undefined) &&
        typeof rc.bathrooms === "number" &&
        Number.isFinite(rc.bathrooms)
      ) {
        ch.bathrooms = rc.bathrooms;
      }
      enrichedProperty.characteristics = ch;

      // occupancy.ownerOccupied (only if RentCast provides it)
      const occ =
        enrichedProperty.occupancy && typeof enrichedProperty.occupancy === "object" ? { ...enrichedProperty.occupancy } : {};
      if ((occ.ownerOccupied === null || occ.ownerOccupied === undefined) && typeof rc.ownerOccupied === "boolean") {
        occ.ownerOccupied = rc.ownerOccupied;
      }
      enrichedProperty.occupancy = occ;

      // provider.rentcastPropertyType (enables canonical type mapping, e.g. Manufactured -> single_family)
      const prov =
        enrichedProperty.provider && typeof enrichedProperty.provider === "object" ? { ...enrichedProperty.provider } : {};
      if (!isNonEmptyString(prov.rentcastPropertyType) && isNonEmptyString(rc.propertyType)) {
        prov.rentcastPropertyType = rc.propertyType;
      }
      enrichedProperty.provider = prov;
    }

    const sources = {
      rentcast: {
        fetchedAtIso,
        data: snapshot,
      },
    };

    return { enrichedProperty, sources };
  } catch (err) {
  if (err instanceof ProviderError) {
    throw makeBadGatewayError("RentCast enrichment failed.", [
      { provider: "rentcast", code: err.code, status: err.status, details: err.details },
    ]);
  }
  throw err;
}

}/**
 * payload is expected to be the request body.
 * Supports both shapes:
 *  - { property: {...} } (preferred)
 *  - { ... } (legacy direct property payload)
 */
async function runPropertyAnalysis(payload, options = {}) {
  const { persist = true } = options;

  if (!payload || typeof payload !== "object") {
    throw makeBadRequestError("Request body must be a JSON object.", [{ field: "body", message: "Missing or invalid JSON body." }]);
  }

  const rawPropertyInput = payload.property && typeof payload.property === "object" ? payload.property : payload;

  const { enrichedProperty, sources } = await maybeEnrichWithRentCast(payload, rawPropertyInput, options);

  const analysis = analyzeRulesV1(enrichedProperty);

  if (!analysis.ok) {
    throw makeBadRequestError("Invalid create contract for property analysis.", analysis.errors);
  }

  const report = analysis.report;
  const canonicalProperty = analysis.canonicalProperty;

  const doc = {
    type: "property_analysis",
    engine: report.meta.engine,
    analysisVersion: report.meta.analysisVersion,
    input: canonicalProperty,
    report,
    ...(sources ? { sources } : {}),
  };

  if (!persist) {
    return { id: null, report };
  }

  const stored = await createPropertyAnalysis(doc);
  return { id: stored.id, report: stored.report };
}

/**
 * Base fetch (existing/default response shape).
 * Keep this aligned with your current API default response.
 */
async function fetchPropertyAnalysisBase(id) {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw makeBadRequestError("Missing analysis id.", [{ field: "id", message: "Provide a valid analysis id." }]);
  }

  const stored = await getPropertyAnalysisById(id);
  if (!stored) throw makeNotFoundError("Analysis not found.");

  return {
    id: stored.id,
    report: stored.report,
    createdAt: stored.createdAt,
    // Preserve current default behavior: sources is returned (nullable).
    sources: stored.sources || null,
  };
}

/**
 * Fetch with optional includes.
 * opts: { includeInput?: boolean, includeSources?: boolean }
 *
 * Default behavior remains exactly the base response unless include flags are set.
 */
async function fetchPropertyAnalysis(id, opts = null) {
  const includeInput = Boolean(opts && opts.includeInput);
  const includeSources = Boolean(opts && opts.includeSources);

  // If no includes requested, return the base response exactly.
  if (!includeInput && !includeSources) {
    return fetchPropertyAnalysisBase(id);
  }

  if (typeof id !== "string" || id.trim().length === 0) {
    throw makeBadRequestError("Missing analysis id.", [{ field: "id", message: "Provide a valid analysis id." }]);
  }

  const stored = await getPropertyAnalysisById(id);
  if (!stored) throw makeNotFoundError("Analysis not found.");

  // Start from the base shape to avoid accidental drift.
  const response = {
    id: stored.id,
    report: stored.report,
    createdAt: stored.createdAt,
    // Keep sources behavior consistent; includeSources simply guarantees presence.
    sources: stored.sources || null,
  };

  if (includeInput) {
    response.input = stored.input ?? null;
  }

  if (includeSources && response.sources === undefined) {
    response.sources = stored.sources || null;
  }

  return response;
}

module.exports = {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
};
