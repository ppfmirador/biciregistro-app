
// src/lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// --- IMPORTANT ---
// Using environment variables is the standard practice, but to ensure the deployed
// server function can ALWAYS initialize Firebase, we provide the hardcoded keys
// as a fallback. This is the most robust solution for this specific hosting setup.
//
// PLEASE REPLACE these placeholder values with your actual Firebase project keys.
// You can find them in your Firebase project settings under "General".
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_HERE",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_HERE",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID_HERE",
};

// Initialize Firebase App
// This pattern ensures that the app is initialized only once.
const appInstance: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize App Check
// This should only run on the client-side.
if (typeof window !== "undefined") {
  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;

  if (debugToken) {
    // Development mode: Use the debug token.
    // This is the recommended approach for local development and CI environments.
    console.log("Firebase App Check: Initializing with debug token.");
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    initializeAppCheck(appInstance, {
      provider: new ReCaptchaV3Provider('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'), // Placeholder for debug provider
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    // Production mode: Use reCAPTCHA v3.
    const reCaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (reCaptchaSiteKey) {
      try {
        console.log("Firebase App Check: Initializing with reCAPTCHA v3 provider.");
        initializeAppCheck(appInstance, {
          provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (error) {
        console.error("Error initializing Firebase App Check with reCAPTCHA:", error);
      }
    } else {
      console.warn("Firebase App Check: Production mode detected but NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. App Check will not be initialized.");
    }
  }
}


// Export the initialized app and other Firebase services
export const app: FirebaseApp = appInstance;
export const auth: Auth = getAuth(appInstance);
export const db: Firestore = getFirestore(appInstance);
export const storage: FirebaseStorage = getStorage(appInstance);
