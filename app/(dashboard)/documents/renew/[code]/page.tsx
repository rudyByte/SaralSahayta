'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ExternalLink,
    MapPin,
    Phone,
    Clock,
    FileText,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    Globe,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RenewalStep {
    title: string;
    description: string;
}

interface DocumentRenewalInfo {
    name: string;
    code: string;
    onlineUrl?: string;
    description: string;
    onlineSteps: RenewalStep[];
    offlineSteps: RenewalStep[];
    requiredDocs: string[];
}

const RENEWAL_DATABASE: Record<string, DocumentRenewalInfo> = {
    'income-certificate': {
        name: 'Income Certificate',
        code: 'INCOME_CERT',
        description: 'A certificate documenting the annual income of a family. Valid for 1 year from the date of issue.',
        onlineUrl: 'https://edistrict.up.gov.in/',
        onlineSteps: [
            { title: 'Visit e-District Portal', description: 'Go to the official e-District portal of your state (e.g., edistrict.up.gov.in for UP).' },
            { title: 'Citizen Login', description: 'Log in using your account or register as a new user if you don\'t have one.' },
            { title: 'Select Service', description: 'Search for "Income Certificate" under the Revenue Department services.' },
            { title: 'Fill Application', description: 'Fill in the required details including family income and member information.' },
            { title: 'Upload Proofs', description: 'Upload your Aadhaar card and self-declaration form.' },
            { title: 'Pay Fee', description: 'Complete the nominal fee payment (approx. ₹15-30) online.' }
        ],
        offlineSteps: [
            { title: 'Visit Nearest CSC', description: 'Find your nearest Common Service Center (Jan Seva Kendra).' },
            { title: 'Submit Details', description: 'Provide your Aadhaar card and details of family income to the CSP operator.' },
            { title: 'Verification', description: 'The operator will fill the form and take your thumbprint or signature.' },
            { title: 'Collection', description: 'Collect the receipt. Your certificate will be ready in 7-15 working days.' }
        ],
        requiredDocs: [
            'Aadhaar Card of Applicant',
            'Self-Declaration Form',
            'Salary Slip or Income Proof (if employed)',
            'Passport Size Photo'
        ]
    },
    'caste-certificate': {
        name: 'Caste Certificate',
        code: 'CASTE_CERT',
        description: 'Proof of belonging to a specific caste (SC/ST/OBC). Usually valid for 3 years or permanent depending on state rules.',
        onlineUrl: 'https://edistrict.up.gov.in/',
        onlineSteps: [
            { title: 'Login to Portal', description: 'Access the state e-Services portal using your credentials.' },
            { title: 'Select Caste Service', description: 'Find "Caste Certificate" (SC/ST or OBC) under the Revenue section.' },
            { title: 'Enter Lineage', description: 'Provide details of your father\'s caste certificate or your family tree.' },
            { title: 'Upload Verification', description: 'Upload Aadhaar and your father\'s caste certificate as proof.' },
            { title: 'Submit & Pay', description: 'Submit the application and pay the processing fee.' }
        ],
        offlineSteps: [
            { title: 'Visit Tehsil Office', description: 'Go to the local Sub-Divisional Magistrate (SDM) or Tehsil office.' },
            { title: 'Affidavit', description: 'Submit a caste affidavit signed by a notary or magistrate.' },
            { title: 'Document Submission', description: 'Hand over physical copies of Aadhaar, Ration Card, and older caste proofs.' },
            { title: 'Field Visit', description: 'A local Lekhpal or Patwari may visit for community verification.' }
        ],
        requiredDocs: [
            'Aadhaar Card',
            'Father\'s Caste Certificate (mandatory for most)',
            'Affidavit for Caste Declaration',
            'Ration Card copy'
        ]
    },
    'domicile-certificate': {
        name: 'Domicile Certificate',
        code: 'DOMICILE_CERT',
        description: 'Proof of residential status in a particular state. Valid for 3 years in most states.',
        onlineUrl: 'https://edistrict.up.gov.in/',
        onlineSteps: [
            { title: 'E-District Login', description: 'Log in to the state revenue services portal.' },
            { title: 'Apply for Domicile', description: 'Select "Residence/Domicile Certificate" from the list of services.' },
            { title: 'Residence Proof', description: 'Enter how long you have lived at the current address (min 15 years for most states).' },
            { title: 'Upload Files', description: 'Upload Aadhaar, Electricity Bill, or Voter ID as residency proof.' },
            { title: 'Final Submission', description: 'Submit and save the application number for tracking.' }
        ],
        offlineSteps: [
            { title: 'Common Service Center', description: 'Visit a nearby CSC/Jan Seva Kendra with valid residence proofs.' },
            { title: 'Biometric Check', description: 'The operator may perform biometric verification via Aadhaar.' },
            { title: 'Processing', description: 'The application is routed to the Tehsildar for approval.' }
        ],
        requiredDocs: [
            'Aadhaar Card',
            'Voter ID or Electricity Bill (last few years)',
            'Birth Certificate or School Leaving Certificate',
            'Self-Declaration Form'
        ]
    }
};

export default function DocumentRenewalPage() {
    const { code } = useParams();
    const router = useRouter();

    const docCode = Array.isArray(code) ? code[0] : code;
    const info = RENEWAL_DATABASE[docCode || ''];

    if (!info) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Renewal Guide Not Found</h1>
                <p className="text-gray-600 mb-8">We don't have a specific renewal guide for this document code yet.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Button
                variant="ghost"
                className="mb-6 gap-2"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" /> Back to Documents
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{info.name}</h1>
                        <Badge variant="outline" className="uppercase">{info.code}</Badge>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed">{info.description}</p>
                </div>
                <Card className="w-full md:w-80 shadow-sm border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-amber-800 flex items-center gap-2 text-lg">
                            <AlertCircle className="h-5 w-5" /> Expiry Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-amber-700">
                            This document is marked as <strong>EXPIRED</strong> or <strong>EXPIRING SOON</strong>. Expired documents reduce your eligibility for government schemes.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Guides */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="online" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="online" className="gap-2">
                                <Globe className="h-4 w-4" /> Online Renewal
                            </TabsTrigger>
                            <TabsTrigger value="offline" className="gap-2">
                                <MapPin className="h-4 w-4" /> Offline Renewal
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="online" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        Official Portal
                                    </CardTitle>
                                    <CardDescription>
                                        Renew directly through the state government's e-District portal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border rounded-lg">
                                        <div className="flex-1 truncate text-sm font-mono text-gray-600">
                                            {info.onlineUrl}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => window.open(info.onlineUrl, '_blank')}
                                            className="gap-2"
                                        >
                                            Visit Portal <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <Separator className="my-8" />

                                    <div className="space-y-8 relative">
                                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                        {info.onlineSteps.map((step, idx) => (
                                            <div key={idx} className="flex gap-6 relative">
                                                <div className="flex-none h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold z-10 shadow-sm">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                                                    <p className="text-sm text-gray-600">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 border-t mt-6 flex justify-between">
                                    <p className="text-xs text-gray-500">Typical Processing Time: 7-10 Days</p>
                                    <p className="text-xs text-gray-500">Government Fee: ₹15 - ₹30</p>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="offline" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Visit a CSC / Sahaj Center</CardTitle>
                                    <CardDescription>
                                        Recommended if you lack high-speed internet or digital scanner.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Alert className="mb-8">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Note for CSC Renewal</AlertTitle>
                                        <AlertDescription>
                                            Common Service Centers (Jan Seva Kendra) usually charge a Service Fee of ₹30-50 in addition to the government fee.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-8 relative">
                                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                        {info.offlineSteps.map((step, idx) => (
                                            <div key={idx} className="flex gap-6 relative">
                                                <div className="flex-none h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold z-10 shadow-sm">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                                                    <p className="text-sm text-gray-600">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-auto py-4 px-6 justify-start gap-4 block" onClick={() => window.open('https://www.google.com/maps/search/Common+Service+Center+near+me', '_blank')}>
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        <MapPin className="h-4 w-4 text-primary" /> Locate Nearest CSC
                                    </div>
                                    <div className="text-xs font-normal text-gray-500 text-left">Find centers on Google Maps</div>
                                </Button>
                                <Button variant="outline" className="h-auto py-4 px-6 justify-start gap-4 block">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        <Phone className="h-4 w-4 text-primary" /> Toll Free Helpline
                                    </div>
                                    <div className="text-xs font-normal text-gray-500 text-left">1800-11-2360 (VLE Support)</div>
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Required Docs */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Checklist of Documents</CardTitle>
                            <CardDescription>Documents needed for renewal application.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {info.requiredDocs.map((doc, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded bg-green-50 flex items-center justify-center border border-green-200">
                                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                                        </div>
                                        <span className="text-sm text-gray-700">{doc}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button variant="ghost" className="w-full text-xs text-gray-500 hover:bg-gray-50">
                                Need help preparing these?
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="bg-slate-900 text-white border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <FileText className="h-5 w-5" /> Quick Advice
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-300 text-sm">
                            <p>
                                Aadhaar is the base for most renewals. Ensure your Aadhaar has your current mobile number updated.
                            </p>
                            <p>
                                Always ask for a hard copy of the submission receipt with a <strong>Tracking ID</strong>.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
