function isMissingString(v) {
  return typeof v !== "string" || v.trim().length === 0;
}

module.exports = function zoningUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const zoning = property.land?.zoning ?? null;

  if (isMissingString(zoning)) {
    observations.push("Zoning is not provided.");
    flags.push({
      code: "ZONING_UNKNOWN",
      severity: "medium",
      message: "Zoning is missing. Confirm intended use compatibility and any restrictions.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "USE_COMPATIBILITY_UNCONFIRMED",
      severity: "medium",
      details: "land.zoning not present.",
    });
  }

  return { observations, flags, riskSignals };
};
