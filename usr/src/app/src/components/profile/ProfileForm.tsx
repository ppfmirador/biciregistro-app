
"use client";

import React, { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'; // FIX: lint issue
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { UserProfileData } from '@/lib/types';
import { LAT_AM_LOCATIONS, GENDERS } from '@/constants';

const PLACEHOLDER_NONE_VALUE = "_PLACEHOLDER_NONE_";

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio.'),
  lastName: z.string().min(1, 'El apellido es obligatorio.'),
  whatsappPhone: z.string().optional().refine(val => !val || /^\+?[0-9\s-()]*$/.test(val), {
    message: "Número de WhatsApp inválido."
  }),
  country: z.string().optional(),
  profileState: z.string().optional(),
  postalCode: z.string().optional().refine(val => !val || /^\d{5}$/.test(val), {
    message: "El código postal debe tener 5 dígitos."
  }),
  age: z.coerce.number().positive("La edad debe ser un número positivo.").optional().nullable(),
  gender: z.enum(['masculino', 'femenino', 'otro', 'prefiero_no_decir', '']).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  initialData?: Partial<UserProfileData>;
  isLoading: boolean;
  submitButtonText?: string;
}

export const ProfileForm = ({
  onSubmit,
  initialData,
  isLoading,
  submitButtonText = "Guardar Perfil",
}: ProfileFormProps): JSX.Element => {
  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      whatsappPhone: initialData?.whatsappPhone || '',
      country: initialData?.country || '',
      profileState: initialData?.profileState || '',
      postalCode: initialData?.postalCode || '',
      age: initialData?.age || null,
      gender: initialData?.gender || '',
    },
  });
  
  const watchedCountry = watch("country");

  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        whatsappPhone: initialData.whatsappPhone || '',
        country: initialData.country || '',
        profileState: initialData.profileState || '',
        postalCode: initialData.postalCode || '',
        age: initialData.age || null,
        gender: initialData.gender || '',
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    // When country changes, reset the state field
    setValue('profileState', '');
  }, [watchedCountry, setValue]);


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre(s)</Label>
          <Input id="firstName" {...register('firstName')} className={errors.firstName ? 'border-destructive' : ''} />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido(s)</Label>
          <Input id="lastName" {...register('lastName')} className={errors.lastName ? 'border-destructive' : ''} />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
          <Label htmlFor="country">País de Residencia (Opcional)</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)}
                value={field.value || ''}
              >
                <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                  {LAT_AM_LOCATIONS.map(countryData => (
                    <SelectItem key={countryData.country} value={countryData.country}>{countryData.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profileState">Estado/Provincia (Opcional)</Label>
          <Controller
            name="profileState"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)}
                value={field.value || ''}
                disabled={!watchedCountry}
              >
                <SelectTrigger className={errors.profileState ? 'border-destructive' : ''}>
                  <SelectValue placeholder={!watchedCountry ? "Selecciona un país primero" : "Selecciona un estado"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                  {watchedCountry && LAT_AM_LOCATIONS.find(c => c.country === watchedCountry)?.states.map(stateName => (
                    <SelectItem key={stateName} value={stateName}>{stateName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.profileState && <p className="text-sm text-destructive">{errors.profileState.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="whatsappPhone">Teléfono WhatsApp (Opcional)</Label>
          <Input id="whatsappPhone" {...register('whatsappPhone')} placeholder="+52 55 1234 5678" className={errors.whatsappPhone ? 'border-destructive' : ''} />
          {errors.whatsappPhone && <p className="text-sm text-destructive">{errors.whatsappPhone.message}</p>}
        </div>
         <div className="space-y-2">
          <Label htmlFor="postalCode">Código Postal (Opcional)</Label>
          <Input id="postalCode" {...register('postalCode')} placeholder="Ej. 01234" className={errors.postalCode ? 'border-destructive' : ''} />
          {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="age">Edad (Opcional)</Label>
          <Input id="age" type="number" {...register('age')} className={errors.age ? 'border-destructive' : ''} />
          {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Género (Opcional)</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)}
                value={field.value || ''}
              >
                <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                  {GENDERS.map(genderOpt => (
                    <SelectItem key={genderOpt.value} value={genderOpt.value}>{genderOpt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitButtonText}
      </Button>
    </form>
  );
};
