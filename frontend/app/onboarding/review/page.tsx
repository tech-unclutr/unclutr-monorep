"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/new/onboarding-shell';
import { ReviewSummaryRow } from '@/components/onboarding/new/review-summary-row';
import { useOnboarding } from '@/store/onboarding-context';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReviewPage() {
    const router = useRouter();
    const { state } = useOnboarding();

    const handleFinish = () => {
        console.log("Final Submission:", state);
        router.push('/dashboard');
    };

    return (
        <OnboardingShell
            title="You’re set for a fast start."
            subtitle="We’ll use this to tailor what you see first — keeping everything else out of your way."
            showFooter={false}
        >
            <div className="space-y-8 mt-4">

                {/* Identity Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Identity & Context</h3>
                            <Button variant="ghost" size="sm" onClick={() => router.push('/onboarding/basics')} className="text-zinc-400 hover:text-black hover:bg-zinc-100 h-8 text-xs font-medium px-3 rounded-full">
                                Edit
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Company</p>
                                <p className="font-semibold text-lg text-zinc-900">{state.companyName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Brand</p>
                                <p className="font-semibold text-lg text-zinc-900">{state.brandName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wide">Region</p>
                                <p className="font-medium text-base text-zinc-600 flex items-center gap-2">
                                    India · INR · Asia/Kolkata
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Channels Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm"
                >
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Selling Channels</h3>
                    <ReviewSummaryRow
                        label="D2C Platform"
                        editPath="/onboarding/channels"
                        selectedIds={state.channels.d2c}
                    />
                    <ReviewSummaryRow
                        label="Marketplaces"
                        editPath="/onboarding/channels"
                        selectedIds={state.channels.marketplaces}
                    />
                    <ReviewSummaryRow
                        label="Quick Commerce"
                        editPath="/onboarding/channels"
                        selectedIds={state.channels.qcom}
                    />
                </motion.div>

                {/* Stack Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm"
                >
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Truth Stack</h3>
                    <ReviewSummaryRow
                        label="Orders Truth"
                        editPath="/onboarding/stack"
                        selectedIds={state.stack.orders}
                    />
                    <ReviewSummaryRow
                        label="Payments Truth"
                        editPath="/onboarding/stack"
                        selectedIds={state.stack.payments}
                    />
                    <ReviewSummaryRow
                        label="Shipping Truth"
                        editPath="/onboarding/stack"
                        selectedIds={state.stack.shipping}
                    />
                    <ReviewSummaryRow
                        label="Payouts Truth"
                        editPath="/onboarding/stack"
                        selectedIds={state.stack.payouts}
                    />
                </motion.div>

                <div className="pt-8 pb-12 flex flex-col items-center">
                    <Button
                        onClick={handleFinish}
                        className="bg-black text-white hover:bg-zinc-800 h-16 px-12 rounded-2xl text-lg font-medium shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
                    >
                        Enter Unclutr <ArrowRight className="ml-2" size={20} />
                    </Button>
                    <p className="text-zinc-400 text-sm mt-6">
                        That’s enough to start. You can go deeper whenever you want.
                    </p>
                </div>
            </div>
        </OnboardingShell>
    );
}
