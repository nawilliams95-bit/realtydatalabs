// backend/services/analysis/property/normalizers/canonicalPropertyNormalizer.js

const { PROPERTY_TYPES, isSupportedPropertyType } = require("../propertyTypes");

function toNullableString(v) {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

function toNullableNumber(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNullableBoolean(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true" || t === "yes" || t === "y") return true;
    if (t === "false" || t === "no" || t === "n") return false;
  }
  return null;
}

function mapRentcastPropertyTypeToInternal(rawProviderType) {
  const raw = toNullableString(rawProviderType);
  if (!raw) return null;

  const t = raw.toLowerCase();

  // Required: RentCast "Manufactured" should map into our internal enum.
  if (
    t === "manufactured" ||
    t === "manufactured home" ||
    t === "mobile" ||
    t === "mobile home" ||
    t === "modular" ||
    t === "modular home"
  ) {
    return PROPERTY_TYPES.SINGLE_FAMILY;
  }

  // Conservative extras, low risk.
  if (t === "condo" || t === "condominium") return PROPERTY_TYPES.CONDO;
  if (t === "land" || t === "lot" || t === "vacant land") return PROPERTY_TYPES.LAND;

  if (
    t === "multi family" ||
    t === "multifamily" ||
    t === "apartment" ||
    t === "duplex" ||
    t === "triplex" ||
    t === "quadplex" ||
    t === "fourplex"
  ) {
    return PROPERTY_TYPES.MULTI_FAMILY;
  }

  return null;
}

function normalizeAddress(inputAddress) {
  const a = inputAddress || {};
  return {
    line1: toNullableString(a.line1 || a.address1 || a.street || a.street1 || a.addressLine1),
    line2: toNullableString(a.line2 || a.address2 || a.unit || a.addressLine2),
    city: toNullableString(a.city),
    state: toNullableString(a.state),
    postalCode: toNullableString(a.postalCode || a.zip || a.zipCode),
    county: toNullableString(a.county),
  };
}

function normalizeUnits(rawUnits) {
  if (!Array.isArray(rawUnits)) return null;
  const cleaned = rawUnits
    .map((u) => {
      const src = u || {};
      return {
        unitId: toNullableString(src.unitId || src.id || src.unit),
        bedrooms: toNullableNumber(src.bedrooms),
        bathrooms: toNullableNumber(src.bathrooms),
        livingAreaSqft: toNullableNumber(src.livingAreaSqft || src.sqft || src.squareFeet),
      };
    })
    .filter((u) => u.unitId || u.bedrooms != null || u.bathrooms != null || u.livingAreaSqft != null);

  return cleaned.length ? cleaned : null;
}

function pickUnitsArray(src) {
  const mf = src.multiFamily || {};
  if (Array.isArray(mf.units)) return mf.units;
  if (Array.isArray(src.unitsDetail)) return src.unitsDetail;
  if (Array.isArray(src.units)) return src.units;
  return null;
}

function deriveUnitCount(src, unitsArray) {
  const mf = src.multiFamily || {};

  const explicit =
    toNullableNumber(mf.unitCount) ??
    toNullableNumber(mf.unitsCount) ??
    toNullableNumber(src.unitCount) ??
    toNullableNumber(src.numberOfUnits);

  if (explicit != null) return explicit;

  const maybeCount = toNullableNumber(src.units);
  if (maybeCount != null) return maybeCount;

  if (Array.isArray(unitsArray) && unitsArray.length) return unitsArray.length;

  return null;
}

function normalizeGeo(src) {
  const g = src.geo || {};
  const lat =
    toNullableNumber(g.lat) ??
    toNullableNumber(g.latitude) ??
    toNullableNumber(src.latitude) ??
    toNullableNumber(src.lat);

  const lng =
    toNullableNumber(g.lng) ??
    toNullableNumber(g.longitude) ??
    toNullableNumber(src.longitude) ??
    toNullableNumber(src.lon) ??
    toNullableNumber(src.lng);

  if (lat == null && lng == null) return null;
  return { lat, lng };
}

function normalizeProvider(src) {
  const p = src.provider || {};
  const rentcastId = toNullableString(p.rentcastId);
  const rentcastPropertyType = toNullableString(p.rentcastPropertyType);

  if (!rentcastId && !rentcastPropertyType) return null;
  return { rentcastId, rentcastPropertyType };
}

/**
 * Pure function. Converts raw input into canonical Property model for rules_v1.
 */
function normalizeToCanonicalProperty(raw) {
  const src = raw || {};

  const rawType = src.propertyType || src.type;
  let propertyType = isSupportedPropertyType(rawType) ? rawType : PROPERTY_TYPES.OTHER;

  const address = normalizeAddress(src.address);

  const parcelId = toNullableString(src.parcelId || src.parcelID || src.apn);

  const yearBuilt = toNullableNumber(
    src.yearBuilt ||
      (src.characteristics && src.characteristics.yearBuilt) ||
      (src.details && src.details.yearBuilt)
  );

  const livingAreaSqft = toNullableNumber(
    src.livingAreaSqft ||
      src.sqft ||
      src.squareFeet ||
      (src.characteristics && src.characteristics.livingAreaSqft)
  );

  const bedrooms = toNullableNumber(
    src.bedrooms || (src.characteristics && src.characteristics.bedrooms)
  );
  const bathrooms = toNullableNumber(
    src.bathrooms || (src.characteristics && src.characteristics.bathrooms)
  );

  const roofYearUpdated = toNullableNumber(
    (src.systems && src.systems.roof && src.systems.roof.yearUpdated) ||
      src.roofYearUpdated ||
      src.roofYear
  );

  const hvacYearUpdated = toNullableNumber(
    (src.systems && src.systems.hvac && src.systems.hvac.yearUpdated) ||
      src.hvacYearUpdated ||
      src.hvacYear
  );

  const hasHoa = toNullableBoolean((src.hoa && src.hoa.hasHoa) || src.hasHoa || src.isHoa);

  const hoaFeeMonthly = toNullableNumber(
    (src.hoa && src.hoa.feeMonthly) || src.hoaFeeMonthly || src.hoaMonthlyFee
  );

  const waterSource = toNullableString((src.utilities && src.utilities.waterSource) || src.waterSource);
  const sewerType = toNullableString((src.utilities && src.utilities.sewerType) || src.sewerType);

  const occupancyStatus = toNullableString(
    (src.occupancy && src.occupancy.status) || src.occupancyStatus || src.occupied
  );
  const ownerOccupied = toNullableBoolean((src.occupancy && src.occupancy.ownerOccupied) || src.ownerOccupied);

  const unitsArray = pickUnitsArray(src);
  const mfUnits = normalizeUnits(unitsArray);
  const mfUnitCount = deriveUnitCount(src, unitsArray);

  const landAcres = toNullableNumber((src.land && src.land.acres) || src.lotSizeAcres || src.acres);
  const landZoning = toNullableString((src.land && src.land.zoning) || src.zoning);
  const landAccessType = toNullableString((src.land && src.land.accessType) || src.accessType);
  const landRoadFrontage = toNullableString((src.land && src.land.roadFrontage) || src.roadFrontage);
  const landTopography = toNullableString((src.land && src.land.topography) || src.topography);
  const landFloodZone = toNullableString((src.land && src.land.floodZone) || src.floodZone);
  const landPercStatus = toNullableString((src.land && src.land.percStatus) || src.percStatus);
  const landEasementsPresent = toNullableBoolean((src.land && src.land.easementsPresent) || src.easementsPresent);

  const geo = normalizeGeo(src);
  const provider = normalizeProvider(src);

  // Provider-to-canonical propertyType mapping.
  // Only apply when caller did not provide a supported internal type.
  // This keeps rules_v1 pack selection coherent, while preserving existing behavior for valid inputs.
  let provenance = null;
  if (propertyType === PROPERTY_TYPES.OTHER && provider && provider.rentcastPropertyType) {
    const mapped = mapRentcastPropertyTypeToInternal(provider.rentcastPropertyType);
    if (mapped && isSupportedPropertyType(mapped)) {
      propertyType = mapped;
      provenance = {
        propertyType: {
          provider: "rentcast",
          raw: provider.rentcastPropertyType,
          mapped,
        },
      };
    }
  }

  return {
    propertyType,
    parcelId,
    address,
    geo,
    provider,
    ...(provenance ? { provenance } : {}),
    characteristics: {
      yearBuilt,
      livingAreaSqft,
      bedrooms,
      bathrooms,
    },
    systems: {
      roof: { yearUpdated: roofYearUpdated },
      hvac: { yearUpdated: hvacYearUpdated },
    },
    hoa: {
      hasHoa,
      feeMonthly: hoaFeeMonthly,
    },
    utilities: {
      waterSource,
      sewerType,
    },
    occupancy: {
      status: occupancyStatus,
      ownerOccupied,
    },
    multiFamily: {
      unitCount: mfUnitCount,
      units: mfUnits,
    },
    land: {
      acres: landAcres,
      zoning: landZoning,
      accessType: landAccessType,
      roadFrontage: landRoadFrontage,
      topography: landTopography,
      floodZone: landFloodZone,
      percStatus: landPercStatus,
      easementsPresent: landEasementsPresent,
    },
  };
}

module.exports = { normalizeToCanonicalProperty };
