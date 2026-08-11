'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowLeft, CheckCircle, FileText, Calendar,
  DollarSign, Users, ExternalLink, AlertCircle, Clock,
  ChevronRight, Info, ShieldCheck, Banknote, MapPin,
  GraduationCap, Building2, ChevronDown, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ConfidenceBadge } from '@/components/scheme/confidence-badge';
import DocumentRequirementsList from '@/components/scheme/DocumentRequirementsList';
import { SmartDocumentKitWizard } from '@/components/documents/SmartDocumentKitWizard';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to load scheme');
  return r.json();
});

const TYPE_COLORS: Record<string, string> = {
  CENTRAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  STATE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  PRIVATE: 'bg-amber-50 text-amber-700 border-amber-200',
  NGO:     'bg-rose-50 text-rose-700 border-rose-200',
};

export default function SchemeDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isActionExpanded, setIsActionExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');


  // ── Uses the new /api/schemes/[id] route which:
  //    1. Queries 'schemes' (correct lowercase) table
  //    2. Queries 'scheme_document_requirements' (not the legacy string array)
  //    3. Returns requiredDocumentsCount from the relational source — same as detail shows
  const { data, error, isLoading } = useSWR(
    `/api/schemes/${params.slug}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const scheme         = data?.scheme ?? null;
  const requirements   = data?.requirements ?? [];
  const documentStatus = data?.documentStatus ?? {};

  function startApplication() {
    if (!user) {
      router.push(`/login?redirect=/schemes/${params.slug}`);
      return;
    }
    const missingMandatory = requirements.filter(
      (req: any) => req.isMandatory && !documentStatus[req.documentId]
    );
    if (missingMandatory.length > 0) {
      toast.warning(`Please upload ${missingMandatory.length} mandatory document(s) before applying.`);
      document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    router.push(`/schemes/${params.slug}/apply`);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">Gathering scheme details...</p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Scheme not found</h2>
        <p className="text-muted-foreground max-w-xs">
          This scheme may have been removed or the link is incorrect.
        </p>
        <Button onClick={() => router.push('/discover')}>Browse All Schemes</Button>
      </div>
    );
  }

  const mandatoryDocs     = requirements.filter((r: any) => r.isMandatory);
  const uploadedMandatory = mandatoryDocs.filter((r: any) => documentStatus[r.documentId]);
  const totalMandatory    = mandatoryDocs.length;
  const readiness         = totalMandatory > 0
    ? (uploadedMandatory.length / totalMandatory) * 100
    : 100;
  const hasDeadline = scheme.deadline && !scheme.isRolling;
  const daysLeft = hasDeadline
    ? Math.ceil((new Date(scheme.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const eligibilityCriteria = scheme.eligibilityCriteria
    ? (typeof scheme.eligibilityCriteria === 'string'
        ? JSON.parse(scheme.eligibilityCriteria)
        : scheme.eligibilityCriteria)
    : null;
  const eligibilityEntries: [string, any][] = eligibilityCriteria
    ? Object.entries(eligibilityCriteria).filter(([, v]) => v !== null && v !== undefined)
    : [];

  return (
    <div className="max-w-6xl mx-auto pb-32 lg:pb-12">
      {/* Back Button */}
      <div className="px-4 md:px-0 pt-2 pb-4">
        <Button
          variant="ghost"
          className="group text-muted-foreground hover:text-primary pl-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>
      </div>

      {/* ── HERO ── */}
      <div className="mx-4 md:mx-0 mb-6 relative overflow-hidden rounded-3xl border bg-card p-6 md:p-10">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <FileText className="w-32 h-32 text-primary rotate-12" />
        </div>
        <div className="relative space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn('font-bold uppercase text-[10px]', TYPE_COLORS[scheme.schemeType] || '')}>
              {scheme.schemeType}
            </Badge>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-[10px]">
              {scheme.category?.replace(/_/g, ' ')}
            </Badge>
            {scheme.isActive && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">
                ● Active
              </Badge>
            )}
            {requirements.length > 0 && (
              <button
                onClick={() => setActiveTab('documents')}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <FileText className="w-3 h-3 text-blue-600" />
                {requirements.length} Documents Required
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {scheme.name}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            {scheme.description?.substring(0, 200)}{scheme.description?.length > 200 ? '...' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
            {scheme.ministry && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary/60 shrink-0" />
                <span className="font-medium">{scheme.ministry}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary/60 shrink-0" />
              <span>{scheme.applications_count || 0} Applied</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary/60 shrink-0" />
              <span>{scheme.views_count || 0} Views</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid lg:grid-cols-3 gap-6 px-4 md:px-0 items-start">
        {/* Left: Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-muted/50 rounded-xl p-1 h-12">
              <TabsTrigger value="overview"    className="rounded-lg text-xs sm:text-sm font-semibold">Overview</TabsTrigger>
              <TabsTrigger value="eligibility" className="rounded-lg text-xs sm:text-sm font-semibold">Eligibility</TabsTrigger>
              <TabsTrigger value="documents"   className="rounded-lg text-xs sm:text-sm font-semibold relative">
                Documents
                {requirements.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-sm">
                    {requirements.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="p-5 sm:p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Benefit Amount</p>
                    <p className="text-3xl sm:text-4xl font-black text-primary">
                      {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString('en-IN')}` : 'Variable'}
                    </p>
                    {scheme.benefitDescription && (
                      <p className="text-sm text-muted-foreground mt-1">{scheme.benefitDescription}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="text-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[80px]">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Type</p>
                      <p className="text-sm font-black text-slate-900">{scheme.benefitType}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[80px]">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Deadline</p>
                      <p className={cn('text-sm font-black', hasDeadline && daysLeft !== null && daysLeft < 7 ? 'text-red-500' : 'text-slate-900')}>
                        {hasDeadline ? (daysLeft !== null && daysLeft > 0 ? `${daysLeft}d` : 'Soon') : 'Rolling'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── PROMINENT REQUIRED DOCUMENTS AT A GLANCE ── */}
              <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-transparent border-blue-200/60 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2 text-slate-900">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Required Documents Needed to Apply
                  </h2>
                  <Badge variant="outline" className="bg-blue-100/80 text-blue-800 border-blue-300 font-bold text-xs">
                    {requirements.length} Required
                  </Badge>
                </div>

                {requirements.length > 0 ? (
                  <div className="grid gap-3">
                    {requirements.map((req: any, idx: number) => {
                      const rawName = req.documents?.document_name || 'Document';
                      const formattedName = rawName
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (l: string) => l.toUpperCase());
                      const isUploaded = documentStatus[req.documentId] || req.isUploaded;
                      const docCode = req.documents?.document_code || rawName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

                      return (
                        <div
                          key={req.id || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xs gap-3 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isUploaded ? (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-amber-700" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {formattedName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isUploaded ? 'Document verified in your vault' : 'Mandatory for eligibility check'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isUploaded ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1">
                                ✓ Verified
                              </Badge>
                            ) : (
                              <>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs px-3 py-1">
                                  Required
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/documents?upload=${docCode}`)}
                                  className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Upload
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No specific documents required for this scheme.</p>
                )}

                <Button
                  variant="outline"
                  onClick={() => setActiveTab('documents')}
                  className="w-full mt-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 font-bold text-xs sm:text-sm h-10 rounded-xl"
                >
                  View & Upload Full Document Checklist
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>

              {/* About this Scheme */}
              <Card className="p-5 sm:p-6 space-y-4 bg-card/40 border-primary/5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />About this Scheme
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {scheme.description_full || scheme.description}
                </p>
                {scheme.benefits_details && (
                  <div className="pt-4 border-t border-primary/5">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-emerald-500" />Key Benefits
                    </h3>
                    <div className="grid gap-2">
                      {Array.isArray(scheme.benefits_details)
                        ? scheme.benefits_details.map((b: string, i: number) => (
                            <div key={i} className="flex gap-3 text-muted-foreground text-sm">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />{b}
                            </div>
                          ))
                        : <p className="text-muted-foreground text-sm">{scheme.benefits_details}</p>
                      }
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>


            {/* Eligibility Tab */}
            <TabsContent value="eligibility" className="mt-4">
              <Card className="p-5 sm:p-6 bg-card/40 border-primary/5">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
                  <ShieldCheck className="w-5 h-5 text-primary" />Eligibility Requirements
                </h2>
                {eligibilityEntries.length > 0 ? (
                  <div className="grid gap-3">
                    {eligibilityEntries.map(([key, value], i) => (
                      <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/30 border border-primary/5 gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          {key.includes('age')      && <Clock         className="w-4 h-4 text-primary/60 shrink-0" />}
                          {key.includes('income')   && <Banknote       className="w-4 h-4 text-primary/60 shrink-0" />}
                          {key.includes('state')    && <MapPin          className="w-4 h-4 text-primary/60 shrink-0" />}
                          {key.includes('education')&& <GraduationCap   className="w-4 h-4 text-primary/60 shrink-0" />}
                          {!['age','income','state','education'].some(k => key.includes(k)) && <Info className="w-4 h-4 text-primary/60 shrink-0" />}
                          <span className="text-sm font-semibold capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-semibold text-primary text-xs shrink-0">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Standard criteria apply. All eligible citizens may apply.</p>
                )}
                {scheme.exclusions && (
                  <div className="mt-6 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                    <h4 className="text-sm font-bold text-destructive mb-2">⚠ Exclusions</h4>
                    <p className="text-sm text-destructive/80 leading-relaxed">{scheme.exclusions}</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" id="documents-section" className="mt-4">
              <Card className="p-5 sm:p-6 bg-card/40 border-primary/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />Required Documentation
                  </h2>
                  {requirements.length > 0 && <Badge className="font-bold">{requirements.length} Total</Badge>}
                </div>
                <DocumentRequirementsList
                  requirements={requirements}
                  documentStatus={documentStatus}
                  userId={user?.id || null}
                  schemeSlug={params.slug}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar (desktop only) */}
        <div className="hidden lg:block space-y-4 sticky top-8">
          <Card className="p-6 space-y-5 border-primary/10 shadow-lg shadow-primary/5 bg-card/80 backdrop-blur-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Benefit Amount</p>
              <p className="text-3xl font-black text-primary">
                {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString('en-IN')}` : 'Variable'}
              </p>
            </div>
            {user && <ConfidenceBadge schemeId={scheme.id} />}
            <div className="p-4 rounded-2xl bg-muted/50 border border-primary/5 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground uppercase">Document Readiness</span>
                <span className={readiness === 100 ? 'text-emerald-500' : 'text-primary'}>
                  {readiness === 100 ? 'Complete ✓' : `${Math.round(readiness)}%`}
                </span>
              </div>
              <Progress value={readiness} className="h-1.5" />
              <p className="text-xs text-muted-foreground leading-tight">
                {readiness === 100
                  ? 'All mandatory documents verified. Ready to apply!'
                  : `${uploadedMandatory.length}/${totalMandatory} mandatory docs uploaded.`}
              </p>
            </div>
            <div className="space-y-3">
              <SmartDocumentKitWizard
                schemeName={scheme.name}
                requiredDocuments={requirements}
                initialDocumentStatus={documentStatus}
              />
              <Button
                onClick={startApplication}
                className="w-full h-12 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 group"
              >
                Apply Now
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 rounded-2xl border-primary/20 hover:bg-primary/5 text-sm"
                onClick={() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Document Checklist
              </Button>
            </div>
            <div className="space-y-3 pt-2 border-t border-primary/5">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Deadline</p>
                  <p className="font-bold text-xs">
                    {scheme.deadline
                      ? new Date(scheme.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : scheme.application_deadline_text || 'Ongoing / Rolling'}
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
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Official Portal</p>
                    <p className="font-bold text-xs text-primary group-hover:underline">Open Site</p>
                  </div>
                </a>
              )}
            </div>
          </Card>

          {/* Help Card */}
          <Card className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50/20 border-yellow-200/50 rounded-3xl">
            <div className="flex gap-3">
              <div className="h-9 w-9 shrink-0 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-yellow-900">Need Assistance?</h4>
                <p className="text-xs text-yellow-800/70 leading-relaxed">
                  Stuck with documents? Our experts help thousands of citizens every day.
                </p>
                <Button variant="link" className="p-0 h-auto text-yellow-700 hover:text-yellow-600 font-bold text-xs underline">
                  Talk to Support
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── MOBILE BOTTOM ACTION BAR ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        {/* Progress strip */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${readiness}%` }}
          />
        </div>
        {/* Collapsed bar */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Benefit</p>
            <p className="text-xl font-black text-primary leading-none">
              {scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString('en-IN')}` : 'Variable'}
            </p>
          </div>
          <button
            onClick={() => setIsActionExpanded(!isActionExpanded)}
            className="p-2 rounded-xl text-muted-foreground hover:text-primary"
            aria-label="Toggle details"
          >
            <ChevronDown className={cn('w-5 h-5 transition-transform duration-300', isActionExpanded && 'rotate-180')} />
          </button>
          <Button
            onClick={startApplication}
            className="h-12 px-6 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 shrink-0"
          >
            Apply Now <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
        {/* Expandable drawer */}
        {isActionExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3 animate-in slide-in-from-bottom duration-300">
            <div className="p-3 rounded-2xl bg-muted/50 border border-primary/5 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground uppercase">Readiness</span>
                <span className={readiness === 100 ? 'text-emerald-500' : 'text-primary'}>
                  {readiness === 100 ? 'Ready!' : `${Math.round(readiness)}% (${uploadedMandatory.length}/${totalMandatory})`}
                </span>
              </div>
              <Progress value={readiness} className="h-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SmartDocumentKitWizard
                schemeName={scheme.name}
                requiredDocuments={requirements}
                initialDocumentStatus={documentStatus}
              />
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-primary/20 text-sm font-semibold"
                onClick={() => {
                  setIsActionExpanded(false);
                  setTimeout(() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              >
                View Checklist
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {hasDeadline ? new Date(scheme.deadline).toLocaleDateString('en-IN') : 'Ongoing'}
                </span>
              </div>
              {scheme.official_website && (
                <a
                  href={scheme.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />Official Site
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}