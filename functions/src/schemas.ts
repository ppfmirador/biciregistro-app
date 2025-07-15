// schemas.ts for Cloud Functions
// These schemas are copied or adapted from the main application's schemas
// to validate data within the Cloud Functions environment.

import * as z from "zod";
import type { BikeType, RideLevel } from "./types";

export const bikeRideSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z
    .string()
    .min(20, "La descripción debe tener al menos 20 caracteres."),
  rideDate: z.date({
    required_error: "La fecha de la rodada es obligatoria.",
  }),
  country: z.string().min(1, "El país es obligatorio."),
  state: z.string().min(1, "El estado/provincia es obligatorio."),
  distance: z.number().positive("La distancia debe ser un número positivo."),
  level: z.custom<RideLevel>().optional(),
  meetingPoint: z
    .string()
    .min(10, "El punto de encuentro debe tener al menos 10 caracteres."),
  meetingPointMapsLink: z
    .string()
    .url({ message: "URL de Google Maps inválida." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  modality: z.custom<BikeType>().optional(),
  cost: z.preprocess(
    (val) => (val === "" || val === null ? null : val),
    z.coerce
      .number()
      .min(0, "El costo no puede ser negativo.")
      .nullable()
      .optional(),
  ),
});

export const bikeShopAdminSchema = z.object({
  shopName: z.string().min(1, "El nombre de la tienda es obligatorio."),
  country: z.string().min(1, "El país es obligatorio."),
  profileState: z.string().min(1, "El estado/provincia es obligatorio."),
  address: z.string().min(1, "La dirección es obligatoria."),
  postalCode: z
    .string()
    .min(1, "El código postal es obligatorio.")
    .refine((val) => /^\d{4,5}$/.test(val), {
      message: "El código postal debe tener entre 4 y 5 dígitos.",
    }),
  phone: z.string().min(1, "El teléfono de la tienda es obligatorio."),
  email: z
    .string()
    .email({ message: "El correo electrónico de la tienda es inválido." }),
  website: z
    .string()
    .url({ message: "URL del sitio web inválida." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  mapsLink: z
    .string()
    .url({ message: "URL de Google Maps inválida." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  whatsappGroupLink: z
    .string()
    .url({ message: "URL de grupo de WhatsApp inválida." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  contactName: z.string().min(1, "El nombre del contacto es obligatorio."),
  contactEmail: z
    .string()
    .email({ message: "El correo electrónico del contacto es inválido." }),
  contactWhatsApp: z
    .string()
    .min(1, "El WhatsApp del contacto es obligatorio."),
});

export const ngoAdminSchema = z.object({
  ngoName: z.string().min(1, "El nombre de la ONG es obligatorio."),
  mission: z.string().min(20, "La misión debe tener al menos 20 caracteres."),
  country: z.string().min(1, "El país es obligatorio."),
  profileState: z.string().min(1, "El estado/provincia es obligatorio."),
  address: z.string().min(1, "La dirección es obligatoria."),
  postalCode: z
    .string()
    .min(1, "El código postal es obligatorio.")
    .refine((val) => /^\d{4,5}$/.test(val), {
      message: "El código postal debe tener entre 4 y 5 dígitos.",
    }),
  publicWhatsapp: z.string().min(1, "El WhatsApp público es obligatorio."),
  website: z
    .string()
    .url({ message: "URL del sitio web inválida." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  meetingDays: z.array(z.string()).optional(),
  meetingTime: z.string().optional(),
  meetingPointMapsLink: z
    .string()
    .url({ message: "URL de Google Maps inválida." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  email: z
    .string()
    .email({ message: "El correo electrónico de la cuenta es inválido." }),
  contactName: z.string().min(1, "El nombre del contacto es obligatorio."),
  contactWhatsApp: z
    .string()
    .min(1, "El WhatsApp del contacto es obligatorio."),
});
