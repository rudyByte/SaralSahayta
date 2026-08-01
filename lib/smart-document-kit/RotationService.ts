import { PDFDocument, degrees } from 'pdf-lib';

export const RotationService = {
  /**
   * Detects landscape pages and rotates them to portrait.
   */
  async enforcePortrait(pdfDoc: PDFDocument): Promise<void> {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      // If page is wider than it is tall, it is landscape
      if (width > height) {
        // Rotate 90 degrees
        page.setRotation(degrees(90));
      }
    }
  }
};
