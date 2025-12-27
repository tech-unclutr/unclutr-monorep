"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataSource } from '@/data/datasourceCatalog';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

interface OnboardingState {
    companyName: string;
    brandName: string;
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
    saveAndExit: () => void;
}

const initialState: OnboardingState = {
    companyName: '',
    brandName: '',
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
    },
    integrationRequestsDraft: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<OnboardingState>(initialState);

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
                const backendData = await api.get('/onboarding/state');
                if (backendData && backendData.data) {
                    console.log("DEBUG: Hydrating from backend:", backendData.data);
                    setState(prev => ({ ...prev, ...backendData.data }));
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

    const saveAndExit = async () => {
        try {
            console.log('Saving to backend...', state);
            // Save to step=1 (Generic draft state for now)
            await api.post('/onboarding/step', {
                step: 1,
                data: state
            });

            // CRITICAL: Mark session as skipped so OnboardingGuard lets us into Dashboard
            skipOnboardingSession();
            router.push('/dashboard');
        } catch (error) {
            console.error("Failed to save state:", error);
            // Even if fail, we redirect? better to alert?
            // For now, alert
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
