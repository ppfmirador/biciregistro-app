
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBikeBySerialNumber } from '@/lib/db';
import type { Bike } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShieldAlert, QrCode } from 'lucide-react';
import QrCodeDisplay from '@/components/bike/QrCodeDisplay';
import Image from 'next/image';
import BikeStatusBadge from '@/components/bike/BikeStatusBadge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function QrCodePageContent() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const serialNumber = params.serialNumber as string;

    const [bike, setBike] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBikeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const bikeData = await getBikeBySerialNumber(decodeURIComponent(serialNumber));
            if (!bikeData) {
                toast({ title: "Error", description: "Bicicleta no encontrada.", variant: "destructive" });
                router.push('/dashboard');
                return;
            }
            // Security check: Only the owner can see the QR management page.
            if (bikeData.ownerId !== user?.uid) { // FIX: lint issue
                toast({ title: "Acceso Denegado", description: "No tienes permiso para gestionar el QR de esta bicicleta.", variant: "destructive" });
                router.push('/dashboard');
                return;
            }
            setBike(bikeData);
        } catch (error: unknown) { // FIX: lint issue
            const errorMessage = error instanceof Error ? error.message : "No se pudo cargar la información de la bicicleta.";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [serialNumber, user, router, toast]);

    useEffect(() => {
        if (!serialNumber || authLoading) return;

        if (!user) {
            toast({ title: "Acceso Denegado", description: "Debes iniciar sesión para ver esta página.", variant: "destructive" });
            router.push('/auth');
            return;
        }

        fetchBikeData();
    }, [serialNumber, user, authLoading, router, toast, fetchBikeData]);

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Cargando generador de QR...</p>
            </div>
        );
    }

    if (!bike) {
        return (
            <div className="text-center py-10">
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Bicicleta no encontrada o no tienes permiso para acceder a esta página.</AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/dashboard')} className="mt-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
                </Button>
            </div>
        );
    }
    
    const displayPhotoUrl = bike.photoUrls && bike.photoUrls.filter(url => url).length > 0 
    ? bike.photoUrls.filter(url => url)[0] 
    : 'https://placehold.co/400x250.png';

    return (
        <div className="space-y-6 sm:space-y-8">
            <Button variant="outline" onClick={() => router.push(`/bike/${serialNumber}`)} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Detalles de la Bici
            </Button>
            
            <Card className="max-w-3xl mx-auto shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <QrCode className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        <CardTitle className="text-2xl sm:text-3xl font-headline">Código QR de tu Bicicleta</CardTitle>
                    </div>
                    <CardDescription className="text-sm sm:text-base">
                        Este código QR enlaza al perfil público de tu {bike.brand} {bike.model}. Descárgalo y pégalo en tu bicicleta para una fácil identificación y verificación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid items-start md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Vista Previa del Perfil Público</h3>
                        <Card className="overflow-hidden">
                           <Image
                                src={displayPhotoUrl}
                                alt={`Foto de ${bike.brand} ${bike.model}`}
                                width={400}
                                height={250}
                                className="object-cover w-full aspect-video"
                                data-ai-hint="bicycle side view"
                            />
                            <div className="p-4 space-y-2">
                                <CardTitle className="text-xl">{bike.brand} {bike.model}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">N/S:</span> {bike.serialNumber}
                                </p>
                                <div className="flex items-center gap-2 pt-2">
                                     <span className="text-sm font-semibold">Estado:</span>
                                    <BikeStatusBadge status={bike.status} />
                                </div>
                            </div>
                        </Card>
                         <Alert>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>¡Importante!</AlertTitle>
                            <AlertDescription>
                                La información del propietario (tu nombre, contacto, etc.) NUNCA se muestra en el perfil público. Solo se muestra el estado actual de la bicicleta.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <div className="space-y-4">
                         <h3 className="font-semibold text-lg border-b pb-2">Tu Código QR</h3>
                        <QrCodeDisplay bike={bike} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function QrCodePage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Cargando...</p>
            </div>
        }>
            <QrCodePageContent />
        </Suspense>
    );
}
