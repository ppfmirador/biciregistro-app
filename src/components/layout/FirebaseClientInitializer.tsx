"use client";

import { useEffect } from "react";
import { initializeClientSideFirebase } from "@/lib/firebase-client";

/**
 * A client-side component whose sole purpose is to initialize
 * client-specific Firebase services like App Check.
 */
export default function FirebaseClientInitializer() {
  useEffect(() => {
    initializeClientSideFirebase();
  }, []);

  return null; // This component does not render anything.
}
