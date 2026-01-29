import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, Check, Pencil, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContactDetailsCardProps {
    contactDetails: {
        name: string;
        phone: string;
    };
    onChange: (field: 'name' | 'phone', value: string) => void;
    isSaved: boolean;
    onSave: (isValid: boolean) => void;
    className?: string;
}

type ViewState = 'EDIT' | 'VIEW';

// Validation helper functions
const validatePhoneNumber = (phone: string): boolean => {
    // Phone format: "+XX XXXXXXXXXX"
    // Must have country code (starts with +) and at least 10 digits
    const parts = phone.trim().split(' ');
    if (parts.length < 2 || !parts[0].startsWith('+')) {
        return false;
    }

    // Extract just the digits from the number part (excluding country code)
    const numberPart = parts.slice(1).join('').replace(/\D/g, '');
    return numberPart.length >= 10;
};

const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
};

export function ContactDetailsCard({ contactDetails, onChange, isSaved, onSave, className }: ContactDetailsCardProps) {
    const [viewState, setViewState] = useState<ViewState>(isSaved ? 'VIEW' : 'EDIT');

    // Sync internal state with external saved prop
    useEffect(() => {
        if (isSaved && viewState !== 'VIEW') {
            setViewState('VIEW');
        } else if (!isSaved && viewState === 'VIEW') {
            setViewState('EDIT');
        }
    }, [isSaved]);

    const handleSave = () => {
        // Validate name
        if (!validateName(contactDetails.name)) {
            toast.error("Please enter a valid name (at least 2 characters).");
            return;
        }

        // Validate phone number
        if (!validatePhoneNumber(contactDetails.phone)) {
            toast.error("Please enter a valid phone number with country code (at least 10 digits).");
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
    };

    return (
        <Card className={cn(
            "border-gray-100/50 dark:border-white/[0.03] backdrop-blur-md rounded-[2.5rem] overflow-hidden group transition-colors duration-500",
            viewState === 'VIEW'
                ? "bg-emerald-500/5 dark:bg-emerald-500/[0.02] border-emerald-500/10"
                : "bg-white/40 dark:bg-white/[0.01]",
            className
        )}>
            <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-3 rounded-2xl transition-colors duration-300",
                            viewState === 'VIEW' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                        )}>
                            {viewState === 'VIEW' ? <Check className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold dark:text-white">Your Contact</h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                                {viewState === 'VIEW' ? "Saved & Locked" : "Required for Interview"}
                            </p>
                        </div>
                    </div>

                    {viewState === 'VIEW' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEdit}
                            className="text-gray-400 hover:text-orange-500 hover:bg-orange-500/5 transition-colors"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {viewState === 'EDIT' ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        value={contactDetails.name}
                                        onChange={(e) => onChange('name', e.target.value)}
                                        placeholder="E.g. Elon Musk"
                                        className="pl-10 h-12 rounded-xl bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
                                    Phone Number
                                </Label>
                                <PhoneInput
                                    value={contactDetails.phone}
                                    onChange={(val) => onChange('phone', val)}
                                    className="h-12 rounded-xl bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus-within:ring-orange-500/30 focus-within:border-orange-500 transition-all duration-300"
                                />
                            </div>

                            <Button
                                className="w-full rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-gray-200 text-white dark:text-zinc-950 font-bold h-11 shadow-lg shadow-black/5 dark:shadow-white/10 hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
                                onClick={handleSave}
                            >
                                Save Contact Details
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

                            <div className="pt-2">
                                <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    <Check className="w-4 h-4" />
                                    Contact Saved
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card >
    );
}
