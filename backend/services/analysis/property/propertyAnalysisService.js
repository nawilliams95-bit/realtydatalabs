// backend/services/analysis/property/propertyAnalysisService.js

const { analyzeRulesV1 } = require("./engines/rulesV1Analyzer");
const {
  createPropertyAnalysis,
  getPropertyAnalysisById,
} = require("../../firestore/analysisRepository");

const {
  getPropertySnapshotByAddress,
  ProviderError,
} = require("../../providers/rentcast/rentcastClient");

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
      enrichedProperty.raw && typeof enrichedProperty.raw === "object"
        ? { ...enrichedProperty.raw }
        : {};
    enrichedProperty.raw.provider =
      enrichedProperty.raw.provider && typeof enrichedProperty.raw.provider === "object"
        ? { ...enrichedProperty.raw.provider }
        : {};
    enrichedProperty.raw.provider.rentcastSnapshot = snapshot;

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
}

/**
 * payload is expected to be the request body.
 * Supports both shapes:
 *  - { property: {...} } (preferred)
 *  - { ... } (legacy direct property payload)
 */
async function runPropertyAnalysis(payload, options = {}) {
  const { persist = true } = options;

  if (!payload || typeof payload !== "object") {
    throw makeBadRequestError("Request body must be a JSON object.", [
      { field: "body", message: "Missing or invalid JSON body." },
    ]);
  }

  const rawPropertyInput =
    payload.property && typeof payload.property === "object" ? payload.property : payload;

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

async function fetchPropertyAnalysis(id) {
  const stored = await getPropertyAnalysisById(id);
  return {
    id: stored.id,
    report: stored.report,
    createdAt: stored.createdAt,
    sources: stored.sources || null,
  };
}

module.exports = {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
};
