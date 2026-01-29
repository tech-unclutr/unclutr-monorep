"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { app } from "./firebase"; // Import the initialized app

const isDev = process.env.NODE_ENV === "development";

export const useAnalytics = () => {
    useEffect(() => {
        // Only init on client side
        if (typeof window !== "undefined") {
            const shouldSkipLive = isDev && !localStorage.getItem('ENABLE_GA_IN_DEV');

            if (isDev) {
                console.log("[Analytics] Page view tracked", {
                    page_path: window.location.pathname,
                    page_title: document.title,
                });
            }

            if (shouldSkipLive) return;

            isSupported().then((supported) => {
                if (supported) {
                    try {
                        const analytics = getAnalytics(app);
                        logEvent(analytics, "page_view", {
                            page_path: window.location.pathname,
                            page_title: document.title,
                        });
                    } catch (err) {
                        if (isDev) console.warn("[Analytics] GA blocked by browser or ad-blocker.");
                    }
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
        const shouldSkipLive = isDev && !localStorage.getItem('ENABLE_GA_IN_DEV');

        if (isDev) {
            console.log(`[Analytics] Event: ${eventName}`, params);
        }

        if (shouldSkipLive) return;

        isSupported().then((supported) => {
            if (supported) {
                try {
                    const analytics = getAnalytics(app);
                    logEvent(analytics, eventName, params);
                } catch (err) {
                    if (isDev) console.warn(`[Analytics] Failed to send event "${eventName}" (likely blocked).`);
                }
            }
        });
    }
};

/**
 * Onboarding-specific event tracking
 * Success metrics tracking for onboarding flow
 */

type OnboardingEvent =
    | 'onboarding_started'
    | 'onboarding_step_completed'
    | 'onboarding_completed'
    | 'onboarding_abandoned'
    | 'drawer_opened'
    | 'drawer_search_used'
    | 'drawer_category_clicked'
    | 'datasource_selected'
    | 'datasource_deselected'
    | 'integration_requested'
    | 'save_and_exit'
    | 'field_completed'
    | 'validation_error';

interface OnboardingEventData {
    step?: string;
    stepNumber?: number;
    category?: string;
    datasourceId?: string;
    datasourceName?: string;
    searchQuery?: string;
    timeSpent?: number;
    variant?: 'channels' | 'stack';
    fieldName?: string;
    errorMessage?: string;
    priorityCategory?: string;
}

/**
 * Track onboarding events for success metrics
 * Integrates with Firebase Analytics and logs to localStorage for debugging
 */
export function trackOnboardingEvent(
    event: OnboardingEvent,
    data?: OnboardingEventData
) {
    const timestamp = new Date().toISOString();
    const eventData = {
        event,
        timestamp,
        ...data,
    };

    // Send to Firebase Analytics
    trackEvent(event, data);

    // Store in localStorage for debugging
    try {
        const events = JSON.parse(localStorage.getItem('onboarding_events') || '[]');
        events.push(eventData);
        // Keep only last 100 events
        if (events.length > 100) events.shift();
        localStorage.setItem('onboarding_events', JSON.stringify(events));
    } catch (e) {
        // Ignore localStorage errors
    }
}

/**
 * Hook to track time spent on a step
 */
export function useStepTimer(stepName: string) {
    const startTime = Date.now();

    return () => {
        const timeSpent = Date.now() - startTime;
        trackOnboardingEvent('onboarding_step_completed', {
            step: stepName,
            timeSpent,
        });
    };
}

/**
 * Track authentication events
 */
export function trackAuthEvent(event: 'login' | 'logout' | 'signup' | 'login_failed', data?: Record<string, any>) {
    trackEvent(`auth_${event}`, {
        ...data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Track navigation events
 */
export function trackNavigation(from: string, to: string) {
    trackEvent('navigation', {
        from_page: from,
        to_page: to,
        timestamp: new Date().toISOString()
    });
}

/**
 * Track error events
 */
export function trackError(error: Error, context?: Record<string, any>) {
    trackEvent('error_occurred', {
        error_message: error.message,
        error_stack: error.stack?.slice(0, 500),
        ...context,
        timestamp: new Date().toISOString()
    });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, action: string, data?: Record<string, any>) {
    trackEvent('feature_used', {
        feature_name: featureName,
        action,
        ...data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Success metrics to track:
 * 
 * 1. Onboarding Completion Rate
 *    - Track: onboarding_started, onboarding_completed, onboarding_abandoned
 *    - Target: 85%+
 * 
 * 2. Drawer Engagement
 *    - Track: drawer_opened events
 *    - Target: 40%+ of users open drawer at least once
 * 
 * 3. Search Usage
 *    - Track: drawer_search_used events
 *    - Target: 20%+ of drawer sessions use search
 * 
 * 4. Request Submissions
 *    - Track: integration_requested events
 *    - Target: <5% (means catalog is comprehensive)
 * 
 * 5. Time to Complete Step 2
 *    - Track: timeSpent on channels step
 *    - Target: <90s median
 * 
 * 6. Field Completion Rate
 *    - Track: field_completed events
 *    - Target: >95% completion before moving to next step
 * 
 * 7. Validation Error Rate
 *    - Track: validation_error events
 *    - Target: <10% of field interactions
 */

