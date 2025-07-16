
'use client';

import { app } from './firebase'; // Import the already initialized app
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// This function should be called once from a client component, e.g., your main layout or auth provider.
let appCheckInitialized = false;

export function initializeClientSideFirebase() {
  if (typeof window !== "undefined") {
    
    if (appCheckInitialized) {
      return;
    }
    appCheckInitialized = true;

    // Use debug token if available (for local development)
    const appCheckDebugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
    if (appCheckDebugToken) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckDebugToken;
    }
    
    // Initialize App Check with reCAPTCHA v3 provider
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey) {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized.");
      } catch (error) {
        console.error("Error initializing Firebase App Check:", error);
      }
    } else {
      console.warn("App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined.");
    }
  }
}
