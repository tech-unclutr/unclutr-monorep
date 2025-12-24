"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Gatekeeper component that redirects unauthenticated users to /login.
 * Enhances security for 'Command Center' routes.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // We only redirect if we are DEFINITELY not loading and DEFINITELY not authenticated
        if (!loading && !isAuthenticated) {
            console.log(`DEBUG: ProtectedRoute - Unauthenticated access to ${pathname}, redirecting to /login`);
            router.push("/login");
        }
    }, [isAuthenticated, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    <p className="text-sm text-neutral-500 animate-pulse font-medium tracking-tight">
                        Securing session...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return <>{children}</>;
}
