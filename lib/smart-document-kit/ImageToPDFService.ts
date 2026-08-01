import { PDFDocument } from 'pdf-lib';
import { CompressionService } from './CompressionService';

export const ImageToPDFService = {
  /**
   * Converts an image file to a single-page PDFDocument.
   */
  async convert(file: File | Blob, fileType: string): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();
    
    // Compress image
    const compressedBlob = await CompressionService.compressImage(file);
    const arrayBuffer = await compressedBlob.arrayBuffer();
    
    let image;
    if (fileType === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }
    
    // Create A4 page (portrait: 595.28 x 841.89)
    const page = pdfDoc.addPage([595.28, 841.89]);
    
    // Scale image to fit within page while maintaining aspect ratio
    const { width: imgW, height: imgH } = image.scale(1);
    const pageW = page.getWidth();
    const pageH = page.getHeight();
    
    // Add margin (e.g., 20 points)
    const margin = 20;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    
    let scale = Math.min(maxW / imgW, maxH / imgH);
    if (scale > 1) scale = 1; // Don't upscale if smaller
    
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;
    
    // Center the image
    const x = (pageW - scaledW) / 2;
    const y = (pageH - scaledH) / 2;
    
    page.drawImage(image, {
      x,
      y,
      width: scaledW,
      height: scaledH,
    });
    
    return pdfDoc;
  }
};
