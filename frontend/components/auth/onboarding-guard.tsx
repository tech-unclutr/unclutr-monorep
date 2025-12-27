"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { MagicLoader } from "@/components/ui/magic-loader";

interface OnboardingGuardProps {
    children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
    const { isAuthenticated, onboardingCompleted, loading, isSyncing, hasSkippedOnboarding } = useAuth();
    const [timedOut, setTimedOut] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Safety timeout to prevent infinite loader
        const timer = setTimeout(() => {
            if (loading || isSyncing || (isAuthenticated && onboardingCompleted === null)) {
                console.warn("DEBUG: OnboardingGuard - Status check timed out after 5s.");
                setTimedOut(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [loading, isSyncing, isAuthenticated, onboardingCompleted]);

    useEffect(() => {
        console.log("DEBUG: OnboardingGuard - State Check:", {
            isAuthenticated,
            onboardingCompleted,
            loading,
            isSyncing,
            hasSkippedOnboarding,
            pathname,
            timedOut
        });

        // If we're already on the onboarding page, don't do anything
        if (pathname === "/onboarding") return;

        // If authenticated but onboarding is not completed, redirect to onboarding
        // ONLY if we are NOT currently syncing AND NOT skipped
        if (!loading && !isSyncing && isAuthenticated && onboardingCompleted === false && !hasSkippedOnboarding) {
            console.log("DEBUG: OnboardingGuard - User not onboarded, redirecting to /onboarding");
            router.replace("/onboarding");
        }
    }, [isAuthenticated, onboardingCompleted, loading, isSyncing, hasSkippedOnboarding, pathname, router, timedOut]);

    // While loading auth or onboarding status, show the global loader
    // But if timed out, let them through (they might experience errors later, but better than a hang)
    // While loading auth or onboarding status, show the global loader
    if (!timedOut && (loading || isSyncing || (isAuthenticated && onboardingCompleted === null))) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <MagicLoader text="Checking your access..." />
            </div>
        );
    }

    // Critical flicker fix: If we are about to redirect, DO NOT render children
    if (isAuthenticated && onboardingCompleted === false && !hasSkippedOnboarding && pathname !== "/onboarding") {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <MagicLoader text="Redirecting to setup..." />
            </div>
        );
    }

    // If authenticated and onboarding is completed (or not authenticated - let other guards handle that), 
    // or if we're already on the onboarding page, render children
    return <>{children}</>;
}
