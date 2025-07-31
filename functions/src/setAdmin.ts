// functions/src/setAdmin.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Allow unauthenticated calls for this specific one-off function
// and set a less stringent CORS policy if needed for testing from console/other origins.
const callOptions = {
  cors: true, 
  enforceAppCheck: false, // Disable App Check for this specific utility function
};

/**
 * A one-off utility function to assign the first admin user.
 * This should be secured or removed after initial setup.
 * @param data The data object from the client.
 * @param data.email The email of the user to make an admin.
 * @returns {Promise<{message: string}>} A success message.
 */
export const setAdmin = onCall(callOptions, async (request) => {
  // We are not using the auth context here, as this is for the initial setup.
  // In a production environment, you'd add security rules here, but for now,
  // we rely on the obscurity of the function name and developer-only access.
  
  const email = request.data.email;
  if (!email || typeof email !== 'string') {
    throw new HttpsError("invalid-argument", "The function must be called with an 'email' argument.");
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
    
    // Also update the user's document in Firestore for consistency
    const userRef = admin.firestore().collection("users").doc(user.uid);
    await userRef.set({ role: 'admin', isAdmin: true }, { merge: true });

    console.log(`Successfully made ${email} (UID: ${user.uid}) an admin.`);
    return { message: `Success! ${email} has been made an admin.` };

  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    console.error(`Error setting admin for ${email}:`, err);
    if (err.code === 'auth/user-not-found') {
      throw new HttpsError("not-found", `User with email ${email} not found.`);
    }
    throw new HttpsError("internal", "An unexpected error occurred while setting the admin user.");
  }
});
