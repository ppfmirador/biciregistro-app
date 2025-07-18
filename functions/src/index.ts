// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import type {
  BikeRideFormValues,
  BikeShopAdminFormValues,
  NgoAdminFormValues,
  TheftReportData,
  UserRole,
} from "./types";

// Initialize Firebase Admin SDK
admin.initializeApp();

/**  Lista de orígenes que permitirás durante el desarrollo y en prod  */
const allowedOrigins = [
  "https://biciregistro.mx",
  "https://www.biciregistro.mx",
  "https://bike-guardian-hbbg6.firebaseapp.com",
  // cloud workstation → usa un comodín para cualquier sub-dominio
  /^https:\/\/.*\.cloudworkstations\.dev$/,
  "http://localhost:3000",
];

// Set global options for all functions in this file.
// CORS is handled per-function via callOptions.
setGlobalOptions({
  region: "us-central1",
  // Bypassing App Check for development. Change to true for production.
  enforceAppCheck: false,
});

// This object now contains the CORS configuration to be applied to each function.
const callOptions = {
  cors: allowedOrigins,
};

// ───────────────────────────
//     Cloud Functions
// ───────────────────────────

/**
 * Creates a new bike document in Firestore.
 * This function performs a server-side check for duplicate serial numbers
 * and sanitizes all incoming data.
 */
export const createBike = onCall(callOptions, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to create a bike."
    );
  }
  const { bikeData } = req.data;
  const ownerId = req.auth.uid;

  // --- Start of Robust Validation ---
  if (!bikeData) {
    throw new HttpsError("invalid-argument", "Bike data object is missing.");
  }
  const {
    serialNumber,
    brand,
    model,
    color,
    description,
    country,
    state,
    bikeType,
    photoUrls,
    ownershipDocumentUrl,
    ownershipDocumentName,
  } = bikeData;

  if (
    !serialNumber ||
    typeof serialNumber !== "string" ||
    serialNumber.trim() === ""
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Bike data must include a valid 'serialNumber'."
    );
  }
  if (!brand || typeof brand !== "string" || brand.trim() === "") {
    throw new HttpsError(
      "invalid-argument",
      "Bike data must include a valid 'brand'."
    );
  }
  if (!model || typeof model !== "string" || model.trim() === "") {
    throw new HttpsError(
      "invalid-argument",
      "Bike data must include a valid 'model'."
    );
  }
  // --- End of Robust Validation ---

  const bikesRef = admin.firestore().collection("bikes");
  const serialNumberCheckQuery = bikesRef.where(
    "serialNumber",
    "==",
    serialNumber.trim()
  );

  try {
    const serialNumberSnapshot = await serialNumberCheckQuery.get();
    if (!serialNumberSnapshot.empty) {
      throw new HttpsError(
        "already-exists",
        `Ya existe una bicicleta registrada con el número de serie: ${serialNumber}`
      );
    }

    const ownerProfile = await admin
      .firestore()
      .collection("users")
      .doc(ownerId)
      .get();

    // Defensive check for user profile. Now it's not a blocking check.
    const ownerData = ownerProfile.exists ? ownerProfile.data() : null;

    // Defensive check for auth token email.
    if (!req.auth.token.email) {
      console.error(
        `User token for UID: ${ownerId} is missing an email address.`
      );
      throw new HttpsError(
        "unauthenticated",
        "Your user token is missing a valid email address."
      );
    }

    // --- Start of Defensive Data Construction ---
    const dataToSave = {
      serialNumber: serialNumber.trim(),
      brand: brand.trim(),
      model: model.trim(),
      ownerId: ownerId,
      ownerFirstName: ownerData?.firstName ?? "",
      ownerLastName: ownerData?.lastName ?? "",
      // Fallback to auth token email if not present in the user document
      ownerEmail: ownerData?.email || req.auth.token.email,
      ownerWhatsappPhone: ownerData?.whatsappPhone ?? "",
      status: "En Regla",
      registrationDate: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: [
        {
          status: "En Regla",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          notes: "Registro inicial por ciclista",
        },
      ],
      theftDetails: null,
      // Optional fields are explicitly checked and defaulted to null/[]
      color: color ?? null,
      description: description ?? null,
      country: country ?? null,
      state: state ?? null,
      bikeType: bikeType ?? null,
      photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
      ownershipDocumentUrl: ownershipDocumentUrl ?? null,
      ownershipDocumentName: ownershipDocumentName ?? null,
    };
    // --- End of Defensive Data Construction ---

    const docRef = await bikesRef.add(dataToSave);

    return { bikeId: docRef.id };
  } catch (error: unknown) {
    const isHttpsError = error instanceof HttpsError;
    // Improved logging
    console.error(`Error in createBike for user ${req.auth?.uid}:`, {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorCode: isHttpsError ? (error as HttpsError).code : undefined,
      bikeData: {
        // Log the data that caused the issue, but be careful with sensitive info
        serialNumber: bikeData.serialNumber,
        brand: bikeData.brand,
        model: bikeData.model,
      },
      fullError: error,
    });
    if (isHttpsError) {
      throw error;
    }
    // Throw with the original error message for better client-side debugging
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An internal error occurred while creating the bike.";
    throw new HttpsError("internal", errorMessage);
  }
});

/**
 * Fetches all bikes owned by the currently authenticated user.
 */
export const getMyBikes = onCall(callOptions, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to view your bikes."
    );
  }
  const ownerId = req.auth.uid;

  try {
    const bikesRef = admin.firestore().collection("bikes");
    const q = bikesRef.where("ownerId", "==", ownerId);
    const querySnapshot = await q.get();

    const bikes = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamps to ISO strings for the client
      const statusHistory = (data.statusHistory || []).map(
        (entry: { timestamp: admin.firestore.Timestamp }) => ({
          ...entry,
          timestamp: entry.timestamp?.toDate().toISOString(),
        })
      );

      return {
        id: doc.id,
        ...data,
        registrationDate: data.registrationDate?.toDate().toISOString(),
        statusHistory: statusHistory,
      };
    });
    return { bikes };
  } catch (error) {
    console.error("Error fetching user's bikes:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected server error while fetching bikes.";
    throw new HttpsError("internal", errorMessage);
  }
});

/**
 * Fetches a bike's details by its serial number.
 * Returns full details for the owner, and public details for others.
 */
export const getPublicBikeBySerial = onCall(callOptions, async (req) => {
  const { serialNumber } = req.data as { serialNumber: string };
  if (!serialNumber || typeof serialNumber !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Serial number must be a non-empty string."
    );
  }

  try {
    const bikesRef = admin.firestore().collection("bikes");
    const q = bikesRef.where("serialNumber", "==", serialNumber).limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return null;
    }

    const bikeDoc = querySnapshot.docs[0];
    const bikeData = bikeDoc.data();
    const isOwner = req.auth?.uid === bikeData.ownerId;

    // Helper to convert Firestore Timestamps to ISO strings safely
    const toISO = (timestamp: admin.firestore.Timestamp | undefined) => {
      return timestamp ? timestamp.toDate().toISOString() : undefined;
    };

    const statusHistory = (bikeData.statusHistory || []).map(
      (entry: { timestamp: admin.firestore.Timestamp }) => ({
        ...entry,
        timestamp: toISO(entry.timestamp),
      })
    );

    const theftDetails = bikeData.theftDetails
      ? {
          ...bikeData.theftDetails,
          reportedAt: toISO(bikeData.theftDetails.reportedAt),
        }
      : null;

    // Base public data available to everyone
    const publicData = {
      id: bikeDoc.id,
      serialNumber: bikeData.serialNumber,
      brand: bikeData.brand,
      model: bikeData.model,
      status: bikeData.status,
      photoUrls: bikeData.photoUrls || [],
      color: bikeData.color || null,
      description: bikeData.description || null,
      country: bikeData.country || null,
      state: bikeData.state || null,
      bikeType: bikeData.bikeType || null,
      ownerFirstName: bikeData.ownerFirstName || "",
      ownerLastName: bikeData.ownerLastName || "",
      registrationDate: toISO(bikeData.registrationDate),
      statusHistory,
      theftDetails,
    };

    if (isOwner) {
      // For the owner, return all data including private fields
      return {
        ...publicData,
        ownerId: bikeData.ownerId,
        ownershipDocumentUrl: bikeData.ownershipDocumentUrl || null,
        ownershipDocumentName: bikeData.ownershipDocumentName || null,
        ownerEmail: bikeData.ownerEmail || "",
        ownerWhatsappPhone: bikeData.ownerWhatsappPhone || "",
        registeredByShopId: bikeData.registeredByShopId || null,
      };
    } else {
      // For the public, return only the public data
      return publicData;
    }
  } catch (error) {
    console.error("Error in getPublicBikeBySerial:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected server error while fetching bike details.";
    throw new HttpsError("internal", errorMessage);
  }
});

/**
 * Reports a bike as stolen. Only the owner can call this.
 * @param {string} bikeId The ID of the bike to report as stolen.
 * @param {object} theftData Details about the theft incident.
 */
export const reportBikeStolen = onCall(callOptions, async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to report a theft."
    );
  }
  const { bikeId, theftData } = req.data as {
    bikeId: string;
    theftData: TheftReportData;
  };
  const { uid } = req.auth;

  if (
    !bikeId ||
    typeof bikeId !== "string" ||
    !theftData ||
    typeof theftData !== "object"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Valid bikeId and theftData are required."
    );
  }

  const bikeRef = admin.firestore().collection("bikes").doc(bikeId);

  try {
    const bikeDoc = await bikeRef.get();
    if (!bikeDoc.exists || bikeDoc.data()?.ownerId !== uid) {
      throw new HttpsError(
        "permission-denied",
        "You do not own this bike or it does not exist."
      );
    }

    const fullTheftDetails = {
      theftLocationState: theftData.theftLocationState,
      theftLocationCountry: theftData.theftLocationCountry,
      theftPerpetratorDetails: theftData.theftPerpetratorDetails || null,
      theftIncidentDetails: theftData.theftIncidentDetails,
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const newStatusEntry = {
      status: "Robada",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      notes:
        theftData.generalNotes ||
        `Reportada como robada en ${theftData.theftLocationState}, ` +
          `${theftData.theftLocationCountry}.`,
    };

    await bikeRef.update({
      status: "Robada",
      statusHistory: admin.firestore.FieldValue.arrayUnion(newStatusEntry),
      theftDetails: fullTheftDetails,
    });
    return {
      success: true,
      message: "Bike successfully reported as stolen.",
    };
  } catch (error) {
    console.error(`Error in reportBikeStolen for bike ${bikeId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected server error while reporting the theft.";
    throw new HttpsError("internal", errorMessage);
  }
});

/**
 * Marks a stolen bike as recovered. Only the owner can call this.
 * @param {string} bikeId The ID of the bike to mark as recovered.
 */
export const markBikeRecovered = onCall(callOptions, async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  const { bikeId } = req.data as { bikeId: string };
  const { uid } = req.auth;

  if (!bikeId || typeof bikeId !== "string") {
    throw new HttpsError("invalid-argument", "A valid bikeId is required.");
  }

  const bikeRef = admin.firestore().collection("bikes").doc(bikeId);
  try {
    const bikeDoc = await bikeRef.get();
    if (!bikeDoc.exists || bikeDoc.data()?.ownerId !== uid) {
      throw new HttpsError("permission-denied", "You do not own this bike.");
    }
    if (bikeDoc.data()?.status !== "Robada") {
      throw new HttpsError(
        "failed-precondition",
        "This bike is not currently reported as stolen."
      );
    }

    const newStatusEntry = {
      status: "En Regla",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      notes: "Bicicleta marcada como recuperada por el propietario.",
    };

    await bikeRef.update({
      status: "En Regla",
      statusHistory: admin.firestore.FieldValue.arrayUnion(newStatusEntry),
      theftDetails: null,
    });
    return {
      success: true,
      message: "Bike successfully marked as recovered.",
    };
  } catch (error) {
    console.error(`Error in markBikeRecovered for bike ${bikeId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected server error while marking the bike as recovered.";
    throw new HttpsError("internal", errorMessage);
  }
});

/**
 * Initiates an ownership transfer request for a bike.
 */
export const initiateTransferRequest = onCall(callOptions, async (req) => {
  if (!req.auth || !req.auth.token.email) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in with a verified email."
    );
  }
  const { bikeId, recipientEmail, transferDocumentUrl, transferDocumentName } =
    req.data as {
      bikeId: string;
      recipientEmail: string;
      transferDocumentUrl?: string;
      transferDocumentName?: string;
    };
  const { uid } = req.auth;
  const fromOwnerEmail = req.auth.token.email;

  if (!bikeId || !recipientEmail) {
    throw new HttpsError(
      "invalid-argument",
      "Bike ID and recipient email are required."
    );
  }

  const bikeRef = admin.firestore().collection("bikes").doc(bikeId);
  try {
    const bikeDoc = await bikeRef.get();
    if (!bikeDoc.exists || bikeDoc.data()?.ownerId !== uid) {
      throw new HttpsError("permission-denied", "You do not own this bike.");
    }
    if (bikeDoc.data()?.status !== "En Regla") {
      throw new HttpsError(
        "failed-precondition",
        "Only bikes 'En Regla' can be transferred."
      );
    }

    const requestsRef = admin.firestore().collection("transferRequests");
    const q = requestsRef
      .where("bikeId", "==", bikeId)
      .where("status", "==", "pending");
    const existingRequests = await q.get();
    if (!existingRequests.empty) {
      throw new HttpsError(
        "already-exists",
        "A transfer request for this bike is already pending."
      );
    }

    const newRequest = {
      bikeId,
      serialNumber: bikeDoc.data()?.serialNumber,
      bikeBrand: bikeDoc.data()?.brand,
      bikeModel: bikeDoc.data()?.model,
      fromOwnerId: uid,
      fromOwnerEmail,
      toUserEmail: recipientEmail.toLowerCase(),
      status: "pending",
      requestDate: admin.firestore.FieldValue.serverTimestamp(),
      transferDocumentUrl: transferDocumentUrl || null,
      transferDocumentName: transferDocumentName || null,
    };

    await requestsRef.add(newRequest);
    return { success: true, message: "Transfer request initiated." };
  } catch (error) {
    console.error(
      `Error in initiateTransferRequest for bike ${bikeId}:`,
      error
    );
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected server error while initiating the transfer request.";
    throw new HttpsError("internal", errorMessage);
  }
});

/**
 * Responds to an ownership transfer request.
 */
export const respondToTransferRequest = onCall(callOptions, async (req) => {
  if (!req.auth || !req.auth.token.email) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  const { requestId, action } = req.data as {
    requestId: string;
    action: "accepted" | "rejected" | "cancelled";
  };
  const { uid } = req.auth;
  const respondingUserEmail = req.auth.token.email;

  if (
    !requestId ||
    !action ||
    !["accepted", "rejected", "cancelled"].includes(action)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Request ID and a valid action are required."
    );
  }

  const requestRef = admin
    .firestore()
    .collection("transferRequests")
    .doc(requestId);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new HttpsError("not-found", "Transfer request not found.");
      }

      const requestData = requestDoc.data();
      if (requestData?.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "This request has already been resolved."
        );
      }

      // Authorization checks
      if (action === "cancelled") {
        if (requestData.fromOwnerId !== uid) {
          throw new HttpsError(
            "permission-denied",
            "Only the sender can cancel the request."
          );
        }
      } else {
        // "accepted" or "rejected"
        if (
          requestData.toUserEmail.toLowerCase() !==
          respondingUserEmail.toLowerCase()
        ) {
          throw new HttpsError(
            "permission-denied",
            "Only the recipient can respond to the request."
          );
        }
      }

      // Perform action
      transaction.update(requestRef, {
        status: action,
        resolutionDate: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (action === "accepted") {
        const bikeRef = admin
          .firestore()
          .collection("bikes")
          .doc(requestData.bikeId);
        const bikeDoc = await transaction.get(bikeRef);
        if (
          !bikeDoc.exists ||
          bikeDoc.data()?.ownerId !== requestData.fromOwnerId
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Bike ownership has changed or bike does not exist."
          );
        }

        const newOwnerDoc = await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .get();
        if (!newOwnerDoc.exists) {
          throw new HttpsError(
            "not-found",
            "The recipient user profile does not exist."
          );
        }
        const newOwnerProfile = newOwnerDoc.data();

        const transferNote =
          "Propiedad transferida de " +
          `${requestData.fromOwnerEmail} a ${requestData.toUserEmail}.`;
        const historyEntry = {
          status: "Transferida",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          notes: transferNote,
          transferDocumentUrl: requestData.transferDocumentUrl || null,
          transferDocumentName: requestData.transferDocumentName || null,
        };

        transaction.update(bikeRef, {
          ownerId: uid,
          ownerFirstName: newOwnerProfile?.firstName || "",
          ownerLastName: newOwnerProfile?.lastName || "",
          ownerEmail: newOwnerProfile?.email || "",
          ownerWhatsappPhone: newOwnerProfile?.whatsappPhone || "",
          status: "En Regla",
          statusHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
        });
      }

      return {
        success: true,
        message: "Request successfully " + action + ".",
      };
    });
  } catch (error) {
    console.error(
      `Error in respondToTransferRequest for request ${requestId}:`,
      error
    );
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected server error.";
    throw new HttpsError("internal", errorMessage);
  }
});

export const getUserTransferRequests = onCall(callOptions, async (req) => {
  if (!req.auth || !req.auth.token.email) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const uid = req.auth.uid;
  const email = req.auth.token.email.toLowerCase();
  const requestsRef = admin.firestore().collection("transferRequests");

  const [sentSnap, receivedSnap] = await Promise.all([
    requestsRef.where("fromOwnerId", "==", uid).get(),
    requestsRef.where("toUserEmail", "==", email).get(),
  ]);

  const docs = [...sentSnap.docs, ...receivedSnap.docs];
  const unique = new Map(docs.map((d) => [d.id, d]));

  const requests = Array.from(unique.values()).map((d) => ({
    id: d.id,
    ...d.data(),
    requestDate: d.data().requestDate?.toDate().toISOString(),
    resolutionDate: d.data().resolutionDate?.toDate().toISOString(),
  }));

  return { requests };
});

// Admin-specific functions
// -----------------------------------------------------------------------------

/**
 * Updates the custom claims for a user to grant/revoke admin privileges.
 * Only callable by existing admins.
 */
export const updateUserRole = onCall(callOptions, async (req) => {
  // Check if the caller is an admin
  if (req.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can modify user roles."
    );
  }

  const { uid, role } = req.data as { uid: string; role: UserRole };
  if (!uid || !role) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid' and 'role'."
    );
  }

  try {
    // Set custom claims
    const isAdmin = role === "admin";
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin, role });

    // Update the user's role in their Firestore document
    const userRef = admin.firestore().collection("users").doc(uid);
    await userRef.set({ role, isAdmin }, { merge: true });

    return {
      message: `Success! User ${uid} has been made a(n) ${role}.`,
    };
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw new HttpsError("internal", "Unable to update user role.");
  }
});

/**
 * Deletes a user account and all their associated bikes.
 * Only callable by existing admins.
 */
export const deleteUserAccount = onCall(callOptions, async (req) => {
  if (req.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can delete user accounts."
    );
  }

  const { uid } = req.data as { uid: string };
  if (!uid) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid'."
    );
  }

  try {
    // 1. Delete associated bikes
    const bikesRef = admin.firestore().collection("bikes");
    const userBikesQuery = bikesRef.where("ownerId", "==", uid);
    const bikesSnapshot = await userBikesQuery.get();

    const batch = admin.firestore().batch();
    bikesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // 2. Delete user's Firestore document
    const userRef = admin.firestore().collection("users").doc(uid);
    await userRef.delete();

    // 3. Delete user from Firebase Authentication
    await admin.auth().deleteUser(uid);

    return { message: `Successfully deleted user ${uid} and their data.` };
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new HttpsError("internal", "Unable to delete user account.");
  }
});

/**
 * Creates or updates the homepage content document.
 * Only callable by existing admins.
 */
export const updateHomepageContent = onCall(callOptions, async (req) => {
  if (req.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can update homepage content."
    );
  }

  const content = req.data;
  if (!content) {
    throw new HttpsError("invalid-argument", "Content data is missing.");
  }

  try {
    const contentRef = admin
      .firestore()
      .collection("homepage_content")
      .doc("config");
    await contentRef.set(
      { ...content, lastUpdated: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { message: "Homepage content updated successfully." };
  } catch (error) {
    console.error("Error updating homepage content:", error);
    throw new HttpsError("internal", "Unable to update homepage content.");
  }
});

export const getHomepageContent = onCall(callOptions, async () => {
  try {
    const contentRef = admin
      .firestore()
      .collection("homepage_content")
      .doc("config");
    const docSnap = await contentRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      // Ensure timestamps are converted to ISO strings for JSON serialization
      if (data && data.lastUpdated instanceof admin.firestore.Timestamp) {
        data.lastUpdated = data.lastUpdated.toDate().toISOString();
      }
      return data;
    }
    // If document doesn't exist, return null instead of throwing an error.
    return null;
  } catch (error) {
    console.error("Error fetching homepage content in Cloud Function:", error);
    // Throw error for unexpected issues like permissions problems.
    throw new HttpsError("internal", "Could not fetch homepage content.");
  }
});

export const createBikeShopAccount = onCall(callOptions, async (req) => {
  if (req.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can create shop accounts."
    );
  }

  const shopData = req.data as BikeShopAdminFormValues;
  const adminId = req.auth.uid;

  if (!shopData || !shopData.email || !shopData.shopName) {
    throw new HttpsError(
      "invalid-argument",
      "Shop name and email are required."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: shopData.email,
      emailVerified: false,
      displayName: shopData.shopName,
    });

    await admin
      .auth()
      .setCustomUserClaims(userRecord.uid, { role: "bikeshop" });

    const userProfileData = {
      email: shopData.email.toLowerCase(),
      role: "bikeshop",
      isAdmin: false,
      shopName: shopData.shopName,
      country: shopData.country,
      profileState: shopData.profileState,
      address: shopData.address,
      postalCode: shopData.postalCode,
      phone: shopData.phone,
      website: shopData.website || "",
      mapsLink: shopData.mapsLink || "",
      contactName: shopData.contactName,
      contactEmail: shopData.contactEmail,
      contactWhatsApp: shopData.contactWhatsApp,
      createdBy: adminId,
    };

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set(userProfileData);

    const passwordResetLink = await admin
      .auth()
      .generatePasswordResetLink(shopData.email);

    // Here you would typically use a transactional email service
    // (e.g., SendGrid, Mailgun) to send a welcome email with the reset link.
    // For this example, we'll log it.
    console.log(
      `Shop account created for ${shopData.email}. ` +
        `Password reset link: ${passwordResetLink}`
    );

    return {
      uid: userRecord.uid,
      message:
        `Shop account for ${shopData.shopName} created. ` +
        "An email has been sent to set the password.",
    };
  } catch (error: unknown) {
    console.error("Error creating bike shop account:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      throw new HttpsError(
        "already-exists",
        "This email is already registered."
      );
    }
    throw new HttpsError("internal", "Could not create shop account.");
  }
});

export const createNgoAccount = onCall(callOptions, async (req) => {
  if (req.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can create NGO accounts."
    );
  }

  const ngoData = req.data as NgoAdminFormValues;
  const adminId = req.auth.uid;

  if (!ngoData || !ngoData.email || !ngoData.ngoName) {
    throw new HttpsError(
      "invalid-argument",
      "NGO name and email are required."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: ngoData.email,
      emailVerified: false,
      displayName: ngoData.ngoName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "ngo" });

    const userProfileData = {
      email: ngoData.email.toLowerCase(),
      role: "ngo",
      isAdmin: false,
      ngoName: ngoData.ngoName,
      mission: ngoData.mission,
      country: ngoData.country,
      profileState: ngoData.profileState,
      address: ngoData.address,
      postalCode: ngoData.postalCode,
      publicWhatsapp: ngoData.publicWhatsapp,
      website: ngoData.website || "",
      meetingDays: ngoData.meetingDays || [],
      meetingTime: ngoData.meetingTime || "",
      meetingPointMapsLink: ngoData.meetingPointMapsLink || "",
      contactName: ngoData.contactName,
      contactWhatsApp: ngoData.contactWhatsApp,
      createdBy: adminId,
    };

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set(userProfileData);

    const passwordResetLink = await admin
      .auth()
      .generatePasswordResetLink(ngoData.email);
    console.log(
      `NGO account created for ${ngoData.email}. ` +
        `Password reset link: ${passwordResetLink}`
    );

    return {
      uid: userRecord.uid,
      message:
        `NGO account for ${ngoData.ngoName} created. ` +
        "An email has been sent to set the password.",
    };
  } catch (error: unknown) {
    console.error("Error creating NGO account:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      throw new HttpsError(
        "already-exists",
        "This email is already registered."
      );
    }
    throw new HttpsError("internal", "Could not create NGO account.");
  }
});

export const createOrUpdateRide = onCall(callOptions, async (req) => {
  if (!req.auth || !req.auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to manage rides."
    );
  }

  const { rideData, rideId } = req.data as {
    rideData: BikeRideFormValues;
    rideId?: string;
  };

  const organizerId = req.auth.uid;

  if (!rideData) {
    throw new HttpsError("invalid-argument", "Ride data is missing.");
  }

  try {
    const organizerDoc = await admin
      .firestore()
      .collection("users")
      .doc(organizerId)
      .get();
    if (!organizerDoc.exists) {
      throw new HttpsError("not-found", "Organizer profile not found.");
    }
    const organizerProfile = organizerDoc.data();

    // Normalize incoming data before saving
    const dataToSave = {
      title: rideData.title,
      description: rideData.description,
      rideDate: admin.firestore.Timestamp.fromDate(new Date(rideData.rideDate)),
      country: rideData.country,
      state: rideData.state,
      distance: rideData.distance,
      level: rideData.level || undefined,
      meetingPoint: rideData.meetingPoint,
      meetingPointMapsLink: rideData.meetingPointMapsLink || undefined,
      modality: rideData.modality || undefined,
      cost: rideData.cost ?? undefined,
      organizerId: organizerId,
      organizerName:
        organizerProfile?.shopName ||
        organizerProfile?.ngoName ||
        "Organizador",
      organizerLogoUrl: "", // Add logic for logo if needed
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (rideId) {
      // Update existing ride
      const rideRef = admin.firestore().collection("bikeRides").doc(rideId);
      const rideSnap = await rideRef.get();
      if (!rideSnap.exists || rideSnap.data()?.organizerId !== organizerId) {
        throw new HttpsError(
          "permission-denied",
          "You do not have permission to edit this ride."
        );
      }
      await rideRef.update(dataToSave);
      return { rideId: rideId, message: "Ride updated successfully." };
    } else {
      // Create new ride
      const newRideData = {
        ...dataToSave,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const newRideRef = await admin
        .firestore()
        .collection("bikeRides")
        .add(newRideData);
      return { rideId: newRideRef.id, message: "Ride created successfully." };
    }
  } catch (error) {
    console.error("Error creating or updating ride:", error);
    throw new HttpsError("internal", "Failed to save ride data.");
  }
});
