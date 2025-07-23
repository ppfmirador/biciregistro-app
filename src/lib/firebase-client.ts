
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
    appCheckInitialized = true;

    // --- App Check Initialization ---

    // 1. Define Development Environment
    const isDev =
      process.env.NODE_ENV !== "production" ||
      location.hostname.endsWith(".cloudworkstations.dev") ||
      location.hostname === "localhost";

    // 2. Set Debug Token
    // In dev environments, this logic forces the SDK to generate a new debug token in the console
    // if the one in .env.local is the placeholder. Once you have a real token, it will use that.
    if (isDev) {
      // This is the variable that the App Check SDK reads.
      // It's set on the window object to be globally available.
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
    }
    
    // 3. Initialize App Check
    // In dev, the debug token logic above will be used. In production, reCAPTCHA v3 will be used.
    // The try/catch prevents the app from crashing if reCAPTCHA fails to load (e.g., ad-blockers).
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized.");
      } catch (e: unknown) {
        console.warn("App Check initialization failed. The app will continue without it.", e);
      }
    } else {
        console.warn("App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set.");
    }
  }
}
