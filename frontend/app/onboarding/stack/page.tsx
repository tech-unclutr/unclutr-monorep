"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/new/onboarding-shell';
import { VerticalStep } from '@/components/onboarding/new/vertical-step';
import { ChipSelector } from '@/components/onboarding/new/chip-selector';
import { useOnboarding } from '@/store/onboarding-context';
import { Button } from '@/components/ui/button';
import { DataSource, datasourceCatalog } from '@/data/datasourceCatalog';
import { motion, AnimatePresence } from 'framer-motion';

type StackSection = 'orders' | 'payments' | 'shipping' | 'payouts';

export default function StackPage() {
    const router = useRouter();
    const { state, updateStack } = useOnboarding();
    const [activeSection, setActiveSection] = useState<StackSection>('orders');

    // Logic for Payouts "Accounting" sub-selection
    const [showAccountingSelector, setShowAccountingSelector] = useState(false);

    const hasData = (section: StackSection) => {
        return state.stack[section] && state.stack[section].length > 0;
    };

    useEffect(() => {
        if (!hasData('orders')) setActiveSection('orders');
        else if (!hasData('payments')) setActiveSection('payments');
        else if (!hasData('shipping')) setActiveSection('shipping');
        else if (!hasData('payouts')) setActiveSection('payouts');
    }, []);

    const handleGlobalNext = () => {
        if (activeSection === 'orders') {
            setActiveSection('payments');
        } else if (activeSection === 'payments') {
            setActiveSection('shipping');
        } else if (activeSection === 'shipping') {
            setActiveSection('payouts');
        } else if (activeSection === 'payouts') {
            router.push('/onboarding/review');
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleGlobalNext();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeSection]);

    const renderSummary = (section: StackSection) => {
        const ids = state.stack[section];
        if (!ids || ids.length === 0) return <p className="text-sm text-zinc-400 italic">Skipped</p>;

        const uniqueIds = Array.from(new Set(ids));
        const sources = uniqueIds.map(id => datasourceCatalog.find(s => s.id === id)).filter(Boolean) as DataSource[];

        return (
            <div className="flex flex-wrap gap-2 mt-1">
                {sources.map(s => (
                    <div key={s.id} className="inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-lg px-2.5 py-1">
                        {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-4 h-4 object-contain" /> : <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] font-bold">{s.displayName[0]}</div>}
                        <span className="text-xs font-medium text-zinc-700">{s.displayName}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Special handler for Payouts to detect "Accounting" selection
    const handlePayoutsToggle = (id: string) => {
        const source = datasourceCatalog.find(s => s.id === id);
        if (source?.categories.includes('accounting_tools')) {
            const current = state.stack.payouts;
            const next = current.includes(id)
                ? current.filter(i => i !== id)
                : [...current, id];
            updateStack({ payouts: next });
            return;
        }

        if (['bank_transfer', 'excel_csv', 'not_sure'].includes(id) || source?.categories.includes('stack_payouts')) {
            const current = state.stack.payouts;
            const next = current.includes(id)
                ? current.filter(i => i !== id)
                : [...current, id];
            updateStack({ payouts: next });
        }
    };

    return (
        <OnboardingShell
            title="Quick stack snapshot."
            subtitle="Where does your 'truth' live? We match numbers to your reality."
            onNext={handleGlobalNext}
        >
            <div className="mt-8 max-w-xl mx-auto pb-24">

                {/* Step 1: Orders */}
                <VerticalStep
                    stepNumber={1}
                    title="Orders & Catalog"
                    description="Where do orders originate? We use this to match sales IDs."
                    isActive={activeSection === 'orders'}
                    isCompleted={hasData('orders') && activeSection !== 'orders'}
                    onEdit={() => setActiveSection('orders')}
                    summary={renderSummary('orders')}
                >
                    <div className="space-y-6">
                        <ChipSelector
                            category="stack_orders"
                            selectedIds={state.stack.orders}
                            onToggle={(id) => {
                                const current = state.stack.orders;
                                const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                                updateStack({ orders: next });
                            }}
                        />
                    </div>
                </VerticalStep>

                {/* Step 2: Payments */}
                <VerticalStep
                    stepNumber={2}
                    title="Payments & Refunds"
                    description="Where are payments, fees, and refunds recorded?"
                    isActive={activeSection === 'payments'}
                    isCompleted={hasData('payments') && activeSection !== 'payments'}
                    onEdit={() => setActiveSection('payments')}
                    summary={renderSummary('payments')}
                >
                    <div className="space-y-6">
                        <ChipSelector
                            category="stack_payments"
                            selectedIds={state.stack.payments}
                            onToggle={(id) => {
                                const current = state.stack.payments;
                                const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                                updateStack({ payments: next });
                            }}
                        />
                    </div>
                </VerticalStep>

                {/* Step 3: Shipping */}
                <VerticalStep
                    stepNumber={3}
                    title="Shipping & Returns"
                    description="Where do shipment status, RTO, and returns live?"
                    isActive={activeSection === 'shipping'}
                    isCompleted={hasData('shipping') && activeSection !== 'shipping'}
                    onEdit={() => setActiveSection('shipping')}
                    summary={renderSummary('shipping')}
                >
                    <div className="space-y-6">
                        <ChipSelector
                            category="stack_shipping"
                            selectedIds={state.stack.shipping}
                            onToggle={(id) => {
                                const current = state.stack.shipping;
                                const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                                updateStack({ shipping: next });
                            }}
                        />
                    </div>
                </VerticalStep>

                {/* Step 4: Payouts */}
                <VerticalStep
                    stepNumber={4}
                    title="Settlements & Payouts"
                    description="Where do you track actual payouts vs deductions?"
                    isActive={activeSection === 'payouts'}
                    isCompleted={hasData('payouts') && activeSection !== 'payouts'}
                    isLast
                    onEdit={() => setActiveSection('payouts')}
                    summary={renderSummary('payouts')}
                >
                    <div className="space-y-6">
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                            <p className="text-sm text-emerald-900 leading-relaxed">
                                <span className="font-semibold">Context:</span> This is how we match "Sales" to "Money in Bank".
                            </p>
                        </div>

                        <ChipSelector
                            category="stack_payouts"
                            selectedIds={state.stack.payouts}
                            onToggle={handlePayoutsToggle}
                        />

                        {/* Accounting Reveal */}
                        <div className="pt-2">
                            <button
                                onClick={() => setShowAccountingSelector(!showAccountingSelector)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
                            >
                                {showAccountingSelector ? 'Hide' : '+ Add'} Accounting System
                            </button>

                            <AnimatePresence>
                                {showAccountingSelector && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 pl-4 border-l-2 border-indigo-100 ml-1">
                                            <p className="text-sm text-zinc-500 mb-3">Which accounting tool?</p>
                                            <ChipSelector
                                                category="accounting_tools"
                                                selectedIds={state.stack.payouts}
                                                onToggle={handlePayoutsToggle}
                                                showSearch={false}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </VerticalStep>

            </div>
        </OnboardingShell>
    );
}
