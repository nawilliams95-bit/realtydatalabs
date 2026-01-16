// backend/services/analysis/property/rules/rulesRunner.js

/**
 * A rule is a pure function:
 * (property, context) => { observations: [], flags: [], riskSignals: [] }
 */
function runRules(property, rulePack, context) {
  const observations = [];
  const flags = [];
  const riskSignals = [];

  for (const rule of rulePack) {
    const out = rule(property, context) || {};
    if (Array.isArray(out.observations)) observations.push(...out.observations);
    if (Array.isArray(out.flags)) flags.push(...out.flags);
    if (Array.isArray(out.riskSignals)) riskSignals.push(...out.riskSignals);
  }

  return { observations, flags, riskSignals };
}

module.exports = { runRules };
