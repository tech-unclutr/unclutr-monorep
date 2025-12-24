import { getPerformance, trace as firebaseTrace } from "firebase/performance";
import { app } from "./firebase";

/**
 * Start a custom performance trace.
 * Use this to measure how long a specific action takes.
 * 
 * Example:
 * const t = startTrace("csv_parsing");
 * // ... heavy work ...
 * stopTrace(t);
 */
export const startTrace = (traceName: string) => {
    if (typeof window !== "undefined") {
        try {
            const perf = getPerformance(app);
            const t = firebaseTrace(perf, traceName);
            t.start();
            return t;
        } catch (e) {
            console.warn("[Performance] Failed to start trace:", e);
            return null;
        }
    }
    return null;
};

/**
 * Stop a trace and log the duration.
 */
export const stopTrace = (traceObject: any, attributes?: Record<string, string>) => {
    if (traceObject) {
        try {
            if (attributes) {
                Object.entries(attributes).forEach(([key, value]) => {
                    traceObject.putAttribute(key, value);
                });
            }
            traceObject.stop();
        } catch (e) {
            console.warn("[Performance] Failed to stop trace:", e);
        }
    }
};

/**
 * Higher-order function to measure an async function automatically.
 */
export const measure = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const t = startTrace(name);
    try {
        const result = await fn();
        return result;
    } finally {
        stopTrace(t);
    }
};
