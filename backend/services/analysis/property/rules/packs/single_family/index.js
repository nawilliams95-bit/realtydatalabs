// backend/services/analysis/property/rules/packs/single_family/index.js

const missingStructural = require("./missingStructural");
const roofHvacAgeUnknown = require("./roofHvacAgeUnknown");
const occupancyHoaUtilitiesUnknown = require("./occupancyHoaUtilitiesUnknown");

module.exports = [
  missingStructural,
  roofHvacAgeUnknown,
  occupancyHoaUtilitiesUnknown,
];
