
import { db, app } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  setDoc,
  orderBy,
  runTransaction,
  increment,
  limit,
  type QuerySnapshot,
  type QueryConstraint,
  type FirestoreError,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  Bike, BikeStatus, BikeType, TransferRequest,
  NewCustomerDataForShop, ShopAnalyticsData, NgoAnalyticsData, BikeRide, ReportTheftDialogData
} from './types';
import type { UserProfileData, UserProfile, UserRole } from '@/lib/types';
import type { BikeShopAdminFormValues, NgoAdminFormValues, BikeRideFormValues } from './schemas';
import { BIKE_STATUSES, OTHER_BRAND_VALUE } from '@/constants';

const safeToISOString = (dateInput: unknown, fieldNameForLogging: string): string => {
  if (dateInput instanceof Timestamp) {
    return dateInput.toDate().toISOString();
  }
  if (typeof dateInput === 'string') {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  console.warn(`Invalid date format for field '${fieldNameForLogging}' in bikeFromDoc:`, dateInput);
  return new Date(0).toISOString(); 
};

const bikeFromDoc = (docSnap: DocumentSnapshot): Bike => {
  if (!docSnap.exists()) {
    throw new Error(`Document data not found for document ${docSnap.id}`);
  }
  const data = docSnap.data();
  if (!data) {
    throw new Error(`No data found for document ${docSnap.id}`);
  }
  return {
    id: docSnap.id,
    serialNumber: data.serialNumber,
    brand: data.brand,
    model: data.model,
    ownerId: data.ownerId,
    status: data.status,
    registrationDate: safeToISOString(data.registrationDate, 'registrationDate'),
    statusHistory: (data.statusHistory || []).map((entry: DocumentData, index: number) => ({
      status: entry.status,
      timestamp: safeToISOString(entry.timestamp, `statusHistory[${index}].timestamp`),
      notes: entry.notes,
      transferDocumentUrl: entry.transferDocumentUrl || null,
      transferDocumentName: entry.transferDocumentName || null,
    })),
    photoUrls: data.photoUrls || [],
    color: data.color || undefined,
    description: data.description || undefined,
    country: data.country || undefined,
    state: data.state || undefined,
    bikeType: data.bikeType || undefined,
    ownershipDocumentUrl: data.ownershipDocumentUrl || null, 
    ownershipDocumentName: data.ownershipDocumentName || null, 
    theftDetails: data.theftDetails ? {
      ...data.theftDetails,
      theftLocationCountry: data.theftDetails.theftLocationCountry || undefined,
      reportedAt: safeToISOString(data.theftDetails.reportedAt, 'theftDetails.reportedAt'),
    } : null,
    registeredByShopId: data.registeredByShopId || null,
    pendingCustomerEmail: data.pendingCustomerEmail || null,
    ownerFirstName: data.ownerFirstName || '',
    ownerLastName: data.ownerLastName || '',
    ownerEmail: data.ownerEmail || '',
    ownerWhatsappPhone: data.ownerWhatsappPhone || '',
  } as Bike;
};

const bikeRideFromDoc = (docSnap: DocumentSnapshot): BikeRide => {
    if (!docSnap.exists()) {
        throw new Error(`No data found for document ${docSnap.id}`);
    }
    const data = docSnap.data();
    if (!data) {
        throw new Error(`No data found for document ${docSnap.id}`);
    }
    return {
        id: docSnap.id,
        organizerId: data.organizerId || data.ngoId, // Backwards compatibility
        organizerName: data.organizerName || data.ngoName,
        organizerLogoUrl: data.organizerLogoUrl || data.ngoLogoUrl,
        title: data.title,
        description: data.description,
        rideDate: safeToISOString(data.rideDate, 'rideDate'),
        distance: data.distance,
        meetingPoint: data.meetingPoint,
        meetingPointMapsLink: data.meetingPointMapsLink,
        createdAt: safeToISOString(data.createdAt, 'createdAt'),
        updatedAt: safeToISOString(data.updatedAt, 'updatedAt'),
        modality: data.modality || undefined,
        cost: data.cost ?? undefined,
        level: data.level || undefined,
        country: data.country,
        state: data.state,
    } as BikeRide;
};

const userProfileFromDoc = (docSnap: DocumentSnapshot): UserProfile => {
    if (!docSnap.exists()) {
        throw new Error(`Document data not found for document ${docSnap.id}`);
    }
    const data = docSnap.data();
    if (!data) {
        throw new Error(`No data found for document ${docSnap.id}`);
    }
    return {
        uid: docSnap.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        shopName: data.shopName,
        ngoName: data.ngoName,
        mission: data.mission,
        publicWhatsapp: data.publicWhatsapp,
        whatsappPhone: data.whatsappPhone,
        country: data.country,
        profileState: data.profileState,
        postalCode: data.postalCode,
        age: data.age,
        gender: data.gender,
        role: data.role,
        isAdmin: data.isAdmin || false,
        displayName: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : data.email,
        isAnonymous: false, 
        emailVerified: false, 
        registeredByShopId: data.registeredByShopId || undefined,
        referralCount: data.referralCount || 0,
        referrerId: data.referrerId || undefined,
        // Bike Shop specific
        address: data.address,
        website: data.website,
        mapsLink: data.mapsLink,
        phone: data.phone,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactWhatsApp: data.contactWhatsApp,
        // Shared field for Shops & NGOs
        whatsappGroupLink: data.whatsappGroupLink || null,
    } as UserProfile;
};


// Helper function to call the consolidated API
const callApi = async <T = any, R = any>(action: string, data?: T): Promise<R> => {
    const functions = getFunctions(app, "us-central1");
    const apiCallable = httpsCallable<any, any>(functions, "api");
    try {
        const result = await apiCallable({ action, data });
        return result.data as R;
    } catch (error) {
        console.error(`Error calling API action '${action}':`, error);
        throw error;
    }
};


export const getBikeBySerialNumber = async (serialNumber: string): Promise<Bike | null> => {
  return callApi<any, Bike | null>('getPublicBikeBySerial', { serialNumber });
};

export const getBikeById = async (bikeId: string): Promise<Bike | null> => {
  if (!bikeId || typeof bikeId !== 'string' || bikeId.trim() === '') {
    return null;
  }
  try {
    const bikeRef = doc(db, 'bikes', bikeId.trim());
    const docSnap = await getDoc(bikeRef);
    if (!docSnap.exists()) {
      return null;
    }
    return bikeFromDoc(docSnap);
  } catch (error) {
    console.error(`Error fetching bike by ID ${bikeId}:`, error);
    throw error;
  }
};

export const getMyBikes = async (): Promise<Bike[]> => {
    const { bikes } = await callApi<void, { bikes: Bike[] }>('getMyBikes');
    return bikes;
};


export const addBikeToFirestore = async (
  bikeData: {
    serialNumber: string;
    brand: string;
    otherBrand?: string;
    model: string;
    color?: string;
    description?: string;
    country?: string;
    state?: string;
    bikeType?: BikeType;
    photoUrls?: string[];
    ownershipDocumentUrl?: string | null;
    ownershipDocumentName?: string | null;
  },
  ownerId: string,
  registeredByShopId?: string | null,
  initialStatus: BikeStatus = BIKE_STATUSES[0],
  initialStatusNotes: string = "Registro inicial por ciclista"
): Promise<string> => {
  const finalBrand = bikeData.brand === OTHER_BRAND_VALUE ? bikeData.otherBrand || '' : bikeData.brand;
  
  const bikePayload = {
      ...bikeData,
      brand: finalBrand,
      ownerId,
      registeredByShopId,
      initialStatus,
      initialStatusNotes
  };

  const { bikeId } = await callApi('createBike', { data: { bikeData: bikePayload } });
  return bikeId;
};


export const updateBike = async (bikeId: string, updates: Partial<Omit<Bike, 'id' | 'registrationDate' | 'statusHistory' | 'ownerFirstName' | 'ownerLastName' | 'ownerEmail' | 'ownerWhatsappPhone'>> & { status?: BikeStatus, newStatusNote?: string, bikeType?: BikeType }): Promise<Bike | null> => {
  const bikeRef = doc(db, 'bikes', bikeId);
  await updateDoc(bikeRef, updates);
  const updatedBikeSnap = await getDoc(bikeRef);
  if (!updatedBikeSnap.exists()) {
    return null;
  }
  return bikeFromDoc(updatedBikeSnap);
};

export const markBikeRecovered = async (bikeId: string): Promise<void> => {
    await callApi('markBikeRecovered', { bikeId });
};

export const getUserTransferRequests = async (): Promise<TransferRequest[]> => {
    const { requests } = await callApi<void, { requests: TransferRequest[] }>('getUserTransferRequests');
    return requests;
};

export const getUserDoc = async (uid: string): Promise<UserProfileData | null> => {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  return docSnap.exists() ? docSnap.data() as UserProfileData : null;
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return userProfileFromDoc(querySnapshot.docs[0]);
};

export const createUserDoc = async (uid: string, data: Partial<UserProfileData>): Promise<void> => {
  await setDoc(doc(db, 'users', uid), data);
};


export const updateUserDoc = async (uid: string, data: Partial<UserProfileData>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });

  if (data.firstName !== undefined || data.lastName !== undefined) {
    const bikesRef = collection(db, 'bikes');
    const q = query(bikesRef, where('ownerId', '==', uid));
    const bikesSnapshot = await getDocs(q);

    if (!bikesSnapshot.empty) {
      const batch = writeBatch(db);
      const nameUpdate: { ownerFirstName?: string, ownerLastName?: string } = {};
      if (data.firstName !== undefined) nameUpdate.ownerFirstName = data.firstName;
      if (data.lastName !== undefined) nameUpdate.ownerLastName = data.lastName;
      bikesSnapshot.forEach(bikeDoc => batch.update(bikeDoc.ref, nameUpdate));
      await batch.commit();
    }
  }
};

export const incrementReferralCount = async (referrerId: string): Promise<void> => {
  if (!referrerId) return;
  const referrerRef = doc(db, 'users', referrerId);
  try {
    await runTransaction(db, async (transaction) => {
      const referrerDoc = await transaction.get(referrerRef);
      if (!referrerDoc.exists()) return;
      transaction.update(referrerRef, { referralCount: increment(1) });
    });
  } catch (error) {
    console.error("Referral count increment failed: ", error);
  }
};


export const getAllUsersForAdmin = async (): Promise<(UserProfileData & {id: string})[]> => {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as UserProfileData }));
};

export const getAllBikeShops = async (): Promise<(UserProfileData & {id: string})[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'bikeshop'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as UserProfileData }));
};

export const getAllNgos = async (): Promise<(UserProfileData & {id: string})[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'ngo'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as UserProfileData }));
};


export const updateUserRoleByAdmin = async (uid: string, role: UserRole): Promise<void> => {
    await callApi('updateUserRole', { data: { uid, role }});
};

type AccountData = BikeShopAdminFormValues | NgoAdminFormValues | NewCustomerDataForShop;

export const createAccountByAdmin = async (
  accountData: AccountData,
  role: 'bikeshop' | 'ngo' | 'cyclist',
  creatorId: string
): Promise<{ uid: string }> => {
    return callApi('createAccount', { data: { accountData, role, creatorId } });
};


export const getShopAnalytics = async (shopId: string, dateRange?: { from?: Date; to?: Date }): Promise<ShopAnalyticsData> => {
  // Client-side implementation of analytics logic.
  // This might become complex and slow; consider moving to a dedicated Cloud Function if performance becomes an issue.
  const usersRef = collection(db, "users");
  const usersQuery = query(usersRef, where("registeredByShopId", "==", shopId));
  const usersSnapshot = await getDocs(usersQuery);
  const userIds = usersSnapshot.docs.map(doc => doc.id);

  const results: ShopAnalyticsData = { totalBikesByShop: 0, totalUsersByShop: userIds.length, stolenBikes: 0, transferredBikes: 0 };
  if (userIds.length === 0) return results;

  const bikesRef = collection(db, "bikes");
  const bikesQuery = query(bikesRef, where("registeredByShopId", "==", shopId));
  const bikesSnapshot = await getDocs(bikesQuery);

  bikesSnapshot.forEach(doc => {
      const bike = bikeFromDoc(doc);
      results.totalBikesByShop++;
      if (bike.status === 'Robada') results.stolenBikes++;
      if (bike.status === 'Transferida') results.transferredBikes++;
  });
  return results;
};

export const getNgoAnalytics = async (ngoId: string, dateRange?: { from?: Date; to?: Date }): Promise<NgoAnalyticsData> => {
    // Analytics for NGOs. Similar to shop analytics but based on referrerId.
    const usersRef = collection(db, "users");
    const referredUsersQuery = query(usersRef, where("referrerId", "==", ngoId));
    const referredUsersSnapshot = await getDocs(referredUsersQuery);
    const referredUserIds = referredUsersSnapshot.docs.map(doc => doc.id);

    const results: NgoAnalyticsData = { totalUsersReferred: referredUserIds.length, totalBikesFromReferrals: 0, stolenBikesFromReferrals: 0, recoveredBikesFromReferrals: 0 };
    if (referredUserIds.length === 0) return results;

    const bikesRef = collection(db, "bikes");
    const allBikesQuery = query(bikesRef, where('ownerId', 'in', referredUserIds));
    const allBikesSnapshot = await getDocs(allBikesQuery);
    
    results.totalBikesFromReferrals = allBikesSnapshot.size;
    allBikesSnapshot.forEach(doc => {
        const bike = bikeFromDoc(doc);
        if (bike.status === 'Robada') results.stolenBikesFromReferrals++;
        // Recovered logic would be more complex, checking status history. For now, this is a simplification.
    });

    return results;
};

export const getPublicRides = async (): Promise<BikeRide[]> => {
    const ridesRef = collection(db, 'bikeRides');
    const q = query(ridesRef, where('rideDate', '>=', Timestamp.now()), orderBy('rideDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => bikeRideFromDoc(doc));
};

export const getOrganizerRides = async (organizerId: string): Promise<BikeRide[]> => {
    const ridesRef = collection(db, 'bikeRides');
    const q = query(ridesRef, where('organizerId', '==', organizerId), orderBy('rideDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => bikeRideFromDoc(doc));
};

export const getRideById = async (rideId: string): Promise<BikeRide | null> => {
    const rideRef = doc(db, 'bikeRides', rideId);
    const docSnap = await getDoc(rideRef);
    return docSnap.exists() ? bikeRideFromDoc(docSnap) : null;
};

export const createOrUpdateRide = async (rideData: BikeRideFormValues, organizerProfile: UserProfile, rideId?: string): Promise<string> => {
    const { rideId: newRideId } = await callApi('createOrUpdateRide', { data: { rideData, rideId } });
    return newRideId;
};

export const deleteRide = async (rideId: string, currentOrganizerId: string): Promise<void> => {
    const rideRef = doc(db, 'bikeRides', rideId);
    const rideSnap = await getDoc(rideRef);
    if (!rideSnap.exists() || rideSnap.data().organizerId !== currentOrganizerId) {
        throw new Error("No tienes permiso para eliminar este evento.");
    }
    await deleteDoc(rideRef);
};

export const getShopRegisteredBikes = async (shopId: string, searchTerm?: string, fetchLimit?: number): Promise<Bike[]> => {
  if (!shopId) return [];
  const bikesRef = collection(db, 'bikes');
  const constraints: QueryConstraint[] = [where('registeredByShopId', '==', shopId), orderBy('registrationDate', 'desc')];
  if(fetchLimit) constraints.push(limit(fetchLimit));
  
  if (searchTerm) {
    const querySnapshot = await getDocs(query(bikesRef, ...constraints));
    const allShopBikes = querySnapshot.docs.map(bikeFromDoc);
    const lowercasedTerm = searchTerm.toLowerCase();
    return allShopBikes.filter(bike => 
      bike.serialNumber.toLowerCase().includes(lowercasedTerm) ||
      (bike.ownerFirstName && bike.ownerFirstName.toLowerCase().includes(lowercasedTerm)) ||
      (bike.ownerLastName && bike.ownerLastName.toLowerCase().includes(lowercasedTerm)) ||
      (bike.ownerEmail && bike.ownerEmail.toLowerCase().includes(lowercasedTerm))
    );
  }
  
  const q = query(bikesRef, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(bikeFromDoc);
};

export const reportBikeTheft = async (bikeId: string, theftData: ReportTheftDialogData): Promise<void> => {
    await callApi('reportBikeStolen', { data: { bikeId, theftData }});
};

export const initiateTransfer = async (
    bikeId: string, 
    recipientEmail: string, 
    transferDocumentUrl?: string | null,
    transferDocumentName?: string | null
): Promise<void> => {
    await callApi('initiateTransferRequest', { data: { bikeId, recipientEmail, transferDocumentUrl, transferDocumentName }});
};
