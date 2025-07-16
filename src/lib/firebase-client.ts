
'use client';

import { app } from './firebase';
import {
  initializeAppCheck,
  DebugAppCheckProvider,
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
    // This is true if we are on localhost or a similar dev environment, OR on a cloud workstation.
    const isDev =
      process.env.NODE_ENV !== "production" ||
      location.hostname.endsWith(".cloudworkstations.dev");

    // 2. Set Debug Token
    // In dev environments, if you don't provide a token in .env.local,
    // this will force the SDK to generate one in the console for you to copy.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ?? (isDev ? true : undefined);
    
    // 3. Conditional Provider Initialization with Error Handling
    if (isDev) {
      // Use the Debug Provider in development to avoid reCAPTCHA issues.
      try {
        initializeAppCheck(app, {
          provider: new DebugAppCheckProvider(),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized in DEBUG mode.");
      } catch (e) {
        console.warn("App Check debug initialization failed. The app will continue without it.", e);
      }
    } else {
      // PRODUCTION: Re-enable this block when your domain is registered in reCAPTCHA.
      // Make sure NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set in your environment variables.
      /*
      import { ReCaptchaV3Provider } from 'firebase/app-check';
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized in PRODUCTION mode.");
      } catch (e) {
        console.error("App Check production initialization failed:", e);
      }
      */
      console.log("App Check is configured for production (currently disabled). Uncomment the production block in firebase-client.ts to enable it.");
    }
  }
}
