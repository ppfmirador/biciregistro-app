
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMyBikes, getUserTransferRequests } from '@/lib/db';
import { getFunctions, httpsCallable, type FunctionsError } from 'firebase/functions';
import { app } from '@/lib/firebase';
import type { Bike, TransferRequest, ReportTheftDialogData } from '@/lib/types';
import BikeCard from '@/components/bike/BikeCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, CheckCircle, XCircle, RefreshCw, Bike as BikeIcon, UserCircle, Share2, MessageSquareText, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent as DialogContentCustom, DialogDescription as DialogDescriptionCustom, DialogHeader as DialogHeaderCustom, DialogTitle as DialogTitleCustom, DialogTrigger as DialogTriggerCustom, DialogFooter as DialogFooterCustom } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getHomepageContent } from '@/lib/homepageContent';
import { Skeleton } from '@/components/ui/skeleton';


type TransferAction = 'accepted' | 'rejected' | 'cancelled';

const translateActionForDisplay = (action: TransferAction | null): string => {
  if (!action) return '';
  switch (action) {
    case 'accepted': return 'aceptada';
    case 'rejected': return 'rechazada';
    case 'cancelled': return 'cancelada';
    default: return action;
  }
};

const translateActionForConfirmation = (action: TransferAction | null): string => {
  if (!action) return '';
  switch (action) {
    case 'accepted': return 'aceptar';
    case 'rejected': return 'rechazar';
    case 'cancelled': return 'cancelar';
    default: return action;
  }
}

const translateStatusBadge = (status: TransferAction): string => {
    switch (status) {
        case 'accepted': return 'Aceptada';
        case 'rejected': return 'Rechazada';
        case 'cancelled': return 'Cancelada';
        default: return status;
    }
}


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [friendPhoneNumber, setFriendPhoneNumber] = useState('');
  const [referralMessageTemplate, setReferralMessageTemplate] = useState('');
  const [isFetchingReferralMessage, setIsFetchingReferralMessage] = useState(true);


  const fetchData = useCallback(async () => {
    if (user && !user.isAnonymous) {
      setIsLoading(true);
      setIsFetchingReferralMessage(true);
      try {
        const [userBikesResult, userRequests, homepageContent] = await Promise.all([
          getMyBikes(),
          getUserTransferRequests(),
          getHomepageContent(),
        ]);
        setBikes(userBikesResult);
        setTransferRequests(userRequests);

        if (homepageContent?.referralMessage) {
          setReferralMessageTemplate(homepageContent.referralMessage);
        } else {
          setReferralMessageTemplate(`¡Hola! Te invito a unirte a BiciRegistro, una plataforma para registrar tu bicicleta y ayudar a la comunidad ciclista. ¡Es gratis! Regístrate aquí: [APP_LINK]`);
        }

      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los datos del panel.', variant: 'destructive' });
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
        setIsFetchingReferralMessage(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.isAnonymous) {
        router.push('/auth');
        toast({ title: "Acceso Denegado", description: "Por favor, inicia sesión para ver tu panel.", variant: "destructive" });
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'bikeshop') {
        router.push('/bikeshop/dashboard');
      } else if (user.role === 'ngo') {
        router.push('/ngo/dashboard');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData, toast]);

  const handleReportTheft = async (bikeId: string, theftData: ReportTheftDialogData) => {
    try {
        const functions = getFunctions(app, 'us-central1');
        const reportBikeStolenCallable = httpsCallable<
            { bikeId: string; theftData: ReportTheftDialogData },
            { success: boolean }
        >(functions, 'reportBikeStolen');
        
        await reportBikeStolenCallable({ bikeId, theftData });
        toast({ title: 'Bicicleta Reportada como Robada', description: 'El estado de la bicicleta ha sido actualizado con los nuevos detalles.' });
        fetchData();
    } catch (error: unknown) {
        const err = error as FunctionsError;
        toast({ title: 'Error al Reportar Robo', description: err.message || 'No se pudo reportar la bicicleta como robada.', variant: 'destructive' });
    }
  };

  const handleInitiateTransfer = async (
    bikeId: string,
    recipientEmail: string,
    transferDocumentUrl?: string | null,
    transferDocumentName?: string | null
  ) => {
    if (!user) return;
    try {
        const functions = getFunctions(app, 'us-central1');
        const initiateTransferCallable = httpsCallable<{
            bikeId: string;
            recipientEmail: string;
            transferDocumentUrl?: string | null;
            transferDocumentName?: string | null;
        }, { success: boolean }>(functions, 'initiateTransferRequest');

        await initiateTransferCallable({
            bikeId,
            recipientEmail,
            transferDocumentUrl,
            transferDocumentName,
        });

      toast({ title: 'Transferencia Iniciada', description: `Solicitud enviada a ${recipientEmail}.` });
      fetchData();
    } catch (error: unknown) {
      const err = error as FunctionsError;
      toast({ title: 'Error al Iniciar Transferencia', description: err.message || 'No se pudo iniciar la transferencia.', variant: 'destructive' });
    }
  };

  const handleRespondToTransfer = async (requestId: string, action: TransferAction) => {
    if (!user) return;
    try {
        const functions = getFunctions(app, 'us-central1');
        const respondToTransferCallable = httpsCallable<{
            requestId: string;
            action: TransferAction;
        }, { success: boolean }>(functions, 'respondToTransferRequest');
        await respondToTransferCallable({ requestId, action });
        toast({title: 'Transferencia Respondida', description: `La solicitud ha sido ${translateActionForDisplay(action)}.`});
        fetchData();
    } catch (error: unknown)
    {
        const err = error as FunctionsError;
        toast({title: 'Error al Responder a Transferencia', description: err.message || 'No se pudo responder a la transferencia.', variant: 'destructive'});
    }
  };

  const handleSendReferral = () => {
    if (!user?.uid) return;
    if (!friendPhoneNumber.trim()) {
      toast({ title: "Número Requerido", description: "Por favor, ingresa el número de WhatsApp.", variant: "destructive" });
      return;
    }

    const processedPhoneNumber = friendPhoneNumber.trim();
    let finalPhoneNumberForApi = '';

    if (processedPhoneNumber.startsWith('+')) {
        finalPhoneNumberForApi = '+' + processedPhoneNumber.substring(1).replace(/\D/g, '');
    } else {
        const digitsOnly = processedPhoneNumber.replace(/\D/g, '');
        if (digitsOnly.length === 10) { 
            finalPhoneNumberForApi = `52${digitsOnly}`; 
        } else {
            toast({
                title: "Formato de Número Inválido",
                description: "Si es un número mexicano, ingresa los 10 dígitos. Para números internacionales, asegúrate de incluir el signo '+' y el código de país.",
                variant: "destructive",
                duration: 8000
            });
            return;
        }
    }

    const numericPartOfFinal = finalPhoneNumberForApi.startsWith('+') ? finalPhoneNumberForApi.substring(1) : finalPhoneNumberForApi;
    if (!/^\d{10,15}$/.test(numericPartOfFinal)) { 
         toast({
            title: "Número Inválido",
            description: "El número de teléfono no parece tener un formato válido después del procesamiento. Revisa el número e inténtalo de nuevo.",
            variant: "destructive",
            duration: 7000
        });
        return;
    }
    
    const referralLink = `${window.location.origin}/auth?mode=signup&ref=${user.uid}`;
    const message = referralMessageTemplate.replace(/\[APP_LINK\]/g, referralLink);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${finalPhoneNumberForApi}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    setFriendPhoneNumber('');
    setReferralDialogOpen(false);
    toast({ title: "¡Listo!", description: "Se está abriendo WhatsApp para enviar tu invitación." });
  };

  const handleCopyReferralLink = () => {
    if (!user?.uid) return;
    const referralLink = `${window.location.origin}/auth?mode=signup&ref=${user.uid}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({ title: "¡Enlace copiado!", description: "Tu enlace de referido ha sido copiado al portapapeles." });
    }).catch(() => {
      toast({ title: "Error", description: "No se pudo copiar el enlace.", variant: "destructive" });
    });
  };


  if (authLoading || isLoading || isFetchingReferralMessage) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando panel...</p>
      </div>
    );
  }

  if (!user) {
    return <p>Redirigiendo a inicio de sesión...</p>;
  }

  const incomingRequests = transferRequests.filter(
    req => req.toUserEmail && req.toUserEmail.toLowerCase() === user.email?.toLowerCase() && req.status === 'pending'
  );
  const outgoingRequests = transferRequests.filter(req => req.fromOwnerId === user.uid && req.status === 'pending');
  const resolvedRequests = transferRequests.filter(req => req.status !== 'pending');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        {/* Text Block */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold">
            {user?.firstName ? `¡Hola ${user.firstName}!` : 'Tu Panel'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Administra tus bicicletas y solicitudes de transferencia.</p>
           {user && (typeof user.referralCount === 'number') && (
            <Badge variant="secondary" className="mt-2 text-sm">
              Amigos invitados: {user.referralCount}
            </Badge>
          )}
        </div>

        {/* Buttons Block */}
        <div className="flex justify-start sm:justify-end">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Button variant="outline" onClick={handleCopyReferralLink} className="w-full sm:w-auto">
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Obtener mi enlace
            </Button>
            <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
              <DialogTriggerCustom asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Share2 className="mr-2 h-5 w-5" />
                  Invitar Amigos
                </Button>
              </DialogTriggerCustom>
               <DialogContentCustom className="sm:max-w-md">
                <DialogHeaderCustom>
                  <DialogTitleCustom>Invitar un Amigo a BiciRegistro</DialogTitleCustom>
                  <DialogDescriptionCustom>
                    Ingresa el número de WhatsApp de tu amigo para enviarle una invitación. El mensaje incluirá tu enlace de referido personal.
                  </DialogDescriptionCustom>
                </DialogHeaderCustom>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="friendPhone">Número de WhatsApp</Label>
                    <Input
                      id="friendPhone"
                      value={friendPhoneNumber}
                      onChange={(e) => setFriendPhoneNumber(e.target.value)}
                      placeholder="Ej: 5512345678 o +12345678900"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Al hacer clic en &quot;Enviar Invitación&quot;, se abrirá WhatsApp con un mensaje predefinido que incluye tu enlace de referido personal.
                  </p>
                </div>
                <DialogFooterCustom>
                  <Button variant="outline" onClick={() => setReferralDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSendReferral}>
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Enviar Invitación
                  </Button>
                </DialogFooterCustom>
              </DialogContentCustom>
            </Dialog>

            <Link href="/profile/edit" passHref className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                <UserCircle className="mr-2 h-5 w-5" />
                Editar Perfil
              </Button>
            </Link>
            <Link href="/register-bike" passHref className="w-full sm:w-auto">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-5 w-5" />
                Registrar Bici
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bikes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bikes">Mis Bicis ({bikes.length})</TabsTrigger>
          <TabsTrigger value="transfers">Solicitudes ({incomingRequests.length + outgoingRequests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="bikes" className="mt-6">
          {bikes.length === 0 ? (
            <Card className="text-center py-12 shadow-md">
              <CardHeader>
                 <BikeIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="text-xl sm:text-2xl">Aún No Hay Bicis Registradas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-6 text-sm sm:text-base">
                  Comienza agregando tu bicicleta al registro de BiciRegistro.
                </CardDescription>
                <Link href="/register-bike" passHref>
                  <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Registra Tu Primera Bici
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bikes.map((bike) => (
                <BikeCard
                  key={bike.id}
                  bike={bike}
                  onReportTheft={handleReportTheft}
                  onInitiateTransfer={handleInitiateTransfer}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="transfers" className="mt-6 space-y-6">
          <TransferRequestsSection
            title="Solicitudes Entrantes"
            requests={incomingRequests}
            onRespond={handleRespondToTransfer}
            isRecipient={true}
          />
          <TransferRequestsSection
            title="Solicitudes Salientes"
            requests={outgoingRequests}
            onRespond={handleRespondToTransfer}
            isRecipient={false}
          />
           <TransferRequestsSection
            title="Solicitudes Resueltas"
            requests={resolvedRequests}
            isRecipient={false}
            isResolvedList={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TransferRequestsSectionProps {
  title: string;
  requests: TransferRequest[];
  onRespond?: (requestId: string, action: TransferAction) => Promise<void>;
  isRecipient: boolean;
  isResolvedList?: boolean;
}

const TransferRequestsSection: React.FC<TransferRequestsSectionProps> = ({ title, requests, onRespond, isRecipient, isResolvedList = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TransferRequest | null>(null);
  const [currentAction, setCurrentAction] = useState<TransferAction | null>(null);
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const openConfirmationDialog = (request: TransferRequest, action: TransferAction) => {
    setCurrentRequest(request);
    setCurrentAction(action);
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (currentRequest && currentAction && onRespond) {
      await onRespond(currentRequest.id, currentAction);
    }
    setDialogOpen(false);
    setCurrentRequest(null);
    setCurrentAction(null);
  };

  if (requests.length === 0 && !isResolvedList) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm sm:text-base">No hay {title.toLowerCase()} por el momento.</p>
        </CardContent>
      </Card>
    );
  }
  if (requests.length === 0 && isResolvedList) {
     return null;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {requests.map(req => (
            <li key={req.id} className="p-3 sm:p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex-grow">
                <p className="font-semibold text-sm sm:text-base">
                  Bicicleta: {req.bikeBrand || 'N/A'} {req.bikeModel || 'N/A'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  N/S: <Link href={`/bike/${req.serialNumber}`} className="text-primary hover:underline">{req.serialNumber}</Link>
                </p>
                {isRecipient && !isResolvedList && <p className="text-xs sm:text-sm text-muted-foreground">De: {req.fromOwnerId === user?.uid ? "Tú" : (req.fromOwnerEmail || "Usuario Desconocido")}</p>}
                {!isRecipient && !isResolvedList && <p className="text-xs sm:text-sm text-muted-foreground">Para: {req.toUserEmail}</p>}
                {isResolvedList && (
                  <>
                     <p className="text-xs sm:text-sm text-muted-foreground">De: {req.fromOwnerId === user?.uid ? "Tú" : (req.fromOwnerEmail || "Usuario Desconocido")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Para: {req.toUserEmail}</p>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  {isResolvedList ? "Resuelta" : "Solicitada"}: {isClient ? formatDistanceToNow(new Date(isResolvedList && req.resolutionDate ? req.resolutionDate : req.requestDate), { addSuffix: true, locale: es }) : <Skeleton className="h-4 w-20 inline-block" />}
                </p>
                {isResolvedList && req.status !== 'pending' && (
                  <Badge variant={
                    req.status === 'accepted' ? 'default' :
                    req.status === 'rejected' ? 'destructive' :
                    'secondary'
                  } className={`mt-1 capitalize text-xs ${req.status === 'accepted' ? 'bg-green-500' : ''}`}>
                    {translateStatusBadge(req.status as TransferAction)}
                  </Badge>
                )}
              </div>
              {!isResolvedList && onRespond && (
                <div className="flex gap-2 mt-2 sm:mt-0 self-end sm:self-center flex-shrink-0 flex-wrap justify-end">
                  {isRecipient ? (
                    <>
                      <Button size="sm" variant="default" onClick={() => openConfirmationDialog(req, 'accepted')} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                        <CheckCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Aceptar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openConfirmationDialog(req, 'rejected')} className="text-xs sm:text-sm">
                        <XCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Rechazar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => openConfirmationDialog(req, 'cancelled')} className="text-xs sm:text-sm">
                       <RefreshCw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                       <span className="hidden sm:inline">Cancelar Solicitud</span>
                       <span className="sm:hidden">Cancelar</span>
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
         <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Estás seguro de que quieres {translateActionForConfirmation(currentAction)} esta solicitud de transferencia para la bici {currentRequest?.bikeBrand} {currentRequest?.bikeModel} (N/S: {currentRequest?.serialNumber})?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAction} className={
                    currentAction === 'accepted' ? "bg-green-600 hover:bg-green-700" :
                    currentAction === 'rejected' ? "bg-destructive hover:bg-destructive/90" :
                    ""
                }>
                    Confirmar {currentAction ? translateActionForConfirmation(currentAction).replace(/^\w/, c => c.toUpperCase()) : ''}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
