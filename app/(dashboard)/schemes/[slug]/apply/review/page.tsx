'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, CheckCircle, ShieldCheck, 
  Send, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { maskSensitiveData } from '@/lib/security/masking';

export default function ApplicationReviewPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  
  const [scheme, setScheme] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    loadDraft();
  }, [params.slug]);

  async function loadDraft() {
    setLoading(true);
    try {
      const draft = sessionStorage.getItem(`app_draft_${params.slug}`);
      if (!draft) {
        router.push(`/schemes/${params.slug}/apply`);
        return;
      }
      setFormData(JSON.parse(draft));

      const { data: schemeData } = await supabase
        .from('Scheme')
        .select('*')
        .eq('id', params.slug)
        .single();
      
      setScheme(schemeData);

      const res = await fetch(`/api/applications/check-documents?schemeId=${schemeData.id}`);
      const readinessData = await res.json();
      setReadiness(readinessData);
    } catch (err) {
      toast.error("Failed to load application draft");
    } finally {
      setLoading(false);
    }
  }

  async function finalSubmit() {
    if (!consent) {
      toast.error("Please provide consent to proceed");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: scheme.id,
          formData,
          attachedDocs: readiness?.attached ?? []
        })
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Application submitted successfully!");
        sessionStorage.removeItem(`app_draft_${params.slug}`);
        router.push(`/applications/${result.applicationNumber}/success`);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="space-y-4">
        <Button variant="ghost" className="px-0 hover:bg-transparent text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Edit Form
        </Button>
        <h1 className="text-3xl font-bold">Review Your Application</h1>
        <p className="text-muted-foreground">Please verify all details before final submission. Applications cannot be edited after submission.</p>
      </div>

      <div className="grid gap-8">
        {/* Verification Alert */}
        <Card className="p-4 bg-primary/5 border-primary/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary mt-1" />
          <div className="text-sm">
            <p className="font-bold text-primary italic">Verification Check Passed</p>
            <p className="text-muted-foreground">All mandatory documents ({readiness?.attached?.length ?? 0}) are securely attached from your vault.</p>
          </div>
        </Card>

        {/* Data Review Grid */}
        <Card className="overflow-hidden border-primary/10">
          <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-tight">Application Summary</h3>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSensitive(!showSensitive)}
                className="h-8 text-xs font-bold"
            >
                {showSensitive ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
                {showSensitive ? 'Mask Values' : 'Show Values'}
            </Button>
          </div>
          <div className="grid md:grid-cols-2 p-6 gap-y-6 gap-x-12">
            <ReviewItem label="Full Name" value={formData.full_name} />
            <ReviewItem 
                label="Aadhaar Number" 
                value={showSensitive ? formData.aadhaar_number : maskSensitiveData(formData.aadhaar_number)} 
                isSensitive 
            />
            <ReviewItem label="Date of Birth" value={formData.dob} />
            <ReviewItem label="Address" value={formData.permanent_address} />
            <ReviewItem 
                label="Bank Account" 
                value={showSensitive ? formData.bank_account_number : maskSensitiveData(formData.bank_account_number)} 
                isSensitive 
            />
            <ReviewItem label="Bank IFSC" value={formData.bank_ifsc} />
          </div>
        </Card>

        {/* Document Checklist Summary */}
        <Card className="p-6 border-primary/10">
           <h3 className="font-bold text-sm mb-4">Attached Documents ({readiness?.attached?.length ?? 0})</h3>
           <div className="grid sm:grid-cols-2 gap-3">
              {readiness?.requirements?.filter((r: any) => readiness?.attached?.includes(r.documentId)).map((req: any) => (
                <div key={req.documentId} className="flex items-center gap-2 text-sm p-3 rounded-xl bg-primary/5 text-primary font-medium">
                   <CheckCircle className="w-4 h-4" />
                   {req.documents.document_name}
                </div>
              ))}
           </div>
        </Card>

        {/* Submission & Consent */}
        <div className="space-y-6 pt-4">
          <div className="flex items-start space-x-3 p-4 rounded-2xl bg-muted/20 border">
            <Checkbox 
              id="consent" 
              checked={consent} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)}
              className="mt-1 cursor-pointer"
            />
            <label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
              I hereby declare that the information provided is true and correct to the best of my knowledge. I understand that providing false information may lead to the rejection of my application or legal action.
            </label>
          </div>

          <Button 
            onClick={finalSubmit}
            disabled={!consent || submitting}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            {submitting ? 'Submitting Securly...' : 'Submit Application Now'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, value, isSensitive }: { label: string; value: string; isSensitive?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">{label}</p>
      <p className={`font-semibold tracking-tight ${isSensitive ? 'font-mono text-sm' : ''}`}>{value || '-'}</p>
    </div>
  );
}
