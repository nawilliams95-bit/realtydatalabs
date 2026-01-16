const test = require("node:test");
const assert = require("node:assert/strict");

const { analyzeRulesV1 } = require("../engines/rulesV1Analyzer");

test("rules_v1 analyzer returns ok=false with errors for invalid create contract", () => {
  const out = analyzeRulesV1({ propertyType: "single_family" });
  assert.equal(out.ok, false);
  assert.ok(Array.isArray(out.errors));
  assert.equal(out.report, null);
});

test("rules_v1 analyzer returns a report for valid single_family input", () => {
  const out = analyzeRulesV1({
    propertyType: "single_family",
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
  });

  assert.equal(out.ok, true);
  assert.ok(out.report);
  assert.equal(out.report.meta.engine, "rules_v1");
  assert.ok(Array.isArray(out.report.flags));
  assert.ok(Array.isArray(out.report.riskSignals));
});

test("rules_v1 analyzer uses condo pack and produces HOA flags when missing", () => {
  const out = analyzeRulesV1({
    propertyType: "condo",
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
  });

  assert.equal(out.ok, true);
  const flagCodes = (out.report.flags || []).map((f) => f.code);
  assert.ok(flagCodes.includes("HOA_UNKNOWN"));
});

test("rules_v1 analyzer uses multi_family pack and does not fall back", () => {
  const out = analyzeRulesV1({
    propertyType: "multi_family",
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
  });

  assert.equal(out.ok, true);

  const flagCodes = (out.report.flags || []).map((f) => f.code);

  // Prove it's not the fallback
  assert.ok(!flagCodes.includes("NO_RULE_PACK_FOR_PROPERTY_TYPE"));

  // Prove the multi-family pack executed (at least one known MF flag should appear)
  assert.ok(flagCodes.includes("MF_UNIT_COUNT_MISSING"));
});

test("multi_family infers unitCount from units array and clears MF_UNIT_COUNT_MISSING", () => {
  const out = analyzeRulesV1({
    propertyType: "multi_family",
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
    units: [{ unitId: "A" }, { unitId: "B" }, { unitId: "C" }],
  });

  assert.equal(out.ok, true);

  // Normalizer should infer unitCount=3
  assert.equal(out.canonicalProperty.multiFamily.unitCount, 3);

  const flagCodes = (out.report.flags || []).map((f) => f.code);
  assert.ok(!flagCodes.includes("MF_UNIT_COUNT_MISSING"));
});

test("rules_v1 analyzer uses single_family pack for townhouse and does not fall back", () => {
  const out = analyzeRulesV1({
    propertyType: "townhouse",
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
  });

  assert.equal(out.ok, true);

  const flagCodes = (out.report.flags || []).map((f) => f.code);
  assert.ok(!flagCodes.includes("NO_RULE_PACK_FOR_PROPERTY_TYPE"));

  // Single-family missingStructural rule should reliably fire for minimal input
  assert.ok(flagCodes.includes("MISSING_YEAR_BUILT") || flagCodes.includes("MISSING_SQFT"));
});

test("rules_v1 analyzer uses OTHER pack and does not fall back", () => {
  const out = analyzeRulesV1({
    propertyType: "other",
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
  });

  assert.equal(out.ok, true);

  const flagCodes = (out.report.flags || []).map((f) => f.code);
  assert.ok(!flagCodes.includes("NO_RULE_PACK_FOR_PROPERTY_TYPE"));

  // OTHER pack should emit at least one known OTHER flag for minimal input
  assert.ok(flagCodes.includes("OTHER_YEAR_BUILT_MISSING") || flagCodes.includes("OTHER_ROOF_YEAR_UNKNOWN"));
});
