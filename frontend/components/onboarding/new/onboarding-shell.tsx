"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/store/onboarding-context';
import { AutoSaveIndicator } from '../auto-save-indicator';

interface OnboardingShellProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: React.ReactNode;
    onNext?: () => void;
    nextDisabled?: boolean;
    showFooter?: boolean;
    privacyNote?: string;
    nextLabel?: string;
    showSkip?: boolean;
    onSkip?: () => void;
    maxWidth?: string;
    titleAlign?: 'left' | 'center' | 'right';
    tightHeader?: boolean;
}


export function OnboardingShell({
    children,
    title,
    subtitle,
    onNext,
    nextDisabled = false,
    showFooter = true,
    privacyNote,
    nextLabel = "Continue",
    showSkip = false,
    onSkip,
    maxWidth = "max-w-3xl",
    titleAlign = "left",
    tightHeader = false,
}: OnboardingShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { isSaving, saveAndExit, lastSavedAt } = useOnboarding();

    const currentStepIndex = 0; // Fixed as we are moving to one-page

    const handleBack = () => {
        if (currentStepIndex > 0) {
            router.back();
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-orange-50/20 text-zinc-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden relative">

            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-orange-50 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Top Bar - Clean & Simple */}
            <nav className="h-16 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-zinc-100">
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
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2.5"
                    >
                        <div className="relative w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg shadow-orange-500/20 flex items-center justify-center border border-white/20">
                            <div className="w-3.5 h-3.5 bg-white rounded-[2px] shadow-sm" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter text-zinc-900">
                            Square<span className="text-zinc-500 font-medium">Up.ai</span>
                        </span>
                    </motion.div>
                </div>

                <AutoSaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center w-full relative z-10 pb-0">
                <div className={`w-full ${maxWidth} px-6 py-4 md:py-6 flex flex-col`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col"
                        >
                            {(title || subtitle) && (
                                <div className={`${tightHeader ? 'mb-2' : 'mb-6'} text-center md:text-${titleAlign}`}>
                                    {title && (
                                        <motion.h1
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1, duration: 0.8 }}
                                            className="text-3xl md:text-4xl font-semibold tracking-tighter mb-2 text-zinc-900"
                                        >
                                            {title}
                                        </motion.h1>
                                    )}
                                    {subtitle && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2, duration: 0.8 }}
                                            className={`text-base md:text-lg text-zinc-500 leading-relaxed max-w-xl font-light ${titleAlign === 'center' ? 'mx-auto' : ''}`}
                                        >
                                            {subtitle}
                                        </motion.div>
                                    )}
                                    {privacyNote && (
                                        <p className="text-xs text-zinc-400 mt-2 font-medium bg-zinc-50/50 backdrop-blur-sm inline-block px-3 py-1 rounded-lg border border-zinc-100">
                                            {privacyNote}
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
                <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-zinc-100 py-5 px-6 md:px-12 z-40 flex items-center justify-between md:justify-end">
                    <div className="hidden md:flex items-center gap-3 text-xs text-zinc-400 font-medium mr-8">
                        <span className="bg-zinc-100/80 border border-zinc-200 rounded-md px-2 py-1 flex items-center shadow-sm">
                            <span className="text-[10px] mr-1">Enter</span>
                            <span className="text-sm">↵</span>
                        </span>
                        <span>to continue</span>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {showSkip && onSkip && (
                            <Button
                                variant="ghost"
                                onClick={onSkip}
                                disabled={isSaving}
                                className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50 transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Skip for now"}
                            </Button>
                        )}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 md:flex-none"
                        >
                            <Button
                                onClick={onNext}
                                disabled={nextDisabled}
                                size="lg"
                                className="w-full md:w-auto text-base px-8 h-12 rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <span className="relative z-10">{nextLabel}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </Button>
                        </motion.div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
