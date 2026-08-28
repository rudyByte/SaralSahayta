'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, FileText, Sparkles, ShieldCheck, 
  ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import DocumentAttachmentStatus from '@/components/applications/DocumentAttachmentStatus';
import DynamicApplicationForm from '@/components/applications/DynamicApplicationForm';
import { mapOCRToFormFields } from '@/lib/applications/form-field-mapper';

export default function ApplicationEntryPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState<any>(null);
  const [autoFilledData, setAutoFilledData] = useState<Record<string, any>>({});
  const [step, setStep] = useState(1); // 1: Readiness, 2: Form, 3: Review

  useEffect(() => {
    initApplication();
  }, [params.slug]);

  async function initApplication() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/login?redirect=/schemes/${params.slug}/apply`);
        return;
      }

      // 1. Get scheme through the normalized API used by cards/detail pages.
      const schemeRes = await fetch(`/api/schemes/${params.slug}`, { cache: 'no-store' });
      if (!schemeRes.ok) throw new Error('Scheme not found');
      const schemePayload = await schemeRes.json();
      const schemeData = schemePayload.scheme;
      if (!schemeData) throw new Error('Scheme not found');
      setScheme(schemeData);

      // 2. Check document readiness
      const res = await fetch(`/api/applications/check-documents?schemeId=${schemeData.id}`);
      const readinessData = await res.json();
      setReadiness(readinessData);

      // 3. Prep auto-filled data
      const { data: userDocs } = await supabase
        .from('user_documents')
        .select('*, documents(document_code)')
        .eq('user_id', session.user.id)
        .in('verification_status', ['VERIFIED', 'PENDING']);

      if (userDocs) {
        const mapped = mapOCRToFormFields(userDocs, params.slug);
        setAutoFilledData(mapped);
      }

      if (readinessData.isReady) {
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      toast.error("Initialization failed");
    } finally {
      setLoading(false);
    }
  }

  const handleFormSubmit = (data: any) => {
    // Store in temporary storage (or state) and move to review
    sessionStorage.setItem(`app_draft_${params.slug}`, JSON.stringify(data));
    router.push(`/schemes/${params.slug}/apply/review`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Preparing your application...</p>
      </div>
    );
  }

  // Mock fields (In production these would come from the scheme's field definition table)
  const formFields = [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, autoFillSource: 'Aadhaar' },
    { name: 'aadhaar_number', label: 'Aadhaar Number', type: 'text', required: true, autoFillSource: 'Aadhaar' },
    { name: 'dob', label: 'Date of Birth', type: 'date', required: true, autoFillSource: 'Aadhaar' },
    { name: 'permanent_address', label: 'Permanent Address', type: 'text', required: true, autoFillSource: 'Aadhaar' },
    { name: 'bank_account_number', label: 'Bank Account Number', type: 'text', required: true, autoFillSource: 'Bank Passbook' },
    { name: 'bank_ifsc', label: 'Bank IFSC Code', type: 'text', required: true, autoFillSource: 'Bank Passbook' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" className="px-0 hover:bg-transparent text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scheme
        </Button>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Apply for Benefit</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Secure Government Portal Connection
            </p>
          </div>
          <Badge variant="outline" className="h-8 px-4 rounded-full border-primary/20 bg-primary/5 text-primary font-bold italic">
            {scheme?.name}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Tracker (Mobile Top, Desktop Left) */}
        <div className="lg:col-span-1 space-y-4">
           <Card className="p-6 border-primary/10 bg-card/50 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Application Progress</h3>
              <div className="space-y-6">
                 <StepItem 
                    num={1} 
                    label="Identity & Readiness" 
                    status={step > 1 ? 'complete' : 'active'} 
                    description={readiness?.isReady ? 'All documents verified' : 'Upload missing docs'}
                 />
                 <StepItem 
                    num={2} 
                    label="Application Form" 
                    status={step === 2 ? 'active' : step > 2 ? 'complete' : 'pending'} 
                    description="Auto-filled from OCR"
                 />
                 <StepItem 
                    num={3} 
                    label="Review & Submit" 
                    status={step === 3 ? 'active' : 'pending'} 
                    description="Final verification"
                 />
              </div>
           </Card>

           {readiness && <DocumentAttachmentStatus 
              requiredDocs={readiness.requirements}
              attachedDocs={readiness.attached}
              missingDocs={readiness.missing}
           />}
        </div>

        {/* Form Area */}
        <div className="lg:col-span-2">
          {step === 1 && !readiness?.isReady ? (
            <Card className="p-8 text-center border-dashed space-y-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Documents Missing</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    You need to upload and verify all mandatory documents in your vault before we can auto-fill this application.
                </p>
              </div>
              <Button className="w-full h-12 rounded-xl" onClick={() => router.push('/documents')}>
                Go to Documents Vault
              </Button>
            </Card>
          ) : (
            <Card className="p-8 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-xl font-bold italic">Smart Auto-Fill Active</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve extracted {Object.keys(autoFilledData).length} fields from your verified documents. 
                  Please review and correct if necessary.
                </p>
              </div>

              <DynamicApplicationForm 
                fields={formFields}
                initialData={autoFilledData}
                onSubmit={handleFormSubmit}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StepItem({ num, label, status, description }: { num: number; label: string; status: 'pending' | 'active' | 'complete'; description: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
          ${status === 'complete' ? 'bg-primary text-white' : status === 'active' ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'}
        `}>
          {status === 'complete' ? '✓' : num}
        </div>
        <div className="w-0.5 h-12 bg-muted group-last:bg-transparent" />
      </div>
      <div className="space-y-1">
        <p className={`text-sm font-bold ${status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
          {description}
        </p>
      </div>
    </div>
  );
}
