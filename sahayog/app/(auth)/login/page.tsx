"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"PHONE" | "OTP" | "PROFILE">("PHONE");
    const [loading, setLoading] = useState(false);

    // Form State
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [profile, setProfile] = useState({
        fullName: "",
        dateOfBirth: "",
        gender: "",
        email: "",
    });

    // Handle Send OTP
    const handleSendOtp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            setStep("OTP");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Verify OTP
    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Sign in with NextAuth Credentials
            const signInRes = await signIn("credentials", {
                token: data.token,
                redirect: false,
            });

            if (signInRes?.error) {
                throw new Error("Login failed");
            }

            if (data.isNewUser) {
                toast.success("Phone verified! Please complete your profile.");
                setStep("PROFILE");
            } else {
                toast.success("Login successful!");
                router.push("/discover");
            }
        } catch (error: any) {
            toast.error(error.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // Handle Profile Completion
    const handleCompleteProfile = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Refresh session to update user data
            // Force reload or useSession update (simpler to reload/redirect)
            toast.success("Profile created successfully!");
            router.push("/discover");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-primary">SahayoG</h1>
                    <p className="text-gray-500">Scholarship Aggregation Platform</p>
                </div>

                {/* STEP 1: PHONE INPUT */}
                {step === "PHONE" && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <Input
                                id="phone"
                                placeholder="Enter 10-digit number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength={10}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || phone.length !== 10}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send OTP
                        </Button>
                    </form>
                )}

                {/* STEP 2: OTP INPUT */}
                {step === "OTP" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label>OTP Sent to +91 {phone}</Label>
                            <Input
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                required
                                className="text-center text-lg tracking-widest"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify OTP
                        </Button>
                        <div className="text-center text-sm">
                            <button type="button" onClick={() => setStep("PHONE")} className="text-primary hover:underline">
                                Change Number
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: PROFILE COMPLETION */}
                {step === "PROFILE" && (
                    <form onSubmit={handleCompleteProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={profile.fullName}
                                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={profile.dateOfBirth}
                                onChange={e => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                id="gender"
                                value={profile.gender}
                                onChange={e => setProfile({ ...profile, gender: e.target.value })}
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Complete Registration
                        </Button>
                    </form>
                )}
            </Card>

            {/* Disclaimer / Footer */}
            <div className="fixed bottom-4 text-center text-xs text-gray-400">
                &copy; 2026 SahayoG Foundation. All rights reserved.
            </div>
        </div>
    );
}
