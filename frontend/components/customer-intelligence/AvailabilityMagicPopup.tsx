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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4"
                    >
                        <div className="bg-white dark:bg-zinc-900 w-full max-w-6xl rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden pointer-events-auto flex flex-col h-[85vh]">

                            {/* Header */}
                            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                                            Execution Windows
                                        </h2>
                                        <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                            Drag to block time for AI calls. Red = Busy (GCal), Green = Execution Window.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 bg-gray-50/50 dark:bg-black/20 overflow-hidden">
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
