import React, { useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { ShieldAlert, Sparkles, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);

interface CalendarWidgetProps {
    busySlots: Array<{ start: string; end: string }>;
    executionWindows: Array<{ day: string; start: string; end: string }>;
    onSaveWindow: (window: { day: string; start: string; end: string }) => Promise<void>;
}

export function CalendarWidget({ busySlots, executionWindows, onSaveWindow }: CalendarWidgetProps) {
    const { theme } = useTheme();

    // Transform slots to events
    const events = useMemo(() => {
        const today = moment().startOf('day');
        const startOfWeek = moment().startOf('week').add(1, 'days'); // Monday

        const allEvents = [];

        // 1. Busy Slots (Red Glassmorphism)
        busySlots.forEach((slot, i) => {
            allEvents.push({
                id: `busy-${i}`,
                title: 'GCal Busy',
                start: new Date(slot.start),
                end: new Date(slot.end),
                resource: 'busy',
            });
        });

        // 2. Execution Windows (Green Glow)
        const daysMap: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

        executionWindows.forEach((win, i) => {
            const dayIndex = daysMap[win.day];
            if (dayIndex === undefined) return;

            // Project to THIS week
            const targetDate = moment().startOf('week').add(dayIndex, 'days');
            const [sH, sM] = win.start.split(':').map(Number);
            const [eH, eM] = win.end.split(':').map(Number);

            const start = targetDate.clone().hours(sH).minutes(sM).seconds(0).toDate();
            const end = targetDate.clone().hours(eH).minutes(eM).seconds(0).toDate();

            allEvents.push({
                id: `campaign-${i}`,
                title: 'AI Execution Window',
                start: start,
                end: end,
                resource: 'campaign',
            });
        });

        return allEvents;
    }, [busySlots, executionWindows]);

    const handleSelectSlot = useCallback(async (slotInfo: SlotInfo) => {
        const start = moment(slotInfo.start);
        const end = moment(slotInfo.end);

        const dayName = start.format('Sunday'); // Wait, format('dddd') is better
        const dayNameFixed = start.format('Regular'); // No, let's use toLocaleDateString for safety
        const finalDayName = slotInfo.start.toLocaleDateString('en-US', { weekday: 'long' });

        const startTime = start.format('HH:mm');
        const endTime = end.format('HH:mm');

        try {
            await onSaveWindow({
                day: finalDayName,
                start: startTime,
                end: endTime
            });
            toast.success(`Window added for ${finalDayName}`, {
                icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
            });
        } catch (error) {
            toast.error("Failed to save window");
        }
    }, [onSaveWindow]);

    const CustomEvent = ({ event }: any) => {
        const isBusy = event.resource === 'busy';
        return (
            <div className="flex flex-col h-full p-2 overflow-hidden">
                <div className="flex items-center gap-1.5 mb-1">
                    {isBusy ? (
                        <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" />
                    ) : (
                        <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider truncate">
                        {event.title}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold opacity-70">
                    <Clock className="w-2.5 h-2.5" />
                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                </div>
            </div>
        );
    };

    const eventStyleGetter = (event: any) => {
        const isBusy = event.resource === 'busy';
        if (isBusy) {
            return {
                className: "busy-event-glass",
                style: {
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderLeft: '4px solid #EF4444',
                    color: '#EF4444',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px -2px rgba(239, 68, 68, 0.12)',
                }
            };
        } else {
            return {
                className: "campaign-event-glow",
                style: {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderLeft: '4px solid #10B981',
                    color: '#10B981',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.2)',
                }
            };
        }
    };

    return (
        <div className="h-full min-h-[650px] bg-white/50 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden p-6 shadow-2xl relative">
            <style jsx global>{`
                .rbc-calendar { font-family: inherit; font-weight: 600; }
                .rbc-time-view { border: none !important; }
                .rbc-time-header { border-bottom: 1px solid rgba(0,0,0,0.05) !important; margin-bottom: 20px; }
                .dark .rbc-time-header { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
                .rbc-time-header-content { border-left: none !important; }
                .rbc-header { border-bottom: none !important; padding: 12px 0 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; }
                
                .rbc-time-content { border-top: none !important; }
                .rbc-timeslot-group { border-bottom: 1px solid rgba(0,0,0,0.02) !important; min-height: 50px !important; }
                .dark .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.02) !important; }
                
                .rbc-day-slot .rbc-time-slot { border-top: none !important; }
                .rbc-time-gutter .rbc-timeslot-group { border-right: none !important; padding-right: 12px; }
                .rbc-label { font-size: 10px; font-weight: 800; color: #a1a1aa; }
                
                .rbc-events-container { margin-right: 8px !important; }
                .rbc-event { padding: 0 !important; border: none !important; transition: all 0.3s ease; }
                .rbc-event:hover { transform: scale(1.02); z-index: 10 !important; filter: brightness(1.1); }
                
                .rbc-today { background-color: rgba(79, 70, 229, 0.03) !important; }
                .dark .rbc-today { background-color: rgba(79, 70, 229, 0.05) !important; }
                
                .rbc-time-view .rbc-allday-cell { display: none; }
                
                /* Selection Highlight */
                .rbc-slot-selection { background-color: rgba(79, 70, 229, 0.1) !important; border: 2px dashed #4f46e5 !important; border-radius: 8px; }
            `}</style>

            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                defaultView={Views.WEEK}
                views={['week']}
                selectable
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventStyleGetter}
                components={{
                    event: CustomEvent
                }}
                min={moment().hours(8).minutes(0).toDate()}
                max={moment().hours(22).minutes(0).toDate()}
            />
        </div>
    );
}
