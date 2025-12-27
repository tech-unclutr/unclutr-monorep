"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";

/**
 * Dashboard Layout
 * Wraps all dashboard routes in a ProtectedRoute and OnboardingGuard.
 * Ensures that users are authenticated and have completed onboarding.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <OnboardingGuard>
                {children}
            </OnboardingGuard>
        </ProtectedRoute>
    );
}
