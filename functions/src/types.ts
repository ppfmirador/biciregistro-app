// types.ts for Cloud Functions
// These types are copied from the main application's type definitions
// to make them available to the Cloud Functions environment.

import type { Timestamp } from "firebase-admin/firestore";
import type { z } from "zod";
import type {
  bikeRideSchema,
  bikeShopAdminSchema,
  ngoAdminSchema,
} from "./schemas";

// Basic types
export type BikeStatus = "En Regla" | "Robada" | "Transferida";
export type UserRole = "cyclist" | "bikeshop" | "admin" | "ngo";

export type BikeType =
  | "Ruta"
  | "Pista"
  | "Enduro"
  | "XC"
  | "Downhill"
  | "BMX"
  | "Trial"
  | "Gravel"
  | "Urbana"
  | "E-Bike"
  | "";

export type RideLevel = "Principiante" | "Intermedio" | "Experto" | "";

export interface TheftReportData {
  theftLocationState: string;
  theftLocationCountry?: string;
  theftPerpetratorDetails?: string;
  theftIncidentDetails: string;
  generalNotes?: string;
}

// Interface for a bike ride event
// Note: Optional string fields are `string | null | undefined` to accommodate
// values from different sources (client forms, firestore).
export interface BikeRide {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerLogoUrl?: string | null | undefined;
  title: string;
  description: string;
  // Can be a Timestamp from Firestore, a Date object, or an ISO string
  rideDate: Timestamp | Date | string;
  distance: number; // in km
  country?: string;
  state?: string;
  meetingPoint: string;
  meetingPointMapsLink?: string | null | undefined;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
  modality?: BikeType;
  cost?: number;
  level?: RideLevel;
}

// Form value types inferred from Zod schemas
export type BikeRideFormValues = z.infer<typeof bikeRideSchema>;
export type BikeShopAdminFormValues = z.infer<typeof bikeShopAdminSchema>;
export type NgoAdminFormValues = z.infer<typeof ngoAdminSchema>;

export interface UserProfileData {
  firstName: string;
  lastName: string;
  country: string;
  profileState: string;
  whatsappPhone?: string;
  postalCode?: string;
  age?: number | null;
  gender?: "masculino" | "femenino" | "otro" | "prefiero_no_decir" | "";
  email?: string | null;
  role?: UserRole;
  isAdmin?: boolean;
  registeredByShopId?: string;
  referralCount?: number;
  referrerId?: string;
  // Bike Shop Specific Fields
  shopName?: string;
  address?: string;
  website?: string | null;
  mapsLink?: string | null;
  phone?: string;
  contactName?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  // Shared field for Shops & NGOs
  whatsappGroupLink?: string | null;
  // NGO Specific Fields
  ngoName?: string;
  mission?: string;
  publicWhatsapp?: string;
  meetingDays?: string[];
  meetingTime?: string;
  meetingPointMapsLink?: string | null;
  createdBy?: string;
}

export interface Bike {
  id: string; // Firestore document ID
  serialNumber: string;
  brand: string;
  model: string;
  ownerId: string | null;
  status: BikeStatus;
  registrationDate: string; // ISO date string
  statusHistory: Array<{
    status: BikeStatus;
    timestamp: string; // ISO date string
    notes?: string;
  }>;
  photoUrls?: string[];
  color?: string;
  description?: string;
  country?: string; // Country of bike's location
  state?: string; // State/Province of bike's location
  bikeType?: BikeType; // New field for bike type
  ownershipDocumentUrl?: string | null; // URL of the uploaded ownership document
  ownershipDocumentName?: string |null; // Original name of the uploaded document
  theftDetails?: {
    theftLocationState: string;
    theftLocationCountry?: string;
    theftPerpetratorDetails?: string;
    theftIncidentDetails: string;
    reportedAt: string; // ISO date string for when the theft was reported
  } | null; // Details specific to a theft report
  registeredByShopId?: string | null; // UID of the bike shop that registered this bike
  pendingCustomerEmail?: string | null; // Email of the customer if they don't have an account yet (potentially deprecated if pre-accounts are always created)
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
  ownerWhatsappPhone?: string; // Added for bikeshop owner contact view
}

export type NewCustomerDataForShop = Omit<UserProfileData, "role" | "isAdmin">;

export interface TransferRequest {
  id:string;
  bikeId: string;
  serialNumber: string;
  bikeBrand?: string;
  bikeModel?: string;
  fromOwnerId: string;
  fromOwnerEmail?: string;
  toUserEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requestDate: string;
  resolutionDate?: string;
  transferDocumentUrl?: string | null;
  transferDocumentName?: string | null;
}
