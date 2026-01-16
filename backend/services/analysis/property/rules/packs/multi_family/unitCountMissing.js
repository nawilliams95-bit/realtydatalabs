// backend/services/analysis/property/rules/packs/multi_family/unitCountMissing.js

module.exports = function unitCountMissing(property) {
  const unitCount = property?.multiFamily?.unitCount;

  if (unitCount !== null && unitCount !== undefined) return {};

  return {
    observations: ["Multi-family: unit count not provided."],
    flags: [
      {
        code: "MF_UNIT_COUNT_MISSING",
        severity: "medium",
        message: "Unit count is missing for this multi-family property.",
        suggestedNextStep: "worth verifying",
      },
    ],
    riskSignals: [
      {
        code: "DATA_GAP_UNIT_COUNT",
        severity: "medium",
        details: "unitCount is missing for multi_family.",
      },
    ],
  };
};
