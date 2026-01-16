// backend/services/analysis/property/rules/packs/condo/occupancyUtilitiesUnknown.js

function isMissingString(v) {
  return typeof v !== "string" || v.trim().length === 0;
}

module.exports = function occupancyUtilitiesUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const occupancy = property.occupancy?.status ?? null;
  if (isMissingString(occupancy)) {
    observations.push("Occupancy status is not provided.");
    flags.push({
      code: "OCCUPANCY_UNKNOWN",
      severity: "low",
      message: "Occupancy status is missing, which may affect access, timeline, and showing logistics.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "OCCUPANCY_UNKNOWN",
      severity: "low",
      details: "occupancy.status not present.",
    });
  }

  const waterSource = property.utilities?.waterSource ?? null;
  if (isMissingString(waterSource)) {
    observations.push("Water source is not provided.");
    flags.push({
      code: "WATER_SOURCE_UNKNOWN",
      severity: "low",
      message: "Water source is missing. Confirm if HOA covers water or if separately billed.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "UTILITIES_UNKNOWN",
      severity: "low",
      details: "utilities.waterSource not present.",
    });
  }

  const sewerType = property.utilities?.sewerType ?? null;
  if (isMissingString(sewerType)) {
    observations.push("Sewer type is not provided.");
    flags.push({
      code: "SEWER_TYPE_UNKNOWN",
      severity: "low",
      message: "Sewer type is missing. Confirm if HOA covers sewer or if separately billed.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "UTILITIES_UNKNOWN",
      severity: "low",
      details: "utilities.sewerType not present.",
    });
  }

  return { observations, flags, riskSignals };
};
