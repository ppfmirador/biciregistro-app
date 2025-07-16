
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { getUserDoc, updateUserDoc } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserCircle, Loader2, KeyRound, Eye, EyeOff, HeartHandshake, User, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ngoProfileSchema, type NgoProfileFormValues } from '@/lib/schemas';
import { LAT_AM_LOCATIONS, DAYS_OF_WEEK } from '@/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function EditNgoProfilePageContent() {
  const router = useRouter();
  const { user, loading: authLoading, updateUserPassword } = useAuth();
  const { toast } = useToast();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm<NgoProfileFormValues>({
    resolver: zodResolver(ngoProfileSchema),
    defaultValues: {
      ngoName: '', mission: '', country: '', profileState: '', address: '', postalCode: '', publicWhatsapp: '', website: '',
      whatsappGroupLink: '',
      meetingDays: [], meetingTime: '', meetingPointMapsLink: '',
      contactName: '', contactWhatsApp: ''
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
    if (authLoading) return;
    if (!user || user.role !== 'ngo') {
      toast({ title: "Acceso Denegado", description: "Debes ser una ONG para editar este perfil.", variant: "destructive" });
      router.push('/ngo/auth');
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingData(true);
      try {
        const existingProfile = await getUserDoc(user.uid);
        if (existingProfile) {
          reset({ 
            ...existingProfile,
            whatsappGroupLink: existingProfile.whatsappGroupLink || '',
            meetingDays: existingProfile.meetingDays || [] 
          } as NgoProfileFormValues);
        }
      } catch (error: unknown) {
        toast({ title: "Error", description: "No se pudo cargar tu perfil.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router, toast, reset]);

  const handleProfileSubmit = async (data: NgoProfileFormValues) => {
    if (!user) return;
    setIsSubmittingProfile(true);
    try {
      await updateUserDoc(user.uid, data);
      toast({ title: "¡Perfil Actualizado!", description: "La información de tu organización ha sido guardada." });
      router.push('/ngo/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el perfil.";
      toast({ title: "Error al Guardar Perfil", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordChangeError('');
    if (newPassword.length < 6) {
      setPasswordChangeError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("Las contraseñas no coinciden.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await updateUserPassword(newPassword);
      toast({ title: "¡Contraseña Actualizada!", description: "Tu contraseña ha sido cambiada exitosamente." });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo cambiar la contraseña.";
      setPasswordChangeError(errorMessage);
      toast({ title: "Error al Cambiar Contraseña", description: errorMessage, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoadingData || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando perfil de la organización...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/ngo/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
      </Button>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline">Editar Perfil de la Organización</CardTitle>
          </div>
          <CardDescription>
            Actualiza la información pública y de contacto de tu organización. El correo electrónico (<span className="font-semibold">{user?.email || 'N/A'}</span>) no se puede cambiar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-6">
            {/* Public Info Section */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium flex items-center border-b pb-2"><HeartHandshake className="mr-2 h-5 w-5 text-primary" /> Información Pública de la ONG</h3>
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
                    <Controller name="country" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value || ''}> <SelectTrigger className={errors.country ? 'border-destructive' : ''}><SelectValue placeholder="Selecciona un país" /></SelectTrigger> <SelectContent> {LAT_AM_LOCATIONS.map(c => <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>)} </SelectContent> </Select> )} />
                    {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="profileState">Estado/Provincia</Label>
                    <Controller name="profileState" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedCountry}> <SelectTrigger className={errors.profileState ? 'border-destructive' : ''}><SelectValue placeholder={!watchedCountry ? "Selecciona país" : "Selecciona estado"} /></SelectTrigger> <SelectContent> {LAT_AM_LOCATIONS.find(c => c.country === watchedCountry)?.states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                    {errors.profileState && <p className="text-xs text-destructive">{errors.profileState.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input id="postalCode" {...register('postalCode')} className={errors.postalCode ? 'border-destructive' : ''} />
                    {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </section>

            <Separator />
            
            {/* Ride Details Section */}
            <section className="space-y-4">
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
            </section>

            {/* Private Info Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium flex items-center border-b pb-2"><User className="mr-2 h-5 w-5 text-primary" /> Información de Contacto (Interno)</h3>
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
            </section>
            
            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios de Perfil
            </Button>
          </form>

          <Separator className="my-8" />

          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-primary" />
              Cambiar Contraseña
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                 <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                   <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {passwordChangeError && <p className="text-sm text-destructive">{passwordChangeError}</p>}
              <Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword || !confirmPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar Contraseña
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditNgoProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando...</p>
      </div>
    }>
      <EditNgoProfilePageContent />
    </Suspense>
  );
}
