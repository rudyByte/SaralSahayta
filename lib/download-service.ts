import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DownloadKitData {
  schemeName: string;
  stats: {
    required: number;
    uploaded: number;
    validated: number;
    readiness: number;
  };
  documents: Array<{
    name: string;
    status: string;
  }>;
}

export const downloadDocumentKit = async (data: DownloadKitData): Promise<boolean> => {
  // Simulate network/processing delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Smart Document Kit Summary', 14, 22);
      
      // Meta Information
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Scheme: ${data.schemeName}`, 14, 32);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 40);
      doc.text(`Applicant Name: John Doe`, 14, 48);
      
      // Stats
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(14);
      doc.text('Package Statistics', 14, 62);
      
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Overall Readiness: ${data.stats.readiness}%`, 14, 72);
      doc.text(`Validation Score: 100%`, 14, 78);
      doc.text(`Package Size: 4.2 MB`, 14, 84);
      doc.text(`Documents Validated: ${data.stats.validated} / ${data.stats.required}`, 14, 90);
      
      // Table
      const tableData = data.documents.map(d => [
        d.name,
        d.status,
        'PDF',
        (Math.random() * 2 + 0.5).toFixed(1) + ' MB'
      ]);
      
      autoTable(doc, {
        startY: 100,
        head: [['Document Name', 'Status', 'File Type', 'Size']],
        body: tableData,
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        styles: { fontSize: 10, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] } // Slate 50
      });
      
      // Save
      doc.save('Smart_Document_Kit.pdf');
      resolve(true);
    }, 1500);
  });
};
