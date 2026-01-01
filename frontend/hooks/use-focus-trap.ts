import { useEffect, useRef } from 'react';

/**
 * Traps focus within a container element
 * Useful for modals, drawers, and dialogs
 * 
 * @param isActive - Whether focus trapping is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(isActive: boolean) {
    const containerRef = useRef<T>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element on mount
        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [isActive]);

    return containerRef;
}
