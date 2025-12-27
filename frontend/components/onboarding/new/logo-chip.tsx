"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface LogoChipProps {
    id: string;
    name: string;
    logoUrl?: string;
    selected: boolean;
    onToggle: (id: string) => void;
    disabled?: boolean;
}

export function LogoChip({
    id,
    name,
    logoUrl,
    selected,
    onToggle,
    disabled
}: LogoChipProps) {
    return (
        <motion.button
            type="button"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !disabled && onToggle(id)}
            className={`group flex flex-col items-center gap-3 p-2 relative outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
        >
            {/* Icon Container */}
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${selected
                ? 'bg-white border border-zinc-800 shadow-sm'
                : 'bg-white border border-zinc-100 group-hover:border-zinc-300 group-hover:shadow-md'
                }`}>
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={name}
                        className="w-10 h-10 object-contain transition-all duration-300"
                    />
                ) : (
                    <span className={`text-sm font-bold uppercase transition-colors ${selected ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        {name.substring(0, 2)}
                    </span>
                )}
            </div>

            {/* Label */}
            <span className={`text-xs font-medium text-center max-w-[80px] leading-tight transition-colors ${selected ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-900'
                }`}>
                {name}
            </span>
        </motion.button>
    );
}
