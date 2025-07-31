// functions/src/index.ts
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";
import type { DocumentData } from "firebase-admin/firestore";
import type {
  Bike,
  BikeRideFormValues,
  BikeShopAdminFormValues,
  NewCustomerDataForShop,
  NgoAdminFormValues,
  TheftReportData,
  TransferRequest,
  UserProfileData,
  UserRole,
} from "./types";

admin.initializeApp();

const allowedOrigins = [
  "https://biciregistro.mx",
  "https://www.biciregistro.mx",
  "https://bike-guardian-hbbg6.firebaseapp.com",
  "https://bike-guardian-staging.web.app",
  // Allow all Cloud Workstations subdomains
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

// --- Type definitions for request contexts and data ---
type AuthContext = CallableRequest["auth"];

interface ActionRequest<T> {
  action: string;
  data: T;
}

// --- Action Handlers (Internal Logic with specific types) ---
const toISO = (
  timestamp: admin.firestore.Timestamp | undefined,
): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

const handleUpdateUserRole = async (
  data: { uid: string; role: UserRole },
  context: AuthContext,
) => {
  if (context?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can modify user roles.",
    );
  }
  const { uid, role } = data;
  if (!uid || !role) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid' and 'role'.",
    );
  }
  const isAdmin = role === "admin";
  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin, role });
  const userRef = admin.firestore().collection("users").doc(uid);
  await userRef.set({ role, isAdmin }, { merge: true });
  return { message: `Success! User ${uid} has been made a(n) ${role}.` };
};

const handleCreateBike = async (
  data: { bikeData: Partial<Bike> & { registeredByShopId?: string | null } },
  context: AuthContext,
) => {
  if (!context)
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para crear una bicicleta.",
    );
  const { bikeData } = data;
  const ownerId = context.uid;

  if (
    !bikeData ||
    !bikeData.serialNumber ||
    !bikeData.brand ||
    !bikeData.model
  ) {
    throw new HttpsError(
      "invalid-argument",
      "El número de serie, marca y modelo son obligatorios.",
    );
  }

  const bikesRef = admin.firestore().collection("bikes");
  const serialNumberCheckQuery = bikesRef.where(
    "serialNumber",
    "==",
    bikeData.serialNumber.trim(),
  );
  const serialNumberSnapshot = await serialNumberCheckQuery.get();
  if (!serialNumberSnapshot.empty) {
    throw new HttpsError(
      "already-exists",
      `Ya existe una bicicleta registrada con el número de serie: ${bikeData.serialNumber}`,
    );
  }

  const ownerProfile = await admin
    .firestore()
    .collection("users")
    .doc(ownerId)
    .get();
  const ownerData = ownerProfile.exists ? ownerProfile.data() : null;

  if (!context.token.email) {
    throw new HttpsError(
      "unauthenticated",
      "Tu token de usuario no tiene una dirección de correo válida.",
    );
  }

  const dataToSave = {
    serialNumber: bikeData.serialNumber.trim(),
    brand: bikeData.brand.trim(),
    model: bikeData.model.trim(),
    ownerId,
    ownerFirstName: ownerData?.firstName ?? "",
    ownerLastName: ownerData?.lastName ?? "",
    ownerEmail: ownerData?.email || context.token.email,
    ownerWhatsappPhone: ownerData?.whatsappPhone ?? "",
    status: "En Regla",
    registrationDate: admin.firestore.Timestamp.now(),
    statusHistory: [
      {
        status: "En Regla",
        timestamp: admin.firestore.Timestamp.now(),
        notes: bikeData.registeredByShopId
          ? `Registrada por tienda: ${ownerData?.shopName || "Tienda"}`
          : "Registro inicial por ciclista",
      },
    ],
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

const handleGetMyBikes = async (_data: unknown, context: AuthContext) => {
  if (!context)
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para ver tus bicicletas.",
    );
  const ownerId = context.uid;
  const bikesRef = admin.firestore().collection("bikes");
  const q = bikesRef.where("ownerId", "==", ownerId);
  const querySnapshot = await q.get();

  const bikes = querySnapshot.docs.map((doc) => {
    const bikeData = doc.data();
    const statusHistory = (bikeData.statusHistory || []).map(
      (entry: { timestamp: admin.firestore.Timestamp }) => ({
        ...entry,
        timestamp: entry.timestamp?.toDate().toISOString(),
      }),
    );
    return {
      id: doc.id,
      ...bikeData,
      registrationDate: bikeData.registrationDate?.toDate().toISOString(),
      statusHistory,
    } as Bike;
  });
  return { bikes };
};

const handleGetPublicBikeBySerial = async (
  data: { serialNumber: string },
  context: AuthContext,
) => {
  const { serialNumber } = data;
  if (!serialNumber || typeof serialNumber !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "El número de serie debe ser una cadena de texto no vacía.",
    );
  }
  const bikesRef = admin.firestore().collection("bikes");
  const q = bikesRef.where("serialNumber", "==", serialNumber).limit(1);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) return null;

  const bikeDoc = querySnapshot.docs[0];
  const bikeData = bikeDoc.data();
  const isOwner = context?.uid === bikeData.ownerId;

  const statusHistory = (bikeData.statusHistory || []).map(
    (entry: { timestamp: admin.firestore.Timestamp }) => ({
      ...entry,
      timestamp: toISO(entry.timestamp),
    }),
  );

  const theftDetails = bikeData.theftDetails
    ? {
        ...bikeData.theftDetails,
        reportedAt: toISO(bikeData.theftDetails.reportedAt),
      }
    : null;

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
    return {
      ...publicData,
      ownerId: bikeData.ownerId,
      ownershipDocumentUrl: bikeData.ownershipDocumentUrl || null,
      ownershipDocumentName: bikeData.ownershipDocumentName || null,
      ownerEmail: bikeData.ownerEmail || "",
      ownerWhatsappPhone: bikeData.ownerWhatsappPhone || "",
      registeredByShopId: bikeData.registeredByShopId || null,
    };
  }
  return publicData;
};

const handleReportBikeStolen = async (
  data: { bikeId: string; theftData: TheftReportData },
  context: AuthContext,
) => {
  if (!context)
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para reportar un robo.",
    );
  const { bikeId, theftData } = data;
  const { uid } = context;

  if (
    !bikeId ||
    typeof bikeId !== "string" ||
    !theftData ||
    typeof theftData !== "object"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Se requieren bikeId y theftData válidos.",
    );
  }
  const bikeRef = admin.firestore().collection("bikes").doc(bikeId);
  const bikeDoc = await bikeRef.get();
  if (!bikeDoc.exists || bikeDoc.data()?.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No eres el propietario de esta bicicleta o no existe.",
    );
  }
  const fullTheftDetails = {
    ...theftData,
    reportedAt: admin.firestore.Timestamp.now(),
  };
  const newStatusEntry = {
    status: "Robada",
    timestamp: admin.firestore.Timestamp.now(),
    notes:
      theftData.generalNotes ||
      `Reportada como robada en ${theftData.theftLocationState}, ${theftData.theftLocationCountry}.`,
  };
  await bikeRef.update({
    status: "Robada",
    statusHistory: admin.firestore.FieldValue.arrayUnion(newStatusEntry),
    theftDetails: fullTheftDetails,
  });
  return {
    success: true,
    message: "Bicicleta reportada como robada exitosamente.",
  };
};

const handleMarkBikeRecovered = async (
  data: { bikeId: string },
  context: AuthContext,
) => {
  if (!context)
    throw new HttpsError("unauthenticated", "Debes estar autenticado.");
  const { bikeId } = data;
  const { uid } = context;
  if (!bikeId || typeof bikeId !== "string")
    throw new HttpsError("invalid-argument", "Se requiere un bikeId válido.");
  const bikeRef = admin.firestore().collection("bikes").doc(bikeId);
  const bikeDoc = await bikeRef.get();
  if (!bikeDoc.exists || bikeDoc.data()?.ownerId !== uid)
    throw new HttpsError(
      "permission-denied",
      "No eres el propietario de esta bicicleta.",
    );
  if (bikeDoc.data()?.status !== "Robada")
    throw new HttpsError(
      "failed-precondition",
      "Esta bicicleta no está reportada como robada actualmente.",
    );

  const newStatusEntry = {
    status: "En Regla",
    timestamp: admin.firestore.Timestamp.now(),
    notes: "Bicicleta marcada como recuperada por el propietario.",
  };
  await bikeRef.update({
    status: "En Regla",
    statusHistory: admin.firestore.FieldValue.arrayUnion(newStatusEntry),
    theftDetails: null,
  });
  return {
    success: true,
    message: "Bicicleta marcada como recuperada exitosamente.",
  };
};

const handleInitiateTransferRequest = async (
  data: {
    bikeId: string;
    recipientEmail: string;
    transferDocumentUrl?: string | null;
    transferDocumentName?: string | null;
  },
  context: AuthContext,
) => {
  if (!context || !context.token.email)
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado con un correo verificado.",
    );
  const { bikeId, recipientEmail, transferDocumentUrl, transferDocumentName } =
    data;
  const { uid } = context;
  if (!bikeId || !recipientEmail)
    throw new HttpsError(
      "invalid-argument",
      "Se requiere el ID de la bicicleta y el correo del destinatario.",
    );

  const bikeRef = admin.firestore().collection("bikes").doc(bikeId);
  const bikeDoc = await bikeRef.get();
  if (!bikeDoc.exists || bikeDoc.data()?.ownerId !== uid)
    throw new HttpsError(
      "permission-denied",
      "No eres el propietario de esta bicicleta.",
    );
  if (bikeDoc.data()?.status !== "En Regla")
    throw new HttpsError(
      "failed-precondition",
      "Solo las bicicletas 'En Regla' pueden ser transferidas.",
    );

  const requestsRef = admin.firestore().collection("transferRequests");
  const q = requestsRef
    .where("bikeId", "==", bikeId)
    .where("status", "==", "pending");
  if (!(await q.get()).empty)
    throw new HttpsError(
      "already-exists",
      "Ya existe una solicitud de transferencia pendiente para esta bicicleta.",
    );

  const newRequest = {
    bikeId,
    serialNumber: bikeDoc.data()?.serialNumber,
    bikeBrand: bikeDoc.data()?.brand,
    bikeModel: bikeDoc.data()?.model,
    fromOwnerId: uid,
    fromOwnerEmail: context.token.email,
    toUserEmail: recipientEmail.toLowerCase(),
    status: "pending",
    requestDate: admin.firestore.Timestamp.now(),
    transferDocumentUrl: transferDocumentUrl || null,
    transferDocumentName: transferDocumentName || null,
  };
  await requestsRef.add(newRequest);
  return { success: true, message: "Solicitud de transferencia iniciada." };
};

const handleRespondToTransferRequest = async (
  data: { requestId: string; action: "accepted" | "rejected" | "cancelled" },
  context: AuthContext,
) => {
  if (!context || !context.token.email)
    throw new HttpsError("unauthenticated", "Debes estar autenticado.");
  const { requestId, action } = data;
  const { uid } = context;
  const respondingUserEmail = context.token.email;
  if (
    !requestId ||
    !action ||
    !["accepted", "rejected", "cancelled"].includes(action)
  )
    throw new HttpsError(
      "invalid-argument",
      "Se requiere ID de solicitud y una acción válida.",
    );

  const requestRef = admin
    .firestore()
    .collection("transferRequests")
    .doc(requestId);
  return admin.firestore().runTransaction(async (transaction) => {
    const requestDoc = await transaction.get(requestRef);
    if (!requestDoc.exists)
      throw new HttpsError(
        "not-found",
        "Solicitud de transferencia no encontrada.",
      );
    const requestData = requestDoc.data() as TransferRequest;
    if (requestData?.status !== "pending")
      throw new HttpsError(
        "failed-precondition",
        "Esta solicitud ya ha sido resuelta.",
      );

    if (action === "cancelled") {
      if (requestData.fromOwnerId !== uid)
        throw new HttpsError(
          "permission-denied",
          "Solo el remitente puede cancelar la solicitud.",
        );
    } else {
      if (
        requestData.toUserEmail.toLowerCase() !==
        respondingUserEmail.toLowerCase()
      )
        throw new HttpsError(
          "permission-denied",
          "Solo el destinatario puede responder a la solicitud.",
        );
    }

    transaction.update(requestRef, {
      status: action,
      resolutionDate: admin.firestore.Timestamp.now(),
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
      )
        throw new HttpsError(
          "failed-precondition",
          "La propiedad de la bicicleta ha cambiado o la bicicleta no existe.",
        );

      const newOwnerDoc = await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .get();
      if (!newOwnerDoc.exists)
        throw new HttpsError(
          "not-found",
          "El perfil del usuario destinatario no existe.",
        );
      const newOwnerProfile = newOwnerDoc.data();

      const transferNote = `Propiedad transferida de ${requestData.fromOwnerEmail} a ${requestData.toUserEmail}.`;
      const historyEntry = {
        status: "Transferida",
        timestamp: admin.firestore.Timestamp.now(),
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
    return { success: true, message: `Solicitud ${action} exitosamente.` };
  });
};

const handleGetUserTransferRequests = async (
  _data: unknown,
  context: AuthContext,
) => {
  if (!context || !context.token.email)
    throw new HttpsError("unauthenticated", "Debes estar autenticado.");
  const uid = context.uid;
  const email = context.token.email.toLowerCase();
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
  })) as TransferRequest[];
  return { requests };
};

const handleDeleteUserAccount = async (
  data: { uid: string },
  context: AuthContext,
) => {
  if (context?.token.admin !== true)
    throw new HttpsError(
      "permission-denied",
      "Solo los administradores pueden eliminar cuentas de usuario.",
    );
  const { uid } = data;
  if (!uid)
    throw new HttpsError(
      "invalid-argument",
      "La función debe ser llamada con un 'uid'.",
    );

  const bikesRef = admin.firestore().collection("bikes");
  const userBikesQuery = bikesRef.where("ownerId", "==", uid);
  const bikesSnapshot = await userBikesQuery.get();

  const batch = admin.firestore().batch();
  bikesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  await admin.firestore().collection("users").doc(uid).delete();
  await admin.auth().deleteUser(uid);

  return { message: `Se eliminó exitosamente al usuario ${uid} y sus datos.` };
};

const handleUpdateHomepageContent = async (
  data: DocumentData,
  context: AuthContext,
) => {
  if (context?.token.admin !== true)
    throw new HttpsError(
      "permission-denied",
      "Solo los administradores pueden actualizar el contenido de la página principal.",
    );
  if (!data)
    throw new HttpsError("invalid-argument", "Faltan datos de contenido.");
  const contentRef = admin
    .firestore()
    .collection("homepage_content")
    .doc("config");
  await contentRef.set(
    { ...data, lastUpdated: admin.firestore.Timestamp.now() },
    { merge: true },
  );
  return {
    message: "Contenido de la página principal actualizado exitosamente.",
  };
};

const handleGetHomepageContent = async () => {
  const contentRef = admin
    .firestore()
    .collection("homepage_content")
    .doc("config");
  const docSnap = await contentRef.get();
  if (docSnap.exists) {
    const data = docSnap.data();
    if (data && data.lastUpdated instanceof admin.firestore.Timestamp) {
      data.lastUpdated = data.lastUpdated.toDate().toISOString();
    }
    return data;
  }
  return null;
};

const handleCreateAccount = async (
  data: {
    accountData:
      | BikeShopAdminFormValues
      | NgoAdminFormValues
      | NewCustomerDataForShop;
    role: "bikeshop" | "ngo" | "cyclist";
    creatorId: string;
  },
  context: AuthContext,
) => {
  if (context?.token.admin !== true)
    throw new HttpsError(
      "permission-denied",
      "Solo los administradores pueden crear nuevas cuentas.",
    );
  const { accountData, role, creatorId } = data;
  if (!accountData || !role || !accountData.email)
    throw new HttpsError(
      "invalid-argument",
      "Se requieren datos de la cuenta, rol y correo electrónico.",
    );

  let userProfileData: UserProfileData;
  const displayName =
    (accountData as BikeShopAdminFormValues).shopName ||
    (accountData as NgoAdminFormValues).ngoName ||
    `${(accountData as NewCustomerDataForShop).firstName} ${(accountData as NewCustomerDataForShop).lastName} (Cliente)`;

  const userRecord = await admin.auth().createUser({
    email: accountData.email,
    emailVerified: false,
    displayName,
  });
  await admin.auth().setCustomUserClaims(userRecord.uid, { role });

  if (role === "bikeshop" || role === "ngo") {
    const commonData = accountData as
      | BikeShopAdminFormValues
      | NgoAdminFormValues;
    userProfileData = {
      ...commonData,
      email: commonData.email.toLowerCase(),
      role,
      isAdmin: false,
      createdBy: creatorId,
      firstName: commonData.contactName.split(" ")[0],
      lastName: commonData.contactName.split(" ").slice(1).join(" "),
    };
  } else {
    const customerData = accountData as NewCustomerDataForShop;
    userProfileData = {
      ...customerData,
      email: customerData.email?.toLowerCase(),
      role: "cyclist",
      isAdmin: false,
      registeredByShopId: creatorId,
    };
  }

  await admin
    .firestore()
    .collection("users")
    .doc(userRecord.uid)
    .set(userProfileData);
  const passwordResetLink = await admin
    .auth()
    .generatePasswordResetLink(accountData.email);
  console.log(
    `Cuenta para ${displayName} <${accountData.email}> creada por admin ${creatorId}. Enlace para restablecer contraseña: ${passwordResetLink}`,
  );

  return {
    uid: userRecord.uid,
    message: `Cuenta para ${displayName} creada. Se ha enviado un correo para establecer la contraseña.`,
  };
};

const handleCreateOrUpdateRide = async (
  data: { rideData: BikeRideFormValues; rideId?: string },
  context: AuthContext,
) => {
  if (!context || !context.uid)
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para gestionar eventos.",
    );
  const { rideData, rideId } = data;
  const organizerId = context.uid;
  if (!rideData)
    throw new HttpsError("invalid-argument", "Faltan datos del evento.");

  const organizerDoc = await admin
    .firestore()
    .collection("users")
    .doc(organizerId)
    .get();
  if (!organizerDoc.exists)
    throw new HttpsError("not-found", "Perfil del organizador no encontrado.");
  const organizerProfile = organizerDoc.data();

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
    organizerId,
    organizerName:
      organizerProfile?.shopName || organizerProfile?.ngoName || "Organizador",
    organizerLogoUrl: "",
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (rideId) {
    const rideRef = admin.firestore().collection("bikeRides").doc(rideId);
    const rideSnap = await rideRef.get();
    if (!rideSnap.exists || rideSnap.data()?.organizerId !== organizerId)
      throw new HttpsError(
        "permission-denied",
        "No tienes permiso para editar este evento.",
      );
    await rideRef.update(dataToSave);
    return { rideId, message: "Evento actualizado exitosamente." };
  } else {
    const newRideData = {
      ...dataToSave,
      createdAt: admin.firestore.Timestamp.now(),
    };
    const newRideRef = await admin
      .firestore()
      .collection("bikeRides")
      .add(newRideData);
    return { rideId: newRideRef.id, message: "Evento creado exitosamente." };
  }
};

// --- The single dispatching Cloud Function ---

export const api = onCall(
  callOptions,
  async (req: CallableRequest<ActionRequest<unknown>>) => {
    const { action, data } = req.data;
    const context = req.auth;

    try {
      switch (action) {
        case "createBike":
          return await handleCreateBike(
            data as {
              bikeData: Partial<Bike> & { registeredByShopId?: string | null };
            },
            context,
          );
        case "getMyBikes":
          return await handleGetMyBikes(data, context);
        case "getPublicBikeBySerial":
          return await handleGetPublicBikeBySerial(
            data as { serialNumber: string },
            context,
          );
        case "reportBikeStolen":
          return await handleReportBikeStolen(
            data as { bikeId: string; theftData: TheftReportData },
            context,
          );
        case "markBikeRecovered":
          return await handleMarkBikeRecovered(
            data as { bikeId: string },
            context,
          );
        case "initiateTransferRequest":
          return await handleInitiateTransferRequest(
            data as {
              bikeId: string;
              recipientEmail: string;
              transferDocumentUrl?: string | null;
              transferDocumentName?: string | null;
            },
            context,
          );
        case "respondToTransferRequest":
          return await handleRespondToTransferRequest(
            data as {
              requestId: string;
              action: "accepted" | "rejected" | "cancelled";
            },
            context,
          );
        case "getUserTransferRequests":
          return await handleGetUserTransferRequests(data, context);
        case "updateUserRole":
          return await handleUpdateUserRole(
            data as { uid: string; role: UserRole },
            context,
          );
        case "deleteUserAccount":
          return await handleDeleteUserAccount(
            data as { uid: string },
            context,
          );
        case "updateHomepageContent":
          return await handleUpdateHomepageContent(
            data as DocumentData,
            context,
          );
        case "getHomepageContent":
          return await handleGetHomepageContent();
        case "createAccount":
          return await handleCreateAccount(
            data as {
              accountData:
                | BikeShopAdminFormValues
                | NgoAdminFormValues
                | NewCustomerDataForShop;
              role: "bikeshop" | "ngo" | "cyclist";
              creatorId: string;
            },
            context,
          );
        case "createOrUpdateRide":
          return await handleCreateOrUpdateRide(
            data as { rideData: BikeRideFormValues; rideId?: string },
            context,
          );

        default:
          throw new HttpsError(
            "not-found",
            "No se encontró la acción solicitada.",
          );
      }
    } catch (error) {
      console.error(`Error al ejecutar la acción '${action}':`, error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "internal",
        `Ocurrió un error inesperado al ejecutar ${action}.`,
      );
    }
  },
);
