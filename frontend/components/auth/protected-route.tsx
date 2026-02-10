"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { MagicLoader } from "@/components/ui/magic-loader";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Gatekeeper component that redirects unauthenticated users to /login.
 * Enhances security for 'Command Center' routes.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading, onboardingCompleted, hasSkippedOnboarding } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // We only redirect if we are DEFINITELY not loading
        if (!loading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (onboardingCompleted === false && !hasSkippedOnboarding && !pathname?.startsWith('/onboarding')) {
                router.push("/onboarding/basics");
            }
        }
    }, [isAuthenticated, loading, onboardingCompleted, hasSkippedOnboarding, router, pathname]);

    if (loading || (isAuthenticated && onboardingCompleted === false && !hasSkippedOnboarding && !pathname?.startsWith('/onboarding'))) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <MagicLoader text="Securing session..." />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return <>{children}</>;
}
