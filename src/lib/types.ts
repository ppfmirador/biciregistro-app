

// Updated to use Spanish status values directly, aligning with BIKE_STATUSES constant
export type BikeStatus = 'En Regla' | 'Robada' | 'Transferida';

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
  | ''; // Allow empty for optional

export type UserRole = 'cyclist' | 'bikeshop' | 'admin' | 'ngo';

export type RideLevel = 'Principiante' | 'Intermedio' | 'Experto' | '';

export interface StatusEntry {
  status: BikeStatus;
  timestamp: string; // ISO date string (converted from/to Firestore Timestamp in db.ts)
  notes?: string;
  transferDocumentUrl?: string | null;
  transferDocumentName?: string | null;
}

export interface TheftDetails {
  theftLocationState: string;
  theftLocationCountry?: string;
  theftPerpetratorDetails?: string;
  theftIncidentDetails: string;
  reportedAt: string; // ISO date string for when the theft was reported
}

export interface ReportTheftDialogData extends Omit<TheftDetails, 'reportedAt'> {
  generalNotes?: string;
}

export interface Bike {
  id: string; // Firestore document ID
  serialNumber: string;
  brand: string;
  model: string;
  ownerId: string | null;
  status: BikeStatus;
  registrationDate: string; // ISO date string
  statusHistory: StatusEntry[];
  photoUrls?: string[];
  color?: string;
  description?: string;
  country?: string; // Country of bike's location
  state?: string; // State/Province of bike's location
  bikeType?: BikeType; // New field for bike type
  ownershipDocumentUrl?: string | null; // URL of the uploaded ownership document
  ownershipDocumentName?: string |null; // Original name of the uploaded document
  theftDetails?: TheftDetails | null; // Details specific to a theft report
  registeredByShopId?: string | null; // UID of the bike shop that registered this bike
  pendingCustomerEmail?: string | null; // Email of the customer if they don't have an account yet (potentially deprecated if pre-accounts are always created)
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
  ownerWhatsappPhone?: string; // Added for bikeshop owner contact view
}

export interface BikeRide {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerLogoUrl?: string | null | undefined;
  title: string;
  description: string;
  rideDate: string; // ISO String
  distance: number; // in km
  country?: string;
  state?: string;
  meetingPoint: string;
  meetingPointMapsLink?: string | null | undefined;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  modality?: BikeType;
  cost?: number;
  level?: RideLevel;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  country: string;
  profileState: string;
  whatsappPhone?: string;
  postalCode?: string;
  age?: number | null;
  gender?: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir' | '';
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
}

export interface UserProfile extends AuthUser, Partial<UserProfileData> {}

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

export interface SponsorConfig {
  id: string;
  name: string;
  logoUrl: string;
  link?: string;
  dataAiHint?: string;
}

export interface HomepageContent {
  id?: string;
  welcomeTitle: string;
  welcomeDescription: string;
  whyAppNameTitle: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  communityTitle: string;
  communityDescription: string;
  communityImageUrl: string;
  sponsors: SponsorConfig[];
  referralMessage?: string;
  ngoReferralMessageTemplate?: string;
  lastUpdated?: string;
}

// Type for new customer data collected by the shop
export interface NewCustomerDataForShop extends Omit<UserProfileData, "role" | "isAdmin" | "firstName" | "lastName" | "country" | "profileState"> {
    firstName: string;
    lastName: string;
    country: string;
    profileState: string;
}

export interface ShopAnalyticsData {
  totalBikesByShop: number;
  totalUsersByShop: number;
  stolenBikes: number;
  transferredBikes: number;
}

export interface NgoAnalyticsData {
  totalUsersReferred: number;
  totalBikesFromReferrals: number;
  stolenBikesFromReferrals: number;
  recoveredBikesFromReferrals: number;
}
