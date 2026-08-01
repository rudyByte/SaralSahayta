import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface TOCEntry {
  documentName: string;
  startPageNumber: number;
}

export const TOCService = {
  /**
   * Generates a single-page PDFDocument containing the Table of Contents.
   */
  async generateTOC(entries: TOCEntry[]): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();
    
    const page = pdfDoc.addPage([595.28, 841.89]);
    
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const pageW = page.getWidth();
    const pageH = page.getHeight();
    
    // Header
    const titleText = 'Table of Contents';
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 24);
    page.drawText(titleText, {
      x: (pageW - titleWidth) / 2,
      y: pageH - 100,
      size: 24,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    let currentY = pageH - 160;
    
    // List entries
    entries.forEach((entry, idx) => {
      // If page is full, add a new page
      if (currentY < 100) {
        // Ideally we'd add another page, but for simplicity assuming TOC fits on 1 page
      }
      
      const docName = `${idx + 1}. ${entry.documentName}`;
      const pageNumStr = entry.startPageNumber.toString();
      
      page.drawText(docName, {
        x: 80,
        y: currentY,
        size: 12,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      const pageNumWidth = fontBold.widthOfTextAtSize(pageNumStr, 12);
      page.drawText(pageNumStr, {
        x: pageW - 80 - pageNumWidth,
        y: currentY,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0)
      });
      
      // Draw dotted line
      const docNameWidth = fontRegular.widthOfTextAtSize(docName, 12);
      const startX = 80 + docNameWidth + 10;
      const endX = pageW - 80 - pageNumWidth - 10;
      
      for (let dotX = startX; dotX < endX; dotX += 5) {
        page.drawText('.', {
          x: dotX,
          y: currentY,
          size: 10,
          font: fontRegular,
          color: rgb(0.6, 0.6, 0.6)
        });
      }
      
      currentY -= 24;
    });
    
    return pdfDoc;
  }
};
