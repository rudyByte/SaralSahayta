"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileEligibilitySchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { INDIAN_STATES, getDistrictsByState } from "@/lib/india-data";

interface EligibilityFormProps {
    initialData: any;
    onSave: (data: any) => Promise<void>;
}

export function EligibilityForm({ initialData, onSave }: EligibilityFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(profileEligibilitySchema),
        defaultValues: {
            casteCategory: initialData?.casteCategory || "GENERAL",
            annualIncome: initialData?.annualIncome || 0,
            state: initialData?.state || "",
            district: initialData?.district || "",
            educationLevel: initialData?.educationLevel || "BELOW_10TH",
            occupation: initialData?.occupation || "OTHER",
            disabilityStatus: initialData?.disabilityStatus || false,
            disabilityType: initialData?.disabilityType || "",
        },
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const watchedFields = watch();
    const selectedState = watch("state");
    const disabilityStatus = watch("disabilityStatus");
    const [districts, setDistricts] = useState<string[]>([]);

    // Update districts when state changes
    useEffect(() => {
        if (selectedState) {
            const d = getDistrictsByState(selectedState);
            setDistricts(d);
            // Only reset district if it's not in the new list (to prevent reset on initial load)
            if (!d.includes(initialData?.district) || selectedState !== initialData?.state) {
                // If we manually change state, reset district
                // Check if we are actually changing (not just initial load)
            }
        } else {
            setDistricts([]);
        }
    }, [selectedState, initialData?.state, initialData?.district]);

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
                    <Label htmlFor="casteCategory">Caste Category</Label>
                    <Select id="casteCategory" {...register("casteCategory")}>
                        <option value="GENERAL">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                    </Select>
                    {errors.casteCategory && <p className="text-xs text-destructive">{errors.casteCategory.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="annualIncome">Annual Income (₹)</Label>
                    <Input
                        id="annualIncome"
                        type="number"
                        {...register("annualIncome", { valueAsNumber: true })}
                    />
                    {errors.annualIncome && <p className="text-xs text-destructive">{errors.annualIncome.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">State / UT</Label>
                    <Select
                        id="state"
                        {...register("state")}
                        onChange={(e) => {
                            register("state").onChange(e);
                            setValue("district", ""); // Reset district on state change
                        }}
                    >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select id="district" {...register("district")}>
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                    {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="educationLevel">Education Level</Label>
                    <Select id="educationLevel" {...register("educationLevel")}>
                        <option value="BELOW_10TH">Below 10th</option>
                        <option value="CLASS_10TH">Class 10th</option>
                        <option value="CLASS_12TH">Class 12th</option>
                        <option value="UNDERGRADUATE">Undergraduate</option>
                        <option value="POSTGRADUATE">Postgraduate</option>
                        <option value="DOCTORATE">Doctorate</option>
                    </Select>
                    {errors.educationLevel && <p className="text-xs text-destructive">{errors.educationLevel.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Select id="occupation" {...register("occupation")}>
                        <option value="STUDENT">Student</option>
                        <option value="FARMER">Farmer</option>
                        <option value="ENTREPRENEUR">Entrepreneur</option>
                        <option value="SALARIED">Salaried</option>
                        <option value="UNEMPLOYED">Unemployed</option>
                        <option value="OTHER">Other</option>
                    </Select>
                    {errors.occupation && <p className="text-xs text-destructive">{errors.occupation.message}</p>}
                </div>

                <div className="flex items-center space-x-2 py-4">
                    <input
                        type="checkbox"
                        id="disabilityStatus"
                        {...register("disabilityStatus")}
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                    />
                    <Label htmlFor="disabilityStatus">Person with Disability (PwD)</Label>
                </div>

                {disabilityStatus && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="disabilityType">Disability Type</Label>
                        <Input id="disabilityType" placeholder="e.g. Visual Impairment" {...register("disabilityType")} />
                        {errors.disabilityType && <p className="text-xs text-destructive">{errors.disabilityType.message}</p>}
                    </div>
                )}
            </div>
        </form>
    );
}
