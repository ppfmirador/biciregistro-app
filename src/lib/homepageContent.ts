
'use server';

import { db } from './firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { HomepageContent } from './types';

const CONTENT_COLLECTION = 'homepage_content';
const CONTENT_DOC_ID = 'config';

const homepageContentFromDoc = (docSnap: any): HomepageContent => {
  const data = docSnap.data();
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
