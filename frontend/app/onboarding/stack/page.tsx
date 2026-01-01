"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Minus } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding/new/onboarding-shell';
import { VerticalStep } from '@/components/onboarding/new/vertical-step';
import { ChipSelector } from '@/components/onboarding/new/chip-selector';
import { useOnboarding } from '@/store/onboarding-context';
import { useAuth } from '@/context/auth-context';
import { client } from '@/lib/api/client';
import { api } from '@/lib/api';
import { DataSource } from '@/data/datasourceCatalog';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

// Types matching backend
interface APIDataSource {
    id: string;
    name: string;
    slug: string;
    category: string;
    logo_url?: string;
    display_name?: string;
    is_common: boolean;
}

type Step3Section = 'shipping' | 'payments' | 'marketing' | 'analytics' | 'finance';

export default function StackPage() {
    const router = useRouter();
    const { state, updateStack, saveAndExit } = useOnboarding();
    const { user, loading: authLoading } = useAuth(); // Use auth context
    const [activeSection, setActiveSection] = useState<Step3Section>('shipping');
    const [datasources, setDatasources] = useState<APIDataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Datasources
    useEffect(() => {
        const fetchDatasources = async () => {
            if (authLoading) return;
            if (!user) return; // Wait for user

            try {
                // Explicitly get token to match Step 2 reliability
                const token = await user.getIdToken();
                const res = await api.get('/datasources/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // API returns array directly
                if (Array.isArray(res)) {
                    setDatasources(res);
                } else if (res && Array.isArray(res.data)) {
                    setDatasources(res.data);
                } else {
                    console.error("Unexpected datasources response format:", res);
                    setDatasources([]);
                }
            } catch (error) {
                console.error("Failed to fetch datasources:", error);
                alert("Failed to load stack options. Please refresh the page or check your connection.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDatasources();
    }, [user, authLoading]);

    // Categorize
    const categorized = useMemo(() => {
        return {
            shipping: datasources.filter(d => d.category === 'Logistics'),
            payments: datasources.filter(d => ['Payment', 'Payouts'].includes(d.category)),
            marketing: datasources.filter(d => d.category === 'Marketing'),
            analytics: datasources.filter(d => ['Analytics', 'Retention', 'Communication'].includes(d.category)),
            finance: datasources.filter(d => d.category === 'Accounting'),
        };
    }, [datasources]);

    // Helpers
    const hasData = (ids: string[]) => ids && ids.length > 0;

    const handleNext = async () => {
        if (activeSection === 'shipping') setActiveSection('payments');
        else if (activeSection === 'payments') setActiveSection('marketing');
        else if (activeSection === 'marketing') setActiveSection('analytics');
        else if (activeSection === 'analytics') setActiveSection('finance');
        else if (activeSection === 'finance') {
            await handleFinish();
        }
    };

    const handleFinish = async () => {
        try {
            if (user) {
                // Flatten stack data for backend
                const allTools = [
                    ...(state.stack.orders || []),
                    ...(state.stack.payments || []),
                    ...(state.stack.shipping || []),
                    ...(state.stack.payouts || []),
                    ...(state.stack.marketing || []),
                    ...(state.stack.analytics || []),
                    ...(state.stack.finance || [])
                ];

                await client.onboarding.saveProgressApiV1OnboardingSavePost({
                    requestBody: {
                        page: 'stack',
                        data: {
                            ...state.stack,
                            selectedTools: allTools
                        }
                    }
                });
            }
            router.push('/onboarding/finish');
        } catch (e) {
            console.error('Failed to save stack data:', e);
            // Continue anyway - data is in localStorage
            router.push('/onboarding/finish');
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't hijack if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSection]); // Re-bind when section changes

    // Render Summary
    const renderSummary = (ids: string[]) => {
        if (!ids || ids.length === 0) return <p className="text-sm text-zinc-400 italic">None selected</p>;
        const selected = datasources.filter(d => ids.includes(d.id));
        return (
            <div className="flex flex-wrap gap-2 mt-1">
                {selected.map(s => {
                    const isNotApplicable = s.name?.toLowerCase().includes("not applicable");
                    return (
                        <div key={s.id} className="inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1">
                            {isNotApplicable ? (
                                <div className="w-4 h-4 rounded-full border border-zinc-200 flex items-center justify-center">
                                    <Minus size={10} className="text-zinc-400" strokeWidth={1.5} />
                                </div>
                            ) : s.logo_url ? (
                                <img src={s.logo_url} alt="" className="w-4 h-4 object-contain" />
                            ) : (
                                <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold">{s.name[0]}</div>
                            )}
                            <span className="text-xs font-medium text-zinc-700">{s.display_name || s.name}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Helper for Not Applicable Exclusivity
    const handleToggle = (
        section: keyof typeof state.stack,
        id: string,
        allSources: APIDataSource[]
    ) => {
        const current = state.stack[section] || [];
        const source = allSources.find(s => s.id === id);
        const isNotApplicable = source?.name?.toLowerCase().includes("not applicable");

        // Find existing Not Applicable ID in current selection
        const existingNA = current.find(cid => {
            const s = allSources.find(as => as.id === cid);
            return s?.name?.toLowerCase().includes("not applicable");
        });

        let next: string[] = [];

        if (isNotApplicable) {
            // If selecting N/A, clear everything else
            next = current.includes(id) ? [] : [id];
        } else {
            // Normal selection
            if (current.includes(id)) {
                // Deselecting
                next = current.filter(i => i !== id);
            } else {
                // Selecting new item: Remove N/A if present, then add new
                next = current.filter(cid => cid !== existingNA).concat(id);
            }
        }

        updateStack({ [section]: next });
    };

    // Step 4 Sub-Tabs


    // ... (Main Render)
    return (
        <OnboardingShell
            title="Your Ops Stack"
            subtitle={
                <div className="space-y-2">
                    <p>Tell us what tools you use today. We'll use this only to personalize your Integrations page later.</p>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Lock size={14} className="text-zinc-400" />
                        <span>No logins required. Update anytime.</span>
                    </div>
                </div>
            }
            onNext={handleNext}
            nextLabel={activeSection === 'finance' ? "Complete Setup" : "Continue"}
            showSkip
            onSkip={saveAndExit}
        >


            <div className="mt-8 max-w-xl mx-auto pb-24 space-y-2">
                {/* 3.1 Logistics */}
                <VerticalStep
                    stepNumber={1}
                    title="Logistics & Returns"
                    description="Which tools do you use to ship orders and handle returns?"
                    isActive={activeSection === 'shipping'}
                    isCompleted={hasData(state.stack.shipping) && activeSection !== 'shipping'}
                    onEdit={() => setActiveSection('shipping')}
                    summary={renderSummary(state.stack.shipping)}
                >
                    <div className="space-y-4">
                        <ChipSelector
                            category="Logistics"
                            commonSources={categorized.shipping.filter(d => d.is_common)}
                            allSources={datasources}
                            selectedIds={state.stack.shipping}
                            onToggle={(id) => handleToggle('shipping', id, datasources)}
                            showSearch={false}
                            drawerVariant="stack"
                            priorityCategory="Logistics"
                        />
                    </div>
                </VerticalStep>

                {/* 3.2 Payments */}
                <VerticalStep
                    stepNumber={2}
                    title="Payments & Settlements"
                    description="Which tools touch your money flow? (Gateways, Payouts, etc)"
                    isActive={activeSection === 'payments'}
                    isCompleted={hasData(state.stack.payments) && activeSection !== 'payments'}
                    onEdit={() => setActiveSection('payments')}
                    summary={renderSummary(state.stack.payments)}
                >
                    <div className="space-y-6">
                        <ChipSelector
                            category="Payment"
                            commonSources={categorized.payments.filter(d => d.is_common)}
                            allSources={datasources}
                            selectedIds={state.stack.payments}
                            onToggle={(id) => handleToggle('payments', id, datasources)}
                            showSearch={false}
                            drawerVariant="stack"
                            priorityCategory="Payment"
                        />
                    </div>
                </VerticalStep>

                {/* 3.3 Marketing */}
                <VerticalStep
                    stepNumber={3}
                    title="Growth & Marketing"
                    description="Which ad platforms do you actively spend on?"
                    isActive={activeSection === 'marketing'}
                    isCompleted={hasData(state.stack.marketing) && activeSection !== 'marketing'}
                    onEdit={() => setActiveSection('marketing')}
                    summary={renderSummary(state.stack.marketing)}
                >
                    <div className="space-y-6">
                        <ChipSelector
                            category="Marketing"
                            commonSources={categorized.marketing.filter(d => d.is_common)}
                            allSources={datasources}
                            selectedIds={state.stack.marketing}
                            onToggle={(id) => handleToggle('marketing', id, datasources)}
                            showSearch={false}
                            drawerVariant="stack"
                            priorityCategory="Marketing"
                        />
                    </div>
                </VerticalStep>

                {/* 3.4 Analytics (Tabbed) */}
                <VerticalStep
                    stepNumber={4}
                    title="Analytics, CRM & Customer Ops"
                    description="Which tools do you use to track users and talk to customers?"
                    isActive={activeSection === 'analytics'}
                    isCompleted={hasData(state.stack.analytics) && activeSection !== 'analytics'}
                    onEdit={() => setActiveSection('analytics')}
                    isLast={false}
                    summary={renderSummary(state.stack.analytics)}
                >
                    <ChipSelector
                        category="Analytics, CRM & Customer Ops"
                        commonSources={categorized.analytics.filter(d => d.is_common)}
                        allSources={datasources}
                        selectedIds={state.stack.analytics}
                        onToggle={(id) => handleToggle('analytics', id, datasources)}
                        showSearch={false}
                        drawerVariant="stack"
                        priorityCategory="Analytics"
                    />
                </VerticalStep>

                {/* 3.5 Accounting */}
                <VerticalStep
                    stepNumber={5}
                    title="Accounting"
                    description="Optional: Connect your accounting software for profitability tracking."
                    isActive={activeSection === 'finance'}
                    isCompleted={hasData(state.stack.finance) && activeSection !== 'finance'}
                    onEdit={() => setActiveSection('finance')}
                    isLast
                    optional
                    summary={renderSummary(state.stack.finance)}
                >
                    <div className="space-y-6">
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 mb-4">
                            <p className="text-sm text-emerald-900 leading-relaxed">
                                <span className="font-semibold">Pro Tip:</span> Connecting Tally/Zoho now enables true profit calculation later.
                            </p>
                        </div>
                        <ChipSelector
                            category="Accounting"
                            commonSources={categorized.finance.filter(d => d.is_common)}
                            allSources={datasources}
                            selectedIds={state.stack.finance}
                            onToggle={(id) => handleToggle('finance', id, datasources)}
                            showSearch={false}
                            drawerVariant="stack"
                            priorityCategory="Accounting"
                        />
                    </div>
                </VerticalStep>

            </div>
        </OnboardingShell>
    );
}
