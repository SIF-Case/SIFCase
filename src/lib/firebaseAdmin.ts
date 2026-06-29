import admin from "firebase-admin";
import os from "os";
import path from "path";
import fs from "fs";

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  let credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    credentialsJson = credentialsJson.trim();
    if (credentialsJson.startsWith("'") && credentialsJson.endsWith("'")) {
      credentialsJson = credentialsJson.slice(1, -1);
    }
    if (credentialsJson.startsWith('"') && credentialsJson.endsWith('"')) {
      credentialsJson = credentialsJson.slice(1, -1);
    }

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(credentialsJson);
    } catch (err) {
      console.error("GOOGLE_APPLICATION_CREDENTIALS_JSON parse error:", err);
      console.error("Value being parsed was:", JSON.stringify(credentialsJson));
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON");
    }

    // Fix private_key: .env storage may turn real newlines into literal \n
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
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
  } catch (err) {
    console.error("Firebase ID Token verification failed:", err);
    return null;
  }
}
