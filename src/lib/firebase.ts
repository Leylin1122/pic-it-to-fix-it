/**
 * Firebase client-side initialization helper.
 *
 * This file only initializes the browser Firebase SDK using public
 * config values prefixed with NEXT_PUBLIC_. It is safe to import from
 * client components and does not include any admin credentials.
 */
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigValid = missingKeys.length === 0;
export const firebaseConfigError = missingKeys.length
  ? new Error(
      `Missing Firebase config values: ${missingKeys.join(", ")}. ` +
        "Add them to .env.local using NEXT_PUBLIC_FIREBASE_* keys."
    )
  : undefined;

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

/**
 * Initialize or return the existing Firebase app instance.
 */
function initializeFirebaseApp(): FirebaseApp {
  if (!firebaseConfigValid) {
    throw firebaseConfigError;
  }

  cachedApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app = cachedApp ?? initializeFirebaseApp();
  cachedAuth = getAuth(app);
  return cachedAuth;
}
