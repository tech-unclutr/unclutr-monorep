import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Activity, TrendingUp, Phone, CheckCircle2, XCircle, Wallet } from "lucide-react";

interface CampaignStatsProps {
    campaignId: string;
}

interface StatsData {
    total_cost: number;
    total_duration: number;
    total_calls: number;
    avg_cost: number;
    avg_duration: number;
    status_breakdown: Record<string, number>;
    outcome_breakdown: Record<string, number>;
}

export function CampaignStats({ campaignId }: CampaignStatsProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const data: any = await api.get(`/execution/campaign/${campaignId}/stats`);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch campaign stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Poll every 30s
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [campaignId]);

    if (loading && !stats) return <div className="animate-pulse h-24 w-full bg-white/5 rounded-xl"></div>;

    if (!stats) return null;

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    // Calculate success rate (INTENT_YES or COMPLETED / TOTAL) - simplistic
    // Or just use outcome breakdown
    const completedCount = stats.status_breakdown['completed'] || 0;
    const completionRate = stats.total_calls > 0 ? (completedCount / stats.total_calls * 100).toFixed(1) : "0.0";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Cost */}
            <Card className="bg-white/5 border-white/10 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Total Spend (INR)</CardTitle>
                    <Wallet className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">₹{(stats.total_cost * 0.9).toFixed(2)}</div>
                    <p className="text-xs text-zinc-500">
                        Avg ₹{(stats.avg_cost * 0.9).toFixed(3)} / call
                    </p>
                </CardContent>
            </Card>

            {/* Total Calls */}
            <Card className="bg-white/5 border-white/10 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Total Executions</CardTitle>
                    <Phone className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.total_calls}</div>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {completedCount}</span>
                        <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> {stats.status_breakdown['failed'] || 0}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Avg Duration */}
            <Card className="bg-white/5 border-white/10 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Avg Duration</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{formatDuration(stats.avg_duration)}</div>
                    <p className="text-xs text-zinc-500">
                        Total {formatDuration(stats.total_duration)}
                    </p>
                </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card className="bg-white/5 border-white/10 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Completion Rate</CardTitle>
                    <Activity className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{completionRate}%</div>
                    <p className="text-xs text-zinc-500">
                        Successfully completed calls
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
