// backend/services/analysis/property/validators/createContractValidator.js

const { isSupportedPropertyType } = require("../propertyTypes");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function validateCreateContract(canonicalProperty) {
  const errors = [];

  if (!isSupportedPropertyType(canonicalProperty.propertyType)) {
    errors.push({ field: "propertyType", message: "propertyType must be a supported enum value." });
  }

  const hasParcel = isNonEmptyString(canonicalProperty.parcelId);

  const a = canonicalProperty.address || {};
  const hasAddressMinimum =
    isNonEmptyString(a.line1) &&
    isNonEmptyString(a.city) &&
    isNonEmptyString(a.state) &&
    isNonEmptyString(a.postalCode);

  if (!hasParcel && !hasAddressMinimum) {
    errors.push({
      field: "address|parcelId",
      message: "Provide either parcelId OR address with line1, city, state, and postalCode.",
    });
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateCreateContract };
