import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarWidget } from "@/components/customer-intelligence/CalendarWidget";

interface AvailabilityMagicPopupProps {
    isOpen: boolean;
    onClose: () => void;
    busySlots: Array<{ start: string; end: string }>;
    activeCampaign: any;
    onSaveWindow: (window: { day: string; start: string; end: string }) => Promise<void>;
}

export function AvailabilityMagicPopup({ isOpen, onClose, busySlots, activeCampaign, onSaveWindow }: AvailabilityMagicPopupProps) {

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[9998] transition-all duration-500"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
                        className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4 md:p-8"
                    >
                        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl w-full max-w-6xl rounded-[2.5rem] shadow-[0_30px_100px_-10px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 overflow-hidden pointer-events-auto flex flex-col h-[85vh] relative ring-1 ring-black/5 dark:ring-white/5">

                            {/* Decorative Top Highlight */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent opacity-50" />

                            {/* Header */}
                            <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-100/50 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 flex items-center justify-center border border-orange-200/50 dark:border-orange-500/20 shadow-sm">
                                        <Calendar className="w-7 h-7 text-orange-500 dark:text-orange-400" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display tracking-tight flex items-center gap-3">
                                            Availability
                                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-700/50">
                                                7-DAY VIEW
                                            </span>
                                        </h2>
                                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">
                                            View your availability and AI execution windows for the next 7 days.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                                >
                                    <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-3 md:px-8 md:py-4 flex-1 bg-gray-50/50 dark:bg-black/20 overflow-hidden relative">
                                {/* Grid Pattern Background */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                                <CalendarWidget
                                    busySlots={busySlots}
                                    executionWindows={activeCampaign?.execution_windows || []}
                                    onSaveWindow={onSaveWindow}
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
