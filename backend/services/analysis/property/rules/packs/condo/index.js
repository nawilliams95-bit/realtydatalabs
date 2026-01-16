// backend/services/analysis/property/rules/packs/condo/index.js

const missingStructuralBasics = require("./missingStructuralBasics");
const hoaUnknownOrMissingFee = require("./hoaUnknownOrMissingFee");
const occupancyUtilitiesUnknown = require("./occupancyUtilitiesUnknown");

module.exports = [
  missingStructuralBasics,
  hoaUnknownOrMissingFee,
  occupancyUtilitiesUnknown,
];
