// backend/services/analysis/property/rules/packs/single_family/occupancyHoaUtilitiesUnknown.js

function isMissingString(v) {
  return typeof v !== "string" || v.trim().length === 0;
}

function isMissingNullableBoolean(v) {
  return v !== true && v !== false;
}

module.exports = function occupancyHoaUtilitiesUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const occupancy = property.occupancy?.status ?? null;
  if (isMissingString(occupancy)) {
    observations.push("Occupancy status is not provided.");
    flags.push({
      code: "OCCUPANCY_UNKNOWN",
      severity: "low",
      message: "Occupancy status is missing, which may affect showing logistics and timeline assumptions.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "OCCUPANCY_UNKNOWN",
      severity: "low",
      details: "occupancy.status not present.",
    });
  }

  const hasHoa = property.hoa?.hasHoa ?? null;
  if (isMissingNullableBoolean(hasHoa)) {
    observations.push("HOA presence is not provided.");
    flags.push({
      code: "HOA_UNKNOWN",
      severity: "low",
      message: "HOA presence is missing. HOA rules or fees can affect buyer constraints.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "HOA_UNKNOWN",
      severity: "low",
      details: "hoa.hasHoa not present.",
    });
  }

  const waterSource = property.utilities?.waterSource ?? null;
  if (isMissingString(waterSource)) {
    observations.push("Water source is not provided.");
    flags.push({
      code: "WATER_SOURCE_UNKNOWN",
      severity: "medium",
      message: "Water source is missing (public, well, etc.).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "UTILITIES_UNKNOWN",
      severity: "medium",
      details: "utilities.waterSource not present.",
    });
  }

  const sewerType = property.utilities?.sewerType ?? null;
  if (isMissingString(sewerType)) {
    observations.push("Sewer type is not provided.");
    flags.push({
      code: "SEWER_TYPE_UNKNOWN",
      severity: "medium",
      message: "Sewer type is missing (public sewer, septic, etc.).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "UTILITIES_UNKNOWN",
      severity: "medium",
      details: "utilities.sewerType not present.",
    });
  }

  return { observations, flags, riskSignals };
};
