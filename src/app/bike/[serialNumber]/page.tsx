"use client";

import React, {
  useEffect,
  useState,
  useRef,
  Suspense,
  useCallback,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getBikeBySerialNumber,
  updateBike,
  getBikeById,
  markBikeRecovered,
} from "@/lib/db";
import type { Bike, StatusEntry } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BikeStatusBadge from "@/components/bike/BikeStatusBadge";
import BikeCompletenessIndicator from "@/components/bike/BikeCompletenessIndicator";
import {
  ArrowLeft,
  CalendarDays,
  Bike as BikeIcon,
  Tag,
  Palette,
  Info,
  ShieldAlert,
  History,
  Image as ImageIcon,
  UploadCloud,
  Edit,
  Trash2,
  Paperclip,
  Download,
  FileText,
  MapPin,
  CheckCircle,
  RefreshCw,
  Loader2,
  Cog,
  UserCircle,
  QrCode,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { uploadFileToStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { BIKE_STATUSES } from "@/constants";
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

function BikeDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const serialNumberFromParams = params.serialNumber;

  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [removingDocument, setRemovingDocument] = useState(false);
  const [markingRecovered, setMarkingRecovered] = useState(false);
  const [isRecoverConfirmationOpen, setIsRecoverConfirmationOpen] =
    useState(false);

  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Validate serialNumberFromParams early and memoize the valid one.
  const serialNumberParam = React.useMemo(() => {
    if (
      typeof serialNumberFromParams === "string" &&
      serialNumberFromParams.trim() !== ""
    ) {
      return serialNumberFromParams.trim();
    }
    if (
      Array.isArray(serialNumberFromParams) &&
      serialNumberFromParams.length > 0 &&
      typeof serialNumberFromParams[0] === "string" &&
      serialNumberFromParams[0].trim() !== ""
    ) {
      return serialNumberFromParams[0].trim();
    }
    return null;
  }, [serialNumberFromParams]);

  const fetchBike = useCallback(async () => {
    if (serialNumberParam) {
      setLoading(true);
      setPageError(null);
      try {
        const decodedSerial = decodeURIComponent(serialNumberParam);
        // Use the Cloud Function to get public details first.
        const bikeData = await getBikeBySerialNumber(decodedSerial);

        if (!bikeData) {
          setPageError("Bicicleta con este número de serie no encontrada.");
          setBike(null);
          setIsOwner(false);
          setLoading(false);
          return;
        }

        // If the user is logged in, check if they are the owner.
        const checkIsOwner = !!(
          bikeData &&
          user &&
          bikeData.ownerId === user.uid
        );
        setIsOwner(checkIsOwner);

        // If they are the owner, fetch the full, private details.
        if (checkIsOwner) {
          const fullBikeData = await getBikeById(bikeData.id);
          setBike(fullBikeData);
        } else {
          setBike(bikeData); // Set the public data for non-owners
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Error in fetchBike:", error);
        let message = "Error al obtener los detalles de la bicicleta.";
        if (error instanceof URIError) {
          message = "El número de serie en la URL tiene un formato inválido.";
        } else if (error.message) {
          message = error.message;
        }
        setPageError(message);
        toast({
          title: "Error de Carga",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setPageError("Número de serie no proporcionado o inválido en la URL.");
      setLoading(false);
    }
  }, [serialNumberParam, user, toast]); // user is a dependency for setIsOwner

  useEffect(() => {
    if (serialNumberParam) {
      fetchBike();
    }
  }, [serialNumberParam, user, authLoading, fetchBike]);

  // Early return if serialNumberParam is definitively null
  if (serialNumberParam === null && !loading) {
    return (
      <div className="text-center py-10">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error: Número de Serie Inválido</AlertTitle>
          <AlertDescription>
            El número de serie proporcionado en la URL no es válido o está
            ausente.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Búsqueda
        </Button>
      </div>
    );
  }

  const handleNextImage = () => {
    if (bike && bike.photoUrls && bike.photoUrls.length > 1) {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % bike.photoUrls!.length,
      );
    }
  };

  const handlePrevImage = () => {
    if (bike && bike.photoUrls && bike.photoUrls.length > 1) {
      setCurrentImageIndex(
        (prevIndex) =>
          (prevIndex - 1 + bike.photoUrls!.length) % bike.photoUrls!.length,
      );
    }
  };

  const handlePhotoFileChange = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (
      !event.target.files ||
      event.target.files.length === 0 ||
      !bike ||
      !user ||
      bike.ownerId !== user.uid
    ) {
      return;
    }
    const file = event.target.files[0];

    setUploadingPhoto((prev) => {
      const newUploading = [...prev];
      newUploading[index] = true;
      return newUploading;
    });

    try {
      const filePath = `bike_images/${bike.ownerId}/${bike.id}/photo_${index}_${Date.now()}_${file.name}`;
      const downloadURL = await uploadFileToStorage(file, filePath);

      const newPhotoUrls = [...(bike.photoUrls || [])];
      while (newPhotoUrls.length <= index) {
        newPhotoUrls.push("");
      }
      newPhotoUrls[index] = downloadURL;

      const finalPhotoUrls = newPhotoUrls.filter(
        (url) => url && url.trim() !== "",
      );

      await updateBike(bike.id, { photoUrls: finalPhotoUrls });
      toast({
        title: "Foto Actualizada",
        description: `La foto ${index + 1} ha sido actualizada.`,
      });
      fetchBike(); // Re-fetch bike data
    } catch (uploadError: unknown) {
      const error = uploadError as Error;
      console.error(`Error uploading photo ${index + 1}:`, error);
      toast({
        title: "Error al Subir Foto",
        description: error.message || `No se pudo subir la foto ${index + 1}.`,
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto((prev) => {
        const newUploading = [...prev];
        newUploading[index] = false;
        return newUploading;
      });
      if (fileInputRefs[index]?.current) {
        fileInputRefs[index].current!.value = "";
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (
      !bike ||
      !user ||
      bike.ownerId !== user.uid ||
      !bike.photoUrls ||
      !bike.photoUrls[index]
    ) {
      return;
    }
    setUploadingPhoto((prev) => {
      const newUploading = [...prev];
      newUploading[index] = true;
      return newUploading;
    });
    try {
      const currentPhotoUrls = bike.photoUrls || [];
      const newPhotoUrls = [...currentPhotoUrls];
      newPhotoUrls.splice(index, 1);

      await updateBike(bike.id, { photoUrls: newPhotoUrls });
      toast({
        title: "Foto Eliminada",
        description: `La foto ${index + 1} ha sido eliminada.`,
      });
      setCurrentImageIndex(0);
      fetchBike(); // Re-fetch bike data
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`Error removing photo ${index + 1}:`, error);
      toast({
        title: "Error al Eliminar Foto",
        description: err.message || `No se pudo eliminar la foto ${index + 1}.`,
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto((prev) => {
        const newUploading = [...prev];
        newUploading[index] = false;
        return newUploading;
      });
    }
  };

  const handleDocumentFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (
      !event.target.files ||
      event.target.files.length === 0 ||
      !bike ||
      !user ||
      bike.ownerId !== user.uid
    ) {
      return;
    }
    const file = event.target.files[0];
    setUploadingDocument(true);
    try {
      const filePath = `bike_documents/${bike.ownerId}/${bike.id}/${Date.now()}_${file.name}`;
      const downloadURL = await uploadFileToStorage(file, filePath);
      await updateBike(bike.id, {
        ownershipDocumentUrl: downloadURL,
        ownershipDocumentName: file.name,
      });
      toast({
        title: "Documento Subido",
        description: `El documento "${file.name}" ha sido subido.`,
      });
      fetchBike(); // Re-fetch bike data
    } catch (uploadError: unknown) {
      const error = uploadError as Error;
      console.error("Error uploading document:", error);
      toast({
        title: "Error al Subir Documento",
        description: error.message || "No se pudo subir el documento.",
        variant: "destructive",
      });
    } finally {
      setUploadingDocument(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
    }
  };

  const handleRemoveDocument = async () => {
    if (
      !bike ||
      !user ||
      bike.ownerId !== user.uid ||
      !bike.ownershipDocumentUrl
    ) {
      return;
    }
    setRemovingDocument(true);
    try {
      await updateBike(bike.id, {
        ownershipDocumentUrl: null,
        ownershipDocumentName: null,
      });
      toast({
        title: "Documento Eliminado",
        description:
          "El documento de propiedad ha sido eliminado del registro.",
      });
      fetchBike(); // Re-fetch bike data
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error removing document:", err);
      toast({
        title: "Error al Eliminar Documento",
        description: err.message || "No se pudo eliminar el documento.",
        variant: "destructive",
      });
    } finally {
      setRemovingDocument(false);
    }
  };

  const handleMarkAsRecovered = async () => {
    if (!bike || !user || !isOwner || bike.status !== BIKE_STATUSES[1]) return;
    setMarkingRecovered(true);
    try {
      await markBikeRecovered(bike.id);
      toast({
        title: "¡Bicicleta Recuperada!",
        description:
          'El estado de la bicicleta ha sido actualizado a "En Regla".',
      });
      fetchBike(); // Re-fetch bike data
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado.";
      toast({
        title: "Error al Marcar como Recuperada",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMarkingRecovered(false);
      setIsRecoverConfirmationOpen(false);
    }
  };

  if (authLoading || (loading && !bike && !pageError)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando detalles de la bicicleta...</p>
      </div>
    );
  }

  if (pageError && !loading) {
    // Only show pageError if not also loading
    return (
      <div className="text-center py-10">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Búsqueda
        </Button>
      </div>
    );
  }

  if (!bike && !loading && !pageError) {
    // Bike not found, but no specific error and not loading
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">
          Bicicleta no encontrada.
        </p>
        <Button onClick={() => router.push("/")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Búsqueda
        </Button>
      </div>
    );
  }

  // This should only be reached if bike is not null
  if (!bike) {
    // Fallback for safety, though above conditions should catch typical scenarios
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verificando datos...</p>
      </div>
    );
  }

  const displayPhotoUrl =
    bike.photoUrls &&
    bike.photoUrls.length > 0 &&
    bike.photoUrls[currentImageIndex]
      ? bike.photoUrls[currentImageIndex]
      : "https://placehold.co/600x400.png";
  const hasMultiplePhotos = bike.photoUrls && bike.photoUrls.length > 1;
  const numPhotos = bike.photoUrls?.filter((url) => url).length || 0;

  const cameFromHome = searchParams.get("from") === "home";
  let backButtonText = "Volver al Panel";
  let backButtonPath = "/dashboard";

  if (user) {
    if (user.isAdmin) {
      backButtonPath = "/admin";
      backButtonText = "Volver al Panel de Admin";
    } else if (user.role === "bikeshop") {
      backButtonPath = "/bikeshop/dashboard";
      backButtonText = "Volver al Panel de Tienda";
    }
  } else if (cameFromHome) {
    backButtonPath = "/";
    backButtonText = "Volver al Inicio";
  }

  const backButtonAction = () => router.push(backButtonPath);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-6">
        <Button
          variant="outline"
          onClick={backButtonAction}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {backButtonText}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isOwner && (
            <Link
              href={`/bike/${bike.serialNumber}/qr`}
              passHref
              className="w-full sm:w-auto"
            >
              <Button variant="outline" className="w-full">
                <QrCode className="mr-2 h-4 w-4" /> Gestionar QR
              </Button>
            </Link>
          )}
          {isOwner &&
            (bike.status === BIKE_STATUSES[0] ||
              bike.status === BIKE_STATUSES[1]) && (
              <Link
                href={`/bike/${bike.serialNumber}/edit`}
                passHref
                className="w-full sm:w-auto"
              >
                <Button variant="default" className="w-full">
                  <Edit className="mr-2 h-4 w-4" /> Editar Detalles
                </Button>
              </Link>
            )}
        </div>
      </div>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">
                {bike.brand} {bike.model}
              </CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Número de Serie: {bike.serialNumber}
              </CardDescription>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <BikeStatusBadge
                status={bike.status}
                className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold"
              />
              {isOwner && bike.status === BIKE_STATUSES[1] && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRecoverConfirmationOpen(true)}
                  disabled={markingRecovered}
                  className="bg-green-100 border-green-500 text-green-700 hover:bg-green-200 text-xs sm:text-sm"
                >
                  {markingRecovered ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Marcar como Recuperada
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 grid md:grid-cols-3 gap-6 sm:gap-8">
          <div className="md:col-span-1 relative">
            {loading && !pageError && !bike ? (
              <Skeleton className="w-full aspect-[3/2] rounded-lg" />
            ) : (
              <Image
                src={displayPhotoUrl}
                alt={`${bike.brand} ${bike.model} - Foto ${currentImageIndex + 1}`}
                width={600}
                height={400}
                className="rounded-lg shadow-md object-cover w-full aspect-[3/2]"
                data-ai-hint="bicycle side"
                priority={currentImageIndex === 0}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://placehold.co/600x400.png";
                }}
              />
            )}
            {hasMultiplePhotos && numPhotos > 0 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevImage}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 sm:h-auto sm:w-auto"
                  aria-label="Previous image"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextImage}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 sm:h-auto sm:w-auto"
                  aria-label="Next image"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </Button>
                {numPhotos > 0 && (
                  <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {currentImageIndex + 1} / {numPhotos}
                  </div>
                )}
              </>
            )}
            {(!bike.photoUrls || numPhotos === 0) && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg">
                <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  Sin imagen disponible
                </p>
              </div>
            )}
          </div>
          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 border-b pb-2">
              Detalles de la Bicicleta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <DetailItem
                icon={<BikeIcon className="h-5 w-5 text-primary" />}
                label="Marca"
                value={bike.brand}
              />
              <DetailItem
                icon={<Tag className="h-5 w-5 text-primary" />}
                label="Modelo"
                value={bike.model}
              />
              <DetailItem
                icon={<Cog className="h-5 w-5 text-primary" />}
                label="Tipo"
                value={bike.bikeType || "N/A"}
              />
              <DetailItem
                icon={<Palette className="h-5 w-5 text-primary" />}
                label="Color"
                value={bike.color || "N/A"}
              />
              <DetailItem
                icon={<MapPin className="h-5 w-5 text-primary" />}
                label="Estado Principal (México)"
                value={bike.state || "N/A"}
              />
              <DetailItem
                icon={<CalendarDays className="h-5 w-5 text-primary" />}
                label="Registrada el"
                value={format(new Date(bike.registrationDate), "PPP", {
                  locale: es,
                })}
              />
              <DetailItem
                icon={<UserCircle className="h-5 w-5 text-primary" />}
                label="Propietario Registrado"
                value={
                  bike.ownerFirstName || bike.ownerLastName
                    ? `${bike.ownerFirstName || ""} ${bike.ownerLastName || ""}`.trim()
                    : "(Nombre no proporcionado por el usuario)"
                }
                fullWidth
              />
            </div>
            {bike.description && (
              <DetailItem
                icon={<Info className="h-5 w-5 text-primary" />}
                label="Descripción"
                value={bike.description}
                fullWidth
              />
            )}

            {bike.status === BIKE_STATUSES[1] && (
              <Alert variant="destructive" className="mt-4">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>
                  ¡ESTA BICICLETA ESTÁ REPORTADA COMO ROBADA!
                </AlertTitle>
                <AlertDescription className="space-y-1 text-xs sm:text-sm">
                  <p>
                    Último cambio de estado:{" "}
                    {format(
                      new Date(
                        bike.statusHistory[
                          bike.statusHistory.length - 1
                        ].timestamp,
                      ),
                      "PPP p",
                      { locale: es },
                    )}
                  </p>
                  {bike.statusHistory[bike.statusHistory.length - 1].notes && (
                    <p className="text-xs">
                      Notas del reporte:{" "}
                      {bike.statusHistory[bike.statusHistory.length - 1].notes}
                    </p>
                  )}

                  {bike.theftDetails && (
                    <div className="mt-2 pt-2 border-t border-destructive/30 text-xs space-y-0.5">
                      <p>
                        <strong>Lugar del robo (Estado):</strong>{" "}
                        {bike.theftDetails.theftLocationState}
                      </p>
                      <p>
                        <strong>Detalles del incidente:</strong>{" "}
                        {bike.theftDetails.theftIncidentDetails}
                      </p>
                      {bike.theftDetails.theftPerpetratorDetails && (
                        <p>
                          <strong>Detalles del perpetrador:</strong>{" "}
                          {bike.theftDetails.theftPerpetratorDetails}
                        </p>
                      )}
                      <p>
                        <strong>Fecha del reporte:</strong>{" "}
                        {format(
                          new Date(bike.theftDetails.reportedAt),
                          "PPP p",
                          { locale: es },
                        )}
                      </p>
                    </div>
                  )}
                  <p className="mt-2 font-semibold">
                    Si tienes información, contacta a las autoridades.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>

        <Separator />
        <CardContent className="p-4 sm:p-6">
          <BikeCompletenessIndicator bike={bike} />
        </CardContent>

        {user &&
          user.role === "bikeshop" &&
          bike.ownerId &&
          (bike.ownerFirstName ||
            bike.ownerEmail ||
            bike.ownerWhatsappPhone) && (
            <>
              <Separator />
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                  <UserCircle className="h-5 w-5 text-primary mr-2" />
                  Información del Propietario (Visible para Tienda)
                </h3>
                <div className="space-y-2 text-sm">
                  {(bike.ownerFirstName || bike.ownerLastName) && (
                    <p>
                      <strong>Nombre:</strong> {bike.ownerFirstName || ""}{" "}
                      {bike.ownerLastName || ""}
                    </p>
                  )}
                  {bike.ownerEmail && (
                    <p>
                      <strong>Correo Electrónico:</strong>{" "}
                      <a
                        href={`mailto:${bike.ownerEmail}`}
                        className="text-primary hover:underline"
                      >
                        {bike.ownerEmail}
                      </a>
                    </p>
                  )}
                  {bike.ownerWhatsappPhone && (
                    <p>
                      <strong>Teléfono WhatsApp:</strong>{" "}
                      <a
                        href={`https://wa.me/${bike.ownerWhatsappPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {bike.ownerWhatsappPhone}
                      </a>
                    </p>
                  )}
                  {!bike.ownerFirstName &&
                    !bike.ownerLastName &&
                    !bike.ownerEmail &&
                    !bike.ownerWhatsappPhone && (
                      <p className="text-muted-foreground">
                        No hay información de contacto adicional disponible para
                        el propietario.
                      </p>
                    )}
                </div>
              </CardContent>
            </>
          )}

        {isOwner && (
          <>
            <Separator />
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center">
                  <ImageIcon className="h-5 w-5 text-primary mr-2" />
                  Administrar Fotos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <Card
                      key={`photo-manage-${index}`}
                      className="p-3 sm:p-4 space-y-2"
                    >
                      <p className="text-xs sm:text-sm font-medium text-center">
                        Foto {index + 1}
                      </p>
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                        {bike.photoUrls && bike.photoUrls[index] ? (
                          <Image
                            src={bike.photoUrls[index]}
                            alt={`Foto ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                const placeholderText =
                                  document.createElement("p");
                                placeholderText.textContent = "Error al cargar";
                                placeholderText.className =
                                  "text-xs text-destructive-foreground p-2";
                                parent.appendChild(placeholderText);
                              }
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                        )}
                      </div>
                      <Input
                        type="file"
                        id={`photo-upload-${index}`}
                        ref={fileInputRefs[index]}
                        accept="image/*"
                        onChange={(e) => handlePhotoFileChange(index, e)}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full text-xs sm:text-sm"
                        onClick={() => fileInputRefs[index]?.current?.click()}
                        disabled={uploadingPhoto[index]}
                      >
                        {uploadingPhoto[index]
                          ? "Subiendo..."
                          : bike.photoUrls && bike.photoUrls[index]
                            ? "Cambiar"
                            : "Agregar"}
                        {!uploadingPhoto[index] && (
                          <UploadCloud className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                      {bike.photoUrls && bike.photoUrls[index] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10 text-xs sm:text-sm"
                          onClick={() => handleRemovePhoto(index)}
                          disabled={uploadingPhoto[index]}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  Documento de Propiedad
                </h3>
                {bike.ownershipDocumentUrl && bike.ownershipDocumentName ? (
                  <Card className="p-3 sm:p-4 space-y-3 bg-muted/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium text-foreground flex items-center break-all">
                        <Paperclip className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        {bike.ownershipDocumentName}
                      </p>
                      <a
                        href={bike.ownershipDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={bike.ownershipDocumentName}
                        className="inline-flex items-center flex-shrink-0"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <Download className="mr-2 h-4 w-4" /> Descargar
                        </Button>
                      </a>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Button
                        variant="outline"
                        className="w-full text-xs sm:text-sm"
                        onClick={() => documentInputRef.current?.click()}
                        disabled={uploadingDocument || removingDocument}
                      >
                        {uploadingDocument ? "Subiendo..." : "Reemplazar"}
                        {!uploadingDocument && (
                          <UploadCloud className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10 text-xs sm:text-sm"
                        onClick={handleRemoveDocument}
                        disabled={removingDocument || uploadingDocument}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 text-center border-dashed">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      No se ha subido ningún documento de propiedad.
                    </p>
                    <Button
                      variant="default"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={uploadingDocument}
                      className="text-xs sm:text-sm"
                    >
                      {uploadingDocument ? "Subiendo..." : "Subir Documento"}
                      {!uploadingDocument && (
                        <UploadCloud className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </Card>
                )}
                <Input
                  type="file"
                  id="document-upload"
                  ref={documentInputRef}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleDocumentFileChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </>
        )}

        {bike.statusHistory && bike.statusHistory.length > 0 && (
          <>
            <Separator />
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center">
                <History className="h-5 w-5 text-primary mr-2" />
                Historial de Estado
              </h3>
              <ul className="space-y-3">
                {bike.statusHistory
                  .slice()
                  .reverse()
                  .map((entry: StatusEntry, histIndex: number) => (
                    <li
                      key={histIndex}
                      className="p-3 bg-muted/30 rounded-md border border-border/50 text-xs sm:text-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1 gap-1 sm:gap-0">
                        <BikeStatusBadge
                          status={entry.status}
                          className="self-start"
                        />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.timestamp), "PPP p", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-muted-foreground text-xs mt-1 italic break-words">
                          Notas: {entry.notes}
                        </p>
                      )}
                      {entry.status === BIKE_STATUSES[2] &&
                        entry.transferDocumentUrl &&
                        entry.transferDocumentName && (
                          <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                            <a
                              href={entry.transferDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={entry.transferDocumentName}
                              className="inline-flex items-center text-xs text-primary hover:underline break-all"
                            >
                              <Paperclip className="h-3 w-3 mr-1 flex-shrink-0" />
                              Documento de Transferencia:{" "}
                              {entry.transferDocumentName}
                            </a>
                          </div>
                        )}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </>
        )}
      </Card>

      <AlertDialog
        open={isRecoverConfirmationOpen}
        onOpenChange={setIsRecoverConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Recuperación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres marcar esta bicicleta ({bike.brand}{" "}
              {bike.model} - N/S: {bike.serialNumber}) como recuperada? Esto
              cambiará su estado a &quot;En Regla&quot; y eliminará los detalles
              del reporte de robo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markingRecovered}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsRecovered}
              disabled={markingRecovered}
              className="bg-green-600 hover:bg-green-700"
            >
              {markingRecovered && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sí, Marcar como Recuperada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}
const DetailItem: React.FC<DetailItemProps> = ({
  icon,
  label,
  value,
  fullWidth,
}) => (
  <div
    className={`flex items-start space-x-2 sm:space-x-3 ${fullWidth ? "col-span-1 sm:col-span-2" : ""}`}
  >
    <span className="mt-1 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <p className="text-sm sm:text-base text-foreground font-semibold break-words">
        {value}
      </p>
    </div>
  </div>
);

export default function BikeDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Cargando...</p>
        </div>
      }
    >
      <BikeDetailsPageContent />
    </Suspense>
  );
}
