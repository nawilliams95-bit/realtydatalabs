function isMissingString(v) {
  return typeof v !== "string" || v.trim().length === 0;
}

function normalize(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

module.exports = function utilitiesAndPercUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const waterSource = property.utilities?.waterSource ?? null;
  const sewerType = property.utilities?.sewerType ?? null;
  const percStatus = property.land?.percStatus ?? null;

  if (isMissingString(waterSource)) {
    observations.push("Water source is not provided.");
    flags.push({
      code: "WATER_SOURCE_UNKNOWN",
      severity: "medium",
      message: "Water source is missing (public, well, none).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "UTILITIES_UNKNOWN",
      severity: "medium",
      details: "utilities.waterSource not present.",
    });
  }

  if (isMissingString(sewerType)) {
    observations.push("Sewer type is not provided.");
    flags.push({
      code: "SEWER_TYPE_UNKNOWN",
      severity: "medium",
      message: "Sewer type is missing (public sewer, septic, none).",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "UTILITIES_UNKNOWN",
      severity: "medium",
      details: "utilities.sewerType not present.",
    });
  }

  // If sewer is not clearly public, septic feasibility becomes relevant
  const sewerNorm = normalize(sewerType);
  const sewerNotPublic = sewerNorm && !sewerNorm.includes("public");

  if ((isMissingString(sewerType) || sewerNotPublic) && isMissingString(percStatus)) {
    observations.push("Perc/septic feasibility status is not provided.");
    flags.push({
      code: "PERC_STATUS_UNKNOWN",
      severity: "medium",
      message: "Perc/septic feasibility is missing. Confirm perc test status and septic suitability if not on public sewer.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "SEPTIC_FEASIBILITY_UNKNOWN",
      severity: "medium",
      details: "land.percStatus not present (and sewer is unknown or not public).",
    });
  }

  return { observations, flags, riskSignals };
};
