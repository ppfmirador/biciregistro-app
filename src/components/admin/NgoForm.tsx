
"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ngoAdminSchema, type NgoAdminFormValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, MapPin, HeartHandshake } from 'lucide-react';
import { LAT_AM_LOCATIONS, DAYS_OF_WEEK } from '@/constants';
import { Separator } from '../ui/separator';
import type { UserProfileData } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface NgoFormProps {
  onSubmit: (data: NgoAdminFormValues) => Promise<void>;
  initialData?: Partial<UserProfileData> | null;
  isLoading: boolean;
  isEditMode: boolean;
}

export const NgoForm: React.FC<NgoFormProps> = ({ onSubmit, initialData, isLoading, isEditMode }) => {
  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<NgoAdminFormValues>({
    resolver: zodResolver(ngoAdminSchema),
    defaultValues: {
      ngoName: '',
      mission: '',
      country: '',
      profileState: '',
      address: '',
      postalCode: '',
      publicWhatsapp: '',
      website: '',
      whatsappGroupLink: null,
      meetingDays: [],
      meetingTime: '',
      meetingPointMapsLink: '',
      email: '',
      contactName: '',
      contactWhatsApp: ''
    }
  });

  const watchedCountry = watch('country');
  const watchedMeetingDays = watch('meetingDays') || [];

  const handleDayChange = (dayId: string, checked: boolean | 'indeterminate') => {
      const currentDays = watchedMeetingDays;
      let newDays;
      if (checked) {
          newDays = [...currentDays, dayId];
      } else {
          newDays = currentDays.filter(d => d !== dayId);
      }
      setValue('meetingDays', newDays, { shouldValidate: true });
  };


  useEffect(() => {
    if (initialData) {
        reset({
            ngoName: initialData.ngoName || '',
            mission: initialData.mission || '',
            country: initialData.country || '',
            profileState: initialData.profileState || '',
            address: initialData.address || '',
            postalCode: initialData.postalCode || '',
            publicWhatsapp: initialData.publicWhatsapp || '',
            website: initialData.website || '',
            whatsappGroupLink: initialData.whatsappGroupLink || null,
            meetingDays: initialData.meetingDays || [],
            meetingTime: initialData.meetingTime || '',
            meetingPointMapsLink: initialData.meetingPointMapsLink || '',
            email: initialData.email || '',
            contactName: initialData.contactName || '',
            contactWhatsApp: initialData.contactWhatsApp || '',
        });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* NGO Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center"><HeartHandshake className="mr-2 h-5 w-5 text-primary" /> Detalles de la ONG</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="ngoName">Nombre de la ONG</Label>
            <Input id="ngoName" {...register('ngoName')} className={errors.ngoName ? 'border-destructive' : ''} />
            {errors.ngoName && <p className="text-xs text-destructive">{errors.ngoName.message}</p>}
          </div>
           <div className="space-y-1">
            <Label htmlFor="publicWhatsapp">WhatsApp Público</Label>
            <Input id="publicWhatsapp" {...register('publicWhatsapp')} className={errors.publicWhatsapp ? 'border-destructive' : ''} />
            {errors.publicWhatsapp && <p className="text-xs text-destructive">{errors.publicWhatsapp.message}</p>}
          </div>
        </div>
         <div className="space-y-1">
            <Label htmlFor="mission">Misión / Descripción</Label>
            <Textarea id="mission" {...register('mission')} className={errors.mission ? 'border-destructive' : ''} />
            {errors.mission && <p className="text-xs text-destructive">{errors.mission.message}</p>}
        </div>
         <div className="space-y-1">
            <Label htmlFor="address">Dirección Postal</Label>
            <Input id="address" {...register('address')} className={errors.address ? 'border-destructive' : ''} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="country">País</Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value) => { 
                    field.onChange(value); 
                    setValue('profileState', ''); // Reset state when country changes
                }} value={field.value || ''}>
                  <SelectTrigger className={errors.country ? 'border-destructive' : ''}><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                  <SelectContent>
                    {LAT_AM_LOCATIONS.map(c => <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="profileState">Estado/Provincia</Label>
            <Controller
              name="profileState"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedCountry}>
                  <SelectTrigger className={errors.profileState ? 'border-destructive' : ''}><SelectValue placeholder={!watchedCountry ? "Selecciona país" : "Selecciona estado"} /></SelectTrigger>
                  <SelectContent>
                    {LAT_AM_LOCATIONS.find(c => c.country === watchedCountry)?.states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.profileState && <p className="text-xs text-destructive">{errors.profileState.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input id="postalCode" {...register('postalCode')} className={errors.postalCode ? 'border-destructive' : ''} />
            {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
            <Label htmlFor="website">Sitio Web (Opcional)</Label>
            <Input id="website" type="url" {...register('website')} placeholder="https://..." className={errors.website ? 'border-destructive' : ''} />
            {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
        </div>
         <div className="space-y-1">
            <Label htmlFor="whatsappGroupLink">Enlace del Grupo de WhatsApp (para invitaciones)</Label>
            <Input id="whatsappGroupLink" type="url" {...register('whatsappGroupLink')} placeholder="https://chat.whatsapp.com/..." className={errors.whatsappGroupLink ? 'border-destructive' : ''} />
            {errors.whatsappGroupLink && <p className="text-xs text-destructive">{errors.whatsappGroupLink.message}</p>}
        </div>
      </div>

      <Separator />
      
      {/* Ride Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center border-b pb-2"><MapPin className="mr-2 h-5 w-5 text-primary" /> Detalles de Rodadas</h3>
        <div className="space-y-2">
            <Label>Días de Rodada</Label>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <TooltipProvider>
                    {DAYS_OF_WEEK.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`day-admin-${day.id}`}
                                checked={watchedMeetingDays.includes(day.id)}
                                onCheckedChange={(checked) => handleDayChange(day.id, checked)}
                            />
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Label htmlFor={`day-admin-${day.id}`} className="font-normal cursor-pointer">{day.label}</Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{day.id}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ))}
                </TooltipProvider>
            </div>
            {errors.meetingDays && <p className="text-xs text-destructive">{typeof errors.meetingDays.message === "string" ? errors.meetingDays.message : "Error en selección de días."}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="meetingTime">Hora de Encuentro</Label>
            <Input id="meetingTime" type="time" {...register('meetingTime')} className={errors.meetingTime ? 'border-destructive' : ''} />
            {errors.meetingTime && <p className="text-xs text-destructive">{errors.meetingTime.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="meetingPointMapsLink">Enlace de Google Maps</Label>
            <Input id="meetingPointMapsLink" type="url" {...register('meetingPointMapsLink')} placeholder="https://maps.app.goo.gl/..." className={errors.meetingPointMapsLink ? 'border-destructive' : ''} />
            {errors.meetingPointMapsLink && <p className="text-xs text-destructive">{errors.meetingPointMapsLink.message}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Account and Contact Person */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Cuenta y Contacto</h3>
        <div className="space-y-1">
            <Label htmlFor="email">Correo de la Cuenta (recibirá enlace)</Label>
            <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-destructive' : ''} disabled={isEditMode} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            {isEditMode && <p className="text-xs text-muted-foreground">El correo de la cuenta no se puede cambiar.</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
                <Label htmlFor="contactName">Nombre Completo del Contacto</Label>
                <Input id="contactName" {...register('contactName')} className={errors.contactName ? 'border-destructive' : ''} />
                {errors.contactName && <p className="text-xs text-destructive">{errors.contactName.message}</p>}
            </div>
            <div className="space-y-1">
                <Label htmlFor="contactWhatsApp">WhatsApp del Contacto</Label>
                <Input id="contactWhatsApp" {...register('contactWhatsApp')} className={errors.contactWhatsApp ? 'border-destructive' : ''} />
                {errors.contactWhatsApp && <p className="text-xs text-destructive">{errors.contactWhatsApp.message}</p>}
            </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditMode ? 'Guardar Cambios' : 'Crear ONG y Enviar Invitación'}
      </Button>
    </form>
  );
};
