

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase'; // Use the client SDK firebase instance
import type { HomepageContent } from './types';


// This function now uses a callable Cloud Function to securely fetch data.
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
    // Note: 'us-central1' is often the default, but ensure it matches your function deployment region.
    const functions = getFunctions(app, 'us-central1');
    const getHomepageContentCallable = httpsCallable<void, HomepageContent>(functions, 'getHomepageContent');

    try {
        const result = await getHomepageContentCallable();
        return result.data;
    } catch(error) {
        console.error("Error calling getHomepageContent function:", error);
        // You might want to return null or throw a more specific error
        // for the UI to handle, e.g., showing a "Could not load content" message.
        return null;
    }
};
