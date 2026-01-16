// backend/services/analysis/property/rules/packs/single_family/missingStructural.js

function isMissing(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number") return !Number.isFinite(v);
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

module.exports = function missingStructural(property) {
  const yearBuilt = property.characteristics?.yearBuilt ?? null;
  const livingAreaSqft = property.characteristics?.livingAreaSqft ?? null;

  const observations = [];
  const flags = [];
  const riskSignals = [];

  if (isMissing(yearBuilt)) {
    observations.push("Year built is not provided.");
    flags.push({
      code: "MISSING_YEAR_BUILT",
      severity: "high",
      message: "Year built is missing, which reduces confidence in condition and lifecycle assumptions.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "STRUCTURAL_BASELINE_INCOMPLETE",
      severity: "high",
      details: "characteristics.yearBuilt not present.",
    });
  }

  if (isMissing(livingAreaSqft)) {
    observations.push("Living area (square footage) is not provided.");
    flags.push({
      code: "MISSING_SQFT",
      severity: "high",
      message: "Square footage is missing, which reduces comparability and overall analysis completeness.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "STRUCTURAL_BASELINE_INCOMPLETE",
      severity: "high",
      details: "characteristics.livingAreaSqft not present.",
    });
  }

  return { observations, flags, riskSignals };
};
