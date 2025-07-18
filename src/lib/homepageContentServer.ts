'use server';

import { getAdminDb } from './firebase-admin-config';
import * as admin from 'firebase-admin';
import type { HomepageContent } from './types';

/**
 * Fetches homepage content directly from Firestore using the Admin SDK.
 * Intended for server-side use to avoid callable function overhead.
 */
export const getHomepageContentServer = async (): Promise<HomepageContent | null> => {
  const adminDb = await getAdminDb();
  
  // If the Admin SDK failed to initialize (e.g., missing env var), don't try to use it.
  if (!adminDb) {
    console.warn("Firebase Admin DB is not available. Skipping server-side homepage content fetch.");
    return null;
  }
  
  try {
    const docSnap = await adminDb.collection('homepage_content').doc('config').get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data && data.lastUpdated instanceof admin.firestore.Timestamp) {
        data.lastUpdated = data.lastUpdated.toDate().toISOString();
      }
      return data as HomepageContent;
    }
    // If the document doesn't exist, it's not an error, we just return null.
    return null;
  } catch (error) {
    console.error('Error fetching homepage content with Admin SDK:', error);
    // Return null in case of other errors (e.g., permissions) so the page can still render with defaults.
    return null; 
  }
};
