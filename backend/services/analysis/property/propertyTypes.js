// backend/services/analysis/property/propertyTypes.js

const PROPERTY_TYPES = Object.freeze({
  SINGLE_FAMILY: "single_family",
  CONDO: "condo",
  TOWNHOUSE: "townhouse",
  MULTI_FAMILY: "multi_family",
  LAND: "land",
  OTHER: "other",
});

const ALL_PROPERTY_TYPES = Object.freeze(new Set(Object.values(PROPERTY_TYPES)));

function isSupportedPropertyType(value) {
  return typeof value === "string" && ALL_PROPERTY_TYPES.has(value);
}

module.exports = {
  PROPERTY_TYPES,
  ALL_PROPERTY_TYPES,
  isSupportedPropertyType,
};
