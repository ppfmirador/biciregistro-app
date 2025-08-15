'use server';
import * as admin from 'firebase-admin';

// This is our singleton instance of the Firestore DB.
let adminDb: admin.firestore.Firestore | null = null;

/**
 * Safely initializes the Firebase Admin SDK and returns a Firestore instance.
 * It uses a singleton pattern to ensure that initialization only happens once.
 * This function is robust against multiple imports and calls across the server.
 */
export async function getAdminDb(): Promise<admin.firestore.Firestore | null> {
  // If the instance already exists, return it immediately.
  if (adminDb) {
    return adminDb;
  }

  // If there are no initialized apps, and we have a key, then initialize.
  if (admin.apps.length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.warn('Firebase service account key not found. Server-side data fetching will be disabled. Set FIREBASE_SERVICE_ACCOUNT_KEY in your App Hosting backend settings.');
      return null;
    }

    try {
      const serviceAccount = typeof serviceAccountKey === 'string'
        ? JSON.parse(serviceAccountKey)
        : serviceAccountKey;
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON object or string.", error);
      return null;
    }
  }

  // At this point, the default app is guaranteed to be initialized (either by this call or a previous one).
  // We can now safely get the Firestore instance and cache it.
  adminDb = admin.firestore();
  return adminDb;
}
