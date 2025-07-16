
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileForm, type ProfileFormValues } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { getUserDoc, updateUserDoc } from '@/lib/db';
import type { UserProfileData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserCircle, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FirebaseError } from 'firebase/app'; // FIX: lint issue

function EditProfilePageContent() {
  const router = useRouter();
  const { user, loading: authLoading, updateUserPassword } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<Partial<UserProfileData> | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast({ title: "Autenticación Requerida", description: "Por favor, inicia sesión para editar tu perfil.", variant: "destructive" });
      router.push('/auth');
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingData(true);
      try {
        const existingProfile = await getUserDoc(user.uid);
        if (existingProfile) {
          setProfileData(existingProfile);
        } else {
          setProfileData({ email: user.email || undefined });
        }
      } catch (error: unknown) { // FIX: lint issue
        toast({ title: "Error", description: "No se pudo cargar tu perfil.", variant: "destructive" });
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router, toast]);

  const handleProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmittingProfile(true);
    try {
      const profileToSave: UserProfileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        whatsappPhone: data.whatsappPhone || '',
        country: data.country || '',
        profileState: data.profileState || '',
        postalCode: data.postalCode || '',
        age: data.age || null,
        gender: data.gender || '',
        email: user.email,
      };
      await updateUserDoc(user.uid, profileToSave);
      toast({ title: "¡Perfil Actualizado!", description: "Tu información de perfil ha sido guardada." });
      router.push('/dashboard');
    } catch (error: unknown) { // FIX: lint issue
      const errorMessage = error instanceof FirebaseError ? error.message : "No se pudo guardar el perfil.";
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
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: unknown) { // FIX: lint issue
      const errorMessage = error instanceof FirebaseError ? error.message : 'No se pudo actualizar la contraseña.';
      setPasswordChangeError(errorMessage);
      toast({ title: "Error al Cambiar Contraseña", description: errorMessage, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };


  if (isLoadingData || authLoading) {
    return (
      div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        Loader2 className="h-12 w-12 animate-spin text-primary" />
        p className="ml-4 text-lg">Cargando perfil...p>
      div>
    );
  }

  return (
    div className="space-y-8">
      Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-6">
        ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
      Button>
      Card className="max-w-2xl mx-auto shadow-xl">
        CardHeader>
          div className="flex items-center gap-2 mb-2">
            UserCircle className="h-8 w-8 text-primary" />
            CardTitle className="text-3xl font-headline">
              {profileData?.firstName ? 'Editar Perfil' : 'Completar Perfil'}
            CardTitle>
          div>
          CardDescription>
            {profileData?.firstName ? 'Actualiza tu información personal.' : 'Completa tu información personal para continuar.'}
            El correo electrónico (span className="font-semibold">{user?.email || 'N/A'}span>) no es editable aquí.
          CardDescription>
        CardHeader>
        CardContent>
          ProfileForm
            onSubmit={handleProfileSubmit}
            initialData={profileData || {}}
            isLoading={isSubmittingProfile}
            submitButtonText={profileData?.firstName ? "Guardar Cambios de Perfil" : "Guardar Perfil y Continuar"}
          />

          Separator className="my-8" />

          div>
            h3 className="text-xl font-semibold mb-4 flex items-center">
              KeyRound className="mr-2 h-5 w-5 text-primary" />
              Cambiar Contraseñah3>
            div className="space-y-4">
              div className="space-y-2">
                Label htmlFor="newPassword">Nueva ContraseñaLabel>
                div className="relative">
                  Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={passwordChangeError && (newPassword.length  newPassword !== confirmPassword) ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showNewPassword ? EyeOff className="h-4 w-4" /> : Eye className="h-4 w-4" />}
                  Button>
                div>
              div>
              div className="space-y-2">
                Label htmlFor="confirmPassword">Confirmar Nueva ContraseñaLabel>
                 div className="relative">
                  Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={passwordChangeError && newPassword !== confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                   Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? EyeOff className="h-4 w-4" /> : Eye className="h-4 w-4" />}
                  Button>
                div>
              div>
              {passwordChangeError && p className="text-sm text-destructive">{passwordChangeError}p>}
              Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword || !confirmPassword}>
                {isChangingPassword && Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar Contraseña
              Button>
            div>
          div>
        CardContent>
      Card>
    div>
  );
}

export default function EditProfilePage() {
  return (
    Suspense fallback={
      div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        Loader2 className="h-12 w-12 animate-spin text-primary" />
        p className="ml-4 text-lg">Cargando...p>
      div>
    }>
      EditProfilePageContent />
    Suspense>
  );
}
