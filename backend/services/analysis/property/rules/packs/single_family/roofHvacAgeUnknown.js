// backend/services/analysis/property/rules/packs/single_family/roofHvacAgeUnknown.js

function isMissingNumber(v) {
  return v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));
}

module.exports = function roofHvacAgeUnknown(property) {
  const roofYear = property.systems?.roof?.yearUpdated ?? null;
  const hvacYear = property.systems?.hvac?.yearUpdated ?? null;

  const observations = [];
  const flags = [];
  const riskSignals = [];

  if (isMissingNumber(roofYear)) {
    observations.push("Roof update year is not provided.");
    flags.push({
      code: "MISSING_ROOF_AGE",
      severity: "medium",
      message: "Roof age or last update year is missing.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "ROOF_AGE_UNKNOWN",
      severity: "medium",
      details: "systems.roof.yearUpdated not present.",
    });
  }

  if (isMissingNumber(hvacYear)) {
    observations.push("HVAC update year is not provided.");
    flags.push({
      code: "MISSING_HVAC_AGE",
      severity: "medium",
      message: "HVAC age or last update year is missing.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "HVAC_AGE_UNKNOWN",
      severity: "medium",
      details: "systems.hvac.yearUpdated not present.",
    });
  }

  return { observations, flags, riskSignals };
};
