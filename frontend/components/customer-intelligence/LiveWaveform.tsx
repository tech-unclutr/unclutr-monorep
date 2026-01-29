"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface LiveWaveformProps {
    isActive: boolean;
    className?: string;
}

export function LiveWaveform({ isActive, className }: LiveWaveformProps) {
    // Generate bars for the waveform
    const bars = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className={cn("relative flex items-center justify-center gap-1.5 h-16 w-32", className)}>
            {bars.map((i) => (
                <motion.div
                    key={i}
                    animate={isActive ? {
                        height: [
                            '20%',
                            `${30 + Math.random() * 70}%`,
                            `${20 + Math.random() * 40}%`,
                            '20%'
                        ],
                        backgroundColor: isActive ? [
                            '#FF8A4C', // Orange
                            '#F59E0B', // Amber
                            '#EC4899', // Pink
                            '#FF8A4C'
                        ] : '#94A3B8'
                    } : {
                        height: '10%',
                        backgroundColor: '#94A3B8'
                    }}
                    transition={{
                        duration: 0.6 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.05
                    }}
                    className="w-1.5 rounded-full bg-slate-400 opacity-80"
                />
            ))}

            {/* Soft glow background */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.2, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-orange-500/30 blur-2xl rounded-full -z-10"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

import { AnimatePresence } from 'framer-motion';
