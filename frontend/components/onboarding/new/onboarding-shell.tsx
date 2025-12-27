"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/store/onboarding-context';

interface OnboardingShellProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    onNext?: () => void;
    nextDisabled?: boolean;
    showFooter?: boolean;
}

const steps = [
    { id: 'basics', label: 'Basics', path: '/onboarding/basics' },
    { id: 'channels', label: 'Channels', path: '/onboarding/channels' },
    { id: 'stack', label: 'Stack', path: '/onboarding/stack' },
    { id: 'review', label: 'Finish', path: '/onboarding/review' },
];

export function OnboardingShell({
    children,
    title,
    subtitle,
    onNext,
    nextDisabled = false,
    showFooter = true,
}: OnboardingShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { saveAndExit } = useOnboarding();

    const currentStepIndex = steps.findIndex(step =>
        pathname.startsWith(step.path) ||
        (step.id === 'stack' && pathname.includes('/onboarding/stack'))
    );

    const handleBack = () => {
        if (currentStepIndex > 0) {
            router.back();
        }
    };

    const handleSaveAndExit = () => {
        saveAndExit();
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">

            {/* Premium Ambient Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Top Right Glow - Very Subtle Indigo */}
                <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-50/40 blur-[120px] opacity-60 mix-blend-multiply" />

                {/* Bottom Left Glow - Very Subtle Emerald/Teal */}
                <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-50/40 blur-[120px] opacity-50 mix-blend-multiply" />

                {/* Moving element example (optional, kept static for performance/uncluttered feel) */}
            </div>

            {/* Top Bar - Minimalist Glass */}
            <nav className="h-20 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-zinc-50/50">
                <div className="flex items-center gap-6">
                    {currentStepIndex > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                    )}
                    <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-600">
                        Unclutr.ai
                    </span>

                    {/* Central Progress - Vertical Separator Style */}
                    <div className="hidden md:flex items-center gap-1.5 ml-8 pl-8 border-l border-zinc-100 h-8">
                        {steps.map((step, idx) => {
                            const isActive = idx === currentStepIndex;
                            const isCompleted = idx < currentStepIndex;
                            return (
                                <React.Fragment key={step.id}>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-zinc-100' : ''
                                        }`}>
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-black scale-100' : isCompleted ? 'bg-zinc-300' : 'bg-zinc-100'
                                                }`}
                                        />
                                        <span className={`text-xs font-medium transition-colors ${isActive ? 'text-zinc-900' : 'text-zinc-400'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Auto-save Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hidden sm:flex items-center gap-2"
                    >
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Auto-saving</span>
                    </motion.div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveAndExit}
                        className="text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-full px-5 h-9 text-xs font-medium border border-zinc-100 hover:border-zinc-200 transition-all bg-white shadow-sm hover:shadow"
                    >
                        Save & exit
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center w-full relative z-10 pb-32">
                <div className="w-full max-w-3xl px-6 py-6 md:py-10 flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col"
                        >
                            {(title || subtitle) && (
                                <div className="mb-12 text-center md:text-left">
                                    {title && (
                                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-4 text-zinc-900 bg-clip-text">
                                            {title}
                                        </h1>
                                    )}
                                    {subtitle && (
                                        <p className="text-xl text-zinc-500 leading-relaxed max-w-xl font-light">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            )}
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Typeform-style Fixed Footer */}
            {showFooter && onNext && (
                <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-zinc-100 py-6 px-6 md:px-12 z-40 flex items-center justify-between md:justify-end">
                    <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 font-medium mr-6">
                        <span className="bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5">Enter ↵</span>
                        to continue
                    </div>
                    <Button
                        onClick={onNext}
                        disabled={nextDisabled}
                        size="lg"
                        className="w-full md:w-auto text-lg px-8 h-12 rounded-xl bg-black hover:bg-zinc-800 text-white shadow-xl shadow-black/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue
                    </Button>
                </div>
            )}
        </div>
    );
}
