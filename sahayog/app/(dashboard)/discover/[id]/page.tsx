"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Calendar,
    MapPin,
    Building2,
    ArrowRight,
    Download,
    Share2,
    FileText,
    Loader2,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EligibilityBreakdown } from "@/components/scheme/eligibility-breakdown";
import { LowMatchWarning } from "@/components/modals/low-match-warning";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SchemeDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startingApp, setStartingApp] = useState(false);
    const [isWarningOpen, setIsWarningOpen] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/schemes/${id}`);
                const json = await res.json();
                if (json.success) setData(json);
                else toast.error("Scheme not found");
            } catch (e) {
                toast.error("Failed to load scheme details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleStartApplication = async () => {
        if (!data.isProfileComplete) {
            toast.info("Please complete your profile to at least 80% before applying.");
            router.push("/profile");
            return;
        }

        if (data.matchScore < 40 && !isWarningOpen) {
            setIsWarningOpen(true);
            return;
        }

        setStartingApp(true);
        try {
            const res = await fetch("/api/applications/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schemeId: id }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success("Application started!");
                // Redirect to form or dashboard (Phase 2)
                router.push("/applications");
            } else {
                throw new Error(json.error);
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to start application");
        } finally {
            setStartingApp(false);
            setIsWarningOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data?.scheme) return null;

    const scheme = data.scheme;
    const score = data.matchScore;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-8">
            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <nav className="flex items-center text-sm text-gray-500">
                    <Link href="/discover" className="hover:text-primary flex items-center">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Discover
                    </Link>
                </nav>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard");
                    }}>
                        <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden md:flex">
                        <FileText className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: MAIN CONTENT */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="uppercase font-bold text-primary border-primary">
                                {scheme.schemeType}
                            </Badge>
                            <Badge variant="secondary">{scheme.category}</Badge>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                            {scheme.schemeName}
                        </h1>
                        <p className="text-gray-600 leading-relaxed italic">
                            Ministry: {scheme.provider || "Government of India"}
                        </p>
                    </div>

                    {/* Match Score Section */}
                    {score !== null && (
                        <Card className="p-6 bg-primary/5 border-primary/20">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="relative h-24 w-24 flex-shrink-0">
                                    <svg className="h-full w-full" viewBox="0 0 36 36">
                                        <path
                                            className="text-gray-200"
                                            strokeDasharray="100, 100"
                                            strokeWidth="3"
                                            stroke="currentColor"
                                            fill="transparent"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-primary"
                                            strokeDasharray={`${score}, 100`}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                                        {score}%
                                    </div>
                                </div>
                                <div className="text-center md:text-left space-y-1">
                                    <h3 className="text-lg font-bold">Eligibility Match: {
                                        score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Moderate" : "Low"
                                    }</h3>
                                    <p className="text-sm text-gray-600">
                                        This score is calculated based on your profile details compared to the scheme requirements.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Target Beneficiaries */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center">
                            <Info className="h-5 w-5 mr-2 text-primary" />
                            Target Beneficiaries
                        </h2>
                        <div className="bg-white p-6 rounded-lg border text-gray-700 leading-relaxed whitespace-pre-line">
                            {scheme.targetBeneficiary}
                        </div>
                    </section>

                    {/* Eligibility Breakdown */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">Who can apply?</h2>
                        <Card className="overflow-hidden">
                            <EligibilityBreakdown
                                breakdown={data.breakdown}
                                isProfileComplete={data.isProfileComplete}
                            />
                        </Card>
                    </section>

                    {/* Required Documents */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">Documents you'll need</h2>
                        <Card className="p-1">
                            {scheme.requiredDocuments.map((doc: string, idx: number) => (
                                <div key={idx} className="flex items-center p-4 border-b last:border-0">
                                    <div className="bg-gray-100 p-2 rounded mr-4">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <span className="text-sm font-medium">{doc}</span>
                                </div>
                            ))}
                        </Card>
                    </section>

                    {/* How to Apply */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">How to Apply</h2>
                        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                            <div className="flex gap-4">
                                <div className="bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
                                <div>
                                    <p className="font-bold">Check Eligibility</p>
                                    <p className="text-sm text-gray-600">Review the match breakdown above to ensure you meet all requirements.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
                                <div>
                                    <p className="font-bold">Prepare Documents</p>
                                    <p className="text-sm text-gray-600">Gather all the required documents mentioned above in digital format.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
                                <div>
                                    <p className="font-bold">Initiate Process</p>
                                    <p className="text-sm text-gray-600">Click the Start Application button to begin your journey with SahayoG.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN: STICKY INFO CARD */}
                <div className="space-y-6">
                    <Card className="p-6 sticky top-24 space-y-6 border-t-4 border-t-primary">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Financial Benefit</p>
                            <p className="text-3xl font-black text-primary">₹{scheme.benefitAmount?.toLocaleString('en-IN') || scheme.financialBenefit}</p>
                        </div>

                        <div className="space-y-4 border-y py-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Deadline</p>
                                    <p className="text-sm font-semibold">
                                        {scheme.applicationDeadline ? new Date(scheme.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "Apply Anytime"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Application Mode</p>
                                    <p className="text-sm font-semibold capitalize">{scheme.applicationMode?.toLowerCase() || "Online"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Region</p>
                                    <p className="text-sm font-semibold">{scheme.state || "Pan India"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                className="w-full h-12 text-md font-bold group"
                                onClick={handleStartApplication}
                                disabled={startingApp}
                            >
                                {startingApp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Start Application"}
                                {!startingApp && <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />}
                            </Button>
                            <Link href={scheme.officialPortalUrl || "#"} target="_blank" className="block">
                                <Button variant="outline" className="w-full h-11">
                                    Visit Official Portal
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* MOBILE STICKY BOTTOM BAR */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <Button
                    className="flex-1 h-12 font-bold"
                    onClick={handleStartApplication}
                    disabled={startingApp}
                >
                    {startingApp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Application"}
                </Button>
            </div>

            <LowMatchWarning
                isOpen={isWarningOpen}
                onClose={() => setIsWarningOpen(false)}
                onConfirm={handleStartApplication}
                score={score}
            />
        </div>
    );
}
