// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import type {
  BikeRideFormValues,
  BikeShopAdminFormValues,
  NewCustomerDataForShop,
  NgoAdminFormValues,
  UserProfileData,
  UserRole,
} from "./types";

admin.initializeApp();

const allowedOrigins = [
  "https://biciregistro.mx",
  "https://www.biciregistro.mx",
  "https://bike-guardian-hbbg6.firebaseapp.com",
  "https://bike-guardian-staging.web.app",
  /^https:\/\/.*\.cloudworkstations\.dev$/,
  "http://localhost:3000",
];

setGlobalOptions({
  region: "us-central1",
  enforceAppCheck: true,
});

const callOptions = {
  cors: allowedOrigins,
};

// --- Action Handlers (Internal Logic) ---

const handleCreateBike = async (data: any, context: any) => {
  if (!context.auth) throw new HttpsError("unauthenticated", "You must be logged in.");
  const { bikeData } = data;
  const ownerId = context.auth.uid;

  if (!bikeData || !bikeData.serialNumber || !bikeData.brand || !bikeData.model) {
    throw new HttpsError("invalid-argument", "Serial number, brand, and model are required.");
  }

  const bikesRef = admin.firestore().collection("bikes");
  const serialNumberCheckQuery = bikesRef.where("serialNumber", "==", bikeData.serialNumber.trim());
  const serialNumberSnapshot = await serialNumberCheckQuery.get();
  if (!serialNumberSnapshot.empty) {
    throw new HttpsError("already-exists", `Ya existe una bicicleta registrada con el número de serie: ${bikeData.serialNumber}`);
  }

  const ownerProfile = await admin.firestore().collection("users").doc(ownerId).get();
  const ownerData = ownerProfile.exists ? ownerProfile.data() : null;

  if (!context.auth.token.email) {
    throw new HttpsError("unauthenticated", "Your user token is missing a valid email address.");
  }
  
  const dataToSave = {
    serialNumber: bikeData.serialNumber.trim(),
    brand: bikeData.brand.trim(),
    model: bikeData.model.trim(),
    ownerId,
    ownerFirstName: ownerData?.firstName ?? "",
    ownerLastName: ownerData?.lastName ?? "",
    ownerEmail: ownerData?.email || context.auth.token.email,
    ownerWhatsappPhone: ownerData?.whatsappPhone ?? "",
    status: "En Regla",
    registrationDate: admin.firestore.Timestamp.now(),
    statusHistory: [{ status: "En Regla", timestamp: admin.firestore.Timestamp.now(), notes: "Registro inicial por ciclista" }],
    theftDetails: null,
    color: bikeData.color ?? null,
    description: bikeData.description ?? null,
    country: bikeData.country ?? null,
    state: bikeData.state ?? null,
    bikeType: bikeData.bikeType ?? null,
    photoUrls: Array.isArray(bikeData.photoUrls) ? bikeData.photoUrls : [],
    ownershipDocumentUrl: bikeData.ownershipDocumentUrl ?? null,
    ownershipDocumentName: bikeData.ownershipDocumentName ?? null,
    registeredByShopId: bikeData.registeredByShopId ?? null,
  };

  const docRef = await bikesRef.add(dataToSave);
  return { bikeId: docRef.id };
};

const handleGetMyBikes = async (data: any, context: any) => {
    if (!context.auth) throw new HttpsError("unauthenticated", "You must be logged in.");
    const ownerId = context.auth.uid;
    const bikesRef = admin.firestore().collection("bikes");
    const q = bikesRef.where("ownerId", "==", ownerId);
    const querySnapshot = await q.get();

    const bikes = querySnapshot.docs.map(doc => {
        const bikeData = doc.data();
        const statusHistory = (bikeData.statusHistory || []).map((entry: { timestamp: admin.firestore.Timestamp }) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate().toISOString(),
        }));
        return {
            id: doc.id,
            ...bikeData,
            registrationDate: bikeData.registrationDate?.toDate().toISOString(),
            statusHistory,
        };
    });
    return { bikes };
};

const handleUpdateUserRole = async (data: any, context: any) => {
    // if (context.auth?.token.admin !== true) {
    //     throw new HttpsError("permission-denied", "Only admins can modify user roles.");
    // }
    const { uid, role } = data as { uid: string; role: UserRole };
    if (!uid || !role) throw new HttpsError("invalid-argument", "UID and role are required.");
    
    const isAdmin = role === 'admin';
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin, role });
    const userRef = admin.firestore().collection("users").doc(uid);
    await userRef.set({ role, isAdmin }, { merge: true });
    
    return { message: `Success! User ${uid} has been made a(n) ${role}.` };
};


// --- The single dispatching Cloud Function ---

export const api = onCall(callOptions, async (req) => {
  const { action, data } = req.data;

  try {
    switch (action) {
      case "createBike":
        return await handleCreateBike(data, req);
      case "getMyBikes":
        return await handleGetMyBikes(data, req);
      case "updateUserRole":
        return await handleUpdateUserRole(data, req);
      // ... other cases will be added here
      default:
        throw new HttpsError("not-found", "No such action found.");
    }
  } catch (error) {
    // Log the full error on the server for debugging
    console.error(`Error executing action '${action}':`, error);
    
    // Re-throw HttpsError to be caught by the client
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // For other types of errors, throw a generic internal error
    throw new HttpsError("internal", `An unexpected error occurred while executing ${action}.`);
  }
});
