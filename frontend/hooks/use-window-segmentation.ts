import { useMemo } from 'react';
import { parseISO } from 'date-fns';

export const useWindowSegmentation = (executionWindows: any[]) => {
    return useMemo(() => {
        const now = new Date();
        const indexedWindows = (executionWindows || []).map((w, i) => ({ ...w, _originalIndex: i }));

        const current: any[] = [];
        const upcoming: any[] = [];
        const past: any[] = [];

        indexedWindows.forEach(w => {
            try {
                const startDt = parseISO(`${w.day}T${w.start}`);
                const endDt = parseISO(`${w.day}T${w.end}`);
                const bufferMins = 30;

                if (now > endDt) {
                    past.push(w);
                } else if (now >= startDt && now <= endDt) {
                    // Any window that includes "now" is Current
                    const remainingMins = Math.max(0, Math.round((endDt.getTime() - now.getTime()) / (60 * 1000)));
                    const isInvalid = remainingMins < bufferMins;
                    current.push({
                        ...w,
                        _durationLabel: `${remainingMins} MINS LEFT`,
                        _isInvalid: isInvalid
                    });
                } else {
                    // Future window
                    upcoming.push(w);
                }
            } catch {
                upcoming.push(w);
            }
        });

        // Sort
        upcoming.sort((a, b) => parseISO(`${a.day}T${a.start}`).getTime() - parseISO(`${b.day}T${b.start}`).getTime());
        past.sort((a, b) => parseISO(`${b.day}T${b.start}`).getTime() - parseISO(`${a.day}T${a.start}`).getTime());

        return { current, upcoming, past };
    }, [executionWindows]);
};
