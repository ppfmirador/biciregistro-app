import 'server-only'; // Mark this module as server-only
import { adminDb } from './firebase-admin-config';
import type { HomepageContent } from './types';
import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Fetches homepage content directly from Firestore using the Admin SDK.
 * This function is intended for use in Server Components.
 */
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
    try {
        const contentRef = adminDb.collection('homepage_content').doc('config');
        const docSnap = await contentRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (data) {
                // Ensure timestamps are converted to ISO strings for JSON serialization
                if (data.lastUpdated && data.lastUpdated instanceof admin.firestore.Timestamp) {
                    data.lastUpdated = (data.lastUpdated as Timestamp).toDate().toISOString();
                }
                return data as HomepageContent;
            }
        }
        return null; // Document does not exist
    } catch (error) {
        console.error("Error fetching homepage content via Admin SDK:", error);
        // In a real-world scenario, you might want to log this error to a monitoring service.
        return null;
    }
};
