const test = require("node:test");
const assert = require("node:assert/strict");

const { buildReport } = require("../report/reportBuilder");

test("report builder dedupes riskSignals and aggregates details[]", () => {
  const report = buildReport({
    engine: "rules_v1",
    analysisVersion: "rules_v1",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    completeness: { missingRequired: [], missingRecommended: [], coverage: 1 },
    observations: ["A", "A", "B"],
    flags: [
      { code: "X", severity: "low", message: "x1", suggestedNextStep: "worth verifying" },
      { code: "X", severity: "high", message: "x2", suggestedNextStep: "worth verifying" },
    ],
    riskSignals: [
      { code: "UTILITIES_UNKNOWN", severity: "medium", details: "utilities.waterSource not present." },
      { code: "UTILITIES_UNKNOWN", severity: "medium", details: "utilities.sewerType not present." },
      { code: "OTHER", severity: "low", details: ["d1", "d1"] },
    ],
  });

  assert.equal(report.meta.engine, "rules_v1");
  assert.deepEqual(report.observations, ["A", "B"]);

  // Flags: keep highest severity for same code
  assert.equal(report.flags.length, 1);
  assert.equal(report.flags[0].code, "X");
  assert.equal(report.flags[0].severity, "high");

  // Risk signals: UTILITIES_UNKNOWN should be one entry with two details
  const util = report.riskSignals.find((r) => r.code === "UTILITIES_UNKNOWN");
  assert.ok(util);
  assert.equal(util.severity, "medium");
  assert.ok(Array.isArray(util.details));
  assert.equal(util.details.length, 2);
});
