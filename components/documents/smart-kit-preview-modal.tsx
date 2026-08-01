import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, Clock, X, HardDrive, Percent, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    isMandatory: boolean;
  }>;
  pdfBlobUrl?: string | null;
}

export function SmartKitPreviewModal({
  open,
  onOpenChange,
  schemeName,
  stats,
  documents,
  pdfBlobUrl
}: PreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Smart Document Kit Preview
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Application Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Scheme Name</span>
                  <span className="font-semibold text-slate-900 text-right">{schemeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Generated Date</span>
                  <span className="font-semibold text-slate-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Applicant Name</span>
                  <span className="font-semibold text-slate-900">John Doe (Mock)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kit Health</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1">Overall Readiness</span>
                  <span className="text-2xl font-bold text-indigo-600 flex items-center gap-1">
                    <Percent className="w-5 h-5" /> {stats.readiness}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1">Validation Score</span>
                  <span className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-5 h-5" /> 100%
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-1">Package Size</span>
                  <span className="text-lg font-bold text-slate-800 flex items-center gap-1">
                    <HardDrive className="w-4 h-4" /> 4.2 MB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Sections */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Document Contents</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white">Req: {stats.required}</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Up: {stats.uploaded}</Badge>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Val: {stats.validated}</Badge>
              </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Document Name</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">File Type</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium text-slate-800">{doc.name}</span>
                          {doc.isMandatory && <Badge variant="secondary" className="text-[10px] py-0 h-4">Req</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none">
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-rose-500" />
                          PDF
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {(Math.random() * 2 + 0.5).toFixed(1)} MB
                      </td>
                    </tr>
                  ))}
                  {stats.uploaded === 0 && (
                     <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                           No documents uploaded yet.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {pdfBlobUrl && (
              <div className="bg-white border rounded-2xl shadow-sm overflow-hidden h-[600px] mt-6">
                <h3 className="px-4 py-3 font-semibold bg-slate-50 border-b">PDF Preview</h3>
                <iframe src={`${pdfBlobUrl}#toolbar=0`} className="w-full h-[calc(100%-48px)] border-0" title="Smart Kit PDF Preview" />
              </div>
            )}
          </div>
        </div>
        <div className="bg-slate-50 border-t px-6 py-4 flex justify-end">
           <DialogClose asChild>
              <Button variant="outline">Close Preview</Button>
           </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
