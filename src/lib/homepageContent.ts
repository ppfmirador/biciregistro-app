
// src/lib/homepageContent.ts
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { app } from './firebase'; // Use the standard client-side Firebase app
import type { HomepageContent } from './types';

/**
 * Fetches homepage content by calling a dedicated Cloud Function.
 * This function is safe to use on both server and client components.
 */
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
    try {
        const functions = getFunctions(app, 'us-central1');
        const getHomepageContentCallable = httpsCallable<void, HomepageContent>(functions, 'getHomepageContent');
        const result: HttpsCallableResult<HomepageContent> = await getHomepageContentCallable();
        return result.data;
    } catch (error) {
        console.error("Error fetching homepage content via Cloud Function:", error);
        // This will allow the component to fall back to default content.
        return null;
    }
};
