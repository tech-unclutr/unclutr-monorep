"use client";

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoChipProps {
    id: string;
    name: string;
    logoUrl?: string;
    selected: boolean;
    onToggle: (id: string) => void;
    disabled?: boolean;
}

export function LogoChip({ id, name, logoUrl, selected, onToggle, disabled = false }: LogoChipProps) {
    const isNotApplicable = name.toLowerCase().includes("not applicable");

    return (
        <button
            onClick={() => !disabled && onToggle(id)}
            disabled={disabled}
            className={cn(
                "flex flex-col items-center gap-3 p-2 group transition-all duration-150",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {/* Logo Container */}
            <motion.div
                whileHover={!disabled && !selected ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center relative transition-all duration-150",
                    "border",
                    selected
                        ? "bg-white border-zinc-200 shadow-sm"
                        : isNotApplicable
                            ? "bg-white border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                            : "bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50"
                )}
            >
                {isNotApplicable ? (
                    <div className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center">
                        <Minus size={14} className="text-zinc-400" strokeWidth={1.5} />
                    </div>
                ) : logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={name}
                        className="w-10 h-10 object-contain"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-zinc-400">
                            {name[0]?.toUpperCase() || '?'}
                        </span>
                    </div>
                )}

                {/* Selection Indicator with Animation */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center shadow-sm"
                        >
                            <Check size={12} className="text-white" strokeWidth={2.5} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Label */}
            <span
                className={cn(
                    "text-xs font-medium text-center leading-tight transition-colors line-clamp-2",
                    selected ? "text-zinc-900" : "text-zinc-600 group-hover:text-zinc-900"
                )}
            >
                {name}
            </span>
        </button>
    );
}
