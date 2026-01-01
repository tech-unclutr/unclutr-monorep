"use client";

import React from 'react';
import { OnboardingProvider } from '@/store/onboarding-context';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { skipOnboardingSession } = useAuth();
    const router = useRouter();

    return (
        <ProtectedRoute>
            <OnboardingProvider>
                <div className="bg-white min-h-screen relative">
                    <OnboardingHeader />
                    {children}
                </div>
            </OnboardingProvider>
        </ProtectedRoute>
    );
}

import { useOnboarding } from '@/store/onboarding-context';

function OnboardingHeader() {
    const { saveAndExit } = useOnboarding();

    const pathname = usePathname();
    const isFinishPage = pathname?.endsWith('/finish');

    if (isFinishPage) return null;

    return (
        <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
            <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Auto-saving
            </span>
            <button
                onClick={saveAndExit}
                className="bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm active:scale-95"
            >
                Save & exit
            </button>
        </div>
    );
}
