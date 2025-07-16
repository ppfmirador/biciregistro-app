
'use server';

import { db } from './firebase';
import { doc, getDoc, Timestamp, type DocumentSnapshot, type DocumentData } from 'firebase/firestore'; // FIX: lint issue
import type { HomepageContent } from './types';

const CONTENT_COLLECTION = 'homepage_content';
const CONTENT_DOC_ID = 'config';

const homepageContentFromDoc = (docSnap: DocumentSnapshot<DocumentData>): HomepageContent => { // FIX: lint issue
  const data = docSnap.data();
  if (!data) { // FIX: lint issue - Added a check for data existence
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
  const contentRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  const docSnap = await getDoc(contentRef);
  if (docSnap.exists()) {
    return homepageContentFromDoc(docSnap);
  }
  return null;
};
