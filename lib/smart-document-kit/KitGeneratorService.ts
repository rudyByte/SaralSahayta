import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SmartKitDocument, SmartKitStats, ProgressCallback } from './types';
import { DocumentOrderingService } from './DocumentOrderingService';
import { ImageToPDFService } from './ImageToPDFService';
import { RotationService } from './RotationService';
import { CoverPageService } from './CoverPageService';
import { TOCService, TOCEntry } from './TOCService';

export const KitGeneratorService = {
  /**
   * Generates the final Smart Document Kit PDF Blob.
   */
  async generateKit(
    schemeName: string,
    applicantName: string,
    documents: SmartKitDocument[],
    stats: SmartKitStats,
    requiredIds: string[],
    onProgress: ProgressCallback
  ): Promise<Blob> {
    const finalPdf = await PDFDocument.create();

    // 1. Order documents
    onProgress('Arranging Documents', 5, 1, 12);
    const orderedDocs = DocumentOrderingService.order(documents, requiredIds);

    const tocEntries: TOCEntry[] = [];
    let currentPageNumber = 3; // Starts at 3 (Cover = 1, TOC = 2)

    // Temporary storage for parsed PDFs to avoid keeping them all in memory if large,
    // but for browser memory it's fine for a few documents.
    const parsedPdfs: { docName: string; pdfDoc: PDFDocument }[] = [];

    // 2. Process each document
    for (let i = 0; i < orderedDocs.length; i++) {
      const doc = orderedDocs[i];
      onProgress(`Processing ${doc.name}`, 10 + (60 * (i / orderedDocs.length)), i + 2, 12);

      let fileBuffer: ArrayBuffer;
      let contentType = '';

      // Fetch or read file
      if (doc.file) {
        fileBuffer = await doc.file.arrayBuffer();
        contentType = doc.file.type;
      } else if (doc.url) {
        console.log("Document Object:", doc);
        console.log("Document URL:", doc.url);
        console.log("Document:", doc);

        const response = await fetch(doc.url);

        console.log("Fetching URL:", doc.url);
        console.log("Status:", response.status);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${doc.name}\nURL: ${doc.url}\nStatus: ${response.status}`
          );
        }
        fileBuffer = await response.arrayBuffer();
        contentType = response.headers.get('content-type') || 'application/pdf';
      } else {
        continue; // Skip if no file or url
      }

      let docPdf: PDFDocument;

      if (contentType.startsWith('image/')) {
        docPdf = await ImageToPDFService.convert(new Blob([fileBuffer], { type: contentType }), contentType);
      } else {
        docPdf = await PDFDocument.load(fileBuffer);
        // Remove blank pages logic (basic heuristic: no pages or very few objects)
        // Note: Full blank page detection is complex, but we ensure we drop truly empty pages
        // Wait, removing pages from docPdf can be done, but for now we skip complex blank detection to avoid false positives.
      }

      // Rotate if landscape
      await RotationService.enforcePortrait(docPdf);

      parsedPdfs.push({ docName: doc.name, pdfDoc: docPdf });
    }

    onProgress('Generating TOC', 75, 9, 12);

    // Determine TOC entries
    for (const item of parsedPdfs) {
      tocEntries.push({
        documentName: item.docName,
        startPageNumber: currentPageNumber
      });
      currentPageNumber += item.pdfDoc.getPageCount();
    }

    const coverPdf = await CoverPageService.generateCoverPage(schemeName, applicantName, stats, parsedPdfs.length);
    const tocPdf = await TOCService.generateTOC(tocEntries);

    onProgress('Merging PDFs', 85, 10, 12);

    // Copy Cover
    const coverPages = await finalPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    coverPages.forEach(p => finalPdf.addPage(p));

    // Copy TOC
    const tocPages = await finalPdf.copyPages(tocPdf, tocPdf.getPageIndices());
    tocPages.forEach(p => finalPdf.addPage(p));

    // Copy All Docs
    for (const item of parsedPdfs) {
      const copiedPages = await finalPdf.copyPages(item.pdfDoc, item.pdfDoc.getPageIndices());
      copiedPages.forEach(p => finalPdf.addPage(p));
    }

    onProgress('Numbering Pages', 90, 11, 12);

    // Add page numbers
    const fontRegular = await finalPdf.embedFont(StandardFonts.Helvetica);
    const allPages = finalPdf.getPages();

    // Skip Cover and TOC for numbering, start from actual documents
    for (let i = 2; i < allPages.length; i++) {
      const page = allPages[i];
      const { width } = page.getSize();
      const text = `Page ${i + 1}`;
      const textWidth = fontRegular.widthOfTextAtSize(text, 10);

      page.drawText(text, {
        x: width - textWidth - 20,
        y: 20,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2)
      });
    }

    onProgress('Finalizing', 98, 12, 12);
    const finalBytes = await finalPdf.save();

    return new Blob(
      [finalBytes.buffer as ArrayBuffer],
      {
        type: "application/pdf",
      }
    );
  }
};
