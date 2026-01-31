import React, { useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";

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
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const allEvents = [];

        // 1. Busy Slots (Red)
        // Note: busySlots might be absolute dates from backend.
        // We need to make sure they display correctly.
        busySlots.forEach((slot, i) => {
            allEvents.push({
                id: `busy-${i}`,
                title: 'Busy',
                start: new Date(slot.start),
                end: new Date(slot.end),
                resource: 'busy',
            });
        });

        // 2. Execution Windows (Green)
        // These are repeating weekly patterns usually, but for now stored as {day, start, end}
        // We'll map them to the current week view or *all* visible weeks?
        // Assuming we show just the "Next 7 Days" or standard week view.
        // For simplicity, let's map them to the NEXT occurrence or the CURRENT week if we are in week view of current week.
        // Actually, react-big-calendar week view is usually Sunday-Saturday or Mon-Sun.

        // Let's create events for the current week specifically for visualization
        const daysMap: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

        executionWindows.forEach((win, i) => {
            const dayIndex = daysMap[win.day];
            if (dayIndex === undefined) return;

            // Calculate date for this day in the current week (Sunday to Saturday perspective of Moment/BigCalendar)
            // Or better, let's just project everything to "This Week" (relative to now)

            const currentDay = today.getDay();
            const diff = dayIndex - currentDay;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + diff);

            const [sH, sM] = win.start.split(':').map(Number);
            const [eH, eM] = win.end.split(':').map(Number);

            const start = new Date(targetDate);
            start.setHours(sH, sM, 0, 0);

            const end = new Date(targetDate);
            end.setHours(eH, eM, 0, 0);

            allEvents.push({
                id: `campaign-${i}`,
                title: 'Execution Window',
                start: start,
                end: end,
                resource: 'campaign',
            });
        });

        return allEvents;
    }, [busySlots, executionWindows]);

    const handleSelectSlot = useCallback(async (slotInfo: SlotInfo) => {
        // User dragged a slot
        const start = new Date(slotInfo.start);
        const end = new Date(slotInfo.end);

        // Convert to "Day Name" + "HH:MM" format
        const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
        const startTime = start.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const endTime = end.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        if (confirm(`Block execution window on ${dayName} from ${startTime} to ${endTime}?`)) {
            await onSaveWindow({
                day: dayName,
                start: startTime,
                end: endTime
            });
        }
    }, [onSaveWindow]);

    const eventStyleGetter = (event: any) => {
        const isBusy = event.resource === 'busy';
        if (isBusy) {
            return {
                style: {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    borderRadius: '4px',
                }
            };
        } else {
            return {
                style: {
                    backgroundColor: 'rgba(16, 185, 129, 0.2)', // emerald-500/20
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10B981', // emerald-500
                    borderRadius: '4px',
                }
            };
        }
    };

    return (
        <div className="h-[600px] bg-white dark:bg-zinc-900 rounded-xl overflow-hidden calendar-override">
            <style jsx global>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-time-view { border: none; }
                .rbc-time-header { display: none; } /* Hide default header if we want custom or just keep it simple */
                .rbc-time-content { border-top: 1px solid rgba(255,255,255,0.05); }
                .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.05); }
                .rbc-day-slot .rbc-time-slot { border-top: 1px solid rgba(255,255,255,0.02); }
                .rbc-time-view .rbc-row { min-height: 20px; }
                .rbc-today { background-color: transparent; }
                .rbc-off-range-bg { background-color: transparent; }
                
                /* Dark Mode Text */
                .dark .rbc-time-gutter .rbc-timeslot-group { color: #52525b; } /* zinc-600 */
                .dark .rbc-day-slot .rbc-event-label { color: inherit; }
                .dark .rbc-day-slot .rbc-event-content { color: inherit; }
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
                min={new Date(0, 0, 0, 8, 0, 0)} // Start at 8 AM
                max={new Date(0, 0, 0, 22, 0, 0)} // End at 10 PM
            />
        </div>
    );
}
