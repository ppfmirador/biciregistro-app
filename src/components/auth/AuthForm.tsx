"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { FirebaseError } from "firebase/app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LAT_AM_LOCATIONS } from "@/constants";
import {
  formSchema,
  loginSchema,
  type FormValues,
  type LoginValues,
} from "@/lib/schemas";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.686,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

interface AuthFormProps {
  mode: "login" | "signup";
  userType?: UserRole;
}

const SignupForm: React.FC<{ userType: UserRole }> = ({ userType }) => {
  const { signUp, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      country: "",
      profileState: "",
    },
  });

  const watchedCountry = watch("country");

  useEffect(() => {
    setValue("profileState", "");
  }, [watchedCountry, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const referrerId = searchParams.get("ref");
      await signUp({ ...data, role: userType, referrerId });
      toast({
        title: "Registro Exitoso",
        description:
          "Tu cuenta ha sido creada. Por favor, revisa tu correo electrónico para verificar tu cuenta.",
      });
      router.push("/profile/edit"); // Redirect to complete profile after signup
    } catch (error: unknown) {
      const errorMessage =
        error instanceof FirebaseError
          ? error.message
          : "Ocurrió un error inesperado.";
      toast({
        title: "Registro Fallido",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnyLoading = isSubmitting || loading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre(s)</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            className={errors.firstName ? "border-destructive" : ""}
            disabled={isAnyLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido(s)</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            className={errors.lastName ? "border-destructive" : ""}
            disabled={isAnyLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("profileState", "");
                }}
                value={field.value || ""}
                disabled={isAnyLoading}
              >
                {" "}
                <SelectTrigger
                  className={errors.country ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  {LAT_AM_LOCATIONS.map((c) => (
                    <SelectItem key={c.country} value={c.country}>
                      {c.country}
                    </SelectItem>
                  ))}{" "}
                </SelectContent>{" "}
              </Select>
            )}
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profileState">Estado/Provincia</Label>
          <Controller
            name="profileState"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={isAnyLoading || !watchedCountry}
              >
                {" "}
                <SelectTrigger
                  className={errors.profileState ? "border-destructive" : ""}
                >
                  <SelectValue
                    placeholder={
                      !watchedCountry ? "País primero" : "Selecciona estado"
                    }
                  />
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  {LAT_AM_LOCATIONS.find(
                    (c) => c.country === watchedCountry,
                  )?.states.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}{" "}
                </SelectContent>{" "}
              </Select>
            )}
          />
          {errors.profileState && (
            <p className="text-sm text-destructive">
              {errors.profileState.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-signup">Correo Electrónico</Label>
        <Input
          id="email-signup"
          type="email"
          placeholder="tu@ejemplo.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
          disabled={isAnyLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-signup">Contraseña</Label>
        <div className="relative">
          <Input
            id="password-signup"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
            disabled={isAnyLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isAnyLoading}
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isAnyLoading}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registrarse
      </Button>
    </form>
  );
};

const LoginForm: React.FC = () => {
  const { signIn, loading, sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit: SubmitHandler<LoginValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
      // Redirection is handled by the useEffect in the main component
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error
          ? _error.message
          : "Ocurrió un error inesperado.";
      toast({
        title: "Autenticación Fallida",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    const email = getValues("email");
    if (!email || !z.string().email().safeParse(email).success) {
      toast({
        title: "Correo Inválido",
        description: "Por favor, ingresa un correo electrónico válido.",
        variant: "destructive",
      });
      return;
    }
    setIsSendingResetEmail(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: "Correo de Restablecimiento Enviado",
        description: `Si existe una cuenta para ${email}, se ha enviado un enlace.`,
        duration: 7000,
      });
    } catch (_error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de restablecimiento.",
        variant: "destructive",
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const isAnyLoading = isSubmitting || loading || isSendingResetEmail;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email-login">Correo Electrónico</Label>
        <Input
          id="email-login"
          type="email"
          placeholder="tu@ejemplo.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
          disabled={isAnyLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-login">Contraseña</Label>
        <div className="relative">
          <Input
            id="password-login"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password")}
            className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
            disabled={isAnyLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isAnyLoading}
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="text-right">
        <Button
          type="button"
          variant="link"
          onClick={handlePasswordResetRequest}
          className="px-0 text-sm h-auto py-1"
          disabled={isAnyLoading}
        >
          {isSendingResetEmail && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          ¿Olvidaste tu contraseña?
        </Button>
      </div>
      <Button type="submit" className="w-full" disabled={isAnyLoading}>
        {(isSubmitting || loading) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Iniciar Sesión
      </Button>
    </form>
  );
};

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  userType = "cyclist",
}) => {
  const { user, loading, signInWithGoogle } = useAuth();
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "bikeshop") router.push("/bikeshop/dashboard");
      else if (user.role === "ngo") router.push("/ngo/dashboard");
      else if (user.isAdmin) router.push("/admin");
      else if (!user.firstName || !user.lastName) router.push("/profile/edit");
      else router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    const referrerId = searchParams.get("ref");
    try {
      await signInWithGoogle(referrerId);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const isAnyLoading = loading || isGoogleSubmitting;

  return (
    <div className="space-y-4">
      {mode === "login" ? <LoginForm /> : <SignupForm userType={userType} />}
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
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isAnyLoading}
      >
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
