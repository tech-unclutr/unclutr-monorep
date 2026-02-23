import { useState, useEffect } from 'react';

export function useSessionStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    // Handle key changes
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const item = window.sessionStorage.getItem(key);
            const value = item ? JSON.parse(item) : initialValue;
            setStoredValue(value);
        } catch (error) {
            console.error("Error reading from sessionStorage on key change:", error);
            setStoredValue(initialValue);
        }
    }, [key]);

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== "undefined") {
                window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const removeValue = () => {
        try {
            if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem(key);
                setStoredValue(initialValue);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return [storedValue, setValue, removeValue] as const;
}
