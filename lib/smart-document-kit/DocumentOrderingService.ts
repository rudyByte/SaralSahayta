import { SmartKitDocument } from './types';

export const DocumentOrderingService = {
  /**
   * Orders the processed documents based on the exact government requirement order.
   * Ensures that mandatory documents come first, matching the passed requiredDocuments array.
   */
  order(documents: SmartKitDocument[], requiredIds: string[]): SmartKitDocument[] {
    return [...documents].sort((a, b) => {
      const indexA = requiredIds.indexOf(a.id);
      const indexB = requiredIds.indexOf(b.id);
      
      // If both aren't found in the required list (unlikely), keep their relative order
      if (indexA === -1 && indexB === -1) return 0;
      // If A is not found, B comes first
      if (indexA === -1) return 1;
      // If B is not found, A comes first
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  }
};
