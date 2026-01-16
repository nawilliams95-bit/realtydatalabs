// backend/services/analysis/property/rules/packs/multi_family/index.js

const unitCountMissing = require("./unitCountMissing");
const occupancyUtilitiesUnknown = require("./occupancyUtilitiesUnknown");
const systemsLifecycleUnknown = require("./systemsLifecycleUnknown");

module.exports = [unitCountMissing, occupancyUtilitiesUnknown, systemsLifecycleUnknown];
