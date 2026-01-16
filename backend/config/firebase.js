/**
 * Compatibility wrapper.
 * Forces all Firebase Admin initialization through firebaseAdmin.js (emulator-safe),
 * while exporting the same shape repositories expect: { admin, db }.
 */
const initFirebaseAdmin = require("./firebaseAdmin");

const admin = initFirebaseAdmin();
const db = admin.firestore();

module.exports = { admin, db };
