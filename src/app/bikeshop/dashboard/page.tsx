
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Store, Bike, Search, PlusCircle, ClipboardList, LayoutGrid, Filter, Users, AlertTriangle, ArrowRightLeft, RefreshCw, Download, BarChart, CalendarIcon, Edit, Trash2, Share2, Calendar as CalendarIconLucid, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@/constants';
import { auth } from '@/lib/firebase';
import SearchBikeForm from '@/components/SearchBikeForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getShopAnalytics, getOrganizerRides, deleteRide } from '@/lib/db';
import type { ShopAnalyticsData, BikeRide } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; description?: string; isLoading?: boolean; }> = ({ title, value, icon, description, isLoading }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default function BikeShopDashboardPage() {
  const { user, loading: authLoading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [analyticsData, setAnalyticsData] = useState<ShopAnalyticsData | null>(null);
  const [rides, setRides] = useState<BikeRide[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [isRidesLoading, setIsRidesLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  const [rideToDelete, setRideToDelete] = useState<BikeRide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchDashboardData = useCallback(async () => {
    if (!user || user.role !== 'bikeshop') return;

    setIsAnalyticsLoading(true);
    setIsRidesLoading(true);
    try {
      const [analytics, shopRides] = await Promise.all([
        getShopAnalytics(user.uid, dateRange),
        getOrganizerRides(user.uid)
      ]);
      setAnalyticsData(analytics);
      setRides(shopRides);
    } catch (error) {
      console.error("Failed to fetch shop dashboard data:", error);
      toast({
        title: "Error al Cargar Datos",
        description: "No se pudieron obtener los datos de tu tienda.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyticsLoading(false);
      setIsRidesLoading(false);
    }
  }, [user, dateRange, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/bikeshop/auth');
      } else if (user.role !== 'bikeshop') {
        router.push(user.isAdmin ? '/admin' : '/dashboard');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, router, fetchDashboardData]);

  useEffect(() => {
    if (auth.currentUser) {
      refreshUserProfile();
    }
  }, [refreshUserProfile]);

  const handleApplyFilters = () => {
    fetchDashboardData();
  };
  
  const handleShareRideToWhatsApp = (ride: BikeRide) => {
    const formattedDate = format(new Date(ride.rideDate), "PPPP 'a las' p", { locale: es });

    const messageParts = [
      `¡Hola comunidad! 🚴‍♀️🚴‍♂️ Te invitamos a nuestro próximo evento desde ${user?.shopName || APP_NAME}:`,
      `*${ride.title}*`,
      `🗓️ *Fecha:* ${formattedDate}`,
      `📍 *Punto de encuentro:* ${ride.meetingPoint}`,
      ride.distance ? `📏 *Distancia:* ${ride.distance} km` : '',
      ride.modality ? `🚴 *Modalidad:* ${ride.modality}` : '',
      `💰 *Costo:* ${ride.cost && ride.cost > 0 ? `$${ride.cost.toFixed(2)} MXN` : 'Gratuito'}`,
    ];
    
    if (user?.whatsappGroupLink) {
        messageParts.push('');
        messageParts.push(`Para más detalles y unirte a nuestro grupo de WhatsApp: ${user.whatsappGroupLink}`);
    }

    if (ride.meetingPointMapsLink) {
        messageParts.push(`Ver mapa: ${ride.meetingPointMapsLink}`);
    }

    const message = messageParts.filter(part => part !== '').join('\n');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    toast({
        title: "Listo para compartir",
        description: "Se está abriendo WhatsApp para que envíes el mensaje a tu grupo.",
    });
  };

  const handleDeleteRide = async () => {
    if (!rideToDelete || !user) return;
    setIsDeleting(true);
    try {
      await deleteRide(rideToDelete.id, user.uid);
      toast({
        title: "Evento Eliminado",
        description: `El evento "${rideToDelete.title}" ha sido eliminado.`,
      });
      fetchDashboardData(); // Refresh the list
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar.";
      toast({
        title: "Error al Eliminar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setRideToDelete(null);
    }
  };


  if (authLoading || !user || user.role !== 'bikeshop') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando portal de tienda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold flex items-center">
            <Store className="mr-3 h-8 w-8 text-primary" />
            Portal de Tienda: {user.shopName || user.firstName || user.email}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Administra las bicicletas que registras y visualiza tus estadísticas.
          </p>
        </div>
        <div className="flex justify-start sm:justify-end">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/bikeshop/profile/edit" passHref className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                <UserCircle className="mr-2 h-5 w-5" />
                Editar Perfil
              </Button>
            </Link>
          </div>
        </div>
      </div>

       <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Acciones Rápidas</TabsTrigger>
          <TabsTrigger value="rides">Mis Eventos ({rides.length})</TabsTrigger>
          <TabsTrigger value="analytics">Mis Estadísticas</TabsTrigger>
        </TabsList>
        <TabsContent value="actions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <PlusCircle className="mr-2 h-6 w-6 text-primary" />
                  Registrar Bici Vendida
                </CardTitle>
                <CardDescription>
                  Registra una nueva bicicleta y asígnala a un cliente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/bikeshop/register-sold-bike" passHref>
                  <Button className="w-full">
                    Registrar Bici
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <ClipboardList className="mr-2 h-6 w-6 text-primary" />
                  Bicicletas Registradas
                </CardTitle>
                <CardDescription>
                  Visualiza las bicicletas registradas por tu tienda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/bikeshop/inventory" passHref>
                  <Button className="w-full">
                    Ver Bicicletas Registradas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Search className="mr-2 h-6 w-6 text-primary" />
                  Verificar Estado de Bici
                </CardTitle>
                <CardDescription>
                  Consulta el estado de una bicicleta por su número de serie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SearchBikeForm />
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Verifica si una bicicleta está reportada como robada.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="rides" className="mt-6">
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Gestionar Eventos</CardTitle>
                        <CardDescription>Crea, edita o elimina los eventos de tu tienda.</CardDescription>
                    </div>
                    <div className="pt-4">
                        <Link href="/bikeshop/rides/create" passHref>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Nuevo Evento
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {isRidesLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : rides.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">Aún no has creado ningún evento.</p>
                    ) : (
                        <div className="space-y-4">
                            {rides.map(ride => (
                                <Card key={ride.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">{ride.title}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <CalendarIconLucid className="h-4 w-4"/>
                                            {format(new Date(ride.rideDate), "PPPP 'a las' p", { locale: es })}
                                            {isPast(new Date(ride.rideDate)) && <span className="text-xs font-bold text-destructive">(Pasada)</span>}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{ride.description}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 self-stretch sm:self-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="w-full sm:w-auto">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleShareRideToWhatsApp(ride)}
                                                            disabled={!user?.whatsappGroupLink}
                                                            className="w-full"
                                                        >
                                                            <Share2 className="mr-2 h-4 w-4"/> Compartir
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                {!user?.whatsappGroupLink && (
                                                    <TooltipContent>
                                                        <p>Añade el enlace de tu grupo en tu perfil para activarlo.</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                        <Link href={`/bikeshop/rides/${ride.id}`} passHref className="w-full sm:w-auto">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="mr-2 h-4 w-4"/> Editar
                                            </Button>
                                        </Link>
                                        <Button variant="destructive" size="sm" onClick={() => setRideToDelete(ride)} className="w-full sm:w-auto">
                                            <Trash2 className="mr-2 h-4 w-4"/> Eliminar
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <Card className="max-w-5xl mx-auto shadow-lg">
             <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <LayoutGrid className="mr-3 h-7 w-7 text-primary"/> Estadísticas de la Tienda
              </CardTitle>
              <CardDescription>Visualiza métricas clave de tu actividad en la aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Card className="p-4 sm:p-6">
                <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl flex items-center"><Filter className="mr-2 h-5 w-5"/> Filtros</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="dateRangeStart" className="text-sm">Rango de Fechas</Label>
                            <div className="flex gap-2 items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                                        disabled={isAnalyticsLoading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? format(dateRange.from, "PPP", { locale: es }) : <span>Fecha Inicio</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(day) => setDateRange(prev => ({...prev, from: day}))}
                                        initialFocus
                                        disabled={isAnalyticsLoading}
                                    />
                                    </PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                                        disabled={isAnalyticsLoading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "PPP", { locale: es }) : <span>Fecha Fin</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(day) => setDateRange(prev => ({...prev, to: day}))}
                                        disabled={(date) => (isAnalyticsLoading || (dateRange.from && date < dateRange.from)) || false}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleApplyFilters} disabled={isAnalyticsLoading}>
                            {isAnalyticsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Actualizar
                        </Button>
                         <Button variant="outline" disabled>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar CSV (Próximamente)
                        </Button>
                    </div>
                </CardContent>
              </Card>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard title="Bicis Registradas por Tienda" value={analyticsData?.totalBikesByShop ?? 0} icon={<Bike className="h-7 w-7 text-primary"/>} description="Total de bicis registradas por ti." isLoading={isAnalyticsLoading}/>
                <StatCard title="Usuarios Registrados por Tienda" value={analyticsData?.totalUsersByShop ?? 0} icon={<Users className="h-7 w-7 text-primary"/>} description="Total de clientes registrados por ti." isLoading={isAnalyticsLoading}/>
                <StatCard title="Reportes de Robo (Tus Clientes)" value={analyticsData?.stolenBikes ?? 0} icon={<AlertTriangle className="h-7 w-7 text-destructive"/>} description="Bicis de tus clientes marcadas como robadas." isLoading={isAnalyticsLoading}/>
                <StatCard title="Transferencias (Tus Clientes)" value={analyticsData?.transferredBikes ?? 0} icon={<ArrowRightLeft className="h-7 w-7 text-green-600"/>} description="Transferencias de propiedad de tus clientes." isLoading={isAnalyticsLoading}/>
              </div>

               <Card className="p-4 sm:p-6 text-center">
                <CardHeader className="p-0 pb-4">
                     <CardTitle className="text-xl flex items-center justify-center"><BarChart className="mr-2 h-6 w-6 text-primary"/> Gráficas de Actividad</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Visualizaciones de datos próximamente.</p>
                    </div>
                </CardContent>
              </Card>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={!!rideToDelete} onOpenChange={(open) => !open && setRideToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de eliminar este evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                       Esta acción es irreversible. Se eliminará permanentemente el evento: <strong className="break-all">{rideToDelete?.title}</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={() => setRideToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRide} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Sí, eliminar evento
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
