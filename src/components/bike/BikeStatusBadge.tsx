
import type { BikeStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BIKE_STATUSES } from '@/constants';

interface BikeStatusBadgeProps {
  status: BikeStatus;
  className?: string;
}

const BikeStatusBadge: React.FC<BikeStatusBadgeProps> = ({ status, className }) => {
  let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'default';
  const statusText = status;

  switch (status) {
    case BIKE_STATUSES[0]: // En Regla
      return <Badge className={cn("bg-green-500 hover:bg-green-600 text-white", className)}>{statusText}</Badge>;
    case BIKE_STATUSES[1]: // Robada
      variant = 'destructive';
      break;
    case BIKE_STATUSES[2]: // Transferida
      variant = 'secondary'; 
      break;
    default:
      variant = 'outline';
      break;
  }

  return (
    <Badge variant={variant} className={cn(className)}>
      {statusText}
    </Badge>
  );
};

export default BikeStatusBadge;
