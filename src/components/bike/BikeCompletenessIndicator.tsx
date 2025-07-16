
"use client";

import type { Bike } from '@/lib/types';
import { calculateBikeCompleteness } from '@/lib/bikeUtils';
import { Progress } from '@/components/ui/progress';

interface BikeCompletenessIndicatorProps {
  bike: Bike | null;
  className?: string;
}

const BikeCompletenessIndicator: React.FC<BikeCompletenessIndicatorProps> = ({ bike, className }) => {
  if (!bike) return null;

  const completeness = calculateBikeCompleteness(bike);

  let progressColor = 'bg-primary'; // Default blue
  if (completeness < 30) {
    progressColor = 'bg-destructive'; // Red
  } else if (completeness < 70) {
    progressColor = 'bg-yellow-500'; // Yellow
  } else {
    progressColor = 'bg-green-500'; // Green
  }
  
  // Determine text for completeness stage
  let completenessText = "Información Básica";
  if (completeness >= 100) {
    completenessText = "Registro Completo";
  } else if (completeness >= 70) {
    completenessText = "Casi Completo";
  } else if (completeness >= 30) {
     completenessText = "Parcialmente Completo";
  }


  return (
    <div className={className}>
      <div className="mb-1 flex justify-between items-center">
        <p className="text-xs font-medium text-muted-foreground">
          Completitud del Registro:
        </p>
         <p className={`text-xs font-semibold ${
            completeness >= 70 ? 'text-green-600' : completeness >=30 ? 'text-yellow-600' : 'text-destructive'
         }`}>{completenessText} ({completeness}%)</p>
      </div>
      <Progress value={completeness} className="h-2" indicatorClassName={progressColor} />
       {completeness < 100 && (
        <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside space-y-0.5">
            {!(bike.serialNumber && bike.brand && bike.model) && <li>+30% por detalles básicos (N/S, Marca, Modelo).</li>}
            {!(bike.photoUrls && bike.photoUrls.filter(url => url && url.trim() !== '').length > 0) && <li>+30% por subir al menos una foto.</li>}
            {!(bike.ownershipDocumentUrl && bike.ownershipDocumentUrl.trim() !== '') && <li>+40% por subir documento de propiedad.</li>}
        </ul>
       )}
    </div>
  );
};

export default BikeCompletenessIndicator;

// Small monkey patch for Progress component to allow custom indicator color
declare module "@/components/ui/progress" {
  interface ProgressProps extends React.RefAttributes<HTMLDivElement> {
    indicatorClassName?: string;
  }
}
