// backend/services/analysis/property/rules/packs/other/systemsUnknown.js

module.exports = function systemsUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const roofYearUpdated = property?.systems?.roof?.yearUpdated ?? null;
  if (roofYearUpdated === null || roofYearUpdated === undefined) {
    observations.push("Roof year updated is not provided.");
    flags.push({
      code: "OTHER_ROOF_YEAR_UNKNOWN",
      severity: "low",
      message: "Roof age or last update year is not provided.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_ROOF",
      severity: "low",
      details: "systems.roof.yearUpdated not present.",
    });
  }

  const hvacYearUpdated = property?.systems?.hvac?.yearUpdated ?? null;
  if (hvacYearUpdated === null || hvacYearUpdated === undefined) {
    observations.push("HVAC year updated is not provided.");
    flags.push({
      code: "OTHER_HVAC_YEAR_UNKNOWN",
      severity: "low",
      message: "HVAC age or last update year is not provided.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_HVAC",
      severity: "low",
      details: "systems.hvac.yearUpdated not present.",
    });
  }

  if (flags.length === 0) return {};
  return { observations, flags, riskSignals };
};
