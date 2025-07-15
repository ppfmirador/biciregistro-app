
"use client";

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Paperclip } from 'lucide-react';
import { LAT_AM_LOCATIONS, BIKE_TYPES, PLACEHOLDER_NONE_VALUE, BIKE_BRANDS, OTHER_BRAND_VALUE } from '@/constants';
import type { BikeType } from '@/lib/types';
import { useEffect } from 'react';
import { bikeFormSchema, type BikeFormValues } from '@/lib/schemas';

// Re-export the type to make it available for other modules that import this component.
export type { BikeFormValues };

interface BikeFormProps {
  onSubmit: (data: BikeFormValues) => Promise<void>;
  initialData?: Partial<BikeFormValues>;
  isLoading: boolean;
  submitButtonText?: string;
  isEditMode?: boolean; // To conditionally hide file inputs for editing core details
}


export const BikeForm: React.FC<BikeFormProps> = ({ onSubmit, initialData, isLoading, submitButtonText = "Guardar Bici", isEditMode = false }) => {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<BikeFormValues>({
    resolver: zodResolver(bikeFormSchema),
    defaultValues: {
      serialNumber: initialData?.serialNumber || '',
      brand: initialData?.brand || '',
      otherBrand: initialData?.otherBrand || '',
      model: initialData?.model || '',
      color: initialData?.color || '',
      description: initialData?.description || '',
      country: initialData?.country || '',
      state: initialData?.state || '',
      bikeType: initialData?.bikeType || '',
    },
  });

  const watchedBrand = watch('brand');
  const watchedCountry = watch('country');

  useEffect(() => {
    if (initialData?.country && initialData.country !== watchedCountry) {
        setValue('state', '');
    }
  }, [watchedCountry, initialData?.country, setValue]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Número de Serie</Label>
          <Input id="serialNumber" {...register('serialNumber')} className={errors.serialNumber ? 'border-destructive' : ''} />
          {errors.serialNumber && <p className="text-sm text-destructive">{errors.serialNumber.message}</p>}
        </div>
        <div className="space-y-2">
           <Label htmlFor="brand">Marca</Label>
           <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} defaultValue={initialData?.brand}>
                <SelectTrigger name={field.name} className={errors.brand ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  {BIKE_BRANDS.sort().map(brandName => (
                    <SelectItem key={brandName} value={brandName}>{brandName}</SelectItem>
                  ))}
                  <SelectItem value={OTHER_BRAND_VALUE}>{OTHER_BRAND_VALUE} (especificar)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
        </div>
      </div>
      
      {watchedBrand === OTHER_BRAND_VALUE && (
        <div className="space-y-2">
          <Label htmlFor="otherBrand">Especifica la Marca</Label>
          <Input id="otherBrand" {...register('otherBrand')} className={errors.otherBrand ? 'border-destructive' : ''} placeholder="Ej. Bicicletas Patito" />
          {errors.otherBrand && <p className="text-sm text-destructive">{errors.otherBrand.message}</p>}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" {...register('model')} className={errors.model ? 'border-destructive' : ''} />
          {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bikeType">Tipo de Bicicleta (Opcional)</Label>
          <Controller
            name="bikeType"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value as BikeType)}
                value={field.value || ''}
                defaultValue={initialData?.bikeType || ''}
              >
                <SelectTrigger name={field.name} className={errors.bikeType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                  {BIKE_TYPES.map(typeOpt => (
                    <SelectItem key={typeOpt.value} value={typeOpt.value}>{typeOpt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.bikeType && <p className="text-sm text-destructive">{typeof errors.bikeType.message === 'string' ? errors.bikeType.message : "Error en el tipo de bicicleta"}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
          <Label htmlFor="country">País (Ubicación Bici - Opcional)</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => {
                    field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value);
                    setValue('state', ''); // Reset state when country changes
                }}
                value={field.value || ''}
              >
                <SelectTrigger name={field.name} className={errors.country ? 'border-destructive' : ''}>
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
          <Label htmlFor="state">Estado/Provincia (Opcional)</Label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)}
                value={field.value || ''}
                disabled={!watchedCountry}
              >
                <SelectTrigger name={field.name} className={errors.state ? 'border-destructive' : ''}>
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
          {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
          <Label htmlFor="color">Color (Opcional)</Label>
          <Input id="color" {...register('color')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (Opcional)</Label>
        <Textarea id="description" {...register('description')} placeholder="Cualquier detalle adicional sobre tu bicicleta..." />
      </div>

      {!isEditMode && (
        <>
          <h3 className="text-lg font-medium pt-4 border-t">Fotos de la Bicicleta (Opcional)</h3>
          <div className="space-y-2">
            <Label htmlFor="photo1">Foto 1</Label>
            <Input id="photo1" type="file" accept="image/*" {...register('photo1')} className={errors.photo1 ? 'border-destructive' : ''} />
            {errors.photo1 && <p className="text-sm text-destructive">{typeof errors.photo1.message === 'string' ? errors.photo1.message : 'Error con el archivo'}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo2">Foto 2</Label>
            <Input id="photo2" type="file" accept="image/*" {...register('photo2')} className={errors.photo2 ? 'border-destructive' : ''} />
            {errors.photo2 && <p className="text-sm text-destructive">{typeof errors.photo2.message === 'string' ? errors.photo2.message : 'Error con el archivo'}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo3">Foto 3</Label>
            <Input id="photo3" type="file" accept="image/*" {...register('photo3')} className={errors.photo3 ? 'border-destructive' : ''} />
            {errors.photo3 && <p className="text-sm text-destructive">{typeof errors.photo3.message === 'string' ? errors.photo3.message : 'Error con el archivo'}</p>}
          </div>

          <h3 className="text-lg font-medium pt-4 border-t">Documento de Propiedad (Opcional)</h3>
           <div className="space-y-2">
            <Label htmlFor="ownershipDocument" className="flex items-center">
              <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
              Adjuntar Documento (PDF, JPG, PNG)
            </Label>
            <Input id="ownershipDocument" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" {...register('ownershipDocument')} className={errors.ownershipDocument ? 'border-destructive' : ''} />
            {errors.ownershipDocument && <p className="text-sm text-destructive">{typeof errors.ownershipDocument.message === 'string' ? errors.ownershipDocument.message : 'Error con el archivo'}</p>}
          </div>
        </>
      )}
      
      <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitButtonText}
      </Button>
    </form>
  );
};
