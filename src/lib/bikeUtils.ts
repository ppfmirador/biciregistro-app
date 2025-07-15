
import type { Bike } from './types';

export const calculateBikeCompleteness = (bike: Bike | null): number => {
  if (!bike) return 0;

  let completeness = 0;

  // Rule 1: Bike form core details complete (30%)
  // serialNumber, brand, model are essential.
  if (bike.serialNumber && bike.brand && bike.model) {
    completeness += 30;
  }

  // Rule 2: At least 1 photo uploaded (30%)
  if (bike.photoUrls && bike.photoUrls.filter(url => url && url.trim() !== '').length > 0) {
    completeness += 30;
  }

  // Rule 3: Ownership document uploaded (40%)
  if (bike.ownershipDocumentUrl && bike.ownershipDocumentUrl.trim() !== '') {
    completeness += 40;
  }

  return Math.min(completeness, 100); // Cap at 100%
};
