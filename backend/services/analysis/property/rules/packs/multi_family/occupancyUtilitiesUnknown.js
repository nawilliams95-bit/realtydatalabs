// backend/services/analysis/property/rules/packs/multi_family/occupancyUtilitiesUnknown.js

module.exports = function occupancyUtilitiesUnknown(property) {
  const flags = [];
  const observations = [];
  const riskSignals = [];

  const occupancyStatus = property?.occupancy?.status;
  if (!occupancyStatus) {
    observations.push("Multi-family: occupancy status not provided.");
    flags.push({
      code: "MF_OCCUPANCY_STATUS_MISSING",
      severity: "low",
      message: "Occupancy status is not provided (vacant, partially occupied, fully occupied).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_OCCUPANCY",
      severity: "low",
      details: "occupancy.status is missing for multi_family.",
    });
  }

  const waterSource = property?.utilities?.waterSource;
  if (!waterSource) {
    observations.push("Multi-family: water source not provided.");
    flags.push({
      code: "MF_UTILITIES_WATER_SOURCE_MISSING",
      severity: "low",
      message: "Water source is missing (public, well, other).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_WATER_SOURCE",
      severity: "low",
      details: "utilities.waterSource is missing for multi_family.",
    });
  }

  const sewerType = property?.utilities?.sewerType;
  if (!sewerType) {
    observations.push("Multi-family: sewer type not provided.");
    flags.push({
      code: "MF_UTILITIES_SEWER_TYPE_MISSING",
      severity: "low",
      message: "Sewer type is missing (public, septic, other).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "DATA_GAP_SEWER",
      severity: "low",
      details: "utilities.sewerType is missing for multi_family.",
    });
  }

  if (flags.length === 0) return {};
  return { observations, flags, riskSignals };
};
