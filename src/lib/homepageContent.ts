'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import type { HomepageContent } from './types';

/**
 * Calls the consolidated 'api' Cloud Function.
 * This is a client-side utility.
 * @param action The specific action to be performed by the backend.
 * @param data Optional data payload for the action.
 * @returns The result from the callable function.
 */
const callApi = async <T = unknown, R = any>(
  action: string,
  data?: T,
): Promise<R> => {
  const functions = getFunctions(app, 'us-central1');
  const apiCallable = httpsCallable<any, any>(functions, 'api');
  try {
    const result = await apiCallable({ action, data });
    return result.data as R;
  } catch (error) {
    console.error(`Error calling API action '${action}':`, error);
    // Re-throwing the error allows the caller to handle it (e.g., with toasts).
    throw error;
  }
};

/**
 * Fetches the homepage content from Firestore via a Cloud Function.
 * This function is intended for client-side use.
 * @returns A promise that resolves with the homepage content or null if not found.
 */
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
  try {
    const content = await callApi<void, HomepageContent | null>(
      'getHomepageContent',
    );
    return content;
  } catch (error) {
    console.error('Failed to get homepage content:', error);
    // Return null to allow the frontend to gracefully handle the error, e.g., by using default content.
    return null;
  }
};
