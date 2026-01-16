const express = require("express");
const router = express.Router();
const { execSync } = require("node:child_process");

const {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
} = require("../services/analysis/property/propertyAnalysisService");

const {
  getPropertySnapshotByAddress,
  ProviderError,
} = require("../services/providers/rentcast/rentcastClient");

function getGitCommitShort() {
  try {
    const out = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] });
    return String(out).trim() || null;
  } catch {
    return null;
  }
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isProdEnv() {
  return String(process.env.NODE_ENV || "").toLowerCase() === "production";
}

function rentcastKeyLen() {
  if (!isNonEmptyString(process.env.RENTCAST_API_KEY)) return 0;
  return String(process.env.RENTCAST_API_KEY).length;
}

// GET /api/v1/analysis/health
router.get("/health", (req, res) => {
  const emulator = {
    useFirestoreEmulator: process.env.USE_FIRESTORE_EMULATOR === "true",
    firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || null,
  };

  const providers = {
    rentcast: {
      enabled: process.env.USE_RENTCAST === "true",
      hasApiKey: isNonEmptyString(process.env.RENTCAST_API_KEY),
      baseUrl: process.env.RENTCAST_BASE_URL || "https://api.rentcast.io",
    },
  };

  return res.status(200).json({
    ok: true,
    service: "property_analysis",
    engine: "rules_v1",
    emulator,
    providers,
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

// GET /api/v1/analysis/provider/rentcast/debug
// Dev-only: exposes only safe diagnostics (no secrets)
router.get("/provider/rentcast/debug", (req, res) => {
  const isEnabled = process.env.USE_RENTCAST === "true";
  if (!isEnabled || isProdEnv()) {
    return res.status(404).json({ error: "Not Found" });
  }

  return res.status(200).json({
    ok: true,
    provider: "rentcast",
    baseUrl: process.env.RENTCAST_BASE_URL || "https://api.rentcast.io",
    apiKeyPresent: isNonEmptyString(process.env.RENTCAST_API_KEY),
    apiKeyLen: rentcastKeyLen(),
    serverTimeIso: new Date().toISOString(),
  });
});

// POST /api/v1/analysis/provider/rentcast/property
// Dev-only: returns raw provider data; does not persist; guarded by USE_RENTCAST=true and non-production.
router.post("/provider/rentcast/property", async (req, res, next) => {
  try {
    const isEnabled = process.env.USE_RENTCAST === "true";
    if (!isEnabled || isProdEnv()) {
      return res.status(404).json({ error: "Not Found" });
    }

    const address = (req.body && req.body.address) || null;
    const data = await getPropertySnapshotByAddress(address, { timeoutMs: 8000 });

    return res.status(200).json({ ok: true, provider: "rentcast", data });
  } catch (err) {
    if (err instanceof ProviderError) {
      return res.status(502).json({
        ok: false,
        provider: "rentcast",
        error: err.code,
        message: err.message,
        status: err.status,
        details: err.details,
      });
    }
    return next(err);
  }
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
