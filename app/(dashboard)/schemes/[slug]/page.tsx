'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, CheckCircle, FileText, Calendar, 
  DollarSign, Users, ExternalLink, AlertCircle, Clock,
  ChevronRight, Info, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ConfidenceBadge } from '@/components/scheme/confidence-badge';
import DocumentRequirementsList from '@/components/schemes/DocumentRequirementsList';
import { toast } from 'sonner';

export default function SchemeDetailPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [documentStatus, setDocumentStatus] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    loadSchemeDetails();
  }, [params.slug]);
  
  async function loadSchemeDetails() {
    setLoading(true);
    
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
      
      // Get scheme by slug
      const { data: schemeData, error } = await supabase
        .from('Scheme')
        .select('*')
        .eq('slug', params.slug)
        .single();
      
      if (error || !schemeData) {
        throw new Error('Scheme not found');
      }
      
      setScheme(schemeData);
      
      // 2. Increment view count (Background)
      await supabase.rpc('increment_scheme_views', { target_scheme_id: schemeData.id });
      
      // Load required documents
      const { data: docReqs } = await supabase
        .from('SchemeDocumentRequirement')
        .select(`
          *,
          documents (*)
        `)
        .eq('schemeId', schemeData.id)
        .order('displayOrder');
      
      setRequiredDocuments(docReqs || []);
      
      // If user is logged in, check which documents they have
      if (session) {
        const { data: userDocs } = await supabase
          .from('user_documents')
          .select('document_id')
          .eq('user_id', session.user.id)
          .eq('verification_status', 'VERIFIED');
        
        const statusMap: Record<string, boolean> = {};
        docReqs?.forEach((req: any) => {
          statusMap[req.documentId] = userDocs?.some((ud: any) => ud.document_id === req.documentId) || false;
        });
        setDocumentStatus(statusMap);
      }
    } catch (err) {
      console.error(err);
      toast.error("Scheme could not be loaded");
      router.push('/discover');
    } finally {
      setLoading(false);
    }
  }
  
  function startApplication() {
    if (!userId) {
      router.push(`/login?redirect=/schemes/${params.slug}`);
      return;
    }
    
    const missingMandatory = requiredDocuments.filter(
      req => req.isMandatory && !documentStatus[req.documentId]
    );
    
    if (missingMandatory.length > 0) {
      toast.warning(`Please upload ${missingMandatory.length} mandatory document(s) before applying.`);
      document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    router.push(`/schemes/${params.slug}/apply`);
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">Gathering scheme details...</p>
      </div>
    );
  }
  
  const uploadedMandatoryCount = requiredDocuments.filter(r => r.isMandatory && documentStatus[r.documentId]).length;
  const totalMandatoryCount = requiredDocuments.filter(r => r.isMandatory).length;
  const readinessPercentage = totalMandatoryCount > 0 ? (uploadedMandatoryCount / totalMandatoryCount) * 100 : 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Back & Breadcrumb */}
      <Button 
        variant="ghost" 
        className="group text-muted-foreground hover:text-primary transition-colors pr-4 px-0"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </Button>
      
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 md:p-10">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <FileText className="w-32 h-32 text-primary rotate-12" />
            </div>
            
            <div className="relative space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {scheme.category}
                </Badge>
                {scheme.isActive && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">
                    Active
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {scheme.name}
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {scheme.description.substring(0, 150)}...
              </p>
              
              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary/60" />
                  <span>{scheme.applications_count || 0} Citizens Applied</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary/60" />
                  <span>{scheme.views_count || 0} Views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Info Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-1 h-12">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="eligibility" className="rounded-lg">Eligibility</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
            </TabsList>
            
            <Card className="mt-4 border-none bg-transparent shadow-none">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <Card className="p-6 space-y-6 bg-card/40 border-primary/5">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                      <Info className="w-5 h-5 text-primary" />
                      About this Scheme
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {scheme.description_full || scheme.description}
                    </p>
                  </div>
                  
                  {scheme.benefits_details && (
                    <div className="pt-6 border-t border-primary/5">
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Key Benefits
                      </h3>
                      <div className="grid gap-3">
                        {Array.isArray(scheme.benefits_details) ? (
                          scheme.benefits_details.map((benefit: string, i: number) => (
                            <div key={i} className="flex gap-3 text-muted-foreground text-sm">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              {benefit}
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">{scheme.benefits_details}</p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="eligibility" className="space-y-6 mt-0">
                 <Card className="p-6 bg-card/40 border-primary/5">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Eligibility Requirements
                    </h2>
                    
                    <div className="grid gap-4">
                      {scheme.eligibilityCriteria ? (
                        Object.entries(scheme.eligibilityCriteria).map(([key, value]: [string, any], i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/5">
                            <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                            <Badge variant="outline" className="font-semibold text-primary">{String(value)}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Standard criteria apply.</p>
                      )}
                    </div>
                    
                    {scheme.exclusions && (
                      <div className="mt-8 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                        <h4 className="text-sm font-bold text-destructive mb-2">Exclusions</h4>
                        <p className="text-sm text-destructive/80 leading-relaxed">
                          {scheme.exclusions}
                        </p>
                      </div>
                    )}
                 </Card>
              </TabsContent>
              
              <TabsContent value="documents" id="documents-section" className="space-y-6 mt-0">
                <Card className="p-6 bg-card/40 border-primary/5">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-primary" />
                    Required Documentation
                  </h2>
                  <DocumentRequirementsList 
                    requirements={requiredDocuments} 
                    documentStatus={documentStatus}
                    userId={userId}
                    schemeSlug={params.slug}
                  />
                </Card>
              </TabsContent>
            </Card>
          </Tabs>
        </div>

        {/* Right Column: Sticky Sidebar Actions */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <Card className="p-6 md:p-8 space-y-6 border-primary/10 shadow-lg shadow-primary/5 bg-card/80 backdrop-blur-sm">
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Application Action</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Start your journey here
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Benefit Amount</p>
                  <p className="text-3xl font-black text-primary italic">
                    {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString('en-IN')}` : 'Variable'}
                  </p>
                </div>
                {userId && (
                  <ConfidenceBadge 
                    schemeId={scheme.id} 
                  />
                )}
              </div>
              
              <div className="p-4 rounded-2xl bg-muted/50 border border-primary/5 space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                   <span className="text-muted-foreground uppercase">Readiness</span>
                   <span className={readinessPercentage === 100 ? 'text-emerald-500' : 'text-primary'}>
                    {readinessPercentage === 100 ? 'Complete' : `${Math.round(readinessPercentage)}%`}
                    </span>
                </div>
                <Progress value={readinessPercentage} className="h-1.5" />
                <p className="text-xs text-muted-foreground leading-tight">
                  {readinessPercentage === 100 
                    ? "You have all mandatory documents verified. Ready to apply!" 
                    : "Upload the missing mandatory documents to unlock the application."}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={startApplication}
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 group"
              >
                Apply Now
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-2xl border-primary/20 hover:bg-primary/5"
                onClick={() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Checklist
              </Button>
            </div>
            
            <div className="pt-4 space-y-4 border-t border-primary/5">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-semibold text-xs tracking-tight">
                    {scheme.deadline ? new Date(scheme.deadline).toLocaleDateString() : (scheme.application_deadline_text || 'Ongoing')}
                  </p>
                </div>
              </div>
              
              {scheme.official_website && (
                <a 
                  href={scheme.official_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Offical Portal</p>
                    <p className="font-semibold text-xs truncate group-hover:text-primary transition-colors">Open Site</p>
                  </div>
                </a>
              )}
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50/20 border-yellow-200/50 rounded-3xl">
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-yellow-900">Need Assistance?</h4>
                <p className="text-xs text-yellow-800/70 leading-relaxed">
                  Stuck with document requirements? Our experts help thousands of citizens every day.
                </p>
                <Button variant="link" className="p-0 h-auto text-yellow-700 hover:text-yellow-600 font-bold text-xs underline underline-offset-4">
                  Talk to Support
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
