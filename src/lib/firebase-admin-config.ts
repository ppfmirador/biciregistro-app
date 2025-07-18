// src/lib/firebase-admin-config.ts
import * as admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK.
// It checks if an app is already initialized to prevent errors on hot-reloads in development.
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The service account key is retrieved from environment variables.
  // This is the secure way to handle credentials on the server.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!serviceAccount) {
    throw new Error('Firebase service account key not found in environment variables. Set FIREBASE_SERVICE_ACCOUNT_KEY.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Optionally add your databaseURL if needed for Realtime Database
    // databaseURL: `https://YOUR_PROJECT_ID.firebaseio.com`
  });
}

// Initialize and export the admin app instance
export const adminApp = initializeAdminApp();
export const adminDb = admin.firestore();
