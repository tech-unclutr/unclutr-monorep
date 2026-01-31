import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, Check, Pencil, Linkedin, AlertCircle } from 'lucide-react';
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
        designation?: string;
        team?: string;
    };
    onChange: (field: 'name' | 'phone' | 'linkedin' | 'designation' | 'team', value: string) => void;
    isSaved: boolean;
    onSave: (isValid: boolean) => void;
    className?: string;
}

type ViewState = 'EDIT' | 'VIEW';

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

export function ContactDetailsCard({ contactDetails, onChange, isSaved, onSave, className }: ContactDetailsCardProps) {
    const [viewState, setViewState] = useState<ViewState>(() => {
        // Default to VIEW if we have the minimum required fields, otherwise EDIT
        if (contactDetails.name && contactDetails.phone) {
            return 'VIEW';
        }
        return 'EDIT';
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync internal state with external saved prop - ONLY when it becomes saved
    useEffect(() => {
        if (isSaved && viewState !== 'VIEW') {
            setViewState('VIEW');
        }
    }, [isSaved]);

    const handleSave = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        // Validate name
        if (!validateName(contactDetails.name)) {
            newErrors.name = "Name must be at least 2 characters.";
            isValid = false;
        }

        // Validate phone number
        if (!validatePhoneNumber(contactDetails.phone)) {
            newErrors.phone = "Valid phone number with country code required.";
            isValid = false;
        }

        // Validate mandatory fields
        if (!contactDetails.designation || contactDetails.designation.length < 2) {
            newErrors.designation = "Designation is required.";
            isValid = false;
        }

        if (!contactDetails.team || contactDetails.team.length < 2) {
            newErrors.team = "Team is required.";
            isValid = false;
        }

        setErrors(newErrors);

        if (!isValid) {
            toast.error("Please fix the errors in the form.");
            return;
        }

        // Mark as saved and switch to view mode
        onSave(true);
        setViewState('VIEW');
        toast.success("Contact details saved!");
    };

    const handleEdit = () => {
        onSave(false); // Mark as unsaved when editing
        setViewState('EDIT');
        setErrors({}); // Clear errors on edit
    };

    return (
        <Card className={cn(
            "border-white/20 dark:border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden group transition-all duration-500 shadow-2xl shadow-black/5 dark:shadow-black/20",
            viewState === 'VIEW'
                ? "bg-emerald-500/5 dark:bg-emerald-500/[0.05] border-emerald-500/20 ring-1 ring-emerald-500/10"
                : "bg-white/60 dark:bg-zinc-900/80 ring-1 ring-white/40 dark:ring-white/5",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-xl transition-colors duration-300 shadow-sm",
                            viewState === 'VIEW'
                                ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                                : "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/20"
                        )}>
                            {viewState === 'VIEW' ? <Check className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold dark:text-white tracking-tight mb-0.5">Your Contact</h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                                {viewState === 'VIEW' ? "Verified & Locked" : "Required for Interview"}
                            </p>
                        </div>
                    </div>

                    {viewState === 'VIEW' && (
                        <div className="flex items-center gap-2">
                            {/* Show Confirm button if we are in VIEW mode but not saved yet (Reviewing) */}
                            {!isSaved && (
                                <Button
                                    size="sm"
                                    onClick={() => onSave(true)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 h-8 text-xs shadow-lg shadow-emerald-500/20"
                                >
                                    Confirm
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEdit}
                                className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all rounded-full px-3 h-8 text-xs border border-transparent hover:border-orange-200 dark:hover:border-orange-500/20"
                            >
                                <Pencil className="w-3 h-3 mr-1.5" />
                                Edit
                            </Button>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {viewState === 'EDIT' ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                    Full Name <span className="text-orange-500 ml-0.5">*</span>
                                </Label>
                                <div className="relative group">
                                    <User className={cn(
                                        "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                                        errors.name ? "text-red-500" : "text-gray-400 group-focus-within:text-orange-500"
                                    )} />
                                    <Input
                                        id="name"
                                        value={contactDetails.name}
                                        onChange={(e) => {
                                            onChange('name', e.target.value);
                                            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                        }}
                                        placeholder="E.g. Elon Musk"
                                        className={cn(
                                            "pl-10 h-10 rounded-lg bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 text-sm shadow-sm focus:bg-white dark:focus:bg-white/10",
                                            errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                        )}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-[10px] text-red-500 font-medium pl-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                    Phone Number <span className="text-orange-500 ml-0.5">*</span>
                                </Label>
                                <PhoneInput
                                    value={contactDetails.phone}
                                    onChange={(val) => {
                                        onChange('phone', val);
                                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                    }}
                                    className={cn(
                                        "h-10 rounded-lg bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-sm shadow-sm",
                                        errors.phone && "ring-1 ring-red-500 border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
                                    )}
                                />
                                {errors.phone && (
                                    <p className="text-[10px] text-red-500 font-medium pl-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="designation" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                        Designation <span className="text-orange-500 ml-0.5">*</span>
                                    </Label>
                                    <Input
                                        id="designation"
                                        value={contactDetails.designation || ''}
                                        onChange={(e) => {
                                            onChange('designation', e.target.value);
                                            if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
                                        }}
                                        placeholder="E.g. Senior PM"
                                        className={cn(
                                            "h-10 rounded-lg bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 text-sm shadow-sm focus:bg-white dark:focus:bg-white/10",
                                            errors.designation && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                        )}
                                    />
                                    {errors.designation && (
                                        <p className="text-[10px] text-red-500 font-medium pl-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {errors.designation}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="team" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                        Team <span className="text-orange-500 ml-0.5">*</span>
                                    </Label>
                                    <Input
                                        id="team"
                                        value={contactDetails.team || ''}
                                        onChange={(e) => {
                                            onChange('team', e.target.value);
                                            if (errors.team) setErrors(prev => ({ ...prev, team: '' }));
                                        }}
                                        placeholder="E.g. Growth"
                                        className={cn(
                                            "h-10 rounded-lg bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 text-sm shadow-sm focus:bg-white dark:focus:bg-white/10",
                                            errors.team && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                        )}
                                    />
                                    {errors.team && (
                                        <p className="text-[10px] text-red-500 font-medium text-right flex justify-end items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {errors.team}
                                        </p>
                                    )}
                                </div>
                            </div>


                            <div className="space-y-1.5">
                                <Label htmlFor="linkedin" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                    LinkedIn URL <span className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-400/80 ml-1 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full tracking-wide">RECOMMENDED</span>
                                </Label>
                                <div className="flex items-center rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all duration-300 shadow-sm focus-within:bg-white dark:focus-within:bg-white/10 group">
                                    <div className="pl-3.5 flex items-center gap-1.5 text-gray-400 select-none cursor-default">
                                        <Linkedin className="w-3.5 h-3.5 text-[#0077B5] fill-current" />
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-focus-within:text-gray-700 dark:group-focus-within:text-gray-200 transition-colors">linkedin.com/in/</span>
                                    </div>
                                    <Input
                                        id="linkedin"
                                        value={contactDetails.linkedin || ''}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val.includes('linkedin.com/in/')) {
                                                val = val.split('linkedin.com/in/')[1].split('/')[0];
                                            }
                                            onChange('linkedin', val);
                                        }}
                                        placeholder="username"
                                        className="border-none shadow-none focus-visible:ring-0 pl-0.5 h-10 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 text-sm"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-gray-200 text-white dark:text-zinc-950 font-bold h-10 shadow-lg shadow-black/5 dark:shadow-white/10 hover:shadow-xl hover:scale-[1.01] hover:from-black hover:to-zinc-900 dark:hover:from-white dark:hover:to-white transition-all duration-300 relative overflow-hidden group text-sm mt-1"
                                onClick={handleSave}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                                <span className="relative">Save Contact Details</span>
                            </Button>
                        </motion.div>

                    ) : (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</Label>
                                <div className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    {contactDetails.name}
                                    <Check className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                            <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</Label>
                                <div className="text-lg font-mono font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    {contactDetails.phone}
                                    <Check className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>

                            {(contactDetails.designation || contactDetails.team) && (
                                <>
                                    <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                                    <div className="grid grid-cols-2 gap-4">
                                        {contactDetails.designation && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Designation</Label>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                    {contactDetails.designation}
                                                </div>
                                            </div>
                                        )}
                                        {contactDetails.team && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team</Label>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                    {contactDetails.team}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {contactDetails.linkedin && (
                                <>
                                    <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LinkedIn</Label>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2 truncate">
                                            <a href={`https://linkedin.com/in/${contactDetails.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2 truncate group">
                                                <svg className="w-4 h-4 text-[#0077b5] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20.447 20.452H16.892V14.881C16.892 13.553 16.865 11.844 15.039 11.844C13.187 11.844 12.903 13.287 12.903 14.786V20.452H9.349V9H12.756V10.562H12.805C13.279 9.662 14.44 8.712 16.172 8.712C19.773 8.712 20.447 11.082 20.447 14.152V20.452ZM5.337 7.433C4.197 7.433 3.274 6.51 3.274 5.37C3.274 4.23 4.196 3.307 5.337 3.307C6.477 3.307 7.4 4.23 7.4 5.37C7.4 6.51 6.477 7.433 5.337 7.433ZM3.56 20.452H7.114V9H3.561V20.452H3.56ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.2 24 24 23.227 24 22.271V1.729C24 0.774 23.2 0 22.222 0H22.225Z" />
                                                </svg>
                                                <span className="truncate text-sm text-[#0077b5] dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">linkedin.com/in/{contactDetails.linkedin}</span>
                                            </a>
                                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-2">
                                {isSaved && (
                                    <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">
                                        <AnimatedShieldCheck key={viewState} className="w-5 h-5 text-emerald-500" />
                                        Securely Saved
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card >
    );
}
