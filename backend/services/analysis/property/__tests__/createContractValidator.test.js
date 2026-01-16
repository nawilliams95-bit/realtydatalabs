const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateContract } = require("../validators/createContractValidator");

test("create contract fails when missing parcelId and address minimum", () => {
  const canonical = {
    propertyType: "single_family",
    parcelId: null,
    address: { line1: null, city: null, state: null, postalCode: null },
  };

  const out = validateCreateContract(canonical);
  assert.equal(out.ok, false);
  assert.ok(Array.isArray(out.errors));
  assert.ok(out.errors.some((e) => e.field === "address|parcelId"));
});

test("create contract passes with parcelId", () => {
  const canonical = {
    propertyType: "single_family",
    parcelId: "APN-123",
    address: { line1: null, city: null, state: null, postalCode: null },
  };

  const out = validateCreateContract(canonical);
  assert.equal(out.ok, true);
  assert.deepEqual(out.errors, []);
});

test("create contract passes with address minimum", () => {
  const canonical = {
    propertyType: "single_family",
    parcelId: null,
    address: { line1: "123 Main St", city: "Atlanta", state: "GA", postalCode: "30303" },
  };

  const out = validateCreateContract(canonical);
  assert.equal(out.ok, true);
  assert.deepEqual(out.errors, []);
});
