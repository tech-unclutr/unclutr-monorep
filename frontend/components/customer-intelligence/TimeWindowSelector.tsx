"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClockIcon,
    TrashIcon,
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Check
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
    parse
} from 'date-fns';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface TimeWindowSelectorProps {
    day: string;
    start: string;
    end: string;
    onChange: (updates: { day?: string; start?: string; end?: string }) => void;
    onDelete: () => void;
}

// --- Magical Date Picker Component ---
function MagicalDatePicker({ value, onChange }: { value: string, onChange: (date: string) => void }) {
    // Safely parse the date value, falling back to current date if invalid
    const date = (() => {
        if (!value || value.trim() === '') return new Date();
        try {
            const parsed = parseISO(value);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
        } catch {
            return new Date();
        }
    })();
    const [currentMonth, setCurrentMonth] = useState(date);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <div className="w-64 select-none">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-sm dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); prevMonth(); }}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); nextMonth(); }}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                    <div key={`${d}-${idx}`} className="text-[10px] font-black text-zinc-400 text-center uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                    const isSelected = isSameDay(day, date);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onChange(format(day, 'yyyy-MM-dd'))}
                            className={cn(
                                "h-8 w-8 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center",
                                isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" :
                                    isCurrentMonth ? "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800" :
                                        "text-zinc-300 dark:text-zinc-600",
                                isToday(day) && !isSelected && "border border-indigo-200 dark:border-indigo-900/50"
                            )}
                        >
                            {format(day, 'd')}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// --- Magical Time Picker Component ---
function MagicalTimePicker({ value, onChange, label }: { value: string, onChange: (time: string) => void, label: string }) {
    // value is "HH:mm"
    const [h, m] = value.split(':');
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];

    return (
        <div className="w-48 p-1">
            <div className="mb-3 px-2">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{label}</p>
            </div>
            <div className="flex gap-4">
                {/* Hours */}
                <div className="flex-1 space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                    {hours.map(hour => (
                        <button
                            key={hour}
                            onClick={() => onChange(`${hour}:${m}`)}
                            className={cn(
                                "w-full py-2 px-3 rounded-lg text-sm font-bold transition-all text-left flex items-center justify-between",
                                hour === h ? "bg-indigo-600 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            )}
                        >
                            {hour}
                            {hour === h && <Check className="w-3 h-3" />}
                        </button>
                    ))}
                </div>
                {/* Minutes */}
                <div className="w-16 space-y-1">
                    {minutes.map(min => (
                        <button
                            key={min}
                            onClick={() => onChange(`${h}:${min}`)}
                            className={cn(
                                "w-full py-2 px-3 rounded-lg text-sm font-bold transition-all text-center",
                                min === m ? "bg-orange-500 text-white" : "hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                            )}
                        >
                            {min}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function TimeWindowSelector({ day, start, end, onChange, onDelete }: TimeWindowSelectorProps) {
    // Safely parse and format the date, handling invalid or empty values
    const formattedDate = (() => {
        if (!day || day.trim() === '') return 'Pick a date';
        try {
            const parsed = parseISO(day);
            // Check if the parsed date is valid
            if (isNaN(parsed.getTime())) return 'Pick a date';
            return format(parsed, 'EEE, MMM d, yyyy');
        } catch {
            return 'Pick a date';
        }
    })();

    // Formatting 24h to 12h for display
    const formatTime = (time: string) => {
        try {
            const [h, m] = time.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${m} ${ampm}`;
        } catch {
            return time;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    {/* Date Selection */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="flex items-center gap-3 cursor-pointer p-2 -ml-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group/trigger">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover/trigger:scale-110 transition-transform">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                                <div className="relative flex-1">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5 cursor-pointer">Date</label>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {formattedDate}
                                    </p>
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4 rounded-3xl shadow-2xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-100" align="start">
                            <MagicalDatePicker value={day} onChange={(newDay) => onChange({ day: newDay })} />
                        </PopoverContent>
                    </Popover>

                    {/* Time Range */}
                    <div className="flex items-center gap-3 p-2 -ml-2 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 dark:text-orange-400">
                            <ClockIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Time Window</label>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-sm font-black text-zinc-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer">
                                            {formatTime(start)}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3 rounded-2xl shadow-xl bg-white dark:bg-zinc-900 opacity-100" align="start">
                                        <MagicalTimePicker label="Start Time" value={start} onChange={(newStart) => onChange({ start: newStart })} />
                                    </PopoverContent>
                                </Popover>

                                <span className="text-zinc-300 dark:text-zinc-600 text-[10px] uppercase font-bold">To</span>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-sm font-black text-zinc-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer">
                                            {formatTime(end)}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3 rounded-2xl shadow-xl bg-white dark:bg-zinc-900 opacity-100" align="start">
                                        <MagicalTimePicker label="End Time" value={end} onChange={(newEnd) => onChange({ end: newEnd })} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onDelete}
                    className="w-8 h-8 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 -mt-1 -mr-1 opacity-0 group-hover:opacity-100"
                >
                    <TrashIcon className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}
