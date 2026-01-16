const AppError = require("../../../../utils/appError");

const ALLOWED_PROPERTY_TYPES = [
  "single_family",
  "condo",
  "townhome",
  "multi_family",
  "land",
  "manufactured",
  "other",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validatePropertyAnalysisRequest(payload) {
  if (!isObject(payload)) {
    throw new AppError("Request body must be a JSON object.", 400);
  }

  if (!isObject(payload.property)) {
    throw new AppError("Missing required object: property.", 400);
  }

  const { property, listing } = payload;

  if (property.propertyType && !ALLOWED_PROPERTY_TYPES.includes(property.propertyType)) {
    throw new AppError("Invalid property.propertyType.", 400, {
      allowed: ALLOWED_PROPERTY_TYPES,
    });
  }

  const hasAnyLocation =
    Boolean(property.address?.line1) ||
    Boolean(property.address?.city) ||
    Boolean(property.address?.state) ||
    Boolean(property.parcelId);

  if (!property.propertyType) {
    throw new AppError("property.propertyType is required.", 400);
  }

  if (!hasAnyLocation) {
    throw new AppError(
      "Provide at least one location identifier: address (line1/city/state) or parcelId.",
      400
    );
  }

  if (listing && !isObject(listing)) {
    throw new AppError("listing must be an object when provided.", 400);
  }

  return payload;
}

module.exports = {
  validatePropertyAnalysisRequest,
  ALLOWED_PROPERTY_TYPES,
};
