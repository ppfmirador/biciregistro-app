
'use server';

import { getFirestore, Timestamp, type DocumentSnapshot, type DocumentData } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import type { HomepageContent } from './types';

// --- Safe Firebase Admin SDK Initialization ---
// This pattern prevents re-initialization errors in hot-reload environments.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    if (error.code === 'GCLOUD_PROJECT_NOT_SET') {
        console.warn("Firebase Admin SDK not initialized: GCLOUD_PROJECT_NOT_SET. This is expected in client-side rendering but may cause errors in server-side logic.");
    } else if (error.code !== 'auth/invalid-credential') {
        console.error("Firebase Admin SDK initialization error:", error);
    }
    // For other errors, especially 'auth/invalid-credential' during local dev without credentials,
    // we can let it fail gracefully as it might not be needed for all paths.
  }
}

const db = getFirestore();
// --- End Initialization ---


const CONTENT_COLLECTION = 'homepage_content';
const CONTENT_DOC_ID = 'config';

const homepageContentFromDoc = (docSnap: DocumentSnapshot<DocumentData>): HomepageContent => {
  const data = docSnap.data();
  if (!data) {
      throw new Error(`Document data not found for ${docSnap.id}`);
  }
  return {
    id: docSnap.id,
    ...data,
    sponsors: data.sponsors || [], // Ensure sponsors is always an array
    lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
  } as HomepageContent;
};

export const getHomepageContent = async (): Promise<HomepageContent | null> => {
  // Guard clause in case Admin SDK fails to initialize (e.g., no credentials in local dev)
  if (!admin.apps.length) {
    console.warn("getHomepageContent: Firebase Admin SDK not available. Returning null.");
    return null;
  }
  
  const contentRef = db.collection(CONTENT_COLLECTION).doc(CONTENT_DOC_ID);

  try {
    const docSnap = await contentRef.get();
    if (docSnap.exists) {
      return homepageContentFromDoc(docSnap);
    }
    console.log("Homepage content document does not exist.");
    return null;
  } catch(error) {
     console.error("Error fetching homepage content document from Admin SDK:", error);
     return null;
  }
};
