
'use client';

import { app } from './firebase';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

let appCheckInitialized = false;

export function initializeClientSideFirebase() {
  if (typeof window !== "undefined") {
    if (appCheckInitialized) {
      return;
    }
    
    // --- App Check Initialization ---

    // 1. Define Development Environment
    const isDev =
      process.env.NODE_ENV !== "production" ||
      window.location.hostname.endsWith(".cloudworkstations.dev") ||
      window.location.hostname === "localhost";

    // 2. Set Debug Token
    if (isDev) {
      // This is the variable that the App Check SDK reads.
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
    }
    
    // 3. Initialize App Check
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      appCheckInitialized = true; // Set to true before initializing to prevent re-runs
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized successfully.");
      } catch (e: unknown) {
        console.warn("App Check initialization failed. The app will continue without it.", e);
        appCheckInitialized = false; // Reset if initialization fails
      }
    } else {
        console.warn("App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set in environment variables.");
    }
  }
}
