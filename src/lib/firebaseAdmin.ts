import admin from "firebase-admin";
import os from "os";
import path from "path";
import fs from "fs";

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(credentialsJson);
    } catch {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON");
    }

    if (parsed.type === "service_account") {
      admin.initializeApp({
        credential: admin.credential.cert(parsed as admin.ServiceAccount),
        projectId: parsed.project_id,
      });
    } else {
      // authorized_user — write to temp file and use applicationDefault()
      const tmpFile = path.join(os.tmpdir(), "gcloud-adc.json");
      fs.writeFileSync(tmpFile, credentialsJson);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpFile;
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    initFirebaseAdmin();
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}
