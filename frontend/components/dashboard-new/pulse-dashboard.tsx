"use client";

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Users,
    DollarSign,
    Zap,
    ArrowRight,
    Package,
    Activity,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '@/components/integrations/ActivityFeed';
import { getIntegrationOverview, IntegrationOverview } from '@/lib/api/integrations';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface PulseDashboardProps {
    integrationId: string;
}

export function PulseDashboard({ integrationId }: PulseDashboardProps) {
    const { companyId } = useAuth();

    const { data, error, isLoading, mutate } = useSWR<IntegrationOverview>(
        companyId ? `integration-overview-${integrationId}` : null,
        () => getIntegrationOverview(companyId!, integrationId),
        {
            refreshInterval: 30000, // Refresh every 30s
            revalidateOnFocus: true
        }
    );

    const metrics = useMemo(() => {
        if (!data) return null;
        const current = data.summary;
        return [
            {
                label: "Total Sales (30d)",
                value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(current.total_sales_30d),
                growth: current.growth_pct,
                icon: DollarSign,
                color: "orange",
                description: "Gross sales for last 30 days"
            },
            {
                label: "Total Orders",
                value: current.order_count_30d.toLocaleString(),
                growth: 0, // No API support yet
                icon: ShoppingCart,
                color: "blue",
                description: "Sales volume"
            },
            {
                label: "Average Order Value",
                value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(current.total_sales_30d / (current.order_count_30d || 1)),
                growth: 0, // No API support yet
                icon: TrendingUp,
                color: "emerald",
                description: "Basket size strength"
            }
        ];
    }, [data]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-gray-100 dark:bg-zinc-800/50 rounded-3xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/20">
                <p className="text-red-600 dark:text-red-400 font-medium">Failed to load analytics pulse.</p>
                <Button variant="link" onClick={() => mutate()} className="mt-2 text-red-500">Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* KPI Pulse Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics?.map((metric, idx) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="relative overflow-hidden group border-gray-100/50 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] backdrop-blur-md rounded-[2rem] hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500">
                            {/* Decorative gradient blob */}
                            <div className={cn(
                                "absolute -right-4 -top-4 w-24 h-24 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full",
                                metric.color === "orange" ? "bg-orange-500" :
                                    metric.color === "blue" ? "bg-blue-500" : "bg-emerald-500"
                            )} />

                            <CardContent className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn(
                                        "p-3 rounded-2xl",
                                        metric.color === "orange" ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500" :
                                            metric.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" :
                                                "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        <metric.icon className="w-6 h-6" />
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "h-6 font-bold border-none",
                                        metric.growth >= 0 ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-red-500 bg-red-50 dark:bg-red-500/10"
                                    )}>
                                        {metric.growth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                        {Math.abs(metric.growth).toFixed(1)}%
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{metric.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{metric.value}</h3>
                                </div>

                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {metric.description}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Split: Velocity Chart & Live Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Analytics Block */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="overflow-hidden border-gray-100/50 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] backdrop-blur-md rounded-[2.5rem]">
                        <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Revenue Velocity</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-zinc-400">Daily performance trends</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-xl h-8 text-[10px] font-bold uppercase tracking-wider">30 Days</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => mutate()}>
                                    <RefreshCw className="h-4 w-4 text-gray-400" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 h-[350px] relative">
                            {/* Premium Custom SVG Chart Placeholder (Simulated) */}
                            <div className="absolute inset-x-8 bottom-8 top-12 flex items-end justify-between gap-1">
                                {data?.metrics_30d.map((m, i) => {
                                    const max = Math.max(...data.metrics_30d.map(x => x.total_sales)) || 1;
                                    const height = (m.total_sales / max) * 100;
                                    return (
                                        <div key={m.snapshot_date} className="flex-1 group relative h-full flex items-end">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(height, 5)}%` }}
                                                className={cn(
                                                    "w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80",
                                                    i === data.metrics_30d.length - 1 ? "bg-orange-500" : "bg-orange-500/20 dark:bg-orange-500/10"
                                                )}
                                            />
                                            {/* Hover Tooltip */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap border border-white/10 shadow-xl">
                                                ${m.total_sales.toLocaleString()}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Grid Lines */}
                            <div className="absolute inset-x-8 bottom-8 top-12 flex flex-col justify-between pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-gray-900" />)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Horizontal Quick Actions / Sub-metrics - Removed fake data cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Future Real Metrics Placeholders */}
                    </div>
                </div>

                {/* Side Pulse Feed */}
                <div className="space-y-6">
                    <ActivityFeed
                        integrationId={integrationId}
                        open={true}
                        companyId={companyId}
                    />
                </div>
            </div>
        </div>
    );
}
