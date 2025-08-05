// functions/src/setAdmin.ts
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * A one-off utility function to assign the first admin user.
 * This should be secured or removed after initial setup.
 * It is an HTTP function to be called from a trusted environment like gcloud CLI.
 * @param request The HTTP request object.
 * @param response The HTTP response object.
 */
export const setAdminHttp = onRequest(
  { invoker: "public" }, // Removed conflicting 'cors: true'
  async (request, response) => {
    // Basic check to ensure it's a POST request for some level of protection
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const email = request.body.data?.email;
      if (!email || typeof email !== "string") {
        throw new HttpsError(
          "invalid-argument",
          'The function must be called with a JSON body like: { "data": { "email": "user@example.com" } }',
        );
      }

      const user = await admin.auth().getUserByEmail(email);

      // Set custom claims
      await admin
        .auth()
        .setCustomUserClaims(user.uid, { admin: true, role: "admin" });

      // Also update the user's document in Firestore for consistency
      const userRef = admin.firestore().collection("users").doc(user.uid);
      await userRef.set({ role: "admin", isAdmin: true }, { merge: true });

      const successMessage = `Success! ${email} (UID: ${user.uid}) has been made an admin.`;
      console.log(successMessage);
      response.status(200).send({ data: { message: successMessage } });
    } catch (error: unknown) {
      console.error("Error setting admin for email:", error);
      if (error instanceof HttpsError) {
        response.status(error.httpErrorCode.status).send({
          error: { message: error.message, code: error.code },
        });
        return;
      }

      const err = error as { code?: string; message: string };
      if (err.code === "auth/user-not-found") {
        response
          .status(404)
          .send({ error: { message: "User with email not found." } });
      } else {
        response.status(500).send({
          error: { message: "An unexpected internal error occurred." },
        });
      }
    }
  },
);
