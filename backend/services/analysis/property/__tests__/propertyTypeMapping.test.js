// backend/services/analysis/property/__tests__/propertyTypeMapping.test.js

const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeToCanonicalProperty } = require("../normalizers/canonicalPropertyNormalizer");
const { PROPERTY_TYPES } = require("../propertyTypes");
const { analyzeRulesV1 } = require("../engines/rulesV1Analyzer");

test('rentcast provider propertyType "Manufactured" maps to canonical "single_family" and selects single_family pack', () => {
  // Provide an unsupported internal type to force fallback to OTHER,
  // then confirm provider mapping corrects it.
  const raw = {
    propertyType: "Manufactured", // unsupported internal enum value, should fall back then map
    address: {
      line1: "33 Dover Rd",
      city: "Blairsville",
      state: "GA",
      postalCode: "30512",
    },
    provider: {
      rentcastId: "rc_test_123",
      rentcastPropertyType: "Manufactured",
    },
  };

  const canonical = normalizeToCanonicalProperty(raw);
  assert.ok(canonical);
  assert.equal(canonical.propertyType, PROPERTY_TYPES.SINGLE_FAMILY);

  // Provenance is optional but should exist when mapping is applied.
  if (canonical.provenance && canonical.provenance.propertyType) {
    assert.equal(canonical.provenance.propertyType.provider, "rentcast");
    assert.equal(canonical.provenance.propertyType.raw, "Manufactured");
    assert.equal(canonical.provenance.propertyType.mapped, PROPERTY_TYPES.SINGLE_FAMILY);
  }

  // Prove the analyzer uses the single_family pack (no fallback).
  const out = analyzeRulesV1(canonical);

  assert.equal(out.ok, true);

  const flagCodes = (out.report.flags || []).map((f) => f.code);

  // Prove it's not the fallback pack behavior.
  assert.ok(!flagCodes.includes("NO_RULE_PACK_FOR_PROPERTY_TYPE"));

  // Prove the single_family pack executed (at least one known SF flag should appear for minimal input).
  assert.ok(flagCodes.includes("MISSING_YEAR_BUILT") || flagCodes.includes("MISSING_SQFT"));
});
