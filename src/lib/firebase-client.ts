
'use client';

import { app } from './firebase';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';

let appCheckInstance: AppCheck | null = null;

export function initializeClientSideFirebase() {
  if (typeof window === "undefined" || appCheckInstance) {
    return;
  }

  // --- App Check Initialization ---

  const reCaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;

  // For local development or environments where a debug token is explicitly provided.
  if (debugToken) {
    console.log("Firebase App Check: Using debug token.");
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  if (reCaptchaSiteKey) {
    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("Firebase App Check initialized successfully with reCAPTCHA.");
    } catch (e: unknown) {
      console.warn("App Check initialization with reCAPTCHA failed. The app will continue without it.", e);
      appCheckInstance = null;
    }
  } else {
      console.warn("App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. This is expected in local development if you are using a debug token.");
  }
}
