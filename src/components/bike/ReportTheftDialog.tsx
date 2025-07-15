
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Using Input for consistency if needed, but Textarea for details
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Bike, ReportTheftDialogData } from '@/lib/types';
import { LAT_AM_LOCATIONS } from '@/constants';

interface ReportTheftDialogProps {
  bike: Bike;
  onReportTheft: (bikeId: string, theftData: ReportTheftDialogData) => Promise<void>;
  children: React.ReactNode; 
}

const ReportTheftDialog: React.FC<ReportTheftDialogProps> = ({ bike, onReportTheft, children }) => {
  const [theftLocationCountry, setTheftLocationCountry] = useState('');
  const [theftLocationState, setTheftLocationState] = useState('');
  const [theftPerpetratorDetails, setTheftPerpetratorDetails] = useState('');
  const [theftIncidentDetails, setTheftIncidentDetails] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setTheftLocationCountry('');
      setTheftLocationState('');
      setTheftPerpetratorDetails('');
      setTheftIncidentDetails('');
      setGeneralNotes('');
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (theftLocationState) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.theftLocationState;
            return newErrors;
        })
    }
  }, [theftLocationState]);

  useEffect(() => {
      setTheftLocationState('');
      if (theftLocationCountry) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.theftLocationCountry;
            return newErrors;
        })
      }
  }, [theftLocationCountry]);


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!theftLocationCountry) newErrors.theftLocationCountry = "El país es obligatorio.";
    if (!theftLocationState) newErrors.theftLocationState = "El estado/provincia es obligatorio.";
    if (!theftIncidentDetails.trim()) newErrors.theftIncidentDetails = "Los detalles del incidente son obligatorios.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const theftData: ReportTheftDialogData = {
      theftLocationCountry,
      theftLocationState,
      theftPerpetratorDetails: theftPerpetratorDetails.trim() || undefined,
      theftIncidentDetails: theftIncidentDetails.trim(),
      generalNotes: generalNotes.trim() || undefined,
    };
    await onReportTheft(bike.id, theftData);
    setIsLoading(false);
    setIsOpen(false); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Reportar Bicicleta Robada
          </DialogTitle>
          <DialogDescription>
            Reportar tu {bike.brand} {bike.model} (N/S: {bike.serialNumber}) como robada. Proporciona los detalles del incidente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="theftLocationCountry">País donde ocurrió el robo</Label>
            <Select value={theftLocationCountry} onValueChange={setTheftLocationCountry}>
                <SelectTrigger id="theftLocationCountry" className={errors.theftLocationCountry ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                    {LAT_AM_LOCATIONS.map(loc => (
                    <SelectItem key={loc.country} value={loc.country}>{loc.country}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {errors.theftLocationCountry && <p className="text-sm text-destructive">{errors.theftLocationCountry}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="theftLocationState">Estado/Provincia donde ocurrió el robo</Label>
            <Select value={theftLocationState} onValueChange={setTheftLocationState} disabled={!theftLocationCountry}>
              <SelectTrigger id="theftLocationState" className={errors.theftLocationState ? 'border-destructive' : ''}>
                <SelectValue placeholder={!theftLocationCountry ? "Selecciona un país primero" : "Selecciona un estado/provincia"} />
              </SelectTrigger>
              <SelectContent>
                {theftLocationCountry && LAT_AM_LOCATIONS.find(c => c.country === theftLocationCountry)?.states.map(stateName => (
                  <SelectItem key={stateName} value={stateName}>{stateName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.theftLocationState && <p className="text-sm text-destructive">{errors.theftLocationState}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="theftIncidentDetails">Detalles del incidente (Obligatorio)</Label>
            <Textarea
              id="theftIncidentDetails"
              value={theftIncidentDetails}
              onChange={(e) => setTheftIncidentDetails(e.target.value)}
              className={`min-h-[80px] ${errors.theftIncidentDetails ? 'border-destructive' : ''}`}
              placeholder="Describe cómo, cuándo y dónde ocurrió el robo, características específicas de la bici al momento del robo, etc."
            />
            {errors.theftIncidentDetails && <p className="text-sm text-destructive">{errors.theftIncidentDetails}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="theftPerpetratorDetails">Detalles del perpetrador (Opcional)</Label>
            <Textarea
              id="theftPerpetratorDetails"
              value={theftPerpetratorDetails}
              onChange={(e) => setTheftPerpetratorDetails(e.target.value)}
              className="min-h-[60px]"
              placeholder="Descripción del ladrón, vestimenta, vehículo utilizado, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="generalNotes">Notas generales adicionales (Opcional)</Label>
            <Textarea
              id="generalNotes"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="min-h-[60px]"
              placeholder="Número de reporte policial, información de contacto adicional, etc."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isLoading} variant="destructive">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reporte de Robo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTheftDialog;
