const crypto = require("crypto");
const AppError = require("../../utils/appError");
const { db } = require("../../config/firebase");

const COLLECTION = "propertyAnalyses";

async function createPropertyAnalysis(doc) {
  const id = crypto.randomUUID();

  const payload = {
    ...doc,
    id,
    createdAt: new Date().toISOString(),
  };

  await db.collection(COLLECTION).doc(id).set(payload);
  return payload;
}

async function getPropertyAnalysisById(id) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) {
    throw new AppError("Analysis not found.", 404);
  }
  return snap.data();
}

module.exports = {
  createPropertyAnalysis,
  getPropertyAnalysisById,
};
