

import { adminDb } from './firebase-admin-config'; // Use the admin SDK for server-side fetching
import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore'; // Use admin types
import type { HomepageContent } from './types';
import { APP_NAME } from '@/constants';

const CONTENT_COLLECTION = 'homepage_content';
const CONTENT_DOC_ID = 'config';

const homepageContentFromDoc = (docSnap: DocumentSnapshot): HomepageContent => {
  if (!docSnap.exists) {
    throw new Error(`Document data not found for ${docSnap.id}`);
  }
  const data = docSnap.data();
  if (!data) {
    throw new Error(`Document data not found for ${docSnap.id}`);
  }
  
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
    referralMessage: data.referralMessage,
    ngoReferralMessageTemplate: data.ngoReferralMessageTemplate,
    lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
  } as HomepageContent;
};

// This function is now correctly using the Admin SDK for server-side execution.
export const getHomepageContent = async (): Promise<HomepageContent | null> => {
  const contentRef = adminDb.collection(CONTENT_COLLECTION).doc(CONTENT_DOC_ID);
  
  try {
    const docSnap = await contentRef.get();
    if (docSnap.exists) {
      return homepageContentFromDoc(docSnap);
    }
    console.log("Homepage content document does not exist.");
    return null;
  } catch(error) {
     console.error("Error fetching homepage content document:", error);
     return null; 
  }
};
