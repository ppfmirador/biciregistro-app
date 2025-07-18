
// src/lib/homepageContent.ts
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { app } from './firebase'; // Use the standard client-side Firebase app
import { adminDb } from './firebase-admin-config';
import * as admin from 'firebase-admin';
import type { HomepageContent } from './types';


/**
 * Fetches homepage content directly from Firestore using the Admin SDK.
 * Intended for server-side use to avoid callable function overhead.
 */
export const getHomepageContentServer = async (): Promise<HomepageContent | null> => {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Fall back to callable function if admin credentials are not available
        return getHomepageContent();
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
        return null;
    } catch (error) {
        console.error('Error fetching homepage content with Admin SDK:', error);
        return null;
    }
};
