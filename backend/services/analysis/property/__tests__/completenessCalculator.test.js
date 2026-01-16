const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateCompleteness } = require("../completeness/completenessCalculator");

test("single_family completeness counts recommended coverage only", () => {
  const canonical = {
    propertyType: "single_family",
    parcelId: null,
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
    characteristics: { yearBuilt: 2005, livingAreaSqft: 2100, bedrooms: null, bathrooms: null },
    systems: { roof: { yearUpdated: null }, hvac: { yearUpdated: null } },
    hoa: { hasHoa: null, feeMonthly: null },
    utilities: { waterSource: null, sewerType: null },
    occupancy: { status: null },
  };

  const c = calculateCompleteness(canonical);

  // For single_family, recommended list is 8 fields.
  // With yearBuilt + livingAreaSqft present, coverage should be 2/8 = 0.25.
  assert.deepEqual(c.missingRequired, []);
  assert.equal(c.coverage, 0.25);
  assert.ok(Array.isArray(c.missingRecommended));
  assert.equal(c.missingRecommended.length, 6);
});

test("condo completeness uses condo recommended fields (9)", () => {
  const canonical = {
    propertyType: "condo",
    parcelId: null,
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
    characteristics: { yearBuilt: null, livingAreaSqft: null },
    systems: { roof: { yearUpdated: null }, hvac: { yearUpdated: null } },
    hoa: { hasHoa: null, feeMonthly: null },
    utilities: { waterSource: null, sewerType: null },
    occupancy: { status: null },
  };

  const c = calculateCompleteness(canonical);

  // Condo recommended list is 9 fields. All are missing here.
  assert.deepEqual(c.missingRequired, []);
  assert.equal(c.coverage, 0);
  assert.equal(c.missingRecommended.length, 9);
});
