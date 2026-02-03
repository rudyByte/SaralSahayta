"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { BasicInfoForm } from "@/components/profile/basic-info-form";
import { EligibilityForm } from "@/components/profile/eligibility-form";
import { BankDetailsForm } from "@/components/profile/bank-details-form";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ProfilePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (e) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedData: any) => {
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            const json = await res.json();
            if (json.success) {
                setData(json);
                toast.success("Profile updated");
            } else {
                throw new Error(json.error);
            }
        } catch (e: any) {
            toast.error(e.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const completion = data?.completionPercentage || 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-muted-foreground">Manage your information for better scholarship matches.</p>
            </div>

            {/* Completion Widget */}
            <Card className="p-6 border-l-4 border-l-primary">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span>Profile Completion</span>
                            <span>{completion}%</span>
                        </div>
                        <Progress value={completion} className="h-2" />
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                        {completion >= 80 ? (
                            <div className="flex items-center text-green-600 font-medium">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Ready for matching
                            </div>
                        ) : (
                            <div className="flex items-center text-amber-600 font-medium">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Add more info
                            </div>
                        )}
                        {saving && (
                            <div className="flex items-center text-muted-foreground animate-pulse">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Saving...
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                    <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>

                <Card className="p-6">
                    <TabsContent value="basic">
                        <BasicInfoForm initialData={data.user} onSave={handleSave} />
                    </TabsContent>
                    <TabsContent value="eligibility">
                        <EligibilityForm initialData={data.profile} onSave={handleSave} />
                    </TabsContent>
                    <TabsContent value="bank">
                        <BankDetailsForm initialData={data.profile} onSave={handleSave} />
                    </TabsContent>
                </Card>
            </Tabs>

            {completion < 80 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
                    <strong>Pro Tip:</strong> Completing your profile to at least 80% helps our AI matching engine find the most relevant schemes for you including state-specific benefits.
                </div>
            )}
        </div>
    );
}
