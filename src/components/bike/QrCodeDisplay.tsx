
"use client";

import React, { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Code, ShieldCheck } from 'lucide-react';
import { SITE_URL, APP_NAME } from '@/constants';
import type { Bike } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QrCodeDisplayProps {
  bike: Bike;
}

const QR_SIZE_PX = 512; // High resolution for quality downloads

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ bike }) => {
  const qrUrl = `${SITE_URL}/bike/${encodeURIComponent(bike.serialNumber)}`;
  const svgRef = useRef<SVGSVGElement | null>(null);
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
    downloadLink.download = `biciregistro-qr-${bike.serialNumber}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) {
        toast({ title: "Error", description: "No se pudo generar el código QR para SVG.", variant: "destructive" });
        return;
    }
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `biciregistro-qr-${bike.serialNumber}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };
  
  const handleDownloadPdf = () => {
    const canvas = getCanvas();
    if (!canvas) {
      toast({ title: "Error", description: "No se pudo generar el código QR para PDF.", variant: "destructive" });
      return;
    }
    
    const qrDataUrl = canvas.toDataURL('image/png');
    
    // Create a PDF with 50x100 mm dimensions (5cm x 10cm)
    const doc = new jsPDF({
        unit: 'mm',
        format: [50, 100] // width, height
    });

    const primaryColor = '#2563EB'; 
    const textColor = '#0A2540';
    const lightTextColor = '#57606a';
    const backgroundColor = '#F0F8FF';

    // --- PDF Design ---

    // 1. Background
    doc.setFillColor(backgroundColor);
    doc.rect(0, 0, 50, 100, 'F');

    // 2. Header Section
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 50, 22, 'F'); // Header rectangle

    // 3. Logo (if available, otherwise use Shield)
    // To add a real logo, you'd need it as a base64 string or image asset.
    // For now, let's draw a placeholder.
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(APP_NAME.toUpperCase(), 25, 8, { align: 'center' });


    // 4. "Bicicleta Registrada" Legend
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BICICLETA REGISTRADA', 25, 17, { align: 'center' });

    // 5. QR Code Section
    // Center the QR code, which will be square. Width of PDF is 50, so 44x44 gives 3mm margins.
    const qrCodeSize = 44;
    const qrCodeX = (50 - qrCodeSize) / 2; // = 3
    const qrCodeY = 25; // Position it below the header
    doc.addImage(qrDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);

    // 6. Footer Section
    const footerY = qrCodeY + qrCodeSize + 8;
    
    // Serial Number
    doc.setTextColor(textColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('NÚMERO DE SERIE:', 25, footerY, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('courier', 'bold'); // Monospaced for better readability
    doc.text(bike.serialNumber, 25, footerY + 4, { align: 'center' });
    
    // Website
    doc.setTextColor(lightTextColor);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Verifica en: ${SITE_URL}`, 25, 96, { align: 'center' });

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
      {/* Hidden SVG for SVG download logic */}
      <div style={{ display: 'none' }}>
        <QRCodeSVG value={qrUrl} size={QR_SIZE_PX} level={'H'} ref={svgRef} />
      </div>

      <p className="max-w-xs text-center text-xs text-muted-foreground">
         Escanear para verificar en {APP_NAME}
      </p>

      <div className="mt-auto flex w-full flex-col gap-2 pt-4 sm:flex-row">
        <Button onClick={handleDownloadPng} variant="outline" className="w-full">
          <ImageIcon className="mr-2 h-4 w-4" /> PNG
        </Button>
        <Button onClick={handleDownloadSvg} variant="outline" className="w-full">
          <Code className="mr-2 h-4 w-4" /> SVG
        </Button>
        <Button onClick={handleDownloadPdf} className="w-full">
          <FileText className="mr-2 h-4 w-4" /> PDF para Etiqueta
        </Button>
      </div>
    </div>
  );
};

export default QrCodeDisplay;
