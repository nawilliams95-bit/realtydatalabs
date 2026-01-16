// backend/services/analysis/property/rules/packs/condo/hoaUnknownOrMissingFee.js

function isMissingNullableBoolean(v) {
  return v !== true && v !== false;
}

function isMissingNumber(v) {
  return v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));
}

module.exports = function hoaUnknownOrMissingFee(property) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  const hasHoa = property.hoa?.hasHoa ?? null;
  const feeMonthly = property.hoa?.feeMonthly ?? null;

  if (isMissingNullableBoolean(hasHoa)) {
    observations.push("HOA presence is not provided.");
    flags.push({
      code: "HOA_UNKNOWN",
      severity: "medium",
      message: "HOA presence is missing. For condos, HOA rules and fees are typically material to buyer constraints.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "HOA_UNKNOWN",
      severity: "medium",
      details: "hoa.hasHoa not present.",
    });
    return { observations, flags, riskSignals };
  }

  if (hasHoa === true && isMissingNumber(feeMonthly)) {
    observations.push("HOA fee (monthly) is not provided.");
    flags.push({
      code: "HOA_FEE_MISSING",
      severity: "medium",
      message: "HOA fee is missing. For condos, monthly HOA is a key due diligence item.",
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "HOA_FEE_UNKNOWN",
      severity: "medium",
      details: "hoa.feeMonthly not present.",
    });
  }

  return { observations, flags, riskSignals };
};
