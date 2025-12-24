"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { app } from "./firebase"; // Import the initialized app

export const useAnalytics = () => {
    useEffect(() => {
        // Only init on client side
        if (typeof window !== "undefined") {
            isSupported().then((supported) => {
                if (supported) {
                    const analytics = getAnalytics(app);
                    logEvent(analytics, "page_view", {
                        page_path: window.location.pathname,
                        page_title: document.title,
                    });
                }
            });
        }
    }, []);
};

export const useAutoTrackInteractions = () => {
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const interactive = target.closest('button, a, [data-track]');

            if (interactive) {
                let label = (interactive as HTMLElement).innerText || (interactive as HTMLElement).getAttribute('aria-label') || '';
                label = label.slice(0, 50).trim();
                const id = interactive.id || interactive.getAttribute('data-id') || 'unknown';
                const type = interactive.tagName.toLowerCase();

                if (interactive.hasAttribute('data-no-track')) return;

                trackEvent("user_interaction", {
                    event_category: "ui_interaction",
                    event_action: "click",
                    event_label: label,
                    element_type: type,
                    element_id: id,
                    page_path: window.location.pathname
                });
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined") {
        isSupported().then((supported) => {
            if (supported) {
                const analytics = getAnalytics(app);
                logEvent(analytics, eventName, params);
            }
        });
    }
};
