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
  NewCustomerDataForShop, ShopAnalyticsData, NgoAnalyticsData, BikeRide
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
        // Re-throw to be handled by the calling function
        throw error;
    }
};


export const getBikeBySerialNumber = async (serialNumber: string): Promise<Bike | null> => {
  return callApi<any, Bike | null>('getPublicBikeBySerial', { serialNumber });
};

export const getBikeById = async (bikeId: string): Promise<Bike | null> => {
  if (!bikeId || typeof bikeId !== 'string' || bikeId.trim() === '') {
    console.error("getBikeById called with invalid bikeId:", bikeId);
    return null;
  }
  try {
    const bikeRef = doc(db, 'bikes', bikeId.trim());
    const docSnap = await getDoc(bikeRef);
    if (!docSnap.exists()) {
      return null;
    }

    try {
      return bikeFromDoc(docSnap);
    } catch (docProcessingError) {
      console.error(`Error processing bike document ${docSnap.id}:`, docProcessingError);
      return null;
    }
  } catch (error) {
    console.error(`Firestore error fetching bike by ID ${bikeId}:`, error);
    throw error;
  }
};

export const getMyBikes = async (): Promise<Bike[]> => {
    const { bikes } = await callApi<void, { bikes: Bike[] }>('getMyBikes');
    return bikes;
};


/**
 * Adds a new bike document to Firestore. This function is called by a server action
 * and assumes the data has already been validated.
 */
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
  const bikesRef = collection(db, 'bikes');
  
  // Final server-side check for duplicate serial numbers.
  const serialNumberCheckQuery = query(bikesRef, where('serialNumber', '==', bikeData.serialNumber.trim()));
  const serialNumberSnapshot = await getDocs(serialNumberCheckQuery);
  if (!serialNumberSnapshot.empty) {
    throw new Error(`Ya existe una bicicleta registrada con el número de serie: ${bikeData.serialNumber}.`);
  }

  // Fetch owner's profile to denormalize name and contact info.
  const ownerProfile = await getUserDoc(ownerId);
  
  const finalBrand = bikeData.brand === OTHER_BRAND_VALUE ? bikeData.otherBrand || '' : bikeData.brand;

  const dataToSave: { [key: string]: unknown } = {
      serialNumber: bikeData.serialNumber.trim(),
      brand: finalBrand,
      model: bikeData.model.trim(),
      ownerId,
      ownerFirstName: ownerProfile?.firstName ?? "",
      ownerLastName: ownerProfile?.lastName ?? "",
      ownerEmail: ownerProfile?.email ?? "",
      ownerWhatsappPhone: ownerProfile?.whatsappPhone ?? "",
      status: initialStatus,
      registrationDate: serverTimestamp(),
      statusHistory: [{
        status: initialStatus,
        timestamp: Timestamp.now(),
        notes: initialStatusNotes,
      }],
      theftDetails: null,
      registeredByShopId: registeredByShopId ?? null,
      // Sanitize optional fields
      color: bikeData.color || null,
      description: bikeData.description || null,
      country: bikeData.country || null,
      state: bikeData.state || null,
      bikeType: bikeData.bikeType || null,
      photoUrls: bikeData.photoUrls || [],
      ownershipDocumentUrl: bikeData.ownershipDocumentUrl || null,
      ownershipDocumentName: bikeData.ownershipDocumentName || null,
  };

  const docRef = await addDoc(bikesRef, dataToSave);
  return docRef.id;
};


export const updateBike = async (bikeId: string, updates: Partial<Omit<Bike, 'id' | 'registrationDate' | 'statusHistory' | 'ownerFirstName' | 'ownerLastName' | 'ownerEmail' | 'ownerWhatsappPhone'>> & { status?: BikeStatus, newStatusNote?: string, bikeType?: BikeType }): Promise<Bike | null> => {
  const bikeRef = doc(db, 'bikes', bikeId);
  
  const updateData: { [key: string]: unknown } = {};

  if (updates.serialNumber) {
    const bikesRef = collection(db, 'bikes');
    const q = query(bikesRef, where('serialNumber', '==', updates.serialNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty && querySnapshot.docs[0].id !== bikeId) {
      throw new Error(`El número de serie '${updates.serialNumber}' ya está en uso por otra bicicleta.`);
    }
    updateData.serialNumber = updates.serialNumber;
  }
  
  if (updates.brand !== undefined) updateData.brand = updates.brand;
  if (updates.model !== undefined) updateData.model = updates.model;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.country !== undefined) updateData.country = updates.country;
  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.bikeType !== undefined) updateData.bikeType = updates.bikeType;
  if (updates.photoUrls !== undefined) updateData.photoUrls = updates.photoUrls;
  if (updates.ownershipDocumentUrl !== undefined) updateData.ownershipDocumentUrl = updates.ownershipDocumentUrl;
  if (updates.ownershipDocumentName !== undefined) updateData.ownershipDocumentName = updates.ownershipDocumentName;

  if (updates.status) {
    const bikeSnap = await getDoc(bikeRef);
    if (bikeSnap.exists() && bikeSnap.data().status !== updates.status) {
      updateData.status = updates.status;
      const newStatusEntry = {
        status: updates.status,
        timestamp: Timestamp.now(),
        notes: updates.newStatusNote || `Estado cambiado a ${updates.status}`,
      };
      updateData.statusHistory = arrayUnion(newStatusEntry);

      if (bikeSnap.data().status === BIKE_STATUSES[1] && updates.status !== BIKE_STATUSES[1]) {
        updateData.theftDetails = null;
      }
    }
  }
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(bikeRef, updateData);
  }
  
  const updatedBikeSnap = await getDoc(bikeRef);
  if (!updatedBikeSnap.exists()) {
    return null;
  }
  return bikeFromDoc(updatedBikeSnap);
};

export const addBike = async (
  bikeData: {
    serialNumber: string;
    brand: string;
    model: string;
    color?: string;
    description?: string;
    country?: string;
    state?: string;
    bikeType?: BikeType;
    photoUrls: string[];
    ownershipDocumentUrl: string | null;
    ownershipDocumentName: string | null;
  }
): Promise<{ bikeId: string }> => {
    return callApi('createBike', { bikeData });
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
  if (docSnap.exists()) {
    return docSnap.data() as UserProfileData;
  }
  return null;
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  try {
    const docSnap = querySnapshot.docs[0];
    if (!docSnap.exists()) {
        return null;
    }
    return userProfileFromDoc(docSnap);
  } catch (e) {
    console.error(`Error processing user profile for email ${email}:`, e);
    return null;
  }
};

// Use this for new user creation
export const createUserDoc = async (uid: string, data: Partial<UserProfileData>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data);
};


export const updateUserDoc = async (uid: string, data: Partial<UserProfileData>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const updateData: Partial<UserProfileData> = { ...data };

  // Remove empty string fields to avoid overwriting with empty values
  for (const key in updateData) {
    if (updateData[key as keyof typeof updateData] === '') {
      delete updateData[key as keyof typeof updateData];
    }
  }
  
  // We don't need to preserve existing data like role or email as this function
  // should receive all necessary fields to update from a form.
  
  await setDoc(userRef, updateData, { merge: true });

  if (data.firstName !== undefined || data.lastName !== undefined) {
    const bikesRef = collection(db, 'bikes');
    const q = query(bikesRef, where('ownerId', '==', uid));
    const bikesSnapshot = await getDocs(q);

    if (!bikesSnapshot.empty) {
      const batch = writeBatch(db);
      const nameUpdate: { ownerFirstName?: string, ownerLastName?: string } = {};
      if (data.firstName !== undefined) nameUpdate.ownerFirstName = data.firstName;
      if (data.lastName !== undefined) nameUpdate.ownerLastName = data.lastName;
      
      bikesSnapshot.forEach(bikeDoc => {
        batch.update(bikeDoc.ref, nameUpdate);
      });
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
      if (!referrerDoc.exists()) {
        console.warn(`Referrer with ID ${referrerId} does not exist. No referral will be attributed.`);
        return;
      }
      transaction.update(referrerRef, {
        referralCount: increment(1)
      });
    });
  } catch (error) {
    console.error("Transaction failed during referral count increment: ", error);
  }
};


export const getAllUsersForAdmin = async (): Promise<(UserProfileData & {id: string})[]> => {
  const usersRef = collection(db, 'users');
  const querySnapshot: QuerySnapshot<UserProfileData> = await getDocs(usersRef);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getAllBikeShops = async (): Promise<(UserProfileData & {id: string})[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'bikeshop'));
    const querySnapshot: QuerySnapshot<UserProfileData> = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getAllNgos = async (): Promise<(UserProfileData & {id: string})[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'ngo'));
    const querySnapshot: QuerySnapshot<UserProfileData> = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
};


export const updateUserRoleByAdmin = async (uid: string, role: UserRole): Promise<void> => {
    await callApi('updateUserRole', { uid, role });
};

type AccountData = BikeShopAdminFormValues | NgoAdminFormValues | NewCustomerDataForShop;

/**
 * Client-side wrapper to call the centralized `createAccount` Cloud Function.
 */
export const createAccountByAdmin = async (
  accountData: AccountData,
  role: 'bikeshop' | 'ngo' | 'cyclist',
  creatorId: string
): Promise<{ uid: string }> => {
    return callApi('createAccount', { accountData, role, creatorId });
};


export const getShopAnalytics = async (shopId: string, dateRange?: { from?: Date; to?: Date }): Promise<ShopAnalyticsData> => {
  const usersRef = collection(db, "users");
  
  const usersByRegistrationQuery = query(usersRef, where("registeredByShopId", "==", shopId));
  const usersByReferralQuery = query(usersRef, where("referrerId", "==", shopId));

  const [registrationSnapshot, referralSnapshot] = await Promise.all([
    getDocs(usersByRegistrationQuery),
    getDocs(usersByReferralQuery),
  ]);

  const shopUserIds = new Set<string>();
  registrationSnapshot.forEach(doc => shopUserIds.add(doc.id));
  referralSnapshot.forEach(doc => shopUserIds.add(doc.id));
  
  const results: ShopAnalyticsData = {
    totalBikesByShop: 0,
    totalUsersByShop: shopUserIds.size,
    stolenBikes: 0,
    transferredBikes: 0,
  };

  if (shopUserIds.size === 0) {
    return results;
  }

  const bikesRef = collection(db, "bikes");
  const userIdsArray = Array.from(shopUserIds);
  const allBikes: Bike[] = [];

  const MAX_IDS_PER_QUERY = 30;
  for (let i = 0; i < userIdsArray.length; i += MAX_IDS_PER_QUERY) {
      const batchUserIds = userIdsArray.slice(i, i + MAX_IDS_PER_QUERY);
      
      const constraints: QueryConstraint[] = [where('ownerId', 'in', batchUserIds)];
      if (dateRange?.from) {
        constraints.push(where('registrationDate', '>=', Timestamp.fromDate(dateRange.from)));
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); 
        constraints.push(where('registrationDate', '<=', Timestamp.fromDate(toDate)));
      }

      const q = query(bikesRef, ...constraints);
      const bikeSnapshot = await getDocs(q);
      
      bikeSnapshot.forEach(doc => {
          if (!doc.exists()) return;
          try {
              allBikes.push(bikeFromDoc(doc));
          } catch(e: unknown) {
              console.warn(`Could not process bike doc ${doc.id} for shop analytics`, e);
          }
      });
  }

  let totalBikesByShop = 0;
  let stolenCount = 0;
  let transferredCount = 0;
  
  allBikes.forEach(bike => {
    if (bike.registeredByShopId === shopId) {
      const regDate = new Date(bike.registrationDate);
      const fromOk = !dateRange?.from || regDate >= dateRange.from;
      const toOk = !dateRange?.to || regDate <= dateRange.to;
      if (fromOk && toOk) {
        totalBikesByShop++;
      }
    }
    
    bike.statusHistory.forEach(historyEntry => {
        const statusDate = new Date(historyEntry.timestamp);
        const fromOk = !dateRange?.from || statusDate >= dateRange.from;
        const toOk = !dateRange?.to || statusDate <= dateRange.to;
        if (fromOk && toOk) {
            if (historyEntry.status === 'Robada') {
                stolenCount++;
            }
            if (historyEntry.status === 'Transferida') {
                transferredCount++;
            }
        }
    });
  });

  results.totalBikesByShop = totalBikesByShop;
  results.stolenBikes = stolenCount;
  results.transferredBikes = transferredCount;

  return results;
};

export const getNgoAnalytics = async (ngoId: string, dateRange?: { from?: Date; to?: Date }): Promise<NgoAnalyticsData> => {
    const usersRef = collection(db, "users");
    
    try {
        const referredUsersQuery = query(usersRef, where("referrerId", "==", ngoId));

        const referredUsersSnapshot = await getDocs(referredUsersQuery);
        const referredUserIds = referredUsersSnapshot.docs.map(doc => doc.id);

        const results: NgoAnalyticsData = {
            totalUsersReferred: referredUserIds.length,
            totalBikesFromReferrals: 0,
            stolenBikesFromReferrals: 0,
            recoveredBikesFromReferrals: 0,
        };

        if (referredUserIds.length === 0) {
            return results;
        }

        const bikesRef = collection(db, "bikes");
        const allReferredBikes: Bike[] = [];

        const MAX_IDS_PER_QUERY = 30;
        for (let i = 0; i < referredUserIds.length; i += MAX_IDS_PER_QUERY) {
            const batchUserIds = referredUserIds.slice(i, i + MAX_IDS_PER_QUERY);
            
            const constraints: QueryConstraint[] = [where('ownerId', 'in', batchUserIds)];
            
            const q = query(bikesRef, ...constraints);
            const bikeSnapshot = await getDocs(q);
            
            bikeSnapshot.forEach(doc => {
                if (!doc.exists()) return;
                try {
                    allReferredBikes.push(bikeFromDoc(doc));
                } catch (e: unknown) {
                    console.warn(`Could not process bike doc ${doc.id} for NGO analytics`, e);
                }
            });
        }

        results.totalBikesFromReferrals = allReferredBikes.length;

        let stolenCount = 0;
        let recoveredCount = 0;

        allReferredBikes.forEach(bike => {
            let wasStolen = false;
            bike.statusHistory.forEach(entry => {
                const statusDate = new Date(entry.timestamp);
                const fromOk = !dateRange?.from || statusDate >= dateRange.from;
                const toOk = !dateRange?.to || statusDate <= dateRange.to;

                if (fromOk && toOk) {
                    if (entry.status === 'Robada') {
                        stolenCount++;
                        wasStolen = true;
                    }
                    if (wasStolen && entry.status === 'En Regla') {
                        recoveredCount++;
                        wasStolen = false; 
                    }
                }
            });
        });

        results.stolenBikesFromReferrals = stolenCount;
        results.recoveredBikesFromReferrals = recoveredCount;

        return results;

    } catch (error: unknown) {
        const firestoreError = error as FirestoreError;
        console.error("Raw error in getNgoAnalytics:", error);
        console.error("Detailed Firestore Error in getNgoAnalytics:", {
            code: firestoreError.code,
            message: firestoreError.message,
            stack: firestoreError.stack,
        });
        throw new Error(`No se pudieron cargar las analíticas. Verifica los permisos de la base de datos (Code: ${firestoreError.code || 'unknown'}).`);
    }
};

export const getPublicRides = async (): Promise<BikeRide[]> => {
    const ridesRef = collection(db, 'bikeRides');
    const q = query(ridesRef, where('rideDate', '>=', Timestamp.now()), orderBy('rideDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        if (!doc.exists()) return null;
        return bikeRideFromDoc(doc);
    }).filter((ride): ride is BikeRide => ride !== null);
};

export const getOrganizerRides = async (organizerId: string): Promise<BikeRide[]> => {
    const ridesRef = collection(db, 'bikeRides');

    // Query for new documents with 'organizerId'
    const q1 = query(ridesRef, where('organizerId', '==', organizerId));

    // Query for older documents that might have used 'ngoId'
    const q2 = query(ridesRef, where('ngoId', '==', organizerId));

    try {
        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        const ridesMap = new Map<string, BikeRide>();

        // Process first query results
        snapshot1.docs.forEach(doc => {
            if (!doc.exists()) return;
            try {
                ridesMap.set(doc.id, bikeRideFromDoc(doc));
            } catch(e: unknown) {
                console.warn(`Could not process ride doc ${doc.id} from organizerId query`, e);
            }
        });

        // Process second query results, avoiding duplicates
        snapshot2.docs.forEach(doc => {
            if (!ridesMap.has(doc.id) && doc.exists()) {
                try {
                    ridesMap.set(doc.id, bikeRideFromDoc(doc));
                } catch(e: unknown) {
                    console.warn(`Could not process ride doc ${doc.id} from ngoId query`, e);
                }
            }
        });

        const combinedRides = Array.from(ridesMap.values());
        
        // Sort the combined list by date
        combinedRides.sort((a, b) => new Date(b.rideDate).getTime() - new Date(a.rideDate).getTime());

        return combinedRides;

    } catch (error: unknown) {
        const firestoreError = error as FirestoreError;
        console.error("Firestore Error in getOrganizerRides:", {
            code: firestoreError.code,
            message: firestoreError.message,
            stack: firestoreError.stack,
        });
        // Re-throw a more user-friendly error or specific error to be caught by the UI
        throw new Error(`No se pudieron cargar los eventos. Verifica los permisos de la base de datos (Error: ${firestoreError.code}).`);
    }
};

export const getRideById = async (rideId: string): Promise<BikeRide | null> => {
  try {
    const rideRef = doc(db, 'bikeRides', rideId);
    const docSnap = await getDoc(rideRef);
    if (docSnap.exists()) {
      return bikeRideFromDoc(docSnap);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ride by ID ${rideId}:`, error);
    // Propagate the error to be handled by the caller, which is better for server components.
    throw error;
  }
};

export const createOrUpdateRide = async (
    rideData: BikeRideFormValues,
    organizerProfile: UserProfile,
    rideId?: string,
): Promise<string> => {
    return callApi('createOrUpdateRide', { rideData, rideId });
};

export const deleteRide = async (rideId: string, currentOrganizerId: string): Promise<void> => {
    const rideRef = doc(db, 'bikeRides', rideId);
    const rideSnap = await getDoc(rideRef);
    if (!rideSnap.exists() || rideSnap.data().organizerId !== currentOrganizerId) {
        throw new Error("No tienes permiso para eliminar este evento.");
    }
    await deleteDoc(rideRef);
};

export const getShopRegisteredBikes = async (
  shopId: string,
  searchTerm?: string,
  fetchLimit?: number
): Promise<Bike[]> => {
  if (!shopId) return [];

  const bikesRef = collection(db, 'bikes');
  const constraints: QueryConstraint[] = [
    where('registeredByShopId', '==', shopId),
    orderBy('registrationDate', 'desc'),
  ];
  if(fetchLimit) {
    constraints.push(limit(fetchLimit));
  }

  // If there's a search term, we need to fetch all bikes by the shop and then filter client-side,
  // as Firestore doesn't support 'OR' queries on different fields.
  // For a large-scale app, a dedicated search service like Algolia would be better.
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

  // If no search term, just apply the base query with optional limit.
  const q = query(bikesRef, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(bikeFromDoc);
};
