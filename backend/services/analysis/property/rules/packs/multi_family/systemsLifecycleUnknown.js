// backend/services/analysis/property/rules/packs/multi_family/systemsLifecycleUnknown.js

module.exports = function systemsLifecycleUnknown(property) {
  const flags = [];
  const observations = [];
  const riskSignals = [];

  const yearBuilt = property?.characteristics?.yearBuilt;
  if (yearBuilt === null || yearBuilt === undefined) {
    observations.push("Multi-family: year built not provided.");
    flags.push({
      code: "MF_YEAR_BUILT_MISSING",
      severity: "low",
      message: "Year built is missing, which limits systems and lifecycle diligence.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_YEAR_BUILT",
      severity: "low",
      details: "characteristics.yearBuilt is missing for multi_family.",
    });
  }

  const roofYearUpdated = property?.systems?.roof?.yearUpdated;
  if (roofYearUpdated === null || roofYearUpdated === undefined) {
    observations.push("Multi-family: roof year updated not provided.");
    flags.push({
      code: "MF_SYSTEMS_ROOF_YEAR_UNKNOWN",
      severity: "low",
      message: "Roof age or last update year is not provided.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_ROOF",
      severity: "low",
      details: "systems.roof.yearUpdated is missing for multi_family.",
    });
  }

  const hvacYearUpdated = property?.systems?.hvac?.yearUpdated;
  if (hvacYearUpdated === null || hvacYearUpdated === undefined) {
    observations.push("Multi-family: HVAC year updated not provided.");
    flags.push({
      code: "MF_SYSTEMS_HVAC_YEAR_UNKNOWN",
      severity: "low",
      message: "HVAC age or last update year is not provided.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_HVAC",
      severity: "low",
      details: "systems.hvac.yearUpdated is missing for multi_family.",
    });
  }

  if (flags.length === 0) return {};
  return { observations, flags, riskSignals };
};
