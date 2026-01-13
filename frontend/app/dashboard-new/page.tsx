"use client";

import React from 'react';
import useSWR from 'swr';
import { EmptyDashboardState } from "@/components/dashboard-new/empty-dashboard-state";
import { PulseDashboard } from "@/components/dashboard-new/pulse-dashboard";
import { listIntegrations, Integration } from "@/lib/api/integrations";
import { useAuth } from "@/hooks/use-auth";
import { RefreshCw } from "lucide-react";

export default function CashCompassPage() {
    const { companyId } = useAuth();

    const { data: integrations, isLoading } = useSWR<Integration[]>(
        companyId ? `integrations-${companyId}` : null,
        () => listIntegrations(companyId!)
    );

    const activeIntegration = integrations?.find(i =>
        (i.status === 'active' || i.status === 'ACTIVE' || i.status === 'syncing')
    );

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-0.5 mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-display">Cash Compass</h1>
                    <p className="text-gray-400 dark:text-[#71717A] text-sm">P&L at a glance for Jalsaa</p>
                </div>

                <div className="relative">
                    {/* Decorative background element to add depth */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-[#FF8A4C]/5 to-transparent blur-3xl opacity-30 pointer-events-none" />

                    {isLoading ? (
                        <div className="relative bg-white/40 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/[0.03] rounded-[2rem] backdrop-blur-md min-h-[500px] flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-[#FF8A4C] animate-spin" />
                        </div>
                    ) : activeIntegration ? (
                        <PulseDashboard integrationId={activeIntegration.id} />
                    ) : (
                        <div className="relative bg-white/40 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/[0.03] rounded-[2rem] backdrop-blur-md min-h-[500px] flex items-center justify-center transition-all duration-500 hover:border-[#FF8A4C]/20">
                            <EmptyDashboardState
                                title="Connect Your Financials"
                                description="Visualize your revenue, burn, and runway by connecting your bank accounts and accounting software."
                                image="/images/cash-compass-empty.png"
                                lightImage="/images/cash-compass-empty-light.png"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

