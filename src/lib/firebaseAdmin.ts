import admin from "firebase-admin";

if (!admin.apps.length) {
  // Uses Application Default Credentials locally (gcloud auth application-default login)
  // On Vercel, set GOOGLE_APPLICATION_CREDENTIALS_JSON env var with the ADC JSON content
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  admin.initializeApp({
    credential: credentialsJson
      ? admin.credential.cert(JSON.parse(credentialsJson))
      : admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}
