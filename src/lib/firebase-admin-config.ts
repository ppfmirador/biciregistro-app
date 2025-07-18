'use server';
// src/lib/firebase-admin-config.ts
import * as admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK.
// It checks if an app is already initialized to prevent errors on hot-reloads in development.
function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Firebase service account key not found in environment variables. Set FIREBASE_SERVICE_ACCOUNT_KEY.');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Add other config like databaseURL if needed
  });
}

// Export a single initialized instance of the admin app.
export const adminApp = initializeAdminApp();
export const adminDb = admin.firestore();
