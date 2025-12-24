"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Dashboard Layout
 * Wraps all dashboard routes in a ProtectedRoute to ensure 
 * that only authenticated users can access the Command Center.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}
