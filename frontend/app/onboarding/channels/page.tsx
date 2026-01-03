"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Minus } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding/new/onboarding-shell';
import { VerticalStep } from '@/components/onboarding/new/vertical-step';
import { ChipSelector } from '@/components/onboarding/new/chip-selector';
import { useOnboarding } from '@/store/onboarding-context';
import { useAuth } from '@/context/auth-context';
import { client } from '@/lib/api/client';
import { DataSource, datasourceCatalog } from '@/data/datasourceCatalog';
import { api } from '@/lib/api';

type ChannelSection = 'd2c' | 'marketplaces' | 'qcom' | 'others';

export default function ChannelsPage() {
    const router = useRouter();
    const { state, updateChannels, saveCurrentPage } = useOnboarding();
    const { user, loading: authLoading } = useAuth();

    // Track active section for progressive disclosure
    const [activeSection, setActiveSection] = useState<ChannelSection>('d2c');

    // Ref for state to avoid stale closures in event listeners
    const stateRef = React.useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // State for datasources
    const [datasources, setDatasources] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Robust check for data existence (Array safe)
    const hasData = (section: ChannelSection) => {
        const val = state.channels[section];
        return Array.isArray(val) ? val.length > 0 : !!val;
    };

    // Auto-advance logic on mount (skip already done)
    useEffect(() => {
        if (!hasData('d2c')) setActiveSection('d2c');
        else if (!hasData('marketplaces')) setActiveSection('marketplaces');
        else if (!hasData('qcom')) setActiveSection('qcom');
        else if (hasData('others')) setActiveSection('others');
    }, []);

    // Fetch datasources
    useEffect(() => {
        const fetchData = async () => {
            if (authLoading) return; // Wait for auth check
            if (!user) return; // Don't fetch if not logged in

            try {
                // Explicitly get token to ensure we are authenticated
                console.log('DEBUG: ChannelsPage - Fetching ID Token for user:', user.email);
                const token = await user.getIdToken();
                console.log('DEBUG: ChannelsPage - ID Token retrieved (len):', token?.length);

                const data = await api.get('/datasources', {
                    Authorization: `Bearer ${token}`
                });
                setDatasources(data);
            } catch (err) {
                console.error("Failed to load datasources", err);
                alert("Failed to load channel options. Please refresh the page or check your connection.");
            } finally {
                setDataLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading]);

    // Filter helpers
    const getCommonSources = (cat: string) => (datasources || []).filter(d => d.category === cat && d.is_common);

    // Compute Global Selected IDs for drawer state
    const allGlobalIds = [
        ...(Array.isArray(state.channels.d2c) ? state.channels.d2c : (state.channels.d2c ? [state.channels.d2c] : [])),
        ...(state.channels.marketplaces || []),
        ...(state.channels.qcom || []),
        ...(state.channels.others || [])
    ];

    // Global Smart Select Handler
    const handleGlobalSelect = (source: any) => {
        let bucket: ChannelSection | null = null;

        // Categorize based on backend strings
        if (source.category === 'Storefront') bucket = 'd2c';
        else if (source.category === 'Marketplace') bucket = 'marketplaces';
        else if (source.category === 'QuickCommerce') bucket = 'qcom';
        else if (['Network', 'SocialCommerce'].includes(source.category)) bucket = 'others';

        // If matches a known bucket
        if (bucket) {
            // Safely get current IDs as array
            const raw = state.channels[bucket];
            const currentIds = Array.isArray(raw) ? raw : (raw ? [raw] : []);

            const isSelected = currentIds.includes(source.id);

            let nextIds: string[];
            if (isSelected) {
                nextIds = currentIds.filter(id => id !== source.id);
            } else {
                nextIds = [...currentIds, source.id];
            }

            // Update the specific channel bucket (always as array)
            updateChannels({ [bucket]: nextIds });

            // If we selected something for "Others" and we are not there, and it wasn't visible... 
            // The step "Others" is conditionally rendered usually if it has data? 
            // Logic: VerticalSteps are usually static.
            // User requested: "add a 4th step with Others header (only if someone selects options from other channels in the drawer)"
            // So we need to conditionally render the 4th step.
            // If we just added to 'others', ensuring re-render will show it.
            // If user is currently in 'qcom', and adds 'others', should we switch to 'others'?
            // Maybe not immediately, but step appears.
        }
    };

    // Generic Toggle for current section (used by inline chips)
    const handleSectionToggle = (section: ChannelSection, id: string) => {
        const raw = state.channels[section];
        const current = Array.isArray(raw) ? raw : (raw ? [raw] : []);

        console.log(`DEBUG: Toggle ${section} ID:`, id, typeof id);
        console.log(`DEBUG: Current IDs:`, current);

        const next = current.includes(id)
            ? current.filter(i => i !== id)
            : [...current, id];

        console.log(`DEBUG: Next IDs:`, next);
        updateChannels({ [section]: next });
    };

    const handleGlobalNext = async () => {
        // Persist progress
        try {
            await saveCurrentPage();
        } catch (error) {
            console.error("Failed to save progress", error);
            // Continue anyway since data is in localStorage
        }

        if (activeSection === 'd2c') {
            if (hasData('d2c')) setActiveSection('marketplaces');
        } else if (activeSection === 'marketplaces') {
            setActiveSection('qcom');
        } else if (activeSection === 'qcom') {
            if (hasData('others')) {
                setActiveSection('others');
            } else {
                router.push('/onboarding/stack');
            }
        } else if (activeSection === 'others') {
            router.push('/onboarding/stack');
        }
    };

    const isNextDisabled = activeSection === 'd2c' && !hasData('d2c');

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Standard accessibility: Don't hijack Enter if user is on an interactive element
            if (target && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) {
                return;
            }

            if (e.key === 'Enter' && !isNextDisabled) {
                handleGlobalNext();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeSection, isNextDisabled, handleGlobalNext]);

    const renderSummary = (section: ChannelSection) => {
        // Safe check for legacy string vs new array
        const rawIds = state.channels[section];
        const ids = Array.isArray(rawIds) ? rawIds : (rawIds ? [rawIds] : []);

        if (!ids || ids.length === 0) return <p className="text-sm text-zinc-400 italic">None selected</p>;

        // Resolve sources
        const sources = ids.map(id =>
            datasources.find(d => d.id === id) || datasourceCatalog.find(s => s.id === id)
        ).filter(Boolean);

        return (
            <div className="flex flex-wrap gap-2 mt-1">
                {sources.map((s: any) => {
                    const isNotApplicable = s.name?.toLowerCase().includes("not applicable");
                    return (
                        <div key={s.id} className="inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1">
                            {s.logoUrl || s.logo_url ? (
                                <img src={s.logoUrl || s.logo_url} alt="" className="w-4 h-4 object-contain" />
                            ) : isNotApplicable ? (
                                <div className="w-4 h-4 rounded-full border border-zinc-200 flex items-center justify-center">
                                    <Minus size={10} className="text-zinc-400" strokeWidth={2} />
                                </div>
                            ) : (
                                <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold">{(s.name || '?')[0]}</div>
                            )}
                            <span className="text-xs font-medium text-zinc-700">{s.display_name || s.name}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const showOthersStep = hasData('others');

    return (
        <OnboardingShell
            title={`Where does ${state.brandName || 'your brand'} sell?`}
            subtitle="Select all platforms you currently use."
            onNext={handleGlobalNext}
            nextDisabled={isNextDisabled}
        >
            <div className="mt-8 max-w-xl mx-auto pb-24">

                {/* Step 1: D2C Website */}
                <VerticalStep
                    stepNumber={1}
                    title="D2C Website"
                    description="Your own storefront(s)."
                    isActive={activeSection === 'd2c'}
                    isCompleted={hasData('d2c') && activeSection !== 'd2c'}
                    onEdit={() => setActiveSection('d2c')}
                    summary={renderSummary('d2c')}
                >
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 mb-4">
                            <p className="text-sm text-blue-900 leading-relaxed">
                                <span className="font-semibold">Why?</span> Helps us parse order IDs and tax rules correctly.
                            </p>
                        </div>

                        <ChipSelector
                            category="selling_channel_d2c"
                            commonSources={getCommonSources('Storefront')}
                            allSources={datasources}
                            isLoading={dataLoading}
                            selectedIds={Array.isArray(state.channels.d2c) ? state.channels.d2c : (state.channels.d2c ? [state.channels.d2c] : [])}
                            globalSelectedIds={allGlobalIds}
                            priorityCategory="Storefront"
                            onToggle={(id) => handleSectionToggle('d2c', id)}
                            onGlobalSelect={handleGlobalSelect}
                            showSearch={false}
                        />
                    </div>
                </VerticalStep>

                {/* Step 2: Marketplaces */}
                <VerticalStep
                    stepNumber={2}
                    title="Marketplaces"
                    description="Portal channels like Amazon, Flipkart, etc."
                    isActive={activeSection === 'marketplaces'}
                    isCompleted={hasData('marketplaces') && activeSection !== 'marketplaces'}
                    onEdit={() => setActiveSection('marketplaces')}
                    summary={renderSummary('marketplaces')}
                >
                    <div className="space-y-6">
                        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 mb-4">
                            <p className="text-sm text-amber-900 leading-relaxed">
                                <span className="font-semibold">Note:</span> Select all that apply.
                            </p>
                        </div>

                        <ChipSelector
                            category="selling_channel_marketplace"
                            commonSources={getCommonSources('Marketplace')}
                            allSources={datasources}
                            isLoading={dataLoading}
                            selectedIds={state.channels.marketplaces}
                            globalSelectedIds={allGlobalIds}
                            priorityCategory="Marketplace"
                            onToggle={(id) => handleSectionToggle('marketplaces', id)}
                            onGlobalSelect={handleGlobalSelect}
                            showSearch={false}
                        />
                    </div>
                </VerticalStep>

                {/* Step 3: Quick Commerce */}
                <VerticalStep
                    stepNumber={3}
                    title="Quick Commerce"
                    description="Hyper-local delivery platforms."
                    isActive={activeSection === 'qcom'}
                    isCompleted={hasData('qcom') && activeSection !== 'qcom'}
                    isLast={!showOthersStep}
                    onEdit={() => setActiveSection('qcom')}
                    summary={renderSummary('qcom')}
                >
                    <div className="space-y-6">
                        <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100/50 mb-4">
                            <p className="text-sm text-purple-900 leading-relaxed">
                                <span className="font-semibold">Tip:</span> Only active channels.
                            </p>
                        </div>

                        <ChipSelector
                            category="selling_channel_qcom"
                            commonSources={getCommonSources('QuickCommerce')}
                            allSources={datasources}
                            isLoading={dataLoading}
                            selectedIds={state.channels.qcom}
                            globalSelectedIds={allGlobalIds}
                            priorityCategory="QuickCommerce"
                            onToggle={(id) => handleSectionToggle('qcom', id)}
                            onGlobalSelect={handleGlobalSelect}
                            showSearch={false}
                        />
                    </div>
                </VerticalStep>

                {/* Step 4: Others (Conditional) */}
                {showOthersStep && (
                    <VerticalStep
                        stepNumber={4}
                        title="Other Channels"
                        description="Social commerce, ONDC, etc."
                        isActive={activeSection === 'others'}
                        isCompleted={hasData('others') && activeSection !== 'others'}
                        isLast={true}
                        onEdit={() => setActiveSection('others')}
                        summary={renderSummary('others')}
                    >
                        <div className="space-y-6">
                            <ChipSelector
                                category="selling_channel_others"
                                commonSources={[...getCommonSources('Network'), ...getCommonSources('SocialCommerce')]}
                                allSources={datasources}
                                isLoading={dataLoading}
                                selectedIds={state.channels.others || []}
                                globalSelectedIds={allGlobalIds}
                                // priorityCategory? Maybe generic or none, drawer defaults
                                onToggle={(id) => handleSectionToggle('others', id)}
                                onGlobalSelect={handleGlobalSelect}
                                showSearch={false}
                            />
                        </div>
                    </VerticalStep>
                )}

            </div>
        </OnboardingShell>
    );
}
