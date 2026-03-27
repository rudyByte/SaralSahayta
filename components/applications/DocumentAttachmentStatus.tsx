'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DocumentAttachmentStatusProps {
  requiredDocs: any[];
  attachedDocs: string[];
  missingDocs: string[];
}

export default function DocumentAttachmentStatus({
  requiredDocs,
  attachedDocs,
  missingDocs
}: DocumentAttachmentStatusProps) {
  return (
    <Card className="p-6 border-primary/10 bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          Document Readiness
        </h3>
        <Badge variant="outline" className="font-bold font-mono text-[10px]">
          {attachedDocs.length}/{requiredDocs.length} ATTACHED
        </Badge>
      </div>

      <div className="space-y-3">
        {requiredDocs.map((req) => {
          const isAttached = attachedDocs.includes(req.documentId);
          const isMandatory = req.isMandatory;

          return (
            <div 
              key={req.documentId} 
              className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 text-xs"
            >
              <div className="flex items-center gap-3">
                {isAttached ? (
                  <CheckCircle className="w-4 h-4 text-primary" />
                ) : isMandatory ? (
                  <XCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-muted-foreground/40" />
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {req.documents.document_name}
                    {isMandatory && <span className="text-destructive ml-1">*</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isAttached ? 'Auto-attached from vault' : 'Requires upload'}
                  </p>
                </div>
              </div>
              
              <Badge 
                variant={isAttached ? 'secondary' : 'outline'} 
                className={isAttached ? 'bg-primary/10 text-primary border-none text-[10px]' : 'text-[10px]'}
              >
                {isAttached ? '✓ Verified' : 'Missing'}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
