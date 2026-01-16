const express = require("express");
const router = express.Router();
const { execSync } = require("node:child_process");

const {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
} = require("../services/analysis/property/propertyAnalysisService");

function getGitCommitShort() {
  try {
    const out = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] });
    return String(out).trim() || null;
  } catch {
    return null;
  }
}

// GET /api/v1/analysis/health
router.get("/health", (req, res) => {
  const emulator = {
    useFirestoreEmulator: process.env.USE_FIRESTORE_EMULATOR === "true",
    firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || null,
  };

  return res.status(200).json({
    ok: true,
    service: "property_analysis",
    engine: "rules_v1",
    emulator,
    serverTimeIso: new Date().toISOString(),
  });
});

// GET /api/v1/analysis/version
router.get("/version", (req, res) => {
  return res.status(200).json({
    ok: true,
    service: "property_analysis",
    gitCommitShort: getGitCommitShort(),
    serverTimeIso: new Date().toISOString(),
  });
});

// POST /api/v1/analysis/property
router.post("/property", async (req, res, next) => {
  try {
    const result = await runPropertyAnalysis(req.body, { persist: true });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/analysis/property/:id
router.get("/property/:id", async (req, res, next) => {
  try {
    const result = await fetchPropertyAnalysis(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
