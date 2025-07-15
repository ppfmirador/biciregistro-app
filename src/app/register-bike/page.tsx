
"use client";

import { useState, useEffect } from 'react';
import { BikeForm } from '@/components/bike/BikeForm';
import type { BikeFormValues } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable, type HttpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadFileToStorage } from '@/lib/storage'; 
import { OTHER_BRAND_VALUE } from '@/constants';

export default function RegisterBikePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || user.isAnonymous)) {
      toast({ title: "Autenticación Requerida", description: "Por favor, inicia sesión para registrar una bicicleta.", variant: "destructive" });
      router.push('/auth');
    }
  }, [user, authLoading, router, toast]);

  const handleSubmit = async (data: BikeFormValues) => {
    if (!user || user.isAnonymous) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión para registrar una bicicleta.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    try {
      const bikeIdPlaceholder = Date.now().toString();

      // Helper function to upload a single file and return its URL and other info
      const uploadFile = async (file: File | null, type: 'photo' | 'document', index?: number): Promise<{ type: 'photo' | 'document', url: string, name?: string } | null> => {
        if (!file) return null;
        
        let path = '';
        if (type === 'photo') {
            path = `bike_images/${user.uid}/${bikeIdPlaceholder}/photo_${index}_${Date.now()}_${file.name}`;
        } else {
            path = `bike_documents/${user.uid}/${bikeIdPlaceholder}/${Date.now()}_${file.name}`;
        }
        
        const downloadURL = await uploadFileToStorage(file, path);
        
        if (type === 'document') {
            return { type, url: downloadURL, name: file.name };
        }
        return { type, url: downloadURL };
      };
      
      const photo1 = data.photo1?.[0] || null;
      const photo2 = data.photo2?.[0] || null;
      const photo3 = data.photo3?.[0] || null;
      const ownershipDocument = data.ownershipDocument?.[0] || null;

      const uploadPromises = [
        uploadFile(photo1, 'photo', 1),
        uploadFile(photo2, 'photo', 2),
        uploadFile(photo3, 'photo', 3),
        uploadFile(ownershipDocument, 'document'),
      ];

      const uploadResults = await Promise.all(uploadPromises);

      const photoUrls = uploadResults.filter((r): r is { type: 'photo', url: string } => r?.type === 'photo').map(r => r.url);
      const docResult = uploadResults.find((r): r is { type: 'document', url: string, name: string } => r?.type === 'document' && !!r.name);
      
      const ownershipDocumentUrl = docResult?.url || null;
      const ownershipDocumentName = docResult?.name || null;
      
      const finalBrand = data.brand === OTHER_BRAND_VALUE ? data.otherBrand || '' : data.brand;

      const newBikeData = {
        serialNumber: data.serialNumber,
        brand: finalBrand,
        model: data.model,
        color: data.color,
        description: data.description,
        country: data.country,
        state: data.state,
        bikeType: data.bikeType, 
        photoUrls: photoUrls, 
        ownershipDocumentUrl: ownershipDocumentUrl,
        ownershipDocumentName: ownershipDocumentName,
      };
      
      const functions = getFunctions(app, 'us-central1');
      const createBikeCallable = httpsCallable<{ bikeData: any }, { bikeId: string }>(functions, 'createBike');
      await createBikeCallable({ bikeData: newBikeData });
      
      toast({ title: '¡Bicicleta Registrada!', description: `${finalBrand} ${data.model} ha sido registrada exitosamente.` });
      router.push(`/bike/${encodeURIComponent(data.serialNumber)}/qr`);

    } catch (error: any) {
      toast({ 
        title: 'Registro Fallido', 
        description: error.message || 'No se pudo registrar la bicicleta. Revisa los datos e inténtalo de nuevo.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user || user.isAnonymous) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Cargando detalles de autenticación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
       <Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-4 sm:mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
      </Button>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <PlusCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-headline">Registrar Nueva Bicicleta</CardTitle>
          </div>
          <CardDescription className="text-sm sm:text-base">Completa los detalles a continuación para agregar tu bicicleta al registro. Puedes subir hasta 3 fotos y un documento de propiedad desde tu dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <BikeForm onSubmit={handleSubmit} isLoading={isLoading} submitButtonText="Registrar Bici" />
        </CardContent>
      </Card>
    </div>
  );
}
