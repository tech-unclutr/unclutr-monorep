"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MetricCard } from "./metric-card";
import { Users, Building2, Workflow, Database, Activity, TrendingUp } from "lucide-react";

interface OverviewData {
    total_users: number;
    active_users_7d: number;
    total_companies: number;
    total_datasources: number;
    total_integrations: number;
    avg_onboarding_completion: number;
    system_health: number;
}

export function OverviewMetrics() {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await api.get("/metrics/overview");
            setData(result);
        } catch (error) {
            console.error("Failed to fetch overview metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every minute
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
                label="Total Users"
                value={data?.total_users?.toLocaleString() || "0"}
                subValue={`${data?.active_users_7d || 0} active (7d)`}
                icon={Users}
                color="indigo"
                loading={loading}
                trend={5} // Placeholder trend
                trendLabel="vs last month"
            />
            <MetricCard
                label="Companies"
                value={data?.total_companies?.toLocaleString() || "0"}
                icon={Building2}
                color="rose"
                loading={loading}
                trend={data?.total_companies ? 10 : 0}
                trendLabel="growth"
            />
            <MetricCard
                label="Onboarding Rate"
                value={`${Math.round(data?.avg_onboarding_completion || 0)}%`}
                icon={TrendingUp}
                color="emerald"
                loading={loading}
                trend={2}
                trendLabel="completion"
            />
            <MetricCard
                label="Integrations"
                value={data?.total_integrations?.toLocaleString() || "0"}
                subValue={`${data?.total_datasources || 0} supported`}
                icon={Workflow}
                color="amber"
                loading={loading}
                trend={0}
                trendLabel="active"
            />
        </div>
    );
}
