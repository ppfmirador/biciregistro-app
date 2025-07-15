
"use client";

import type { Bike, ReportTheftDialogData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import BikeStatusBadge from './BikeStatusBadge';
import BikeCompletenessIndicator from './BikeCompletenessIndicator';
import ReportTheftDialog from './ReportTheftDialog';
import TransferOwnershipDialog from './TransferOwnershipDialog';
import { AlertTriangle, ArrowRightLeft, Eye, Edit3, History, Image as ImageIcon, MoreVertical, QrCode } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogTrigger } from '@/components/ui/dialog'; 
import { BIKE_STATUSES } from '@/constants';

interface BikeCardProps {
  bike: Bike;
  onReportTheft: (bikeId: string, theftData: ReportTheftDialogData) => Promise<void>;
  onInitiateTransfer: (
    bikeId: string, 
    recipientEmail: string, 
    transferDocumentUrl?: string | null,
    transferDocumentName?: string | null
  ) => Promise<void>;
  onViewHistory?: (bike: Bike) => void; 
}

const BikeCard: React.FC<BikeCardProps> = ({ bike, onReportTheft, onInitiateTransfer, onViewHistory }) => {
  const isActionable = bike.status === BIKE_STATUSES[0]; 
  const displayPhotoUrl = bike.photoUrls && bike.photoUrls.filter(url => url).length > 0 
    ? bike.photoUrls.filter(url => url)[0] 
    : 'https://placehold.co/600x400.png';
  const numPhotos = bike.photoUrls?.filter(url => url).length || 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
      <CardHeader className="p-0 relative">
        <Image
          src={displayPhotoUrl}
          alt={`${bike.brand} ${bike.model}`}
          width={400}
          height={250}
          className="object-cover w-full aspect-video"
          data-ai-hint="bicycle side view"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; 
            target.src = 'https://placehold.co/600x400.png';
          }}
        />
        {numPhotos === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">Sin imagen</p>
            </div>
        )}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/40 p-1 rounded-md">
          <BikeStatusBadge status={bike.status} />
          {isActionable && (
            <TransferOwnershipDialog bike={bike} onInitiateTransfer={onInitiateTransfer}>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20 p-0.5">
                      <ArrowRightLeft className="h-4 w-4" />
                      <span className="sr-only">Transferir Propiedad</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-1 text-xs">
                    <p>Transferir</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TransferOwnershipDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow space-y-2">
        <div>
            <CardTitle className="text-base sm:text-lg font-headline mb-1">{bike.brand} {bike.model}</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mb-1">N/S: {bike.serialNumber}</CardDescription>
            <p className="text-xs text-muted-foreground">Registrada: {format(new Date(bike.registrationDate), "d MMM, yy", { locale: es })}</p>
            {bike.color && <p className="text-xs text-muted-foreground">Color: {bike.color}</p>}
            {bike.state && <p className="text-xs text-muted-foreground">Estado: {bike.state}</p>}
            {bike.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bike.description}</p>}
        </div>
        <BikeCompletenessIndicator bike={bike} className="pt-2" />
      </CardContent>
      <CardFooter className="p-3 sm:p-4 bg-muted/30 border-t">
        <div className="flex w-full justify-between items-center gap-2">
          <TooltipProvider>
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                  <Link href={`/bike/${bike.serialNumber}`}>
                    <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ver</span>
                     <span className="sm:hidden">Ver</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver Detalles Públicos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex gap-1 sm:gap-2">
          {isActionable && (
             <TooltipProvider delayDuration={100}>
              <Tooltip>
                <ReportTheftDialog bike={bike} onReportTheft={onReportTheft}>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm" className="text-xs sm:text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Reportar Robo</span>
                      <span className="inline sm:hidden">Robo</span>
                    </Button>
                  </TooltipTrigger>
                </ReportTheftDialog>
                <TooltipContent>
                  <p>Reportar esta bicicleta como robada</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Más acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/bike/${bike.serialNumber}/edit`} passHref>
                <DropdownMenuItem disabled={!(bike.status === BIKE_STATUSES[0] || bike.status === BIKE_STATUSES[1])}> 
                  <Edit3 className="mr-2 h-4 w-4" />
                  <span>Editar Detalles</span>
                </DropdownMenuItem>
              </Link>
              <Link href={`/bike/${bike.serialNumber}/qr`} passHref>
                <DropdownMenuItem>
                  <QrCode className="mr-2 h-4 w-4" />
                  <span>Gestionar Código QR</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              {isActionable && (
                <>
                  <TransferOwnershipDialog bike={bike} onInitiateTransfer={onInitiateTransfer}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      <span>Transferir Propiedad</span>
                    </DropdownMenuItem>
                  </TransferOwnershipDialog>
                  <ReportTheftDialog bike={bike} onReportTheft={onReportTheft}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      <span>Reportar Robo</span>
                    </DropdownMenuItem>
                  </ReportTheftDialog>
                </>
              )}
              {onViewHistory && (
                 <DropdownMenuItem onClick={() => onViewHistory(bike)}>
                  <History className="mr-2 h-4 w-4" />
                  <span>Ver Historial</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BikeCard;
