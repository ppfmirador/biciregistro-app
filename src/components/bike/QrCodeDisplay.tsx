
"use client";

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { SITE_URL } from '@/constants';
import type { Bike } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QrCodeDisplayProps {
  bike: Bike;
}

const QR_SIZE_PX = 512; // High resolution for quality downloads

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ bike }) => {
  const qrUrl = `${SITE_URL}/bike/${encodeURIComponent(bike.serialNumber)}`;
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const getCanvas = (): HTMLCanvasElement | null => {
    if (!canvasContainerRef.current) return null;
    return canvasContainerRef.current.querySelector('canvas');
  };

  const handleDownloadPng = () => {
    const canvas = getCanvas();
    if (!canvas) {
      toast({ title: "Error", description: "No se pudo generar el código QR para PNG.", variant: "destructive" });
      return;
    }
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `BiciRegistro-qr-${bike.serialNumber}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  const handleDownloadPdf = () => {
    const canvas = getCanvas();
    if (!canvas) {
        toast({ title: "Error", description: "No se pudo generar el código QR para el PDF.", variant: "destructive" });
        return;
    }

    const qrDataUrl = canvas.toDataURL('image/png');
    const doc = new jsPDF({
        unit: 'mm',
        format: [50, 100] // 5cm width, 10cm height
    });

    const primaryColor = '#3B82F6';
    const textColor = '#1E293B';
    const lightTextColor = '#64748B';
    const backgroundColor = '#FFFFFF';
    
    doc.setFillColor(backgroundColor);
    doc.rect(0, 0, 50, 100, 'F');
    
    // Add App Name as text instead of logo
    doc.setTextColor(primaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("BiciRegistro", 25, 15, { align: 'center' });

    doc.setTextColor(textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BICICLETA REGISTRADA', 25, 23, { align: 'center' });

    const qrCodeSize = 44;
    const qrCodeX = (50 - qrCodeSize) / 2;
    const qrCodeY = 28;
    doc.addImage(qrDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);

    const footerY = qrCodeY + qrCodeSize + 5;
    doc.setTextColor(lightTextColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('N/S:', 25, footerY, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('courier', 'bold');
    doc.setTextColor(textColor);
    doc.text(bike.serialNumber, 25, footerY + 4, { align: 'center' });

    doc.setTextColor(lightTextColor);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Verifica en: ${SITE_URL.replace('https://', '')}`, 25, 96, { align: 'center' });
    
    // Add a dotted border for cutting
    doc.setLineDashPattern([1, 1], 0); // 1mm dash, 1mm gap
    doc.setDrawColor(lightTextColor); // Use a light gray for the border
    doc.setLineWidth(0.2);
    doc.rect(2, 2, 46, 96, 'S'); // Draw rectangle with a 2mm margin

    doc.save(`etiqueta-qr-${bike.serialNumber}.pdf`);
};

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-white p-4">
      <div
        className="w-full max-w-[280px] rounded-md bg-white p-4 shadow-inner"
        ref={canvasContainerRef}
      >
        <QRCodeCanvas
          value={qrUrl}
          size={QR_SIZE_PX}
          level={'H'}
          style={{ height: 'auto', width: '100%' }}
          imageSettings={{
            src: '/biciregistro-logo.png',
            height: QR_SIZE_PX / 5,
            width: QR_SIZE_PX / 5,
            excavate: true,
          }}
        />
      </div>
      
      <p className="max-w-xs text-center text-xs text-muted-foreground">
         Escanear para verificar en BiciRegistro
      </p>

      <div className="mt-auto flex w-full flex-col gap-2 pt-4">
        <div className="flex w-full gap-2">
            <Button onClick={handleDownloadPng} variant="outline" className="flex-1">
              <ImageIcon className="mr-2 h-4 w-4" /> PNG
            </Button>
            {/* SVG download removed for now as it's not commonly needed and simplifies the component */}
        </div>
        <Button onClick={handleDownloadPdf} className="w-full">
          <FileText className="mr-2 h-4 w-4" /> PDF para Etiqueta
        </Button>
      </div>
    </div>
  );
};

export default QrCodeDisplay;
