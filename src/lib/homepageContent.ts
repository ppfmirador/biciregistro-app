
'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import type { HomepageContent } from './types';

/**
 * Fetches homepage content by calling the consolidated `api` Cloud Function.
 * This is intended for use in client components.
 */
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
    try {
        const functions = getFunctions(app, 'us-central1');
        // Point to the consolidated 'api' function and specify the action
        const apiCallable = httpsCallable<any, HomepageContent>(functions, 'api');
        const result = await apiCallable({ action: 'getHomepageContent' });
        return result.data;
    } catch (error) {
        // Errors from the callable function will be caught here.
        // The function itself logs the specific Firestore error on the server.
        // We log the client-side error context here.
        console.error("Error fetching homepage content via Cloud Function:", error);
        // It's better to return null and let the UI handle it with default content
        // than to throw an error that might crash the component.
        return null;
    }
};
