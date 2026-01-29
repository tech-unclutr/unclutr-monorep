"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Check, CheckCircle2, TrendingUp, ArrowUpRight, ShoppingBag, BadgeDollarSign, Sparkles, MoreHorizontal } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { LiveTicker } from "./LiveTicker"
import { InsightDeck } from "./InsightDeck"

interface ShopifyMegaCardProps {
    status: "active" | "inactive" | "error"
    ordersToday: number
    gmvToday: number
    lastSync: string
    verificationStatus: string
    logs?: string[]
    brandId?: string | null
    companyId?: string | null
    loading?: boolean
    initialDeck?: any[]
}

const mockData = [
    { value: 40 }, { value: 30 }, { value: 45 }, { value: 50 }, { value: 65 }, { value: 60 }, { value: 80 }
]

export function ShopifyMegaCard({
    status,
    ordersToday,
    gmvToday,
    lastSync,
    verificationStatus,
    logs = [],
    brandId,
    companyId,
    loading = false,
    initialDeck = []
}: ShopifyMegaCardProps) {
    const isLive = status === "active";

    return (
        <Card className="group relative overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl dark:hover:shadow-zinc-900/50 transition-all duration-500 ease-spring">
            {/* Dynamic Spotlight Effect - similar to IntegrationCard */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 via-transparent to-transparent dark:from-zinc-800/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Background Gradients - Subtle & Premium */}
            <div className="absolute top-0 right-0 -mt-32 -mr-32 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 pointer-events-none" />

            <div className="relative flex flex-col p-6 sm:p-8 h-full">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                        {/* Logo Container - Matching IntegrationCard */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-3 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 ease-spring">
                                <ShoppingBag className="text-emerald-600 dark:text-emerald-500 h-7 w-7" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center shadow-sm z-20">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">Shopify Store</h3>
                                {isLive && (
                                    <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 tracking-wider">
                                        Live
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Last synced {lastSync}</p>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 text-xs font-bold uppercase tracking-wide">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Pulse Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions / Meta */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" >
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    {/* GMV Stat */}
                    <div className="relative group/stat">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Gross Merchandise Value</p>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <div className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(gmvToday)}
                            </div>
                        </div>
                        {gmvToday > 0 && (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm mt-3 font-semibold bg-emerald-50 dark:bg-emerald-900/10 w-fit px-2 py-1 rounded-md">
                                <TrendingUp className="h-4 w-4" />
                                <span>+12.5% vs yesterday</span>
                            </div>
                        )}
                    </div>

                    {/* Orders Stat */}
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Orders Today</p>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">{ordersToday}</div>
                            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-bold border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                                View Orders <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="h-16 w-full mt-4 opacity-50 relative pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981" // Emerald-500
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Insight Deck */}
                <div className="my-8 flex-1 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-8">
                    <InsightDeck brandId={brandId || null} companyId={companyId || null} initialDeck={initialDeck} />
                </div>

                {/* Footer / Live Ticker */}
                <div className="mt-auto bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50 p-1">
                    <LiveTicker
                        status={isLive ? "synced" : "analyzing"}
                        logs={logs}
                    />
                </div>
            </div>

            {/* Truth Serum Badge - Repositioned to be less intrusive but visible */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-help opacity-0 group-hover:opacity-100",
                            verificationStatus === "verified"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                        )}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-zinc-900 text-zinc-50 border-zinc-800">
                        <div className="text-xs space-y-1">
                            <p className="font-semibold text-emerald-400 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Data Integrity Confirmed
                            </p>
                            <p className="text-zinc-400">Verified against raw Shopify API payload.</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

        </Card>
    )
}
