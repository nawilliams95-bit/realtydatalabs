// backend/services/analysis/property/rules/packs/condo/missingStructuralBasics.js

function isMissing(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number") return !Number.isFinite(v);
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

module.exports = function missingStructuralBasics(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const yearBuilt = property.characteristics?.yearBuilt ?? null;
  const livingAreaSqft = property.characteristics?.livingAreaSqft ?? null;

  if (isMissing(yearBuilt)) {
    observations.push("Year built is not provided.");
    flags.push({
      code: "MISSING_YEAR_BUILT",
      severity: "medium",
      message: "Year built is missing, which reduces confidence in lifecycle and building-system expectations.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "STRUCTURAL_BASELINE_INCOMPLETE",
      severity: "medium",
      details: "characteristics.yearBuilt not present.",
    });
  }

  if (isMissing(livingAreaSqft)) {
    observations.push("Living area (square footage) is not provided.");
    flags.push({
      code: "MISSING_SQFT",
      severity: "medium",
      message: "Square footage is missing, which reduces general analysis completeness.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "STRUCTURAL_BASELINE_INCOMPLETE",
      severity: "medium",
      details: "characteristics.livingAreaSqft not present.",
    });
  }

  return { observations, flags, riskSignals };
};
