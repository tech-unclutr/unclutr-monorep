import React, { useMemo } from 'react';
import moment from 'moment';
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarWidgetProps {
    busySlots: Array<{ start: string; end: string }>; // Unused but kept for interface
    executionWindows: Array<{ day: string; start: string; end: string }>;
    onSaveWindow: (window: { day: string; start: string; end: string }) => Promise<void>; // Unused
}

export function CalendarWidget({ executionWindows, busySlots = [] }: CalendarWidgetProps) {
    const { theme } = useTheme();

    const next7Days = useMemo(() => {
        const days = [];
        const today = moment().startOf('day');
        for (let i = 0; i < 7; i++) {
            days.push(moment(today).add(i, 'days'));
        }
        return days;
    }, []);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Helper to check status of a specific hour on a specific date
    const getSlotStatus = (date: moment.Moment, hour: number) => {
        const slotStart = date.clone().hour(hour).minute(0);
        const slotEnd = date.clone().hour(hour + 1).minute(0);
        const slotStartMs = slotStart.valueOf();
        const slotEndMs = slotEnd.valueOf();

        // 1. Check Busy Slots (GCal)
        const isBusy = busySlots.some(slot => {
            const s = new Date(slot.start).getTime();
            const e = new Date(slot.end).getTime();
            // Check for overlap
            return (s < slotEndMs && e > slotStartMs);
        });

        // 2. Check Execution Windows
        const isExecution = executionWindows.some(win => {
            let winStart: moment.Moment;
            let winEnd: moment.Moment;

            if (win.day && win.day.includes('-')) {
                // YYYY-MM-DD
                const winDate = moment(win.day);
                if (!winDate.isSame(date, 'day')) return false;

                const [sH, sM] = win.start.split(':').map(Number);
                const [eH, eM] = win.end.split(':').map(Number);

                winStart = winDate.clone().hour(sH).minute(sM);
                winEnd = winDate.clone().hour(eH).minute(eM);
            } else {
                // Day name (e.g., "Monday")
                const dayName = date.format('dddd');
                if (win.day !== dayName) return false;

                const [sH, sM] = win.start.split(':').map(Number);
                const [eH, eM] = win.end.split(':').map(Number);

                winStart = date.clone().hour(sH).minute(sM);
                winEnd = date.clone().hour(eH).minute(eM);
            }

            // Check overlap
            return (slotStart.isBefore(winEnd) && slotEnd.isAfter(winStart));
        });

        if (isBusy && isExecution) return 'conflict';
        if (isBusy) return 'busy';
        if (isExecution) return 'execution';
        return 'free';
    };

    return (
        <div className="h-full flex flex-col bg-white/50 dark:bg-black/40 backdrop-blur-xl rounded-[1.5rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden shadow-sm relative">
            {/* Legend */}
            <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-zinc-900/90 p-1.5 rounded-full border border-zinc-100 dark:border-white/5 backdrop-blur-md z-10 shadow-sm">
                <div className="flex items-center gap-1.5 px-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-zinc-500 dark:text-zinc-400">Busy (GCal)</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 border-l border-zinc-200 dark:border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-zinc-500 dark:text-zinc-400">Free Slot</span>
                </div>
            </div>

            {/* Header Grid */}
            <div className="grid grid-cols-8 gap-2 p-4 border-b border-zinc-100 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] pt-10">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center">
                    Time
                </div>
                {next7Days.map((day, i) => (
                    <div key={i} className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            {day.format('ddd')}
                        </span>
                        <span className={cn(
                            "text-xs font-black",
                            i === 0 ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md" : "text-zinc-900 dark:text-white"
                        )}>
                            {day.format('DD')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
                <div className="grid grid-cols-8 gap-x-2 gap-y-1 p-4">
                    {hours.map((hour) => (
                        <React.Fragment key={hour}>
                            {/* Time Label */}
                            <div className="flex items-center justify-center text-[10px] font-medium text-zinc-400 font-mono">
                                {moment().hour(hour).format('h A')}
                            </div>

                            {/* Slot for each day */}
                            {next7Days.map((day, dayIdx) => {
                                const status = getSlotStatus(day, hour);
                                return (
                                    <div
                                        key={`${dayIdx}-${hour}`}
                                        className={cn(
                                            "h-8 rounded-lg border transition-all duration-300 flex items-center justify-center group relative",
                                            status === 'busy' && "bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
                                            status === 'execution' && "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                                            status === 'conflict' && "bg-amber-500/10 border-amber-500/30",
                                            status === 'free' && "bg-zinc-50/50 dark:bg-white/[0.02] border-zinc-100 dark:border-white/[0.02]"
                                        )}
                                        title={`${day.format('MMM DD')} @ ${moment().hour(hour).format('h A')}: ${status.toUpperCase()}`}
                                    >
                                        {status === 'busy' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-60" />
                                        )}
                                        {status === 'execution' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                                        )}
                                        {status === 'conflict' && (
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
