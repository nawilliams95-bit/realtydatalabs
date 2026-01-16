function isMissingString(v) {
  return typeof v !== "string" || v.trim().length === 0;
}

module.exports = function accessUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const accessType = property.land?.accessType ?? null;
  const roadFrontage = property.land?.roadFrontage ?? null;

  if (isMissingString(accessType) && isMissingString(roadFrontage)) {
    observations.push("Legal/physical access details are not provided (access type and road frontage).");
    flags.push({
      code: "ACCESS_UNKNOWN",
      severity: "medium",
      message: "Access details are missing. Confirm deeded access, road frontage, and any easements.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "LEGAL_ACCESS_UNCONFIRMED",
      severity: "medium",
      details: "land.accessType and land.roadFrontage not present.",
    });
  }

  return { observations, flags, riskSignals };
};
