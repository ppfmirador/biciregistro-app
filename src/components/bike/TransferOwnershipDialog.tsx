
"use client";

import { useState, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { ArrowRightLeft, Loader2, Paperclip } from 'lucide-react';
import type { Bike } from '@/lib/types';
import { APP_NAME } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { uploadFileToStorage } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { FirebaseError } from 'firebase/app';


interface TransferOwnershipDialogProps {
  bike: Bike;
  onInitiateTransfer: (
    bikeId: string, 
    recipientEmail: string,
    transferDocumentUrl?: string | null,
    transferDocumentName?: string | null
  ) => Promise<void>;
  children: React.ReactNode; 
}

const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({ bike, onInitiateTransfer, children }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [transferDocument, setTransferDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setTransferDocument(event.target.files[0]);
    } else {
      setTransferDocument(null);
    }
  };

  const handleSubmit = async () => {
    if (!recipientEmail || !user) {
      toast({ title: "Error", description: "El correo del destinatario es obligatorio.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    let uploadedDocUrl: string | null = null;
    let uploadedDocName: string | null = null;

    try {
      if (transferDocument) {
        const filePath = `transfer_documents/${bike.id}/${Date.now()}_${transferDocument.name}`;
        uploadedDocUrl = await uploadFileToStorage(transferDocument, filePath);
        uploadedDocName = transferDocument.name;
      }

      await onInitiateTransfer(bike.id, recipientEmail, uploadedDocUrl, uploadedDocName);
      
      setIsOpen(false); 
      setRecipientEmail(''); 
      setTransferDocument(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof FirebaseError ? error.message : "No se pudo procesar la transferencia.";
      toast({ title: 'Error en Transferencia', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) { // Reset state when dialog closes
        setRecipientEmail('');
        setTransferDocument(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ArrowRightLeft className="h-5 w-5 mr-2 text-primary" />
            Transferir Propiedad de Bicicleta
          </DialogTitle>
          <DialogDescription>
            Iniciar transferencia para: {bike.brand} {bike.model} (N/S: {bike.serialNumber}).
            Ingresa el correo del nuevo propietario. Debe tener una cuenta en {APP_NAME}.
            Opcionalmente, adjunta un documento de transferencia (ej. contrato).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Correo del Nuevo Propietario</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="destinatario@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transferDocumentFile" className="flex items-center">
                <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                Documento de Transferencia (Opcional)
            </Label>
            <Input
              id="transferDocumentFile"
              type="file"
              ref={fileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="text-sm"
            />
            {transferDocument && (
                <p className="text-xs text-muted-foreground mt-1">Archivo seleccionado: {transferDocument.name}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading || !recipientEmail}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Transferencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferOwnershipDialog;
