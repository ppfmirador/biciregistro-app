
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
  // force debug mode ✔
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  
  try {
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey) {
        initializeAppCheck(appInstance, {
          provider: new ReCaptchaV3Provider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized with ReCaptchaV3Provider.");
    } else {
      console.warn("Firebase App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined.");
    }
  } catch (error) {
    console.error("Error initializing Firebase App Check:", error);
  }
}


// Export the initialized app and other Firebase services
export const app: FirebaseApp = appInstance;
export const auth: Auth = getAuth(appInstance);
export const db: Firestore = getFirestore(appInstance);
export const storage: FirebaseStorage = getStorage(appInstance);
