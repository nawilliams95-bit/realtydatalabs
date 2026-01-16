const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function toBool(v) {
  if (v === true) return true;
  if (!v) return false;
  return String(v).trim().toLowerCase() === "true";
}

function detectProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    (() => {
      try {
        const firebasercPath = path.resolve(__dirname, "../../.firebaserc");
        const raw = fs.readFileSync(firebasercPath, "utf8");
        const json = JSON.parse(raw);
        return json?.projects?.default || null;
      } catch (e) {
        return null;
      }
    })()
  );
}

function assertNoProdCredsInEmulatorMode() {
  const prodVars = ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT"];
  const present = prodVars.filter((k) => !!process.env[k]);

  if (present.length) {
    throw new Error(
      `Refusing to start in emulator mode because production credential env vars are set: ${present.join(
        ", "
      )}. Unset them before running USE_FIRESTORE_EMULATOR=true.`
    );
  }
}

function initFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const useEmulator = toBool(process.env.USE_FIRESTORE_EMULATOR);

  if (useEmulator) {
    assertNoProdCredsInEmulatorMode();

    const projectId = detectProjectId();
    if (!projectId) {
      throw new Error(
        "USE_FIRESTORE_EMULATOR=true but projectId could not be determined. Set FIREBASE_PROJECT_ID or configure .firebaserc projects.default."
      );
    }

    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.GCLOUD_PROJECT = projectId;
    process.env.GOOGLE_CLOUD_PROJECT = projectId;

    console.log(
      `[Firestore Emulator] USE_FIRESTORE_EMULATOR=true, FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST}, projectId=${projectId}`
    );

    admin.initializeApp({ projectId });
    return admin;
  }

  admin.initializeApp();
  return admin;
}

module.exports = initFirebaseAdmin;
