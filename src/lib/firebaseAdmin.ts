import admin from "firebase-admin";
import os from "os";
import path from "path";
import fs from "fs";

if (!admin.apps.length) {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    const parsed = JSON.parse(credentialsJson);

    if (parsed.type === "service_account") {
      // Service account key — use cert() directly
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id,
      });
    } else {
      // authorized_user credentials — write to temp file and use applicationDefault()
      const tmpFile = path.join(os.tmpdir(), "gcloud-adc.json");
      fs.writeFileSync(tmpFile, credentialsJson);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpFile;
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    // Local dev — use gcloud auth application-default login
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}
