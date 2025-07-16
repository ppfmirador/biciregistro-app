
'use client';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, storage } from './firebase';

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * This version is simplified to remove image compression for debugging.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  if (!auth.currentUser) {
    console.error("Upload aborted: User is not authenticated on the client-side.");
    throw new Error('Firebase Storage: User is not authenticated, please authenticate using Firebase Authentication and try again. (storage/unauthenticated)');
  }

  const storageRef = ref(storage, path);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: unknown) {
    const storageError = error as { code?: string; message?: string };
    console.error("Error uploading file:", storageError);
    // Provide more specific error messages based on Firebase Storage error codes
    switch (storageError.code) {
      case 'storage/unauthorized':
        throw new Error('No tienes permiso para subir archivos. Revisa las reglas de seguridad de Storage.');
      case 'storage/canceled':
        throw new Error('La subida del archivo fue cancelada.');
      case 'storage/object-not-found':
        throw new Error('No se encontró el archivo o la ruta de almacenamiento es incorrecta.');
      case 'storage/retry-limit-exceeded':
        throw new Error('Se superó el límite de reintentos. Verifica tu conexión a internet.');
      case 'storage/unknown':
        // This is often an App Check failure
        throw new Error('Ocurrió un error desconocido. Esto puede ser un problema de App Check o CORS. Asegúrate de que App Check esté configurado para tu dominio y que la política CORS sea correcta.');
      default:
        // This will now primarily catch the custom error thrown above or other unexpected errors.
        throw new Error(`Error al subir el archivo: ${storageError.message || 'Error desconocido.'}`);
    }
  }
};

/**
 * Deletes a file from Firebase Storage.
 * @param filePath The full path to the file in Firebase Storage (e.g., 'sponsors/logo.png').
 * @returns A promise that resolves when the file is deleted.
 */
export const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  if (!filePath) return;
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error: unknown) {
    const storageError = error as { code?: string };
    if (storageError.code === 'storage/object-not-found') {
      console.warn(`File not found for deletion, or already deleted: ${filePath}`);
    } else {
      console.error("Error deleting file from storage:", filePath, error);
      throw new Error(`No se pudo eliminar el archivo: ${filePath}`);
    }
  }
};

/**
 * Extracts the file path from a Firebase Storage download URL.
 * @param downloadURL The Firebase Storage download URL.
 * @returns The file path within the storage bucket, or null if parsing fails.
 */
export const getPathFromStorageUrl = (downloadURL: string): string | null => {
    try {
        const url = new URL(downloadURL);
        const pathWithBucket = url.pathname.split('/o/')[1];
        if (pathWithBucket) {
            return decodeURIComponent(pathWithBucket.split('?')[0]);
        }
        return null;
    } catch (error) {
        console.error("Error parsing storage URL:", error);
        return null;
    }
};
