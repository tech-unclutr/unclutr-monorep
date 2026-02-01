import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Check, Pencil, Linkedin, AlertCircle, Briefcase, Building2, Lock, Unlock } from 'lucide-react';
import { AnimatedShieldCheck } from "@/components/ui/AnimatedShieldCheck";
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContactDetailsCardProps {
    contactDetails: {
        name: string;
        phone: string;
        linkedin?: string;
        role?: string;       // Renamed from designation
        department?: string; // Renamed from team
    };
    onChange: (field: 'name' | 'phone' | 'linkedin' | 'role' | 'department', value: string) => void;
    isSaved: boolean;
    onSave: (isValid: boolean) => void;
    className?: string;
}

type ViewState = 'EDIT' | 'VIEW' | 'Unlocking';

// Validation helper functions
const validatePhoneNumber = (phone: string): boolean => {
    const parts = phone.trim().split(' ');
    if (parts.length < 2 || !parts[0].startsWith('+')) {
        return false;
    }
    const numberPart = parts.slice(1).join('').replace(/\D/g, '');
    return numberPart.length >= 10;
};

const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
};

const extractLinkedinHandle = (url: string | undefined): string => {
    if (!url) return '';
    // Handle full URLs
    if (url.includes('linkedin.com/in/')) {
        const parts = url.split(/linkedin\.com\/in\//i);
        if (parts.length > 1) {
            return parts[1].split('/')[0].split('?')[0];
        }
    }
    // Handle simple cleanup if it's just a handle or partial
    return url.split('/')[0].split('?')[0];
};

export function ContactDetailsCard({ contactDetails, onChange, isSaved, isLoading, onSave, className }: ContactDetailsCardProps) {
    const [viewState, setViewState] = useState<ViewState>(() => {
        if (contactDetails.name && contactDetails.phone && contactDetails.role && contactDetails.department) {
            return 'VIEW';
        }
        return 'EDIT';
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync internal state with external saved/loading props
    useEffect(() => {
        if (isLoading) {
            setViewState('Unlocking');
        } else if (isSaved && viewState !== 'VIEW') {
            // If saved externally and not loading, switch to VIEW
            setViewState('VIEW');
        } else if (!isLoading && !isSaved && viewState === 'Unlocking') {
            // If loading finished but not saved (error case), reset to EDIT
            setViewState('EDIT');
        }
    }, [isSaved, isLoading, viewState]);

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (!validateName(contactDetails.name)) {
            newErrors.name = "Name must be at least 2 characters.";
            isValid = false;
        }

        if (!validatePhoneNumber(contactDetails.phone)) {
            newErrors.phone = "Valid phone number with country code required.";
            isValid = false;
        }

        if (!contactDetails.role || contactDetails.role.length < 2) {
            newErrors.role = "Role is required.";
            isValid = false;
        }

        if (!contactDetails.department || contactDetails.department.length < 2) {
            newErrors.department = "Department is required.";
            isValid = false;
        }

        setErrors(newErrors);

        if (!isValid) {
            // Shake animation or toast?
            const form = document.getElementById('contact-form');
            if (form) form.classList.add('shake');
            setTimeout(() => form?.classList.remove('shake'), 400);
            return;
        }

        setIsSubmitting(true);
        // Trigger save callback. If it's a promise, we await it?
        // The parent onSave just triggers a function. 
        // We can simulate an "Unlocking" state here for effect
        setViewState('Unlocking');

        // Wait a small delay for animation effect if we want, or just call onSave immediately
        // But the parent is responsible for API call.
        onSave(true);

        // Note: The parent should handle the actual "Success" state (setting isSaved=true).
        // If parent fails, we should revert. But let's assume success for the optimistic UI.
        // We'll reset submitting when effect updates viewState to VIEW
    };

    const handleEdit = () => {
        onSave(false); // Mark as unsaved
        setViewState('EDIT');
        setErrors({});
    };

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-700 ease-out",
            "border-white/10 dark:border-white/5 backdrop-blur-2xl shadow-2xl",
            viewState === 'VIEW'
                ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/10 rounded-[2.5rem]"
                : "bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-white/10 rounded-[2rem]",
            className
        )}>
            {/* Ambient Background Effects */}
            <div className={cn(
                "absolute inset-0 pointer-events-none transition-opacity duration-1000 overflow-hidden",
                viewState === 'VIEW' ? "opacity-100" : "opacity-0"
            )}>
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(16,185,129,0.1),transparent_50%)]" />
                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_100%,rgba(99,102,241,0.05),transparent_50%)]" />
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full animate-pulse" />
            </div>

            <CardContent className="p-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <motion.div
                            layout
                            className={cn(
                                "flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-colors duration-500",
                                viewState === 'VIEW'
                                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                                    : "bg-orange-50 dark:bg-orange-500/10 text-orange-500 ring-1 ring-orange-200 dark:ring-orange-500/20"
                            )}>
                            {viewState === 'VIEW' ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </motion.div>

                        <div className="flex flex-col">
                            <motion.h3 layout className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400 tracking-tight leading-none">
                                {viewState === 'VIEW' ? "Access Granted" : "Identity Verification"}
                            </motion.h3>
                            <motion.p layout className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 mt-1.5">
                                {viewState === 'VIEW' ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        Context Active
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                        Operational Verification
                                    </>
                                )}
                            </motion.p>
                        </div>
                    </div>

                    {viewState === 'VIEW' && !isSubmitting && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEdit}
                            className="p-2 rounded-full text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-white/5 transition-colors"
                            title="Edit Details"
                        >
                            <Pencil className="w-4 h-4" />
                        </motion.button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {viewState === 'EDIT' || viewState === 'Unlocking' ? (
                        <motion.div
                            id="contact-form"
                            key="edit"
                            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            className="space-y-6"
                        >
                            {/* Row 1: Name & Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-orange-500 transition-colors">
                                        Full Name
                                    </Label>
                                    <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                                        <User className={cn(
                                            "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                            errors.name ? "text-red-500" : "text-gray-400 group-focus-within:text-orange-500"
                                        )} />
                                        <Input
                                            value={contactDetails.name}
                                            onChange={(e) => {
                                                onChange('name', e.target.value);
                                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                            }}
                                            disabled={viewState === 'Unlocking'}
                                            placeholder="Peter Thiel"
                                            className={cn(
                                                "pl-10 h-11 rounded-xl bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10",
                                                "focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white dark:focus:bg-black/40",
                                                "transition-all duration-300 text-sm font-medium shadow-sm",
                                                errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                            )}
                                        />
                                    </div>
                                    {errors.name && <p className="text-[10px] text-red-500 pl-1">{errors.name}</p>}
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-orange-500 transition-colors">
                                        Phone Number
                                    </Label>
                                    <div className="transform transition-all duration-300 group-focus-within:scale-[1.02]">
                                        <PhoneInput
                                            value={contactDetails.phone}
                                            onChange={(val) => {
                                                onChange('phone', val);
                                                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                            }}
                                            disabled={viewState === 'Unlocking'}
                                            className={cn(
                                                "h-11 rounded-xl bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10 text-sm shadow-sm",
                                                "focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500",
                                                errors.phone && "ring-1 ring-red-500 border-red-500"
                                            )}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-[10px] text-red-500 pl-1">{errors.phone}</p>}
                                </div>
                            </div>

                            {/* Row 2: Role & Department */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-orange-500 transition-colors">
                                        Role
                                    </Label>
                                    <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                                        <Briefcase className={cn(
                                            "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                            errors.role ? "text-red-500" : "text-gray-400 group-focus-within:text-orange-500"
                                        )} />
                                        <Input
                                            value={contactDetails.role || ''}
                                            onChange={(e) => {
                                                onChange('role', e.target.value);
                                                if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                                            }}
                                            disabled={viewState === 'Unlocking'}
                                            placeholder="Founding Engineer"
                                            className={cn(
                                                "pl-10 h-11 rounded-xl bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10",
                                                "focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white dark:focus:bg-black/40",
                                                "transition-all duration-300 text-sm font-medium shadow-sm",
                                                errors.role && "border-red-500 focus:border-red-500"
                                            )}
                                        />
                                    </div>
                                    {errors.role && <p className="text-[10px] text-red-500 pl-1">{errors.role}</p>}
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-orange-500 transition-colors">
                                        Department
                                    </Label>
                                    <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                                        <Building2 className={cn(
                                            "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                            errors.department ? "text-red-500" : "text-gray-400 group-focus-within:text-orange-500"
                                        )} />
                                        <Input
                                            value={contactDetails.department || ''}
                                            onChange={(e) => {
                                                onChange('department', e.target.value);
                                                if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
                                            }}
                                            disabled={viewState === 'Unlocking'}
                                            placeholder="Engineering"
                                            className={cn(
                                                "pl-10 h-11 rounded-xl bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10",
                                                "focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white dark:focus:bg-black/40",
                                                "transition-all duration-300 text-sm font-medium shadow-sm",
                                                errors.department && "border-red-500 focus:border-red-500"
                                            )}
                                        />
                                    </div>
                                    {errors.department && <p className="text-[10px] text-red-500 pl-1">{errors.department}</p>}
                                </div>
                            </div>

                            {/* LinkedIn (Optional) */}
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                                    LinkedIn <span className="opacity-50 font-normal normal-case ml-1 text-[10px]">(Optional)</span>
                                </Label>
                                <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.005]">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Linkedin className="w-4 h-4 text-[#0077B5]" />
                                    </div>
                                    <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none pointer-events-none whitespace-nowrap">
                                        linkedin.com/in/
                                    </div>
                                    <Input
                                        value={extractLinkedinHandle(contactDetails.linkedin)}
                                        onChange={(e) => {
                                            onChange('linkedin', extractLinkedinHandle(e.target.value));
                                        }}
                                        disabled={viewState === 'Unlocking'}
                                        className={cn(
                                            "pl-[152px] md:pl-[156px] h-11 rounded-xl bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-white/10",
                                            "focus:ring-4 focus:ring-[#0077b5]/10 focus:border-[#0077b5] focus:bg-white dark:focus:bg-black/40",
                                            "transition-all duration-300 text-sm shadow-sm"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all duration-500 text-white relative overflow-hidden",
                                        viewState === 'Unlocking'
                                            ? "bg-emerald-500 cursor-wait"
                                            : "bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-gray-200 dark:text-zinc-950 hover:shadow-orange-500/10"
                                    )}
                                    onClick={handleSave}
                                    disabled={viewState === 'Unlocking'}
                                >
                                    {viewState === 'Unlocking' ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Start Intelligence Engine...</span>
                                        </motion.div>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Unlock Customer Intelligence
                                            <Unlock className="w-4 h-4 opacity-70" />
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        // VIEW STATE
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-emerald-600/50 dark:text-emerald-400/30 uppercase tracking-[0.2em] ml-0.5">Primary Holder</Label>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        {contactDetails.name}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-emerald-600/50 dark:text-emerald-400/30 uppercase tracking-[0.2em] ml-0.5">Operational Role</Label>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        {contactDetails.role}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-emerald-600/50 dark:text-emerald-400/30 uppercase tracking-[0.2em] ml-0.5">Direct Reach</Label>
                                    <div
                                        className="text-sm sm:text-base lg:text-lg font-mono font-bold text-gray-900 dark:text-emerald-400/90 tracking-tight whitespace-nowrap"
                                    >
                                        {contactDetails.phone}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-emerald-600/50 dark:text-emerald-400/30 uppercase tracking-[0.2em] ml-0.5">Strategic Unit</Label>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        {contactDetails.department}
                                    </div>
                                </div>
                            </div>

                            {contactDetails.linkedin && (
                                <div className="pt-2">
                                    <Label className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/50 uppercase tracking-widest">Profile</Label>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-[#0077b5] dark:text-blue-400">
                                        <Linkedin className="w-4 h-4 fill-current" />
                                        <span className="underline decoration-blue-500/30 underline-offset-4">linkedin.com/in/{extractLinkedinHandle(contactDetails.linkedin)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Secured Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 0.5,
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20
                                }}
                                className="pt-6 flex justify-center"
                            >
                                <div className="group relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="relative px-6 py-2.5 rounded-full bg-white/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-emerald-500/5 transition-all group-hover:bg-emerald-500/[0.15] group-hover:border-emerald-500/40">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-sm rounded-full animate-ping" />
                                            <AnimatedShieldCheck className="w-4 h-4 text-emerald-500 relative z-10" />
                                        </div>
                                        IDENTITY VERIFIED & SECURED
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card >
    );
}
