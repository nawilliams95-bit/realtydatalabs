const { analyzeRulesV1 } = require("./engines/rulesV1Analyzer");
const {
  createPropertyAnalysis,
  getPropertyAnalysisById,
} = require("../../firestore/analysisRepository");

function makeBadRequestError(message, details) {
  const err = new Error(message);
  err.name = "BadRequestError";
  err.statusCode = 400;
  err.details = details || [];
  return err;
}

/**
 * payload is expected to be the request body.
 * Supports both shapes:
 *  - { property: {...} } (preferred)
 *  - { ... } (legacy direct property payload)
 */
async function runPropertyAnalysis(payload, options = {}) {
  const { persist = true } = options;

  if (!payload || typeof payload !== "object") {
    throw makeBadRequestError("Request body must be a JSON object.", [
      { field: "body", message: "Missing or invalid JSON body." },
    ]);
  }

  const rawPropertyInput = payload.property && typeof payload.property === "object"
    ? payload.property
    : payload;

  const analysis = analyzeRulesV1(rawPropertyInput);

  if (!analysis.ok) {
    throw makeBadRequestError("Invalid create contract for property analysis.", analysis.errors);
  }

  const report = analysis.report;
  const canonicalProperty = analysis.canonicalProperty;

  const doc = {
    type: "property_analysis",
    engine: report.meta.engine,
    analysisVersion: report.meta.analysisVersion,
    input: canonicalProperty,
    report,
  };

  if (!persist) {
    return { id: null, report };
  }

  const stored = await createPropertyAnalysis(doc);
  return { id: stored.id, report: stored.report };
}

async function fetchPropertyAnalysis(id) {
  const stored = await getPropertyAnalysisById(id);
  return { id: stored.id, report: stored.report, createdAt: stored.createdAt };
}

module.exports = {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
};
