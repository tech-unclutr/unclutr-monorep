"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClockIcon,
    TrashIcon,
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Check,
    ArrowRightIcon,
    Save
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
    isBefore,
    startOfDay,
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

interface ExecutionWindow {
    day: string;
    start: string;
    end: string;
}

interface TimeWindowSelectorProps {
    day: string;
    start: string;
    end: string;
    onChange: (updates: { day?: string; start?: string; end?: string }) => void;
    onDelete: () => void;
    allWindows?: ExecutionWindow[];
    currentIndex?: number;
    customDurationLabel?: string;
    isInvalid?: boolean;
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
        <div className="w-72 select-none">
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="font-black text-base dark:text-white tracking-tight">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        onClick={(e) => { e.stopPropagation(); prevMonth(); }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-3">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, idx) => (
                    <div key={`${d}-${idx}`} className="text-[10px] font-black text-zinc-400 text-center uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, i) => {
                    const isSelected = isSameDay(day, date);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isPast = isBefore(startOfDay(day), startOfDay(new Date()));

                    return (
                        <motion.button
                            key={i}
                            whileHover={!isPast ? { scale: 1.1, y: -1 } : {}}
                            whileTap={!isPast ? { scale: 0.95 } : {}}
                            onClick={() => !isPast && onChange(format(day, 'yyyy-MM-dd'))}
                            disabled={isPast}
                            className={cn(
                                "h-9 w-9 rounded-[14px] text-xs font-bold transition-all relative flex items-center justify-center border-2 border-transparent",
                                isPast ? "text-zinc-200 dark:text-zinc-800 cursor-not-allowed opacity-30" :
                                    isSelected ? "bg-orange-600 text-white shadow-lg shadow-orange-500/40 border-orange-400/20" :
                                        isCurrentMonth ? "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700" :
                                            "text-zinc-300 dark:text-zinc-600",
                                isToday(day) && !isSelected && !isPast && "border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400"
                            )}
                        >
                            {format(day, 'd')}
                            {isToday(day) && !isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full" />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// --- Magical Time Range Picker Component (Start + End in one modal) ---
function MagicalTimeRangePicker({
    startValue,
    endValue,
    onSave,
    selectedDate
}: {
    startValue: string,
    endValue: string,
    onSave: (start: string, end: string) => void,
    selectedDate?: string
}) {
    const [tempStart, setTempStart] = useState(startValue);
    const [tempEnd, setTempEnd] = useState(endValue);

    const [startH, startM] = tempStart.split(':');
    const [endH, endM] = tempEnd.split(':');

    const startHourRef = React.useRef<HTMLDivElement>(null);
    const endHourRef = React.useRef<HTMLDivElement>(null);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];

    // Auto-scroll logic
    React.useEffect(() => {
        const scrollToActive = (ref: React.RefObject<HTMLDivElement | null>, hour: string) => {
            if (ref.current) {
                const activeBtn = ref.current.querySelector(`[data-hour="${hour}"]`);
                if (activeBtn) {
                    activeBtn.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        };

        // Small delay to ensure popover is rendered and lists are populated
        const timer = setTimeout(() => {
            scrollToActive(startHourRef, startH);
            scrollToActive(endHourRef, endH);
        }, 100);

        return () => clearTimeout(timer);
    }, [startH, endH]); // Trigger scroll on value changes

    // Check if selected date is today
    const isSelectedDateToday = selectedDate ? isToday(parseISO(selectedDate)) : false;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Helper to check if a time is in the past
    const isTimePast = (hour: string, minute: string) => {
        if (!isSelectedDateToday) return false;
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        if (hourNum < currentHour) return true;
        if (hourNum === currentHour) {
            return (currentMinute - minuteNum) > 15;
        }
        return false;
    };

    return (
        <div className="w-auto p-1">
            <div className="flex gap-6">
                {/* START TIME */}
                <div className="w-52">
                    <div className="mb-4 px-2">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Start Time</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Hours */}
                        <div
                            ref={startHourRef}
                            className="flex-1 space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar scrollbar-hide scroll-smooth"
                        >
                            {hours.map(hour => {
                                const isPast = parseInt(hour) < currentHour && isSelectedDateToday;
                                const isSelected = hour === startH;
                                return (
                                    <button
                                        key={hour}
                                        data-hour={hour}
                                        onClick={() => {
                                            if (!isPast) {
                                                const newStart = `${hour}:${startM}`;
                                                setTempStart(newStart);

                                                // Update end if it would become invalid
                                                const startMins = timeToMinutes(newStart);
                                                const endMins = timeToMinutes(tempEnd);
                                                if (startMins >= endMins) {
                                                    const newEndMins = Math.min(startMins + 60, 23 * 60 + 45);
                                                    setTempEnd(minutesToTime(newEndMins));
                                                }
                                            }
                                        }}
                                        disabled={isPast}
                                        className={cn(
                                            "w-full py-2.5 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center justify-between group/hour",
                                            isPast ? "opacity-30 cursor-not-allowed text-zinc-300 dark:text-zinc-700" :
                                                isSelected ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                                            parseInt(hour) === currentHour && isSelectedDateToday && !isSelected && "ring-1 ring-inset ring-orange-500/20 bg-orange-50/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={cn(isSelected ? "scale-110" : "group-hover/hour:translate-x-0.5 transition-transform")}>{hour}</span>
                                            {parseInt(hour) === currentHour && isSelectedDateToday && (
                                                <span className="text-[7px] font-black uppercase tracking-widest text-orange-500/60">Now</span>
                                            )}
                                        </div>
                                        {isSelected && !isPast && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Minutes */}
                        <div className="w-20 space-y-1.5">
                            {minutes.map(min => {
                                const isPast = isTimePast(startH, min);
                                const isSelected = min === startM;
                                return (
                                    <button
                                        key={min}
                                        onClick={() => {
                                            if (!isPast) {
                                                const newStart = `${startH}:${min}`;
                                                setTempStart(newStart);

                                                // Update end if it would become invalid
                                                const startMins = timeToMinutes(newStart);
                                                const endMins = timeToMinutes(tempEnd);
                                                if (startMins >= endMins) {
                                                    const newEndMins = Math.min(startMins + 60, 23 * 60 + 45);
                                                    setTempEnd(minutesToTime(newEndMins));
                                                }
                                            }
                                        }}
                                        disabled={isPast}
                                        className={cn(
                                            "w-full py-2.5 px-3 rounded-xl text-sm font-black transition-all text-center border-2 border-transparent",
                                            isPast ? "opacity-30 cursor-not-allowed text-zinc-300 dark:text-zinc-700" :
                                                isSelected ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 border-orange-400/20" : "bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                                        )}
                                    >
                                        {min}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* VISUAL SEPARATOR */}
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-full w-px bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
                    <ArrowRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 my-2" />
                    <div className="h-full w-px bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
                </div>

                {/* END TIME */}
                <div className="w-52">
                    <div className="mb-4 px-2">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">End Time</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Hours */}
                        <div
                            ref={endHourRef}
                            className="flex-1 space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar scrollbar-hide scroll-smooth"
                        >
                            {hours.map(hour => {
                                const isPast = parseInt(hour) < currentHour && isSelectedDateToday;
                                const isSelected = hour === endH;
                                return (
                                    <button
                                        key={hour}
                                        data-hour={hour}
                                        onClick={() => {
                                            if (!isPast) {
                                                const newEnd = `${hour}:${endM}`;
                                                setTempEnd(newEnd);

                                                // Update start if it would become invalid
                                                const endMins = timeToMinutes(newEnd);
                                                const startMins = timeToMinutes(tempStart);
                                                if (endMins <= startMins) {
                                                    const newStartMins = Math.max(endMins - 60, 0);
                                                    setTempStart(minutesToTime(newStartMins));
                                                }
                                            }
                                        }}
                                        disabled={isPast}
                                        className={cn(
                                            "w-full py-2.5 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center justify-between group/hour",
                                            isPast ? "opacity-30 cursor-not-allowed text-zinc-300 dark:text-zinc-700" :
                                                isSelected ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                                            parseInt(hour) === currentHour && isSelectedDateToday && !isSelected && "ring-1 ring-inset ring-orange-500/20 bg-orange-50/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={cn(isSelected ? "scale-110" : "group-hover/hour:translate-x-0.5 transition-transform")}>{hour}</span>
                                            {parseInt(hour) === currentHour && isSelectedDateToday && (
                                                <span className="text-[7px] font-black uppercase tracking-widest text-orange-500/60">Now</span>
                                            )}
                                        </div>
                                        {isSelected && !isPast && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Minutes */}
                        <div className="w-20 space-y-1.5">
                            {minutes.map(min => {
                                const isPast = isTimePast(endH, min);
                                const isSelected = min === endM;
                                return (
                                    <button
                                        key={min}
                                        onClick={() => {
                                            if (!isPast) {
                                                const newEnd = `${endH}:${min}`;
                                                setTempEnd(newEnd);

                                                // Update start if it would become invalid
                                                const endMins = timeToMinutes(newEnd);
                                                const startMins = timeToMinutes(tempStart);
                                                if (endMins <= startMins) {
                                                    const newStartMins = Math.max(endMins - 60, 0);
                                                    setTempStart(minutesToTime(newStartMins));
                                                }
                                            }
                                        }}
                                        disabled={isPast}
                                        className={cn(
                                            "w-full py-2.5 px-3 rounded-xl text-sm font-black transition-all text-center border-2 border-transparent",
                                            isPast ? "opacity-30 cursor-not-allowed text-zinc-300 dark:text-zinc-700" :
                                                isSelected ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 border-orange-400/20" : "bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                                        )}
                                    >
                                        {min}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* DONE BUTTON */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <Button
                    onClick={() => onSave(tempStart, tempEnd)}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-6 font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                    <Check className="w-4 h-4" />
                    Done
                </Button>
            </div>
        </div>
    );
}

// --- Time Helpers ---
const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({
    day,
    start,
    end,
    onChange,
    onDelete,
    allWindows,
    currentIndex,
    customDurationLabel,
    isInvalid
}) => {
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    // Check for overlaps with other windows
    const checkOverlap = (checkDay: string, checkStart: string, checkEnd: string): boolean => {
        if (!allWindows || currentIndex === undefined) return false;

        const checkStartMins = timeToMinutes(checkStart);
        const checkEndMins = timeToMinutes(checkEnd);

        return allWindows.some((window, idx) => {
            // Skip self
            if (idx === currentIndex) return false;

            // Only check windows on the same day
            if (window.day !== checkDay) return false;

            const windowStartMins = timeToMinutes(window.start);
            const windowEndMins = timeToMinutes(window.end);

            // Check if time ranges overlap
            // Two ranges overlap if: start1 < end2 AND start2 < end1
            return checkStartMins < windowEndMins && windowStartMins < checkEndMins;
        });
    };

    const hasOverlap = checkOverlap(day, start, end);

    const durationMins = timeToMinutes(end) - timeToMinutes(start);
    const formatDuration = (mins: number) => {
        if (mins <= 0) return "No duration";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`.trim();
    };

    const handleStartChange = (newStart: string) => {
        const startMins = timeToMinutes(newStart);
        const endMins = timeToMinutes(end);

        if (startMins >= endMins) {
            // Push end time forward by 1 hour, capped at 23:45
            const newEndMins = Math.min(startMins + 60, 23 * 60 + 45);
            // If we're already at the end of the day and can't push 1h, try 15 mins
            const finalEndMins = newEndMins <= startMins ? Math.min(startMins + 15, 23 * 60 + 45) : newEndMins;

            onChange({ start: newStart, end: minutesToTime(finalEndMins) });
        } else {
            onChange({ start: newStart });
        }
    };

    const handleEndChange = (newEnd: string) => {
        const endMins = timeToMinutes(newEnd);
        const startMins = timeToMinutes(start);

        if (endMins <= startMins) {
            // Pull start time backward by 1 hour, floored at 00:00
            const newStartMins = Math.max(endMins - 60, 0);
            // If we're already at the start of the day and can't pull 1h, try 15 mins
            const finalStartMins = newStartMins >= endMins ? Math.max(endMins - 15, 0) : newStartMins;

            onChange({ end: newEnd, start: minutesToTime(finalStartMins) });
        } else {
            onChange({ end: newEnd });
        }
    };

    // Safely parse and format the date, handling invalid or empty values
    const formattedDate = (() => {
        if (!day || day.trim() === '') return 'Pick a date';
        try {
            const parsed = parseISO(day);
            // Check if the parsed date is valid
            if (isNaN(parsed.getTime())) return 'Pick a date';
            // Minimalist date format: "Mon, Feb 3"
            return format(parsed, 'EEE, MMM d');
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
            return `${displayHour}:${m}${ampm}`;
        } catch {
            return time;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={cn(
                "group relative px-2 py-2 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 overflow-hidden",
                isInvalid || hasOverlap
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-md"
            )}
        >
            {/* Minimalist Error / Status Indicators */}
            {isInvalid && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50 text-[9px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
                    <ClockIcon className="w-2.5 h-2.5" />
                    {"<"} 30m
                </div>
            )}
            {hasOverlap && !isInvalid && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50 text-[9px] font-bold uppercase tracking-wider rounded-md">
                    Overlap
                </div>
            )}

            <div className="flex items-center gap-1.5">
                {/* 1. Date (Minimalist Trigger) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors outline-none group/date whitespace-nowrap">
                            <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 group-hover/date:text-orange-500 transition-colors shrink-0" />
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">
                                {formattedDate}
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4 rounded-3xl z-[200] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl" align="start">
                        <MagicalDatePicker value={day} onChange={(newDay) => onChange({ day: newDay })} />
                    </PopoverContent>
                </Popover>


                {/* 2. Time Range (Cohesive Unit) */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                    <Popover open={isTimePickerOpen} onOpenChange={setIsTimePickerOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center bg-zinc-50/50 dark:bg-zinc-800/50 rounded-lg px-1.5 py-1 gap-0.5 border border-zinc-100/50 dark:border-zinc-800/50 overflow-hidden hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
                                <span className="px-1.5 py-0.5 rounded-md text-sm font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">
                                    {formatTime(start)}
                                </span>
                                <ArrowRightIcon className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                                <span className="px-1.5 py-0.5 rounded-md text-sm font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">
                                    {formatTime(end)}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4 rounded-3xl z-[200] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl" align="start">
                            <MagicalTimeRangePicker
                                startValue={start}
                                endValue={end}
                                onSave={(newStart, newEnd) => {
                                    onChange({ start: newStart, end: newEnd });
                                    setIsTimePickerOpen(false);
                                }}
                                selectedDate={day}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Duration Pill (More Subtle) */}
                    <div className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider hidden md:block ml-1 whitespace-nowrap shrink-0",
                        isInvalid
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-zinc-100/30 text-zinc-400 dark:bg-zinc-800/30 dark:text-zinc-500"
                    )}>
                        {customDurationLabel || formatDuration(durationMins)}
                    </div>
                </div>

                {/* 3. Delete Action */}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onDelete}
                    className="w-8 h-8 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                >
                    <TrashIcon className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}
