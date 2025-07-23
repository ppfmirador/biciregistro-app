

import * as z from 'zod';
import type { BikeType, RideLevel } from './types';
import { OTHER_BRAND_VALUE } from '@/constants';

// This is the schema for the Server Action payload. It contains only the fields
// that are expected to be strings from the FormData. It is now fully independent.
export const bikeActionSchema = z.object({
  serialNumber: z.string()
    .min(1, 'El número de serie es obligatorio.')
    .refine(val => val === val.trim(), {
      message: 'El número de serie no debe tener espacios al inicio o al final.',
    })
    .refine(val => !val.includes(' '), {
      message: 'El número de serie no debe contener espacios internos.',
    }),
  brand: z.string().min(1, 'La marca es obligatoria.'),
  otherBrand: z.string().optional(),
  model: z.string().min(1, 'El modelo es obligatorio.'),
  color: z.string().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  bikeType: z.custom<BikeType>().optional(),
}).refine(data => {
    if (data.brand === OTHER_BRAND_VALUE) {
        return !!data.otherBrand && data.otherBrand.trim().length > 0;
    }
    return true;
}, {
    message: 'Por favor, especifica la marca si seleccionas "Otra".',
    path: ['otherBrand'],
});


// Schema for the client-side form, which includes file inputs.
// This is now fully independent and does not derive from other schemas.
export const bikeFormSchema = z.object({
  serialNumber: z.string()
    .min(1, 'El número de serie es obligatorio.')
    .refine(val => val === val.trim(), {
      message: 'El número de serie no debe tener espacios al inicio o al final.',
    })
    .refine(val => !val.includes(' '), {
      message: 'El número de serie no debe contener espacios internos.',
    }),
  brand: z.string().min(1, 'La marca es obligatoria.'),
  otherBrand: z.string().optional(),
  model: z.string().min(1, 'El modelo es obligatorio.'),
  color: z.string().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  bikeType: z.custom<BikeType>().optional(),
  photo1: z.custom<FileList>().optional(),
  photo2: z.custom<FileList>().optional(),
  photo3: z.custom<FileList>().optional(),
  ownershipDocument: z.custom<FileList>().optional(),
}).refine(data => {
    if (data.brand === OTHER_BRAND_VALUE) {
        return !!data.otherBrand && data.otherBrand.trim().length > 0;
    }
    return true;
}, {
    message: 'Por favor, especifica la marca si seleccionas "Otra".',
    path: ['otherBrand'],
});


export type BikeFormValues = z.infer<typeof bikeFormSchema>;

export const bikeShopRegisterSchema = z.object({
  customerEmail: z.string().email({ message: 'Correo electrónico del cliente inválido.' }),
  customerFirstName: z.string().min(1, 'El nombre del cliente es obligatorio.'),
  customerLastName: z.string().min(1, 'El apellido del cliente es obligatorio.'),
  customerCountry: z.string().min(1, 'El país del cliente es obligatorio.'),
  customerProfileState: z.string().min(1, 'El estado/provincia del cliente es obligatorio.'),
  customerWhatsappPhone: z.string().optional().refine(val => !val || /^\+?[0-9\s-()]*$/.test(val), {
    message: "Número de WhatsApp inválido."
  }),
  customerPostalCode: z.string().optional().refine(val => !val || /^\d{5}$/.test(val), {
    message: "El código postal debe tener 5 dígitos."
  }),
  customerGender: z.enum(['masculino', 'femenino', 'otro', 'prefiero_no_decir', '']).optional(),

  serialNumber: z.string().min(1, 'El número de serie es obligatorio.')
    .refine(val => val === val.trim(), { message: 'El número de serie no debe tener espacios al inicio o al final.'})
    .refine(val => !val.includes(' '), { message: 'El número de serie no debe contener espacios internos.'}),
  brand: z.string().min(1, 'La marca es obligatoria.'),
  otherBrand: z.string().optional(),
  model: z.string().min(1, 'El modelo es obligatorio.'),
  bikeType: z.custom<BikeType>().optional(),
  color: z.string().optional(),
  bikeState: z.string().optional(),
  description: z.string().optional(),
  photo1: z.custom<FileList>((val) => val === undefined || (val instanceof FileList && val.length <= 1) , 'Debes seleccionar un archivo o dejarlo vacío.').optional(),
  photo2: z.custom<FileList>((val) => val === undefined || (val instanceof FileList && val.length <= 1) , 'Debes seleccionar un archivo o dejarlo vacío.').optional(),
  photo3: z.custom<FileList>((val) => val === undefined || (val instanceof FileList && val.length <= 1) , 'Debes seleccionar un archivo o dejarlo vacío.').optional(),
  ownershipDocument: z.custom<FileList>((val) => val === undefined || (val instanceof FileList && val.length <= 1), 'Debes seleccionar un archivo o dejarlo vacío.').optional(),
}).refine(data => {
    if (data.brand === OTHER_BRAND_VALUE) {
        return !!data.otherBrand && data.otherBrand.trim().length > 0;
    }
    return true;
}, {
    message: 'Por favor, especifica la marca si seleccionas "Otra".',
    path: ['otherBrand'],
});

export type BikeShopRegisterFormValues = z.infer<typeof bikeShopRegisterSchema>;


// New schema for the detailed Admin Bike Shop form
export const bikeShopAdminSchema = z.object({
  // Store Details
  shopName: z.string().min(1, 'El nombre de la tienda es obligatorio.'),
  country: z.string().min(1, 'El país es obligatorio.'),
  profileState: z.string().min(1, 'El estado/provincia es obligatorio.'),
  address: z.string().min(1, 'La dirección es obligatoria.'),
  postalCode: z.string().min(1, 'El código postal es obligatorio.').refine(val => /^\d{4,5}$/.test(val), {
    message: "El código postal debe tener entre 4 y 5 dígitos."
  }),
  phone: z.string().min(1, 'El teléfono de la tienda es obligatorio.'),
  email: z.string().email({ message: 'El correo electrónico de la tienda es inválido.' }),
  website: z.string().url({ message: "URL del sitio web inválida." }).optional().or(z.literal('')).nullable(),
  mapsLink: z.string().url({ message: "URL de Google Maps inválida." }).optional().or(z.literal('')).nullable(),
  whatsappGroupLink: z.string().url({ message: "URL de grupo de WhatsApp inválida." }).optional().or(z.literal('')).nullable(),
  
  // Contact Person Details
  contactName: z.string().min(1, 'El nombre del contacto es obligatorio.'),
  contactEmail: z.string().email({ message: 'El correo electrónico del contacto es inválido.' }),
  contactWhatsApp: z.string().min(1, 'El WhatsApp del contacto es obligatorio.'),
});

export type BikeShopAdminFormValues = z.infer<typeof bikeShopAdminSchema>;

// Schema for a bike shop user editing their own profile
export const bikeShopProfileSchema = bikeShopAdminSchema.omit({ email: true });
export type BikeShopProfileFormValues = z.infer<typeof bikeShopProfileSchema>;

export const ngoAdminSchema = z.object({
  // NGO Details
  ngoName: z.string().min(1, 'El nombre de la ONG es obligatorio.'),
  mission: z.string().min(20, 'La misión debe tener al menos 20 caracteres.'),
  country: z.string().min(1, 'El país es obligatorio.'),
  profileState: z.string().min(1, 'El estado/provincia es obligatorio.'),
  address: z.string().min(1, 'La dirección es obligatoria.'),
  postalCode: z.string().min(1, 'El código postal es obligatorio.').refine(val => /^\d{4,5}$/.test(val), {
    message: "El código postal debe tener entre 4 y 5 dígitos."
  }),
  publicWhatsapp: z.string().min(1, 'El WhatsApp público es obligatorio.'),
  website: z.string().url({ message: "URL del sitio web inválida." }).optional().or(z.literal('')).nullable(),
  whatsappGroupLink: z.string().url({ message: "URL de grupo de WhatsApp inválida." }).optional().or(z.literal('')).nullable(),

  // Meeting Details
  meetingDays: z.array(z.string()).optional(),
  meetingTime: z.string().optional(),
  meetingPointMapsLink: z.string().url({ message: "URL de Google Maps inválida." }).optional().or(z.literal('')).nullable(),

  // Account & Contact Details
  email: z.string().email({ message: 'El correo electrónico de la cuenta es inválido.' }),
  contactName: z.string().min(1, 'El nombre del contacto es obligatorio.'),
  contactWhatsApp: z.string().min(1, 'El WhatsApp del contacto es obligatorio.'),
});

export type NgoAdminFormValues = z.infer<typeof ngoAdminSchema>;

// Schema for an NGO user editing their own profile
export const ngoProfileSchema = ngoAdminSchema.omit({ email: true });
export type NgoProfileFormValues = z.infer<typeof ngoProfileSchema>;

export const bikeRideSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres.'),
  rideDate: z.date({
    required_error: "La fecha de la rodada es obligatoria.",
  }),
  country: z.string().min(1, 'El país es obligatorio.'),
  state: z.string().min(1, 'El estado/provincia es obligatorio.'),
  distance: z.number().positive('La distancia debe ser un número positivo.'),
  level: z.custom<RideLevel>().optional(),
  meetingPoint: z.string().min(10, 'El punto de encuentro debe tener al menos 10 caracteres.'),
  meetingPointMapsLink: z.string().url({ message: "URL de Google Maps inválida." }).optional().or(z.literal('')).nullable(),
  modality: z.custom<BikeType>().optional(),
  cost: z.preprocess(
    (val) => (val === "" || val === null ? null : val), // Convert empty string or null to null
    z.coerce.number().min(0, "El costo no puede ser negativo.").nullable().optional() // Allow null and optional
  ),
});

export type BikeRideFormValues = z.infer<typeof bikeRideSchema>;
