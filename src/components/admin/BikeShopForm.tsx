"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bikeShopAdminSchema,
  type BikeShopAdminFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building, User } from "lucide-react";
import { LAT_AM_LOCATIONS } from "@/constants";
import { Separator } from "../ui/separator";
import type { UserProfileData } from "@/lib/types";

interface BikeShopFormProps {
  onSubmit: (data: BikeShopAdminFormValues) => Promise<void>;
  initialData?: Partial<UserProfileData> | null;
  isLoading: boolean;
  isEditMode: boolean;
}

export const BikeShopForm: React.FC<BikeShopFormProps> = ({
  onSubmit,
  initialData,
  isLoading,
  isEditMode,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BikeShopAdminFormValues>({
    resolver: zodResolver(bikeShopAdminSchema),
    defaultValues: {
      shopName: "",
      country: "",
      profileState: "",
      address: "",
      postalCode: "",
      email: "",
      phone: "",
      website: "",
      mapsLink: "",
      whatsappGroupLink: "",
      contactName: "",
      contactEmail: "",
      contactWhatsApp: "",
    },
  });

  const watchedCountry = watch("country");

  useEffect(() => {
    if (initialData) {
      reset({
        shopName: initialData.shopName || "",
        country: initialData.country || "",
        profileState: initialData.profileState || "",
        address: initialData.address || "",
        postalCode: initialData.postalCode || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        website: initialData.website || "",
        mapsLink: initialData.mapsLink || "",
        whatsappGroupLink: initialData.whatsappGroupLink || null, // Ensure null for empty
        contactName: initialData.contactName || "",
        contactEmail: initialData.contactEmail || "",
        contactWhatsApp: initialData.contactWhatsApp || "",
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Store Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <Building className="mr-2 h-5 w-5 text-primary" /> Detalles de la
          Tienda
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="shopName">Nombre de la Tienda</Label>
            <Input
              id="shopName"
              {...register("shopName")}
              className={errors.shopName ? "border-destructive" : ""}
            />
            {errors.shopName && (
              <p className="text-xs text-destructive">
                {errors.shopName.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Teléfono de la Tienda</Label>
            <Input
              id="phone"
              {...register("phone")}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">
            Correo de la Tienda (para inicio de sesión)
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
            disabled={isEditMode}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
          {isEditMode && (
            <p className="text-xs text-muted-foreground">
              El correo de inicio de sesión no se puede cambiar.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            {...register("address")}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="country">País</Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("profileState", ""); // Reset state when country changes
                  }}
                  value={field.value || ""}
                >
                  <SelectTrigger
                    className={errors.country ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAT_AM_LOCATIONS.map((c) => (
                      <SelectItem key={c.country} value={c.country}>
                        {c.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.country && (
              <p className="text-xs text-destructive">
                {errors.country.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="profileState">Estado/Provincia</Label>
            <Controller
              name="profileState"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={!watchedCountry}
                >
                  <SelectTrigger
                    className={errors.profileState ? "border-destructive" : ""}
                  >
                    <SelectValue
                      placeholder={
                        !watchedCountry
                          ? "Selecciona país"
                          : "Selecciona estado"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {LAT_AM_LOCATIONS.find(
                      (c) => c.country === watchedCountry,
                    )?.states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.profileState && (
              <p className="text-xs text-destructive">
                {errors.profileState.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input
              id="postalCode"
              {...register("postalCode")}
              className={errors.postalCode ? "border-destructive" : ""}
            />
            {errors.postalCode && (
              <p className="text-xs text-destructive">
                {errors.postalCode.message}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="website">Sitio Web (Opcional)</Label>
            <Input
              id="website"
              type="url"
              {...register("website")}
              placeholder="https://..."
              className={errors.website ? "border-destructive" : ""}
            />
            {errors.website && (
              <p className="text-xs text-destructive">
                {errors.website.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="mapsLink">Enlace a Google Maps (Opcional)</Label>
            <Input
              id="mapsLink"
              type="url"
              {...register("mapsLink")}
              placeholder="https://maps.app.goo.gl/..."
              className={errors.mapsLink ? "border-destructive" : ""}
            />
            {errors.mapsLink && (
              <p className="text-xs text-destructive">
                {errors.mapsLink.message}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="whatsappGroupLink">
            Enlace del Grupo de WhatsApp (para compartir rodadas)
          </Label>
          <Input
            id="whatsappGroupLink"
            type="url"
            {...register("whatsappGroupLink")}
            placeholder="https://chat.whatsapp.com/..."
            className={errors.whatsappGroupLink ? "border-destructive" : ""}
          />
          {errors.whatsappGroupLink && (
            <p className="text-xs text-destructive">
              {errors.whatsappGroupLink.message}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Contact Person */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <User className="mr-2 h-5 w-5 text-primary" /> Persona de Contacto
        </h3>
        <div className="space-y-1">
          <Label htmlFor="contactName">Nombre Completo del Contacto</Label>
          <Input
            id="contactName"
            {...register("contactName")}
            className={errors.contactName ? "border-destructive" : ""}
          />
          {errors.contactName && (
            <p className="text-xs text-destructive">
              {errors.contactName.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="contactEmail">Correo del Contacto</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register("contactEmail")}
              className={errors.contactEmail ? "border-destructive" : ""}
            />
            {errors.contactEmail && (
              <p className="text-xs text-destructive">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactWhatsApp">WhatsApp del Contacto</Label>
            <Input
              id="contactWhatsApp"
              {...register("contactWhatsApp")}
              className={errors.contactWhatsApp ? "border-destructive" : ""}
            />
            {errors.contactWhatsApp && (
              <p className="text-xs text-destructive">
                {errors.contactWhatsApp.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditMode ? "Guardar Cambios" : "Crear Tienda"}
      </Button>
    </form>
  );
};
