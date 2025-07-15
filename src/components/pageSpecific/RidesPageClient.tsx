
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { BikeRide } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Milestone, Bike as BikeIcon, DollarSign, Globe, Signal, Filter, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { LAT_AM_LOCATIONS, BIKE_TYPES, RIDE_LEVELS } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface RidesPageClientProps {
  initialRides: BikeRide[];
}

const ALL_VALUE = "_all_"; // A unique value for "all" options

const RideCard = ({ ride, user }: { ride: BikeRide, user: ReturnType<typeof useAuth>['user'] }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle>{ride.title}</CardTitle>
        <CardDescription>Organizada por: <span className="font-semibold text-primary">{ride.organizerName}</span></CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{ride.description}</p>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {isClient ? (
              <span className="font-medium">{format(new Date(ride.rideDate), "EEEE, d 'de' MMMM, yyyy 'a las' p", { locale: es })}</span>
            ) : (
              <Skeleton className="h-4 w-48" />
            )}
          </div>
          {ride.state && ride.country && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Ubicación:</span> {ride.state}, {ride.country}</span>
            </div>
          )}
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-medium">Punto de encuentro:</span> {ride.meetingPoint}</span>
              </div>
              <div className="flex items-center gap-2">
                <Milestone className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-medium">Distancia:</span> {ride.distance} km</span>
              </div>
            </>
          ) : null}
          {ride.level && (
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Nivel:</span> {ride.level}</span>
            </div>
          )}
          {ride.modality && (
            <div className="flex items-center gap-2">
              <BikeIcon className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Modalidad:</span> {ride.modality}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span><span className="font-medium">Costo:</span> {ride.cost && ride.cost > 0 ? `$${ride.cost.toFixed(2)} MXN` : 'Gratuito'}</span>
          </div>
        </div>
      </CardContent>
      <div className="p-6 pt-0">
        {user ? (
          ride.meetingPointMapsLink && (
            <a href={ride.meetingPointMapsLink} target="_blank" rel="noopener noreferrer">
              <Button className="w-full">
                Ver en Google Maps
              </Button>
            </a>
          )
        ) : (
          <Link href="/auth?mode=signup" passHref>
            <Button className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Regístrate para ver detalles
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};

export default function RidesPageClient({ initialRides }: RidesPageClientProps) {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string>(ALL_VALUE);
  const [selectedState, setSelectedState] = useState<string>(ALL_VALUE);
  const [selectedModality, setSelectedModality] = useState<string>(ALL_VALUE);
  const [selectedLevel, setSelectedLevel] = useState<string>(ALL_VALUE);

  const availableStates = useMemo(() => {
    if (selectedCountry === ALL_VALUE) {
      return [];
    }
    return LAT_AM_LOCATIONS.find(loc => loc.country === selectedCountry)?.states || [];
  }, [selectedCountry]);

  const filteredRides = useMemo(() => {
    return initialRides.filter(ride => {
      const countryMatch = selectedCountry === ALL_VALUE || ride.country === selectedCountry;
      const stateMatch = selectedState === ALL_VALUE || ride.state === selectedState;
      const modalityMatch = selectedModality === ALL_VALUE || ride.modality === selectedModality;
      const levelMatch = selectedLevel === ALL_VALUE || ride.level === selectedLevel;
      return countryMatch && stateMatch && modalityMatch && levelMatch;
    });
  }, [initialRides, selectedCountry, selectedState, selectedModality, selectedLevel]);

  const handleClearFilters = () => {
    setSelectedCountry(ALL_VALUE);
    setSelectedState(ALL_VALUE);
    setSelectedModality(ALL_VALUE);
    setSelectedLevel(ALL_VALUE);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary">Próximos Eventos Seguros</h1>
        <p className="mt-2 text-lg text-muted-foreground">Encuentra y únete a los eventos organizados por ONGs y colectivos ciclistas.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5" /> Filtros</CardTitle>
          <CardDescription>Usa los filtros para encontrar el evento perfecto para ti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="country-filter">País</Label>
                    <Select value={selectedCountry} onValueChange={(value) => { setSelectedCountry(value); setSelectedState(ALL_VALUE); }}>
                        <SelectTrigger id="country-filter"><SelectValue placeholder="Todos los Países" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>Todos los Países</SelectItem>
                            {LAT_AM_LOCATIONS.map(loc => <SelectItem key={loc.country} value={loc.country}>{loc.country}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="state-filter">Estado/Provincia</Label>
                    <Select value={selectedState} onValueChange={setSelectedState} disabled={selectedCountry === ALL_VALUE}>
                        <SelectTrigger id="state-filter"><SelectValue placeholder="Todos los Estados" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>Todos los Estados</SelectItem>
                            {availableStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="modality-filter">Modalidad</Label>
                     <Select value={selectedModality} onValueChange={setSelectedModality}>
                        <SelectTrigger id="modality-filter"><SelectValue placeholder="Todas las Modalidades" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>Todas las Modalidades</SelectItem>
                            {BIKE_TYPES.filter(bt => bt.value).map(bt => <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="level-filter">Nivel</Label>
                     <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger id="level-filter"><SelectValue placeholder="Todos los Niveles" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>Todos los Niveles</SelectItem>
                            {RIDE_LEVELS.filter(level => level.value).map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button variant="ghost" onClick={handleClearFilters} className="text-sm">Limpiar Filtros</Button>
        </CardContent>
      </Card>

      {filteredRides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRides.map(ride => (
            <RideCard key={ride.id} ride={ride} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No hay eventos que coincidan con tus filtros</h2>
          <p className="text-muted-foreground mt-2">Intenta ajustar o limpiar los filtros para ver más eventos.</p>
        </div>
      )}
    </div>
  );
}
