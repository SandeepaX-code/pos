import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type FirebaseAdminConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // During local development/build we may not have Firebase credentials.
    // Avoid failing the whole Next build during page-data collection.
    // Fail only when code actually tries to use Firebase.
    throw new Error(
      "Firebase Admin config missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in environment variables.",
    );
  }

  // Firebase private keys frequently come escaped (\n). Normalize.
  const normalizedPrivateKey = privateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey: normalizedPrivateKey };
}

let cachedDb: ReturnType<typeof getFirestore> | null = null;

export function getFirebaseAdminDb() {
  if (cachedDb) return cachedDb;

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(getFirebaseAdminConfig()),
      });

  cachedDb = getFirestore(app);
  return cachedDb;
}
