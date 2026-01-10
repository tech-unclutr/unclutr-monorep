"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, Receipt, Percent, Truck, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export default function ShopifyConnectPage() {
    const router = useRouter();
    const { company } = useAuth();

    const features = [
        {
            icon: Receipt,
            title: "Orders & Revenue",
            description: "Complete order history with line-item details",
            color: "emerald"
        },
        {
            icon: Percent,
            title: "Discounts & Taxes",
            description: "Every discount code and tax rate captured",
            color: "blue"
        },
        {
            icon: Truck,
            title: "Shipping & Fulfillment",
            description: "Shipping costs and fulfillment status",
            color: "orange"
        },
        {
            icon: TrendingUp,
            title: "Product Analytics",
            description: "SKU-level performance insights",
            color: "purple"
        }
    ];

    const handleConnect = () => {
        router.push("/integrations/shopify/setup");
    };

    const handleSkip = () => {
        router.push("/dashboard-new/integrations");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[440px] space-y-8"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="flex justify-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                        <Store className="w-10 h-10 text-white" strokeWidth={2} />
                    </div>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-center space-y-3"
                >
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Connect Your Shopify Store
                    </h1>
                    <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                        Unlock real-time profitability insights by syncing your store data. Read-only access — we never modify your store.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="grid grid-cols-2 gap-3"
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                                className="group relative p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
                            >
                                <div className="absolute inset-0 rounded-xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative space-y-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {feature.title}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Security Badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10"
                >
                    <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-500" strokeWidth={2} />
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                        Bank-grade security • 256-bit encryption • Read-only access • SOC 2 compliant
                    </span>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    className="space-y-3"
                >
                    <Button
                        onClick={handleConnect}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Connect Store
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <button
                        onClick={handleSkip}
                        className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 font-medium transition-colors"
                    >
                        I'll do this later →
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
