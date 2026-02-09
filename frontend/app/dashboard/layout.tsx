"use client";

import { Sidebar } from "@/components/dashboard-new/sidebar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0C0C0E] transition-colors duration-300">
                <Sidebar
                    isCollapsed={isCollapsed}
                    toggleCollapse={() => setIsCollapsed(!isCollapsed)}
                />
                <main
                    className={cn(
                        "flex-1 transition-all duration-300 ease-in-out cubic-bezier(0.4, 0, 0.2, 1)",
                        isCollapsed ? "ml-[80px]" : "ml-[240px]"
                    )}
                >
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
