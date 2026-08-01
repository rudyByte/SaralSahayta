/**
 * CompressionService.ts
 * Compresses images using HTML5 Canvas before embedding them into the PDF.
 */

export const CompressionService = {
  /**
   * Compresses an image file and returns a new Blob.
   */
  async compressImage(file: File | Blob, maxWidth = 1200, maxHeight = 1600, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, outputType, quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    });
  }
};
