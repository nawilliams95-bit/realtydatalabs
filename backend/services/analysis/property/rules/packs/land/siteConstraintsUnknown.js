function isMissingString(v) {
  return typeof v !== "string" || v.trim().length === 0;
}

module.exports = function siteConstraintsUnknown(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const topography = property.land?.topography ?? null;
  const floodZone = property.land?.floodZone ?? null;

  if (isMissingString(topography)) {
    observations.push("Topography is not provided.");
    flags.push({
      code: "TOPOGRAPHY_UNKNOWN",
      severity: "low",
      message: "Topography is missing (flat, rolling, steep). Site constraints may affect usability.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "SITE_CONSTRAINTS_UNKNOWN",
      severity: "low",
      details: "land.topography not present.",
    });
  }

  if (isMissingString(floodZone)) {
    observations.push("Flood zone status is not provided.");
    flags.push({
      code: "FLOOD_ZONE_UNKNOWN",
      severity: "medium",
      message: "Flood zone is missing. Confirm flood hazard status and any related constraints.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "SITE_CONSTRAINTS_UNKNOWN",
      severity: "medium",
      details: "land.floodZone not present.",
    });
  }

  return { observations, flags, riskSignals };
};
