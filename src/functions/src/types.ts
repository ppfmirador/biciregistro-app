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
export type BikeStatus = 'En Regla' | 'Robada' | 'Transferida';
export type UserRole = 'cyclist' | 'bikeshop' | 'admin' | 'ngo';

export type BikeType =
  | 'Ruta'
  | 'Pista'
  | 'Enduro'
  | 'XC'
  | 'Downhill'
  | 'BMX'
  | 'Trial'
  | 'Gravel'
  | 'Urbana'
  | 'E-Bike'
  | '';

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
