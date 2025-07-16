
"use client";

import type { UserProfile, UserProfileData, UserRole } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { app, auth } from '@/lib/firebase';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { getUserDoc, updateUserDoc, incrementReferralCount } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, role?: UserRole, referrerId?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<UserProfile | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  signInWithGoogle: (referrerId?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter(); // FIX: lint issue

  useEffect(() => {
    // This check is to prevent App Check from trying to initialize on the server.
    if (typeof window !== 'undefined') {
      try {
        // Initialize App Check for your web app
        // Make sure you have configured the reCAPTCHA v3 provider in your Firebase console
        // and added your development domain to the allowlist.
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider('6LcU1WUrAAAAAFq53Jr7wofsEZqiCFIKdkgrlciU'),
          isTokenAutoRefreshEnabled: true
        });
        console.log("Firebase App Check initialized.");
      } catch (error) {
        console.error("Error initializing Firebase App Check:", error);
      }
    }
  }, []);

  const fetchAndUpdateUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    let userProfileBase: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      isAnonymous: firebaseUser.isAnonymous,
      emailVerified: firebaseUser.emailVerified,
      role: 'cyclist',
      isAdmin: false,
      referralCount: 0,
    };

    try {
      const idTokenResult = await getIdTokenResult(firebaseUser, true);
      const isAdminClaim = idTokenResult.claims.admin === true;
      userProfileBase.isAdmin = isAdminClaim;

      if (isAdminClaim) {
        userProfileBase.role = 'admin';
      }

      const userDocData = await getUserDoc(firebaseUser.uid);
      if (userDocData) {
        userProfileBase = {
            ...userProfileBase,
            ...userDocData,
            role: isAdminClaim ? 'admin' : (userDocData.role || 'cyclist'),
            isAdmin: isAdminClaim,
            referralCount: userDocData.referralCount || 0,
        };
      } else if (!firebaseUser.isAnonymous) {
        const roleToSet = isAdminClaim ? 'admin' : 'cyclist';
        const displayName = firebaseUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await updateUserDoc(firebaseUser.uid, { role: roleToSet, email: firebaseUser.email, isAdmin: isAdminClaim, referralCount: 0, firstName, lastName });
        userProfileBase.role = roleToSet;
        userProfileBase.firstName = firstName;
        userProfileBase.lastName = lastName;
      }

    } catch (error) {
      console.error("Error fetching/creating user profile or claims:", error);
    }
    setUser(userProfileBase);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await fetchAndUpdateUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchAndUpdateUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      await fetchAndUpdateUserProfile(auth.currentUser);
    }
  }, [fetchAndUpdateUserProfile]);

  const signIn = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: unknown) { // FIX: lint issue
      const authError = error as FirebaseError; // FIX: lint issue
      console.warn("Authentication error during signIn:", authError.code);
      setUser(null);
      setLoading(false);
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        throw new Error('Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos.');
      } else {
        throw new Error('Ocurrió un error inesperado al iniciar sesión. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const signUp = async (email: string, pass: string, role: UserRole = 'cyclist', referrerId?: string | null): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (!firebaseUser.isAnonymous) {
        await sendEmailVerification(firebaseUser);
      }

      const roleToSet = role === 'admin' ? 'cyclist' : role;

      const initialProfileData: UserProfileData = {
        email: firebaseUser.email?.toLowerCase(),
        role: roleToSet,
        isAdmin: false,
        referralCount: 0,
        referrerId: referrerId || undefined,
      };
      await updateUserDoc(firebaseUser.uid, initialProfileData);
      
      if (referrerId) {
        await incrementReferralCount(referrerId);
      }

      await fetchAndUpdateUserProfile(firebaseUser);
    } catch (error: unknown) { // FIX: lint issue
      const authError = error as FirebaseError; // FIX: lint issue
      console.warn("Authentication error during signUp:", authError.code);
      setUser(null);
      setLoading(false);
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error('Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.');
      } else if (authError.code === 'auth/weak-password') {
        throw new Error('La contraseña es demasiado débil. Debe tener al menos 6 caracteres.');
      } else {
        throw new Error('Ocurrió un error inesperado al registrar la cuenta.');
      }
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setLoading(false);
    }
  };

  const signInAnonymously = async (): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const userCredential = await firebaseSignInAnonymously(auth);
      if (userCredential.user) {
        await fetchAndUpdateUserProfile(userCredential.user);
      }
      return user;
    } catch (error: unknown) { // FIX: lint issue
      console.error("Error al iniciar sesión anónimamente:", error);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (referrerId?: string | null): Promise<void> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
      const firebaseUser = result.user;

      if (isNewUser) {
        toast({
          title: '¡Bienvenido!',
          description: 'Tu cuenta ha sido creada. Por favor, completa tu perfil.'
        });

        const displayName = firebaseUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const initialProfileData: UserProfileData = {
          email: firebaseUser.email?.toLowerCase(),
          firstName,
          lastName,
          role: 'cyclist',
          isAdmin: false,
          referralCount: 0,
        };

        if (referrerId) {
          initialProfileData.referrerId = referrerId;
          await incrementReferralCount(referrerId);
        }

        await updateUserDoc(firebaseUser.uid, initialProfileData);
      }
    } catch (error: unknown) { // FIX: lint issue
      const authError = error as { code?: string; message?: string };
      if (authError.code === 'auth/popup-closed-by-user') {
        console.log("Google sign-in pop-up closed by user.");
      } else if (authError.code === 'auth/unauthorized-domain') {
        console.error("Google Sign-In Error: This domain is not authorized in the Firebase console. Please add it to the list of authorized domains in the Authentication settings.", {
          currentLocation: window.location.hostname
        });
        toast({
          title: 'Error de Dominio No Autorizado',
          description: 'Este sitio no está autorizado para usar la autenticación de Google. Contacta al administrador.',
          variant: 'destructive',
          duration: 9000,
        });
      } else if (authError.message && authError.message.includes("Missing project support email")){
           console.error("Google Sign-In Error: Missing project support email in Firebase console. Please set it in Project Settings -> General.");
           toast({
             title: 'Error de Configuración del Proyecto',
             description: 'Falta configurar el correo de asistencia en Firebase para poder usar Google Sign-In.',
             variant: 'destructive',
             duration: 9000,
           });
      } else {
        toast({
          title: 'Error de Autenticación con Google',
          description: 'No se pudo iniciar sesión. Por favor, inténtalo de nuevo.',
          variant: 'destructive',
        });
        console.error("Error signing in with Google:", error);
      }
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error: unknown) { // FIX: lint issue
      console.warn("Error sending password reset email:", error);
      throw error;
    }
  };

  const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error("Usuario no autenticado.");
    }
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } catch (error: unknown) { // FIX: lint issue
      const authError = error as { code?: string; message?: string };
      console.warn("Error updating password:", error);
      if (authError.code === 'auth/weak-password') {
        throw new Error('La nueva contraseña es demasiado débil. Debe tener al menos 6 caracteres.');
      } else if (authError.code === 'auth/requires-recent-login') {
        throw new Error('Esta operación es sensible y requiere autenticación reciente. Por favor, cierra sesión y vuelve a iniciarla antes de cambiar tu contraseña.');
      }
      throw new Error(authError.message || 'No se pudo actualizar la contraseña.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInAnonymously, sendPasswordReset, updateUserPassword, refreshUserProfile, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
