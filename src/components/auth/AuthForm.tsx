
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '@/lib/types';

const formSchema = z.object({
  email: z.string().email({ message: 'Dirección de correo inválida.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  userType?: UserRole;
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.686,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export const AuthForm: React.FC<AuthFormProps> = ({ mode, userType = 'cyclist' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, signIn, signUp, loading: authLoading, sendPasswordReset, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!isSubmitting && !authLoading && user) {
      if (mode === 'login' || isGoogleSubmitting) { // Redirect after login or Google sign-in
        if (user.role === 'bikeshop') {
          router.push('/bikeshop/dashboard');
        } else if (user.role === 'ngo') {
            router.push('/ngo/dashboard');
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else if (!user.firstName && !user.lastName) { // Profile is incomplete for any user type
           router.push('/profile/edit');
        }
        else {
          router.push('/dashboard');
        }
      } else if (mode === 'signup') { // Email/pass signup always goes to edit profile
        router.push('/profile/edit');
      }
    }
  }, [user, authLoading, router, mode, isSubmitting, isGoogleSubmitting]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(data.email, data.password);
      } else {
        const referrerId = searchParams.get('ref');
        await signUp(data.email, data.password, userType, referrerId);
        toast({
          title: 'Registro Exitoso',
          description: 'Tu cuenta ha sido creada. Por favor, revisa tu correo electrónico para verificar tu cuenta.'
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast({
        title: 'Autenticación Fallida',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    const referrerId = searchParams.get('ref');
    try {
      await signInWithGoogle(referrerId);
    } catch (error: unknown) {
      // Error is handled in AuthContext
    } finally {
      setIsGoogleSubmitting(false);
    }
  };


  const handlePasswordResetRequest = async () => {
    const email = getValues('email');
    const emailValidation = z.string().email().safeParse(email);

    if (!emailValidation.success) {
      toast({
        title: 'Correo Inválido',
        description: 'Por favor, ingresa un correo electrónico válido en el campo de arriba.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingResetEmail(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: 'Correo de Restablecimiento Enviado',
        description: `Si existe una cuenta para ${email}, se ha enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada y spam.`,
        duration: 7000,
      });
    } catch (error: unknown) {
      console.error("Error requesting password reset:", error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el correo de restablecimiento. Por favor, inténtalo de nuevo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isAnyLoading = isSubmitting || authLoading || isSendingResetEmail || isGoogleSubmitting;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@ejemplo.com"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
            disabled={isAnyLoading}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
              disabled={isAnyLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={togglePasswordVisibility}
              disabled={isAnyLoading}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {mode === 'login' && (
          <div className="text-right">
            <Button
              type="button"
              variant="link"
              onClick={handlePasswordResetRequest}
              className="px-0 text-sm h-auto py-1"
              disabled={isAnyLoading}
            >
              {isSendingResetEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isAnyLoading}>
          {(isSubmitting || authLoading) && !isGoogleSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
            O continúa con
            </span>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isAnyLoading}>
        {isGoogleSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        Google
      </Button>

    </div>
  );
};
