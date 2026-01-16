const express = require("express");
const router = express.Router();

const {
  runPropertyAnalysis,
  fetchPropertyAnalysis,
} = require("../services/analysis/property/propertyAnalysisService");

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
