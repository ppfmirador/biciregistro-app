"use client";

import React, { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Code } from 'lucide-react';
import { SITE_URL, APP_NAME } from '@/constants';
import type { Bike } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QrCodeDisplayProps {
  bike: Bike;
}

const QR_SIZE_PX = 512; // High resolution for quality downloads
const QR_TAG_TEXT = `Escanear para verificar en ${APP_NAME}`;

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ bike }) => {
  const qrUrl = `${SITE_URL}/bike/${encodeURIComponent(bike.serialNumber)}`;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const getCanvas = (): HTMLCanvasElement | null => {
    if (!canvasContainerRef.current) return null;
    // qrcode.react renders a canvas inside the div, so we find it.
    return canvasContainerRef.current.querySelector('canvas');
  };

  const handleDownloadPng = () => {
    const canvas = getCanvas();
    if (!canvas) {
      toast({ title: "Error", description: "No se pudo generar el código QR para PNG.", variant: "destructive" });
      return;
    }

    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    finalCanvas.width = QR_SIZE_PX;
    finalCanvas.height = QR_SIZE_PX + 40; // Add space for text

    // Fill background with white for non-transparent PNG
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Draw QR Code
    ctx.drawImage(canvas, 0, 0, QR_SIZE_PX, QR_SIZE_PX);

    // Add text
    ctx.fillStyle = 'black';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(QR_TAG_TEXT, finalCanvas.width / 2, QR_SIZE_PX + 25);

    const pngUrl = finalCanvas.toDataURL('image/png');
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

    // Create a new SVG element to wrap the QR and text
    const combinedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    combinedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    combinedSvg.setAttribute('viewBox', `0 0 ${QR_SIZE_PX} ${QR_SIZE_PX + 40}`);
    combinedSvg.setAttribute('width', '5cm');
    combinedSvg.setAttribute('height', '5.5cm'); // Approximate aspect ratio to keep proportions

    // Add a white background rectangle
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    combinedSvg.appendChild(background);

    // Clone the QR code SVG and add it
    const qrNode = svgRef.current.cloneNode(true) as SVGSVGElement;
    qrNode.setAttribute('x', '0');
    qrNode.setAttribute('y', '0');
    qrNode.setAttribute('width', String(QR_SIZE_PX));
    qrNode.setAttribute('height', String(QR_SIZE_PX));
    combinedSvg.appendChild(qrNode);
    
    // Add the text element
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', '50%');
    textElement.setAttribute('y', String(QR_SIZE_PX + 25));
    textElement.setAttribute('font-size', '20');
    textElement.setAttribute('font-family', 'sans-serif');
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('fill', 'black');
    textElement.textContent = QR_TAG_TEXT;
    combinedSvg.appendChild(textElement);
    
    const svgData = new XMLSerializer().serializeToString(combinedSvg);
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
    
    // Create a PDF with 50x55 mm dimensions
    const doc = new jsPDF({
        unit: 'mm',
        format: [50, 55] // width, height
    });
    
    // Add QR code image
    doc.addImage(qrDataUrl, 'PNG', 2.5, 2.5, 45, 45); // x, y, width, height

    // Add text
    doc.setFontSize(6);
    doc.text(QR_TAG_TEXT, 25, 51, { align: 'center' }); // x, y, options

    doc.save(`biciregistro-qr-${bike.serialNumber}.pdf`);
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
        {QR_TAG_TEXT}
      </p>

      <div className="mt-auto flex w-full flex-col gap-2 pt-4 sm:flex-row">
        <Button onClick={handleDownloadPng} variant="outline" className="w-full">
          <ImageIcon className="mr-2 h-4 w-4" /> PNG
        </Button>
        <Button onClick={handleDownloadSvg} variant="outline" className="w-full">
          <Code className="mr-2 h-4 w-4" /> SVG
        </Button>
        <Button onClick={handleDownloadPdf} className="w-full">
          <FileText className="mr-2 h-4 w-4" /> PDF
        </Button>
      </div>
    </div>
  );
};

export default QrCodeDisplay;
