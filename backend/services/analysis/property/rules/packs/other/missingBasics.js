// backend/services/analysis/property/rules/packs/other/missingBasics.js

function isMissing(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number") return !Number.isFinite(v);
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

module.exports = function missingBasics(property) {
  const a = property.address || {};
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const hasParcel = !isMissing(property.parcelId);
  const hasAddressMinimum =
    !isMissing(a.line1) && !isMissing(a.city) && !isMissing(a.state) && !isMissing(a.postalCode);

  if (!hasParcel && !hasAddressMinimum) {
    observations.push("Property identifier is incomplete (parcelId or full address minimum).");
    flags.push({
      code: "OTHER_ID_INCOMPLETE",
      severity: "medium",
      message: "Provide parcelId or full address minimum to improve data matching and analysis quality.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_ID",
      severity: "medium",
      details: "parcelId and address minimum are both missing.",
    });
  }

  const yearBuilt = property.characteristics?.yearBuilt ?? null;
  if (isMissing(yearBuilt)) {
    observations.push("Year built is not provided.");
    flags.push({
      code: "OTHER_YEAR_BUILT_MISSING",
      severity: "low",
      message: "Year built is missing, which limits lifecycle and condition diligence.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_YEAR_BUILT",
      severity: "low",
      details: "characteristics.yearBuilt not present.",
    });
  }

  const waterSource = property.utilities?.waterSource ?? null;
  if (isMissing(waterSource)) {
    observations.push("Water source is not provided.");
    flags.push({
      code: "OTHER_WATER_SOURCE_MISSING",
      severity: "low",
      message: "Water source is missing (public, well, other).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_WATER_SOURCE",
      severity: "low",
      details: "utilities.waterSource not present.",
    });
  }

  const sewerType = property.utilities?.sewerType ?? null;
  if (isMissing(sewerType)) {
    observations.push("Sewer type is not provided.");
    flags.push({
      code: "OTHER_SEWER_TYPE_MISSING",
      severity: "low",
      message: "Sewer type is missing (public, septic, other).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_SEWER",
      severity: "low",
      details: "utilities.sewerType not present.",
    });
  }

  if (flags.length === 0) return {};
  return { observations, flags, riskSignals };
};
