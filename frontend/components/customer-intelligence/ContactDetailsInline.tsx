import React, { useState } from 'react';
import { Phone, Pencil, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

interface ContactDetailsInlineProps {
    contactDetails: {
        name: string;
        phone: string;
    };
    onChange: (field: 'name' | 'phone', value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    className?: string;
}

export function ContactDetailsInline({
    contactDetails,
    onChange,
    onSave,
    onCancel,
    className
}: ContactDetailsInlineProps) {
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        onSave();
        setIsEditing(false);
    };

    const handleCancel = () => {
        onCancel();
        setIsEditing(false);
    };

    return (
        <div className={cn("flex items-center gap-2 text-sm", className)}>
            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div
                        key="view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 flex-wrap"
                    >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                            We'll call <span className="font-mono font-medium text-gray-900 dark:text-white">{formatPhoneNumber(contactDetails.phone)}</span> to get your priorities
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="h-6 px-2 text-xs text-gray-500 hover:text-orange-500 hover:bg-orange-500/5"
                        >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-full"
                    >
                        <div className="flex-1 flex flex-col gap-2">
                            <Input
                                value={contactDetails.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                placeholder="Full Name"
                                className="h-8 text-sm"
                            />
                            <PhoneInput
                                value={contactDetails.phone}
                                onChange={(val) => onChange('phone', val)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                size="icon"
                                onClick={handleSave}
                                className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancel}
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
