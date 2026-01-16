// backend/services/analysis/property/rules/packs/other/index.js

const missingBasics = require("./missingBasics");
const systemsUnknown = require("./systemsUnknown");

module.exports = [missingBasics, systemsUnknown];
