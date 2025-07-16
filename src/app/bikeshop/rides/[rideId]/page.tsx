
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bikeRideSchema, type BikeRideFormValues } from '@/lib/schemas';
import { useAuth } from '@/context/AuthContext';
import { getRideById, createOrUpdateRide } from '@/lib/db';
import type { BikeType, RideLevel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Loader2, PlusCircle, Save } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BIKE_TYPES, PLACEHOLDER_NONE_VALUE, LAT_AM_LOCATIONS, RIDE_LEVELS } from '@/constants';

function ManageRidePageContent() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const rideId = params.rideId as string;
    const isCreating = rideId === 'create';

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<BikeRideFormValues>({
        resolver: zodResolver(bikeRideSchema),
        defaultValues: {
            title: '',
            description: '',
            rideDate: undefined,
            country: '',
            state: '',
            distance: 0,
            level: undefined,
            meetingPoint: '',
            meetingPointMapsLink: '',
            modality: undefined,
            cost: undefined,
        }
    });

    const watchedCountry = watch('country');

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'bikeshop') {
            toast({ title: "Acceso Denegado", description: "Debes ser una Tienda para gestionar eventos.", variant: "destructive" });
            router.push('/bikeshop/dashboard');
            return;
        }

        if (isCreating) {
            setIsLoading(false);
        } else {
            const fetchRide = async () => {
                try {
                    const ride = await getRideById(rideId);
                    if (!ride) {
                        toast({ title: "Error", description: "Evento no encontrado.", variant: "destructive" });
                        router.push('/bikeshop/dashboard');
                        return;
                    }
                    if (ride.organizerId !== user.uid) {
                        toast({ title: "Acceso Denegado", description: "No tienes permiso para editar este evento.", variant: "destructive" });
                        router.push('/bikeshop/dashboard');
                        return;
                    }
                    reset({
                        ...ride,
                        rideDate: new Date(ride.rideDate), // Convert ISO string back to Date for the calendar
                        modality: ride.modality || undefined,
                        cost: ride.cost || undefined,
                        level: ride.level || undefined,
                    });
                } catch (error: unknown) {
                    toast({ title: "Error", description: "No se pudo cargar el evento.", variant: "destructive" });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRide();
        }
    }, [user, authLoading, isCreating, rideId, router, toast, reset]);

    const onSubmit: SubmitHandler<BikeRideFormValues> = async (data) => {
        if (!user || user.role !== 'bikeshop') return;

        setIsSubmitting(true);
        try {
            await createOrUpdateRide(data, user, isCreating ? undefined : rideId);
            toast({
                title: isCreating ? "Evento Creado" : "Evento Actualizado",
                description: `El evento "${data.title}" ha sido guardado.`,
            });
            router.push('/bikeshop/dashboard');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar.";
            toast({ title: "Error al Guardar", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/bikeshop/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
            </Button>
            <Card className="max-w-2xl mx-auto shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline flex items-center">
                        {isCreating ? <PlusCircle className="mr-3 h-6 w-6 text-primary" /> : <Save className="mr-3 h-6 w-6 text-primary" />}
                        {isCreating ? 'Crear Nuevo Evento' : 'Editar Evento'}
                    </CardTitle>
                    <CardDescription>
                        {isCreating ? 'Completa los detalles para publicar un nuevo evento para tu tienda.' : 'Modifica los detalles del evento.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-1">
                            <Label htmlFor="title">Título del Evento</Label>
                            <Input id="title" {...register('title')} className={errors.title ? 'border-destructive' : ''} />
                            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" {...register('description')} className={errors.description ? 'border-destructive' : ''} rows={4} />
                            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                        </div>
                        
                        <div className="space-y-1">
                            <Label>Fecha y Hora del Evento</Label>
                            <Controller
                                name="rideDate"
                                control={control}
                                render={({ field }) => (
                                    <div className="grid grid-cols-2 gap-2 items-center">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground", errors.rideDate && "border-destructive")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige fecha</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                        const originalDate = field.value || new Date();
                                                        const newDate = date || originalDate;
                                                        newDate.setHours(originalDate.getHours());
                                                        newDate.setMinutes(originalDate.getMinutes());
                                                        field.onChange(newDate);
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Input
                                            type="time"
                                            value={field.value ? format(field.value, 'HH:mm') : ''}
                                            onChange={(e) => {
                                                const time = e.target.value;
                                                if (!time) return;
                                                const [hours, minutes] = time.split(':').map(Number);
                                                const newDate = field.value ? new Date(field.value) : new Date();
                                                if (!isNaN(hours) && !isNaN(minutes)) {
                                                    newDate.setHours(hours, minutes);
                                                    field.onChange(newDate);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            />
                            {errors.rideDate && <p className="text-xs text-destructive">{errors.rideDate.message}</p>}
                            <p className="text-xs text-muted-foreground pt-1">La hora se registrará en la zona horaria de tu navegador. Asegúrate de que coincida con la hora local del evento.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label htmlFor="distance">Distancia (km)</Label>
                                <Input id="distance" type="number" {...register('distance', {valueAsNumber: true})} className={errors.distance ? 'border-destructive' : ''} />
                                {errors.distance && <p className="text-xs text-destructive">{errors.distance.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="level">Nivel de Dificultad (Opcional)</Label>
                                <Controller
                                    name="level"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? undefined : value as RideLevel)}
                                            value={field.value || ''}
                                        >
                                            <SelectTrigger className={errors.level ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Selecciona un nivel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                                                {RIDE_LEVELS.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.level && <p className="text-xs text-destructive">{typeof errors.level.message === 'string' ? errors.level.message : 'Error en el nivel'}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1">
                                <Label htmlFor="country">País del Evento</Label>
                                <Controller
                                    name="country"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                setValue('state', ''); // Reset state
                                            }}
                                            value={field.value || ''}
                                        >
                                            <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Selecciona un país" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LAT_AM_LOCATIONS.map(c => <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="state">Estado/Provincia del Evento</Label>
                                <Controller
                                    name="state"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedCountry}>
                                            <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                                                <SelectValue placeholder={!watchedCountry ? "Selecciona país primero" : "Selecciona un estado"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LAT_AM_LOCATIONS.find(c => c.country === watchedCountry)?.states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label htmlFor="modality">Modalidad (Opcional)</Label>
                                <Controller
                                    name="modality"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? undefined : value as BikeType)}
                                            value={field.value || ''}
                                        >
                                            <SelectTrigger className={errors.modality ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Selecciona una modalidad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguna --</SelectItem>
                                                {BIKE_TYPES.map(bt => <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.modality && <p className="text-xs text-destructive">{errors.modality.message}</p>}
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="cost">Costo (MXN, si no aplica dejar en 0)</Label>
                                <Input id="cost" type="number" step="0.01" {...register('cost')} className={errors.cost ? 'border-destructive' : ''} placeholder="0.00"/>
                                {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="meetingPoint">Punto de Encuentro</Label>
                            <Input id="meetingPoint" {...register('meetingPoint')} className={errors.meetingPoint ? 'border-destructive' : ''} />
                            {errors.meetingPoint && <p className="text-xs text-destructive">{errors.meetingPoint.message}</p>}
                        </div>
                        
                        <div className="space-y-1">
                            <Label htmlFor="meetingPointMapsLink">Enlace de Google Maps (Opcional)</Label>
                            <Input id="meetingPointMapsLink" type="url" {...register('meetingPointMapsLink')} placeholder="https://maps.app.goo.gl/..." className={errors.meetingPointMapsLink ? 'border-destructive' : ''} />
                            {errors.meetingPointMapsLink && <p className="text-xs text-destructive">{errors.meetingPointMapsLink.message}</p>}
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCreating ? 'Crear Evento' : 'Guardar Cambios'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ManageRidePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <ManageRidePageContent />
        </Suspense>
    );
}
