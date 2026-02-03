"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"; // Assuming Dialog is available or will be created

interface LowMatchWarningProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    score: number;
}

export function LowMatchWarning({ isOpen, onClose, onConfirm, score }: LowMatchWarningProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit mb-4">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Low Match Score</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Your profile shows a <span className="font-bold text-gray-900">{score}% match</span> with this scheme.
                        You may not meet all the eligibility criteria.
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-2">
                    <p className="text-sm text-amber-800 leading-relaxed text-center">
                        Applying for schemes where you don't meet the requirements may lead to rejection.
                        Would you like to review your profile or proceed anyway?
                    </p>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.location.href = "/profile"}>
                        Review My Profile
                    </Button>
                    <Button variant="default" className="w-full sm:w-auto" onClick={onConfirm}>
                        Proceed Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
