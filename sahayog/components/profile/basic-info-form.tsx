"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileBasicSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface BasicInfoFormProps {
    initialData: any;
    onSave: (data: any) => Promise<void>;
}

export function BasicInfoForm({ initialData, onSave }: BasicInfoFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(profileBasicSchema),
        defaultValues: {
            fullName: initialData?.fullName || "",
            email: initialData?.email || "",
            dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : "",
            gender: initialData?.gender || "",
        },
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const watchedFields = watch();

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
        <form className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register("fullName")} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex items-center space-x-2">
                        <Input value={initialData?.phone} disabled className="bg-muted" />
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                    {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select id="gender" {...register("gender")}>
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                    </Select>
                    {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                </div>
            </div>
        </form>
    );
}
