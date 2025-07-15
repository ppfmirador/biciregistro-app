
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BikeForm } from '@/components/bike/BikeForm';
import type { BikeFormValues } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getBikeBySerialNumber, updateBike } from '@/lib/db'; 
import type { Bike, BikeType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { BIKE_BRANDS, OTHER_BRAND_VALUE } from '@/constants';

function EditBikePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const serialNumber = params.serialNumber as string;

  const [bike, setBike] = useState<Bike | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (serialNumber && user) {
      const fetchBikeData = async () => {
        setIsLoading(true);
        try {
          const bikeData = await getBikeBySerialNumber(decodeURIComponent(serialNumber));
          if (!bikeData) {
            toast({ title: "Error", description: "Bicicleta no encontrada.", variant: "destructive" });
            router.push('/dashboard');
            return;
          }
          if (bikeData.ownerId !== user.uid) {
            toast({ title: "Acceso Denegado", description: "No tienes permiso para editar esta bicicleta.", variant: "destructive" });
            router.push(`/bike/${serialNumber}`);
            return;
          }
          setBike(bikeData);
        } catch (error) {
          toast({ title: "Error", description: "No se pudo cargar la información de la bicicleta.", variant: "destructive" });
          console.error(error);
          router.push('/dashboard');
        } finally {
          setIsLoading(false);
        }
      };
      fetchBikeData();
    } else if (!authLoading && !user) {
        toast({ title: "Autenticación Requerida", description: "Por favor, inicia sesión.", variant: "destructive" });
        router.push('/auth');
    }
  }, [serialNumber, user, authLoading, router, toast]);

  const handleSubmit = async (data: BikeFormValues) => {
    if (!bike) return;
    setIsSubmitting(true);
    try {
      const finalBrand = data.brand === OTHER_BRAND_VALUE ? data.otherBrand || '' : data.brand;
      const updates: Partial<Bike> & { bikeType?: BikeType } = { 
        serialNumber: data.serialNumber, 
        brand: finalBrand,
        model: data.model,
        color: data.color,
        description: data.description,
        country: data.country,
        state: data.state,
        bikeType: data.bikeType, 
      };
      
      await updateBike(bike.id, updates);
      toast({ title: "¡Bicicleta Actualizada!", description: "Los detalles de tu bicicleta han sido actualizados." });
      router.push(`/bike/${encodeURIComponent(data.serialNumber || bike.serialNumber)}`); 
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message || "No se pudo actualizar la bicicleta.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando editor...</p>
      </div>
    );
  }

  if (!bike) {
    return <p className="text-center py-10">Bicicleta no encontrada o no tienes permiso para editarla.</p>;
  }
  
  const isKnownBrand = bike.brand && BIKE_BRANDS.includes(bike.brand);

  const initialFormValues: Partial<BikeFormValues> = {
    serialNumber: bike.serialNumber,
    brand: isKnownBrand ? bike.brand : OTHER_BRAND_VALUE,
    otherBrand: isKnownBrand ? '' : bike.brand,
    model: bike.model,
    color: bike.color,
    description: bike.description,
    country: bike.country,
    state: bike.state,
    bikeType: bike.bikeType, 
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <Button variant="outline" onClick={() => router.push(`/bike/${serialNumber}`)} className="mb-4 sm:mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Detalles
      </Button>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Edit className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-headline">Editar Detalles de la Bicicleta</CardTitle>
          </div>
          <CardDescription className="text-sm sm:text-base">Modifica la información de tu {bike.brand} {bike.model}. Para cambiar fotos o el documento de propiedad, usa la página de detalles.</CardDescription>
        </CardHeader>
        <CardContent>
          <BikeForm 
            onSubmit={handleSubmit} 
            initialData={initialFormValues} 
            isLoading={isSubmitting} 
            submitButtonText="Guardar Cambios"
            isEditMode={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}


export default function EditBikePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando...</p>
      </div>
    }>
      <EditBikePageContent />
    </Suspense>
  );
}
