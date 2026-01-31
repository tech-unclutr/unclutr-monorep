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
    return (
        <ProtectedRoute>
            <OnboardingProvider>
                <div className="bg-white min-h-screen relative">
                    {children}
                </div>
            </OnboardingProvider>
        </ProtectedRoute>
    );
}
