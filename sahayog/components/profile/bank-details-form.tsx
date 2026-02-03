"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileBankSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { validateIFSC, BankInfo } from "@/lib/ifsc";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface BankDetailsFormProps {
    initialData: any;
    onSave: (data: any) => Promise<void>;
}

export function BankDetailsForm({ initialData, onSave }: BankDetailsFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(profileBankSchema),
        defaultValues: {
            bankAccount: initialData?.bankAccount || "",
            bankIFSC: initialData?.bankIFSC || "",
        },
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const watchedFields = watch();
    const ifscValue = watch("bankIFSC");

    const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
    const [ifscLoading, setIfscLoading] = useState(false);

    // IFSC Lookup Logic
    useEffect(() => {
        const lookup = async () => {
            if (ifscValue?.length === 11) {
                setIfscLoading(true);
                const info = await validateIFSC(ifscValue);
                setBankInfo(info);
                setIfscLoading(false);
            } else {
                setBankInfo(null);
            }
        };
        lookup();
    }, [ifscValue]);

    useEffect(() => {
        if (isDirty) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                handleSubmit(onSave)();
            }, 3000);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [watchedFields, isDirty, handleSubmit, onSave]);

    return (
        <form className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                    <Input
                        id="bankAccount"
                        placeholder="9-18 digit account number"
                        {...register("bankAccount")}
                    />
                    {errors.bankAccount && <p className="text-xs text-destructive">{errors.bankAccount.message}</p>}
                    <p className="text-xs text-muted-foreground italic">Your data is encrypted and secure.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bankIFSC">IFSC Code</Label>
                    <div className="relative">
                        <Input
                            id="bankIFSC"
                            placeholder="e.g. SBIN0001234"
                            className="uppercase"
                            {...register("bankIFSC")}
                            maxLength={11}
                        />
                        <div className="absolute right-3 top-2">
                            {ifscLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                            {!ifscLoading && bankInfo?.valid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {!ifscLoading && bankInfo && !bankInfo.valid && ifscValue?.length === 11 && <AlertCircle className="h-5 w-5 text-destructive" />}
                        </div>
                    </div>
                    {errors.bankIFSC && <p className="text-xs text-destructive">{errors.bankIFSC.message}</p>}
                </div>

                {bankInfo?.valid && (
                    <div className="col-span-full bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start space-x-3 transition-all animate-in fade-in">
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">{bankInfo.bankName}</p>
                            <p className="text-xs text-blue-700">{bankInfo.branch}</p>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
}
