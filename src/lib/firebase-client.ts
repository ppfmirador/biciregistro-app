
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

    // For development (Cloud Workstations, localhost), use the Debug Provider
    // which doesn't perform the reCAPTCHA challenge.
    // This tells the SDK to expect a debug token or generate one.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ?? true;

    try {
      initializeAppCheck(app, {
        provider: new DebugAppCheckProvider(),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("Firebase App Check initialized in DEBUG mode.");
    } catch (error) {
      console.error("Error initializing Firebase App Check with DebugProvider:", error);
    }
  }
}
