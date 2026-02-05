import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict } from "date-fns"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatMinimalTime(date: Date | string | number): string {
    const d = parseAsUTC(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";

    // Use date-fns for calculation but customize output
    const distance = formatDistanceToNowStrict(d, { addSuffix: false });

    // minimalist replacements
    return distance
        .replace(" seconds", "s")
        .replace(" second", "s")
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" days", "d")
        .replace(" day", "d")
        .replace(" months", "mo")
        .replace(" month", "mo")
        .replace(" years", "y")
        .replace(" year", "y");
}

/**
 * Parses a date string ensuring it's treated as UTC if it lacks timezone info.
 * This fixes issues where naive UTC strings from backend are interpreted as local time.
 */
export function parseAsUTC(dateStr: string | Date | number): Date {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'number') return new Date(dateStr);

    // If it's a string and doesn't end in Z and doesn't have an offset
    // We assume it's UTC.
    // Basic check: if it looks like ISO but no Z or + or - at end (ignoring milliseconds)
    // Actually simpler: if backend sends "YYYY-MM-DDTHH:MM:SS.mmmmmm", 
    // we can append 'Z' if it's missing.
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[+\-]\d{2}:?\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
}

/**
 * Formats a date to Indian Standard Time (IST).
 * Returns format like: "Feb 4, 3:30 PM"
 */
export function formatToIST(date: Date | string | number): string {
    const d = parseAsUTC(date);
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(d);
}

/**
 * Returns relative time string (e.g. "5m ago") but ensures input is treated as UTC first.
 */
export function formatRelativeTime(date: Date | string | number): string {
    const d = parseAsUTC(date);
    return formatDistanceToNowStrict(d, { addSuffix: true })
        .replace(" seconds", "s")
        .replace(" second", "s")
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" days", "d")
        .replace(" day", "d")
        .replace(" months", "mo")
        .replace(" month", "mo")
        .replace(" years", "y")
        .replace(" year", "y");
}
