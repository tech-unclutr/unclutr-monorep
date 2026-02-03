"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CampaignSuccessPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export function CampaignSuccessPopup({ isOpen, onClose, onComplete }: CampaignSuccessPopupProps) {
    useEffect(() => {
        if (isOpen) {
            // Auto-dismiss after animation + viewing time
            const timer = setTimeout(() => {
                if (onComplete) onComplete();
                onClose();
            }, 3500); // 3.5 seconds total duration

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose, onComplete]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Popup Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            delay: 0.1
                        }}
                        className="relative z-10 w-full max-w-sm"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-white/10 shadow-2xl">

                            {/* Ambient Glow Effects */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{
                                        opacity: [0.4, 0.8, 0.4],
                                        scale: [1, 1.2, 1],
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_70%)]"
                                />
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                            </div>

                            <div className="relative p-8 flex flex-col items-center justify-center text-center space-y-6">

                                {/* Icon Animation */}
                                <div className="relative">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            damping: 15,
                                            stiffness: 200,
                                            delay: 0.2
                                        }}
                                        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                    >
                                        <Check className="w-10 h-10 text-white stroke-[4]" />
                                    </motion.div>

                                    {/* Particles */}
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0, 1, 0],
                                                x: (Math.random() - 0.5) * 120,
                                                y: (Math.random() - 0.5) * 120
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                delay: 0.4 + Math.random() * 0.2,
                                                ease: "easeOut"
                                            }}
                                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400"
                                        />
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-2xl font-black text-gray-900 dark:text-white tracking-tight"
                                    >
                                        Campaign Initiated
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                        className="text-sm font-medium text-gray-500 dark:text-gray-400"
                                    >
                                        Your intelligence batch is now live.
                                    </motion.p>
                                </div>

                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3.5, ease: "linear" }}
                                    className="h-1 bg-emerald-500/20 rounded-full w-full overflow-hidden"
                                >
                                    <div className="h-full bg-emerald-500 w-full" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
