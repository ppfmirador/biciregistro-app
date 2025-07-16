
'use client';

import { app } from './firebase'; // Import the already initialized app
import { 
  initializeAppCheck, 
  ReCaptchaV3Provider,
  DebugAppCheckProvider, // Import the Debug provider
} from 'firebase/app-check';

// This function should be called once from a client component, e.g., your main layout or auth provider.
let appCheckInitialized = false;

export function initializeClientSideFirebase() {
  if (typeof window !== "undefined") {
    
    if (appCheckInitialized) {
      return;
    }
    appCheckInitialized = true;

    // --- Start of new logic ---

    // 1. Detect if it's a development environment
    const isDev =
      process.env.NODE_ENV !== "production" ||
      location.hostname.endsWith(".cloudworkstations.dev") ||
      location.hostname === "localhost";

    // 2. Set the debug token flag if in development and no token is provided
    // This tells the SDK to expect a debug token or generate one.
    if (isDev) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN =
          process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ?? true;
    }

    // 3. Choose the provider based on the environment
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    let provider;

    if (isDev) {
      // For development (Cloud Workstations, localhost), use the Debug Provider
      // which doesn't perform the reCAPTCHA challenge.
      provider = new DebugAppCheckProvider();
      console.log("Firebase App Check initialized in DEBUG mode.");
    } else if (recaptchaSiteKey) {
      // For production, use the standard ReCaptchaV3Provider
      provider = new ReCaptchaV3Provider(recaptchaSiteKey);
      console.log("Firebase App Check initialized in production mode with reCAPTCHA.");
    } else {
      console.warn("App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined for production.");
      return; // Do not initialize if key is missing in production
    }
    
    // 4. Initialize App Check
    try {
      initializeAppCheck(app, {
        provider: provider,
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error("Error initializing Firebase App Check:", error);
    }
    
    // --- End of new logic ---
  }
}
