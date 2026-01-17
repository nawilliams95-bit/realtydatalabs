// Load env for test process (node --test does not run via backend/server.js)
require("dotenv").config();

// Ensure Firestore emulator + project are set for google-cloud-firestore client
process.env.USE_FIRESTORE_EMULATOR = process.env.USE_FIRESTORE_EMULATOR || "true";
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:18080";
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "realtydatalabs123";
process.env.GOOGLE_CLOUD_PROJECT =
  process.env.GOOGLE_CLOUD_PROJECT || "realtydatalabs123";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
} = require("../propertyAnalysisService");

// NOTE: These tests require Firestore emulator to be running and USE_FIRESTORE_EMULATOR=true.
// They do not hit providers.

test("fetchPropertyAnalysis default does not include input", async () => {
  const payload = {
    property: {
      propertyType: "single_family",
      address: {
        line1: "33 Dover Rd",
        city: "Blairsville",
        state: "GA",
        postalCode: "30512",
      },
    },
  };

  const created = await runPropertyAnalysis(payload, { persist: true });
  assert.ok(created.id);

  const got = await fetchPropertyAnalysis(created.id);
  assert.equal(got.id, created.id);
  assert.ok(got.report);
  assert.ok(got.createdAt);

  // default should not include input unless explicitly requested
  assert.equal(Object.prototype.hasOwnProperty.call(got, "input"), false);
});

test("fetchPropertyAnalysis includeInput adds input", async () => {
  const payload = {
    property: {
      propertyType: "single_family",
      address: {
        line1: "33 Dover Rd",
        city: "Blairsville",
        state: "GA",
        postalCode: "30512",
      },
    },
  };

  const created = await runPropertyAnalysis(payload, { persist: true });
  const got = await fetchPropertyAnalysis(created.id, { includeInput: true });

  assert.equal(got.id, created.id);
  assert.ok(got.input);
  assert.equal(got.input.address.line1, "33 Dover Rd");
});

test(
  "fetchPropertyAnalysis includeSources adds sources key (nullable) and includeInput still works",
  async () => {
    const payload = {
      property: {
        propertyType: "single_family",
        address: {
          line1: "33 Dover Rd",
          city: "Blairsville",
          state: "GA",
          postalCode: "30512",
        },
      },
    };

    const created = await runPropertyAnalysis(payload, { persist: true });
    const got = await fetchPropertyAnalysis(created.id, {
      includeSources: true,
      includeInput: true,
    });

    assert.equal(got.id, created.id);
    assert.ok(Object.prototype.hasOwnProperty.call(got, "sources"));
    assert.ok(Object.prototype.hasOwnProperty.call(got, "input"));
  }
);
