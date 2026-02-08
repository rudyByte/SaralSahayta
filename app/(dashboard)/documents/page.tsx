'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    RefreshCw,
    ExternalLink,
    Search,
    Trash2,
    HelpCircle,
    Globe,
    MapPin,
    Phone,
    Clock as ClockIcon
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DocumentUpload } from '@/components/documents/document-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Type definitions
interface Document {
    id: string;
    document_code: string;
    document_name: string;
    category: string;
    description?: string;
    is_common: boolean;
    procurement_guide?: {
        steps: { title: string; description: string }[];
    };
    portal_url?: string;
}

interface OfficeAddress {
    id: string;
    document_id?: string;
    state: string;
    office_name: string;
    address: string;
    contact_number?: string;
    working_hours?: string;
    location_url?: string;
    office_type?: string;
}

interface UserDocument {
    id: string;
    document_id: string;
    user_id: string;
    file_url: string;
    file_name: string;
    verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    rejection_reason?: string;
    expiry_date?: string;
    created_at: string;
    updated_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DocumentsPage() {
    const { data: masterDocsData, error: masterError } = useSWR('/api/documents/master', fetcher);
    const { data: userDocsData, error: userError } = useSWR('/api/documents', fetcher);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [selectedDocForUpload, setSelectedDocForUpload] = useState<Document | null>(null);
    const [selectedDocForGuide, setSelectedDocForGuide] = useState<Document | null>(null);

    const isLoading = !masterDocsData || !userDocsData;

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (masterError || userError) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Failed to load documents</h2>
                <p className="text-gray-600 mb-6">Please try refreshing the page</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    const masterDocuments: Document[] = masterDocsData.documents || [];
    const officeAddresses: OfficeAddress[] = masterDocsData.officeAddresses || [];
    const userDocuments: UserDocument[] = userDocsData.documents || [];

    // Filter documents
    const filteredDocs = masterDocuments.filter(doc => {
        const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.document_code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory ? doc.category === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(masterDocuments.map(d => d.category))).filter(Boolean);

    const handleUploadSuccess = () => {
        toast.success('Document uploaded successfully');
        mutate('/api/documents'); // Refresh user documents
        setSelectedDocForUpload(null); // Close dialog
    };

    const handleDelete = async (documentId: string) => {
        try {
            const response = await fetch(`/api/documents/delete?id=${documentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            toast.success('Document deleted successfully');
            mutate('/api/documents');
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
                <p className="text-gray-600">Manage your verified documents for quick application to schemes.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={filterCategory === null ? 'default' : 'outline'}
                        onClick={() => setFilterCategory(null)}
                        className="whitespace-nowrap"
                    >
                        All
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={filterCategory === cat ? 'default' : 'outline'}
                            onClick={() => setFilterCategory(cat)}
                            className="whitespace-nowrap capitalize"
                        >
                            {cat?.toLowerCase().replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map(doc => {
                    const userDoc = userDocuments.find(ud => ud.document_id === doc.id);
                    const status = userDoc?.verification_status || 'MISSING';

                    return (
                        <div key={doc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col relative">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary-50 rounded-lg">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={status} />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full text-blue-600 hover:bg-blue-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDocForGuide(doc);
                                            }}
                                            title="How to get this document?"
                                        >
                                            <HelpCircle className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.document_name}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{doc.description}</p>

                                {userDoc && (
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Uploaded: {new Date(userDoc.created_at).toLocaleDateString()}
                                        </div>
                                        {userDoc.expiry_date && (
                                            <div className="flex items-center text-xs text-amber-600">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Expires: {new Date(userDoc.expiry_date).toLocaleDateString()}
                                            </div>
                                        )}
                                        {status === 'REJECTED' && userDoc.rejection_reason && (
                                            <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                                                <strong>Reason:</strong> {userDoc.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                                {status === 'MISSING' ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full gap-2" onClick={() => setSelectedDocForUpload(doc)}>
                                                <Upload className="h-4 w-4" />
                                                Upload Document
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Upload {doc.document_name}</DialogTitle>
                                            </DialogHeader>
                                            <DocumentUpload
                                                documentCode={doc.document_code}
                                                documentName={doc.document_name}
                                                onUploadSuccess={handleUploadSuccess}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`/api/documents/download?id=${userDoc?.id}`);
                                                    const data = await response.json();
                                                    if (data.signedUrl) {
                                                        window.open(data.signedUrl, '_blank');
                                                    } else {
                                                        toast.error('Failed to generate download link');
                                                    }
                                                } catch (error) {
                                                    toast.error('Failed to open document');
                                                }
                                            }}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            View
                                        </Button>

                                        {status !== 'VERIFIED' && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Replace Document" onClick={() => setSelectedDocForUpload(doc)}>
                                                        <RefreshCw className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Replace {doc.document_name}</DialogTitle>
                                                    </DialogHeader>
                                                    <DocumentUpload
                                                        documentCode={doc.document_code}
                                                        documentName={doc.document_name}
                                                        onUploadSuccess={handleUploadSuccess}
                                                    />
                                                </DialogContent>
                                            </Dialog>

                                        )}

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete Document">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your document.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => userDoc && handleDelete(userDoc.id)}
                                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {
                filteredDocs.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No documents found matching your search.</p>
                    </div>
                )
            }
            {/* Procurement Guide Modal */}
            <Dialog open={!!selectedDocForGuide} onOpenChange={(open) => !open && setSelectedDocForGuide(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <span className="p-1 bg-blue-100 rounded-md text-blue-700">
                                <HelpCircle className="h-5 w-5" />
                            </span>
                            How to get: {selectedDocForGuide?.document_name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden mt-2">
                        <Tabs defaultValue="online" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="online">Online Process</TabsTrigger>
                                <TabsTrigger value="offline">Offline / In-Person</TabsTrigger>
                            </TabsList>

                            <TabsContent value="online" className="flex-1 overflow-hidden mt-4">
                                <ScrollArea className="h-[50vh] pr-4">
                                    <div className="space-y-6">
                                        {selectedDocForGuide?.portal_url && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                    <Globe className="h-4 w-4" /> Official Portal
                                                </h4>
                                                <div className="flex items-center gap-3 bg-white p-2 rounded border border-blue-200">
                                                    <code className="text-sm flex-1 text-gray-600 truncate">{selectedDocForGuide.portal_url}</code>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedDocForGuide.portal_url!);
                                                            toast.success('URL copied to clipboard');
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => window.open(selectedDocForGuide.portal_url, '_blank')}
                                                    >
                                                        Visit
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-900">Step-by-Step Guide</h4>
                                            {selectedDocForGuide?.procurement_guide?.steps?.length ? (
                                                <div className="relative border-l-2 border-blue-100 ml-3 pl-6 space-y-8">
                                                    {selectedDocForGuide.procurement_guide.steps.map((step, idx) => (
                                                        <div key={idx} className="relative">
                                                            <div className="absolute -left-[31px] bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">
                                                                {idx + 1}
                                                            </div>
                                                            <h5 className="font-medium text-gray-900 mb-1">{step.title}</h5>
                                                            <p className="text-sm text-gray-600">{step.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                                    No specific online guide available for this document.
                                                    Please check the official portal.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="offline" className="flex-1 overflow-hidden mt-4">
                                <ScrollArea className="h-[50vh] pr-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900">Nearby Offices</h4>
                                            {officeAddresses.length > 0 && (
                                                <Badge variant="secondary">{officeAddresses[0].state}</Badge>
                                            )}
                                        </div>

                                        {officeAddresses.filter(addr => addr.document_id === selectedDocForGuide?.id).length > 0 ? (
                                            <div className="grid gap-4">
                                                {officeAddresses
                                                    .filter(addr => addr.document_id === selectedDocForGuide?.id)
                                                    .map((office) => (
                                                        <div key={office.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-gray-500" />
                                                                    {office.office_name}
                                                                </div>
                                                                {office.office_type && (
                                                                    <Badge variant="outline" className="text-xs">{office.office_type}</Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 ml-6 mb-3">{office.address}</p>

                                                            <div className="flex flex-wrap gap-4 ml-6 text-xs text-gray-500">
                                                                {office.working_hours && (
                                                                    <div className="flex items-center gap-1">
                                                                        <ClockIcon className="h-3 w-3" />
                                                                        {office.working_hours}
                                                                    </div>
                                                                )}
                                                                {office.contact_number && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Phone className="h-3 w-3" />
                                                                        {office.contact_number}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {office.location_url && (
                                                                <div className="ml-6 mt-3">
                                                                    <a
                                                                        href={office.location_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                                    >
                                                                        View on Maps <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                                <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-900 font-medium">No offices found nearby</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    We couldn't find specific offices for this document in your state.
                                                    Please try looking for "Tehsil Office" or "CSC Center" on Google Maps.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => window.open(`https://www.google.com/maps/search/${selectedDocForGuide?.document_name}+near+me`, '_blank')}
                                                >
                                                    Search on Google Maps
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'VERIFIED':
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
        case 'PENDING':
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
        case 'REJECTED':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"><AlertCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
        default:
            return <Badge variant="outline" className="text-gray-500 border-gray-200">Missing</Badge>;
    }
}
