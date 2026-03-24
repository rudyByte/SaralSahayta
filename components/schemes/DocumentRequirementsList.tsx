'use client';

import React from 'react';
import { CheckCircle, XCircle, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DocumentRequirementsListProps {
  requirements: any[];
  documentStatus: Record<string, boolean>;
  userId: string | null;
  schemeSlug: string;
}

export default function DocumentRequirementsList({
  requirements,
  documentStatus,
  userId,
  schemeSlug
}: DocumentRequirementsListProps) {
  const router = useRouter();
  
  if (!requirements || requirements.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        No specific documents required for this scheme.
      </p>
    );
  }
  
  const mandatory = requirements.filter(r => r.isMandatory);
  const optional = requirements.filter(r => !r.isMandatory);
  
  return (
    <div className="space-y-6">
      {/* Mandatory Documents */}
      {mandatory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="text-destructive">*</span> Mandatory Documents
          </h3>
          <div className="grid gap-3">
            {mandatory.map(req => (
              <DocumentRequirementItem
                key={req.id}
                requirement={req}
                isUploaded={documentStatus[req.documentId]}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Optional Documents */}
      {optional.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Optional Documents</h3>
          <div className="grid gap-3">
            {optional.map(req => (
              <DocumentRequirementItem
                key={req.id}
                requirement={req}
                isUploaded={documentStatus[req.documentId]}
                userId={userId}
                isOptional={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {userId && (
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={() => router.push('/documents')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Go to Documents Vault
          </Button>
        </div>
      )}
    </div>
  );
}

function DocumentRequirementItem({ 
  requirement, 
  isUploaded, 
  userId, 
  isOptional = false 
}: { 
  requirement: any; 
  isUploaded: boolean; 
  userId: string | null;
  isOptional?: boolean;
}) {
  const router = useRouter();
  
  return (
    <Card className={`p-4 transition-colors ${isUploaded ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">
          {isUploaded ? (
            <CheckCircle className="h-5 w-5 text-primary" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-sm">
                {requirement.documents.document_name}
                {!isOptional && <span className="text-destructive ml-1">*</span>}
              </h4>
              {requirement.helpText && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {requirement.helpText}
                </p>
              )}
            </div>
            
            <div className="flex-shrink-0">
              {isUploaded ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  ✓ Ready
                </Badge>
              ) : userId ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => router.push(`/documents?upload=${requirement.documents.document_code}`)}
                >
                  Upload
                </Button>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Login to check
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
