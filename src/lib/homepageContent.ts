

import { db } from './firebase'; 
import { collection, getDoc, doc } from 'firebase/firestore';
import type { HomepageContent, SponsorConfig } from './types';
import type { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { APP_NAME } from '@/constants';

const CONTENT_COLLECTION = 'homepage_content';
const CONTENT_DOC_ID = 'config';

const homepageContentFromDoc = (docSnap: DocumentSnapshot): HomepageContent => {
  if (!docSnap.exists()) {
    throw new Error(`Document data not found for ${docSnap.id}`);
  }
  const data = docSnap.data();
  return {
    id: docSnap.id,
    welcomeTitle: data.welcomeTitle,
    welcomeDescription: data.welcomeDescription,
    whyAppNameTitle: data.whyAppNameTitle,
    feature1Title: data.feature1Title,
    feature1Description: data.feature1Description,
    feature2Title: data.feature2Title,
    feature2Description: data.feature2Description,
    feature3Title: data.feature3Title,
    feature3Description: data.feature3Description,
    communityTitle: data.communityTitle,
    communityDescription: data.communityDescription,
    communityImageUrl: data.communityImageUrl,
    sponsors: data.sponsors || [], 
    lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
  } as HomepageContent;
};

// This function can now be called from both client and server components.
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
  const contentRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  
  try {
    const docSnap = await getDoc(contentRef);
    if (docSnap.exists()) {
      return homepageContentFromDoc(docSnap);
    }
    console.log("Homepage content document does not exist.");
    return null;
  } catch(error) {
     console.error("Error fetching homepage content document:", error);
     return null; 
  }
};
