'use server';

import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | null = null;

// This function safely initializes the Firebase Admin SDK and returns the Firestore instance.
// It uses a singleton pattern to ensure it only initializes once.
export async function getAdminDb(): Promise<admin.firestore.Firestore | null> {
  if (adminDb) {
    return adminDb;
  }

  // If there's already a default app, use it.
  if (admin.apps.length > 0) {
    adminDb = admin.firestore();
    return adminDb;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.warn('Firebase service account key not found. Server-side data fetching will be disabled. Set FIREBASE_SERVICE_ACCOUNT_KEY in your App Hosting backend settings.');
    return null;
  }

  try {
    // Firebase Admin SDK expects a plain JSON object, not a stringified version.
    // The environment variable should be the JSON object itself.
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    adminDb = admin.firestore();
    return adminDb;

  } catch (error) {
    console.error("Error initializing Firebase Admin SDK. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON object.", error);
    return null;
  }
}
