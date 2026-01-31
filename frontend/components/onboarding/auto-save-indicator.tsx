"use client";

import React, { useEffect, useState } from 'react';
import { Check, Loader2, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutoSaveIndicatorProps {
    isSaving: boolean;
    lastSavedAt?: Date | number | null;
}

export function AutoSaveIndicator({ isSaving, lastSavedAt }: AutoSaveIndicatorProps) {
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        if (!isSaving && lastSavedAt) {
            setShowSaved(true);
            const timer = setTimeout(() => setShowSaved(false), 3000); // Hide after 3s
            return () => clearTimeout(timer);
        }
    }, [isSaving, lastSavedAt]);

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-transparent transition-all duration-300">
                {isSaving ? (
                    <>
                        <Loader2 size={14} className="animate-spin text-orange-600" />
                        <span className="text-xs font-medium text-orange-600">Auto saving...</span>
                    </>
                ) : (
                    <>
                        <Cloud size={14} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500">Auto saved</span>
                    </>
                )}
            </div>
        </div>
    );
}
