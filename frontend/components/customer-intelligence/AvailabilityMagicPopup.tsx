import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AvailabilityMagicPopupProps {
    isOpen: boolean;
    onClose: () => void;
    busySlots: Array<{ start: string; end: string }>;
}

export function AvailabilityMagicPopup({ isOpen, onClose, busySlots }: AvailabilityMagicPopupProps) {
    // Generate next 7 days
    const days = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    const getBusySlotsForDay = (date: Date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return busySlots.filter(slot => {
            const slotStart = new Date(slot.start);
            const slotEnd = new Date(slot.end);
            return (slotStart < endOfDay && slotEnd > startOfDay);
        });
    };

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
                        <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                                            Your Availability Overview
                                        </h2>
                                        <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                            Your active schedule for the next 7 days
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
                            <div className="p-6 md:p-8 overflow-y-auto overflow-x-hidden bg-gray-50/50 dark:bg-black/20 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                    {days.map((date, index) => {
                                        const isToday = index === 0;
                                        const daySlots = getBusySlotsForDay(date);
                                        const hasBusySlots = daySlots.length > 0;

                                        return (
                                            <div
                                                key={date.toISOString()}
                                                className={cn(
                                                    "flex flex-col rounded-2xl p-3 border transition-all duration-300",
                                                    isToday
                                                        ? "bg-white dark:bg-white/5 border-orange-500/30 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
                                                        : "bg-white/60 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/5 hover:border-orange-500/20"
                                                )}
                                            >
                                                {/* Date Header */}
                                                <div className="text-center mb-4 pb-2 border-b border-gray-100 dark:border-white/5">
                                                    <div className={cn(
                                                        "text-xs font-bold uppercase tracking-wider mb-0.5",
                                                        isToday ? "text-orange-500" : "text-gray-400 dark:text-zinc-500"
                                                    )}>
                                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className={cn(
                                                        "text-xl font-bold font-display",
                                                        isToday ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-zinc-300"
                                                    )}>
                                                        {date.getDate()}
                                                    </div>
                                                </div>

                                                {/* Day Timeline */}
                                                <div className="flex-1 space-y-1 relative min-h-[200px]">
                                                    {/* Slots Visualization */}
                                                    <div className="relative h-full w-full py-1">
                                                        {(() => {
                                                            // We'll map the "Working Day" from 8 AM to 10 PM (14 hours) to the height
                                                            const hours = Array.from({ length: 14 }).map((_, hIndex) => { // 8 AM to 10 PM
                                                                const hour = hIndex + 8;
                                                                const hourStart = new Date(date);
                                                                hourStart.setHours(hour, 0, 0, 0);
                                                                const hourEnd = new Date(date);
                                                                hourEnd.setHours(hour + 1, 0, 0, 0);

                                                                const isBusy = daySlots.some(slot => {
                                                                    const s = new Date(slot.start).getTime();
                                                                    const e = new Date(slot.end).getTime();
                                                                    return (s < hourEnd.getTime() && e > hourStart.getTime());
                                                                });

                                                                return { hour, isBusy };
                                                            });

                                                            return (
                                                                <div className="flex flex-col gap-1 h-full">
                                                                    {hours.map((slot) => (
                                                                        <div
                                                                            key={slot.hour}
                                                                            className={cn(
                                                                                "flex-1 rounded-sm w-full transition-all flex items-center justify-between px-1.5",
                                                                                slot.isBusy
                                                                                    ? "bg-red-500/5 border border-red-500/10"
                                                                                    : "bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10"
                                                                            )}
                                                                        >
                                                                            <span className={cn(
                                                                                "text-[10px] font-bold font-mono tracking-tighter",
                                                                                slot.isBusy ? "text-red-500" : "text-emerald-900/40 dark:text-emerald-400/40"
                                                                            )}>
                                                                                {slot.hour > 12 ? slot.hour - 12 : slot.hour}{slot.hour >= 12 ? 'P' : 'A'}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Summary Footer */}
                                                <div className="mt-2 text-center">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-1 rounded-full",
                                                        hasBusySlots
                                                            ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                                            : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    )}>
                                                        {hasBusySlots ? `${daySlots.length} Mtgs` : "Clear"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                                <div>
                                    Showing availability for <span className="font-bold text-gray-900 dark:text-white">8:00 AM - 10:00 PM</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500/50 rounded-full"></div>
                                        <span>Free</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500/50 rounded-full"></div>
                                        <span>Busy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
