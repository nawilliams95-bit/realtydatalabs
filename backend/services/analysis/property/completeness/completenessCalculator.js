// backend/services/analysis/property/completeness/completenessCalculator.js

const { PROPERTY_TYPES } = require("../propertyTypes");

function isPresent(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "boolean") return true;
  return true;
}

function getCreateMissingRequiredFields(property) {
  const missing = [];

  if (!isPresent(property.propertyType)) missing.push("propertyType");

  const hasParcel = isPresent(property.parcelId);

  const a = property.address || {};
  const hasAddressMinimum =
    isPresent(a.line1) && isPresent(a.city) && isPresent(a.state) && isPresent(a.postalCode);

  if (!hasParcel && !hasAddressMinimum) {
    if (!hasParcel) missing.push("parcelId");
    if (!isPresent(a.line1)) missing.push("address.line1");
    if (!isPresent(a.city)) missing.push("address.city");
    if (!isPresent(a.state)) missing.push("address.state");
    if (!isPresent(a.postalCode)) missing.push("address.postalCode");
  }

  return missing;
}

function getRecommendedFieldsByType(propertyType) {
  switch (propertyType) {
    case PROPERTY_TYPES.SINGLE_FAMILY:
      return [
        "characteristics.yearBuilt",
        "characteristics.livingAreaSqft",
        "systems.roof.yearUpdated",
        "systems.hvac.yearUpdated",
        "utilities.waterSource",
        "utilities.sewerType",
        "hoa.hasHoa",
        "occupancy.status",
      ];

    case PROPERTY_TYPES.CONDO:
      return [
        "characteristics.yearBuilt",
        "characteristics.livingAreaSqft",
        "systems.roof.yearUpdated",
        "systems.hvac.yearUpdated",
        "utilities.waterSource",
        "utilities.sewerType",
        "hoa.hasHoa",
        "hoa.feeMonthly",
        "occupancy.status",
      ];

    case PROPERTY_TYPES.MULTI_FAMILY:
      return [
        "multiFamily.unitCount",
        "characteristics.yearBuilt",
        "systems.roof.yearUpdated",
        "systems.hvac.yearUpdated",
        "utilities.waterSource",
        "utilities.sewerType",
        "occupancy.status",
      ];

    case PROPERTY_TYPES.LAND:
      return [
        "land.acres",
        "land.zoning",
        "land.accessType",
        "land.roadFrontage",
        "land.topography",
        "land.floodZone",
        "land.percStatus",
        "utilities.waterSource",
        "utilities.sewerType",
      ];

    case PROPERTY_TYPES.OTHER:
      return [
        "characteristics.yearBuilt",
        "systems.roof.yearUpdated",
        "systems.hvac.yearUpdated",
        "utilities.waterSource",
        "utilities.sewerType",
      ];

    default:
      return ["characteristics.yearBuilt", "characteristics.livingAreaSqft"];
  }
}

function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

/**
 * Completeness model:
 * - missingRequired: create-contract required fields that are missing (should be empty if create validation passed)
 * - missingRecommended: recommended fields for analysis quality
 * - coverage: recommended coverage only (presentRecommended / totalRecommended)
 */
function calculateCompleteness(property) {
  const missingRequired = getCreateMissingRequiredFields(property);

  const recommended = getRecommendedFieldsByType(property.propertyType);
  const missingRecommended = recommended.filter((p) => !isPresent(getValueByPath(property, p)));

  const totalRecommended = recommended.length;
  const presentRecommended = totalRecommended - missingRecommended.length;

  const coverage =
    totalRecommended === 0 ? 1 : Math.max(0, Math.min(1, presentRecommended / totalRecommended));

  return {
    missingRequired,
    missingRecommended,
    coverage: Number(coverage.toFixed(2)),
  };
}

module.exports = { calculateCompleteness };
