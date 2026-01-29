"use client"

import { Badge } from "@/components/ui/badge"
import { Globe, ShoppingCart, Truck, CreditCard, BarChart3, Megaphone, Pencil, Layers, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { syncOnboardingState } from "@/lib/api/settings"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"

interface OnboardingSummaryProps {
    data: {
        companyName: string
        brandName: string
        category: string | null
        region: {
            country: string | null
            currency: string | null
            timezone: string | null
        }
        channels: {
            d2c: string[]
            marketplaces: string[]
            qcom: string[]
            others: string[]
        }
        stack: {
            orders: string[]
            payments: string[]
            shipping: string[]
            payouts: string[]
            marketing: string[]
            analytics: string[]
            finance: string[]
            others: string[]
        }
    }
}

export function OnboardingSummary({ data }: OnboardingSummaryProps) {
    const router = useRouter()
    const [isSyncing, setIsSyncing] = useState(false)

    const handleEdit = async () => {
        setIsSyncing(true)
        try {
            await syncOnboardingState()
            toast.success("Ready for edits", {
                description: "Opening the configuration suite. One moment!"
            })
            router.push("/onboarding/basics")
        } catch (error) {
            console.error(error)
            toast.error("Couldn't open editor", {
                description: "We hit a snag preparing the suite. Try again?"
            })
        } finally {
            setIsSyncing(false)
        }
    }

    // Helper to render sections only if they have data
    const renderSection = (title: string, items: string[], icon?: React.ReactNode) => {
        if (!items || items.length === 0) return null
        return (
            <div className="flex flex-col gap-3">
                {title && (
                    <div className="flex items-center gap-2">
                        {icon}
                        <h4 className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">{title}</h4>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <Badge key={item} variant="secondary" className="px-2.5 py-1 font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-none">
                            {item}
                        </Badge>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700 relative group">
            <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Onboarding Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                        Summary of your platform configuration and connected ecosystem.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isSyncing}
                    className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
                >
                    {isSyncing ? "Syncing..." : (
                        <>
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit
                        </>
                    )}
                </Button>
            </div>

            <div className="space-y-8">
                {/* Basics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Region</label>
                        <p className="text-base text-gray-900 dark:text-gray-200">{data.region.country} ({data.region.currency})</p>
                    </div>
                </div>

                {/* Channels Section */}
                {Object.values(data.channels).some(arr => arr && arr.length > 0) && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" /> Sales Channels
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                            {renderSection("D2C", data.channels.d2c)}
                            {renderSection("Marketplaces", data.channels.marketplaces)}
                            {renderSection("Quick Commerce", data.channels.qcom)}
                            {renderSection("", data.channels.others)}
                        </div>
                    </div>
                )}

                {/* Stack Section */}
                {Object.values(data.stack).some(arr => arr && arr.length > 0) && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-purple-500" /> Tech Stack
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                            {renderSection("Order Management", data.stack.orders)}
                            {renderSection("Payments", data.stack.payments, <CreditCard className="w-3 h-3 text-gray-400" />)}
                            {renderSection("Shipping", data.stack.shipping, <Truck className="w-3 h-3 text-gray-400" />)}
                            {renderSection("Marketing", data.stack.marketing, <Megaphone className="w-3 h-3 text-gray-400" />)}
                            {renderSection("Analytics", data.stack.analytics, <BarChart3 className="w-3 h-3 text-gray-400" />)}
                            {renderSection("Finance", data.stack.finance)}
                            {renderSection("Other Tools", data.stack.others)}
                        </div>
                    </div>
                )}

                {/* Empty State - Premium Design */}
                {!Object.values(data.channels).some(arr => arr && arr.length > 0) &&
                    !Object.values(data.stack).some(arr => arr && arr.length > 0) && (
                        <div className="mt-8">
                            <div
                                onClick={!isSyncing ? handleEdit : undefined}
                                className="group relative overflow-hidden rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-orange-500/30 dark:hover:border-orange-500/30 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 w-14 h-14 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                                    <Layers className="w-7 h-7 text-gray-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors duration-300" />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white border-2 border-white dark:border-zinc-800">
                                        <Plus className="w-3 h-3 font-bold" />
                                    </div>
                                </div>

                                <h4 className="relative z-10 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    Complete your configuration
                                </h4>

                                <p className="relative z-10 text-xs text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed mb-5">
                                    Connect your sales channels and tech stack to unlock the full potential of your dashboard.
                                </p>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="relative z-10 h-8 text-xs font-medium border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 transition-all border-dashed"
                                    disabled={isSyncing}
                                >
                                    {isSyncing ? "Loading..." : "Setup Stack"}
                                </Button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}
