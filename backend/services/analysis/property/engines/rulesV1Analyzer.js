// backend/services/analysis/property/engines/rulesV1Analyzer.js

const { PROPERTY_TYPES } = require("../propertyTypes");
const { normalizeToCanonicalProperty } = require("../normalizers/canonicalPropertyNormalizer");
const { validateCreateContract } = require("../validators/createContractValidator");
const { calculateCompleteness } = require("../completeness/completenessCalculator");
const { runRules } = require("../rules/rulesRunner");
const { buildReport } = require("../report/reportBuilder");

const singleFamilyPack = require("../rules/packs/single_family");
const condoPack = require("../rules/packs/condo");
const landPack = require("../rules/packs/land");
const multiFamilyPack = require("../rules/packs/multi_family");

function getRulePack(propertyType) {
  switch (propertyType) {
    case PROPERTY_TYPES.SINGLE_FAMILY:
      return singleFamilyPack;
    case PROPERTY_TYPES.CONDO:
      return condoPack;
    case PROPERTY_TYPES.LAND:
      return landPack;
    case PROPERTY_TYPES.MULTI_FAMILY:
      return multiFamilyPack;
    default:
      return [];
  }
}

/**
 * Pure-ish orchestrator: no I/O, only computes outputs.
 */
function analyzeRulesV1(rawPropertyInput) {
  const canonicalProperty = normalizeToCanonicalProperty(rawPropertyInput);

  const createValidation = validateCreateContract(canonicalProperty);
  if (!createValidation.ok) {
    return {
      ok: false,
      errors: createValidation.errors,
      canonicalProperty,
      report: null,
    };
  }

  const completeness = calculateCompleteness(canonicalProperty);

  const rulePack = getRulePack(canonicalProperty.propertyType);
  const context = { completeness };

  let observations = [];
  let flags = [];
  let riskSignals = [];

  if (!Array.isArray(rulePack) || rulePack.length === 0) {
    observations.push(
      `No rule pack is configured yet for propertyType '${canonicalProperty.propertyType}'.`
    );
    flags.push({
      code: "NO_RULE_PACK_FOR_PROPERTY_TYPE",
      severity: "low",
      message: `Analysis coverage is limited because rules are not yet implemented for propertyType '${canonicalProperty.propertyType}'.`,
      suggestedNextStep: "worth verifying",
    });
    riskSignals.push({
      code: "ANALYSIS_COVERAGE_LIMITED",
      severity: "low",
      details: `No rule pack configured for propertyType '${canonicalProperty.propertyType}'.`,
    });
  } else {
    const out = runRules(canonicalProperty, rulePack, context);
    observations = out.observations;
    flags = out.flags;
    riskSignals = out.riskSignals;
  }

  const report = buildReport({
    engine: "rules_v1",
    analysisVersion: "rules_v1",
    createdAtIso: new Date().toISOString(),
    completeness,
    observations,
    flags,
    riskSignals,
  });

  return {
    ok: true,
    errors: [],
    canonicalProperty,
    report,
  };
}

module.exports = { analyzeRulesV1 };
