"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DataSource } from '@/data/datasourceCatalog';
import { api } from '@/lib/api';
import { client } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface OnboardingState {
    companyName: string;
    brandName: string;
    category: string;
    region: {
        country: string;
        currency: string;
        timezone: string;
    };
    channels: {
        d2c: string[];
        marketplaces: string[];
        qcom: string[];
        others: string[];
    };
    primaryPartners: {
        marketplaces: string[];
        qcom: string[];
    };
    stack: {
        orders: string[];
        payments: string[];
        shipping: string[];
        payouts: string[];
        marketing: string[];
        analytics: string[];
        finance: string[];
    };
    integrationRequestsDraft: Array<{
        term: string;
        context: string;
    }>;
}

interface OnboardingContextType {
    state: OnboardingState;
    updateState: (updates: Partial<OnboardingState>) => void;
    updateChannels: (updates: Partial<OnboardingState['channels']>) => void;
    updatePrimaryPartners: (updates: Partial<OnboardingState['primaryPartners']>) => void;
    updateStack: (updates: Partial<OnboardingState['stack']>) => void;
    addIntegrationRequest: (term: string, context: string) => void;
    saveAndExit: () => Promise<void>;
    saveCurrentPage: (pageOverride?: 'basics' | 'channels' | 'stack' | 'finish', silent?: boolean) => Promise<void>;
    isSaving: boolean;
    lastSavedAt: Date | null;
}

const initialState: OnboardingState = {
    companyName: '',
    brandName: '',
    category: '',
    region: {
        country: '',
        currency: '',
        timezone: ''
    },
    channels: {
        d2c: [],
        marketplaces: [],
        qcom: [],
        others: [],
    },
    primaryPartners: {
        marketplaces: [],
        qcom: [],
    },
    stack: {
        orders: [],
        payments: [],
        shipping: [],
        payouts: [],
        marketing: [],
        analytics: [],
        finance: [],
    },
    integrationRequestsDraft: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<OnboardingState>(initialState);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    // Debounce state to trigger auto-save
    // We exclude complex objects that might cause deep equality issues or loop, 
    // but here we just debounce the whole state reference.
    // To avoid saving on initial load, we can use a ref or check if dirty.
    const debouncedState = useDebouncedValue(state, 1000);
    const isFirstMount = useRef(true);
    const lastSavedStateStr = useRef(JSON.stringify(initialState));

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const currentStateStr = JSON.stringify(debouncedState);
        if (currentStateStr !== lastSavedStateStr.current) {
            saveCurrentPage(undefined, true).catch(err => console.warn("Auto-save failed", err));
            lastSavedStateStr.current = currentStateStr;
        }
    }, [debouncedState]);

    const { user, skipOnboardingSession } = useAuth();
    const router = useRouter();

    // Load from localStorage AND Backend on mount
    useEffect(() => {
        // 1. Local Storage (Fast)
        const saved = localStorage.getItem('unclutr_onboarding_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(prev => ({ ...prev, ...parsed, region: parsed.region || prev.region }));
            } catch (e) {
                console.error('Failed to parse saved onboarding state', e);
            }
        }

        // 2. Backend (Authoritative)
        const fetchBackendState = async () => {
            if (!user) return;
            try {
                const response = await api.get('/onboarding/state');
                if (response) {
                    // ALWAYS Hydrate: Even if is_completed=true, we might be in "Edit" mode.
                    console.log('DEBUG: Backend Raw Response:', response);
                    // ONLY Hydrate if we actually have meaningful data from the backend
                    // This prevents the "Sync Race Condition" where an empty backend record
                    // overwrites a populated local draft before the user finishes.
                    const hasBasics = response.basics_data && (response.basics_data.companyName || response.basics_data.brandName);

                    if (hasBasics || response.is_completed) {
                        const mergedState: Partial<OnboardingState> = {
                            companyName: response.basics_data?.companyName || '',
                            brandName: response.basics_data?.brandName || '',
                            category: response.basics_data?.category || '',
                            region: response.basics_data?.region || initialState.region,
                            channels: response.channels_data?.channels || response.channels_data || initialState.channels,
                            primaryPartners: response.channels_data?.primaryPartners || initialState.primaryPartners,
                            stack: response.stack_data?.stack || response.stack_data || initialState.stack,
                            integrationRequestsDraft: response.finish_data?.integrationRequestsDraft || []
                        };

                        setState(prev => ({ ...prev, ...mergedState }));
                        console.log('Hydrated from backend:', mergedState);
                    } else {
                        console.log('Backend state is empty, keeping local draft.');
                    }
                }
            } catch (err) {
                console.warn("No existing onboarding state found or fetch failed", err);
            }
        };
        fetchBackendState();
    }, [user]);

    const updateState = (updates: Partial<OnboardingState>) => {
        setState((prev) => {
            const newState = { ...prev, ...updates };
            localStorage.setItem('unclutr_onboarding_draft', JSON.stringify(newState));
            return newState;
        });
    };

    const updateChannels = (updates: Partial<OnboardingState['channels']>) => {
        setState((prev) => {
            const newState = { ...prev, channels: { ...prev.channels, ...updates } };
            localStorage.setItem('unclutr_onboarding_draft', JSON.stringify(newState));
            return newState;
        });
    };

    const updatePrimaryPartners = (updates: Partial<OnboardingState['primaryPartners']>) => {
        setState((prev) => {
            const newState = { ...prev, primaryPartners: { ...prev.primaryPartners, ...updates } };
            localStorage.setItem('unclutr_onboarding_draft', JSON.stringify(newState));
            return newState;
        });
    };

    const updateStack = (updates: Partial<OnboardingState['stack']>) => {
        setState((prev) => {
            const newState = { ...prev, stack: { ...prev.stack, ...updates } };
            localStorage.setItem('unclutr_onboarding_draft', JSON.stringify(newState));
            return newState;
        });
    };

    const addIntegrationRequest = (term: string, context: string) => {
        setState((prev) => {
            const newState = {
                ...prev,
                integrationRequestsDraft: [...prev.integrationRequestsDraft, { term, context }],
            };
            localStorage.setItem('unclutr_onboarding_draft', JSON.stringify(newState));
            return newState;
        });
    };

    const saveCurrentPage = async (pageOverride?: 'basics' | 'channels' | 'stack' | 'finish', silent: boolean = false) => {
        if (!silent) setIsSaving(true);
        // If silent (auto-save), we still want to show "Saving..." indicator usually? 
        // The requirements say "missing auto saving component", implying visual feedback is desired.
        // So let's show isSaving even for auto-saves.
        setIsSaving(true);
        try {
            // Determine current page from router or override
            const currentPath = window.location.pathname;
            let currentPage: string = pageOverride || 'basics';

            if (!pageOverride) {
                if (currentPath.includes('/channels')) currentPage = 'channels';
                else if (currentPath.includes('/stack')) currentPage = 'stack';
                else if (currentPath.includes('/finish')) currentPage = 'finish';
            }

            console.log('Saving to backend...', { page: currentPage, state });

            // Validate page type
            const validPages = ['basics', 'channels', 'stack', 'finish'] as const;
            type ValidPage = typeof validPages[number];

            if (!validPages.includes(currentPage as ValidPage)) {
                console.warn("Attempting to save on invalid page:", currentPage);
                setIsSaving(false);
                return;
            }

            // Construct payload based on page
            let payloadData: any = {};

            if (currentPage === 'basics') {
                payloadData = {
                    companyName: state.companyName,
                    brandName: state.brandName,
                    category: state.category,
                    region: state.region
                };
            } else if (currentPage === 'channels') {
                // Flatten channels object into list of IDs for backend
                const allChannels = [
                    ...(state.channels.d2c || []),
                    ...(state.channels.marketplaces || []),
                    ...(state.channels.qcom || []),
                    ...(state.channels.others || [])
                ];
                // Send BOTH structured and flattened data
                payloadData = {
                    selectedChannels: allChannels,
                    channels: state.channels,
                    primaryPartners: state.primaryPartners
                };
            } else if (currentPage === 'stack') {
                // Flatten stack object into list of IDs for backend
                const allTools = [
                    ...(state.stack.orders || []),
                    ...(state.stack.payments || []),
                    ...(state.stack.shipping || []),
                    ...(state.stack.payouts || []),
                    ...(state.stack.marketing || []),
                    ...(state.stack.analytics || []),
                    ...(state.stack.finance || [])
                ];
                // Send BOTH structured and flattened data
                payloadData = {
                    selectedTools: allTools,
                    stack: state.stack
                };
            }

            // Save using generated client
            await client.onboarding.saveProgressApiV1OnboardingSavePost({
                requestBody: {
                    page: currentPage as ValidPage,
                    data: payloadData
                }
            });
            setLastSavedAt(new Date());
            setIsSaving(false);
        } catch (error) {
            console.error("Failed to save state:", error);
            // alert("Failed to save progress. Please check connection."); // Suppress alert for step saves
            setIsSaving(false);
            throw error;
        }
    };

    const saveAndExit = async () => {
        try {
            await saveCurrentPage();
            // CRITICAL: Mark session as skipped so OnboardingGuard lets us into Dashboard
            skipOnboardingSession();
            router.push('/dashboard');
        } catch (e) {
            alert("Failed to save progress. Please check connection.");
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                state,
                updateState,
                updateChannels,
                updatePrimaryPartners,
                updateStack,
                addIntegrationRequest,

                saveAndExit,
                saveCurrentPage,
                isSaving,
                lastSavedAt
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );

}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
