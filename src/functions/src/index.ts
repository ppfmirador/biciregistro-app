
// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

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

const callOptions = {
  region: "us-central1",
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
    const ownerData = ownerProfile.exists() ? ownerProfile.data() : null;

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
    const errorMessage = error instanceof Error ? error.message : "An internal error occurred while creating the bike.";
    throw new HttpsError("internal", errorMessage);
  }
});
