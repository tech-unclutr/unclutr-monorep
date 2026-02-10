"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Store, ArrowLeft, Loader2, Calendar, CheckCircle2, Sparkles, Database, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { shopifyApi } from "@/lib/api/shopify";
import { listIntegrations } from "@/lib/api/integrations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ShopifySetupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { companyId } = useAuth();

    const [shopDomain, setShopDomain] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetUrl, setTargetUrl] = useState<string | null>(null);

    // Config State
    const [isConfigMode, setIsConfigMode] = useState(false);
    const [integrationId, setIntegrationId] = useState<string | null>(null);
    const [selectedRange, setSelectedRange] = useState(12); // Default 12 months

    useEffect(() => {
        const success = searchParams.get("success");
        const shop = searchParams.get("shop");

        if (success === "true" && shop && companyId) {
            setIsConfigMode(true);
            setShopDomain(shop);
            findIntegration(shop);
        }
    }, [searchParams, companyId]);

    const findIntegration = async (shop: string) => {
        try {
            const integrations = await listIntegrations(companyId!);
            const shopifyInt = integrations.find(i =>
                i.datasource.slug === 'shopify' &&
                i.metadata_info?.shop === shop
            );
            if (shopifyInt) {
                setIntegrationId(shopifyInt.id);
            }
        } catch (err) {
            console.error("Failed to find integration:", err);
        }
    };

    const handleContinue = async () => {
        if (!companyId) {
            console.error("handleContinue: Missing companyId");
            return;
        }
        setIsValidating(true);
        setError(null);

        let cleanDomain = shopDomain.trim().toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/admin.*$/, "")
            .replace(/\/$/, "");

        if (!cleanDomain.includes(".")) cleanDomain += ".myshopify.com";

        try {
            // Optimization: Skip explicit validation to reduce latency.
            // If the shop is invalid, Shopify's OAuth page will handle the 404/error.

            const authUrl = await shopifyApi.getAuthUrl(cleanDomain, companyId);
            setTargetUrl(authUrl);

            // Use assign() which is generally more reliable for cross-origin navigation
            window.location.assign(authUrl);

        } catch (err: any) {
            console.error("handleContinue Error:", err);
            setError(err.message || "Failed to validate store");
            setIsValidating(false);
            toast.error("Connection Failed", { description: err.message });
        }
    };

    const handleStartImport = async () => {
        if (!integrationId || !companyId) return;
        setIsValidating(true);
        try {
            await shopifyApi.triggerSync(integrationId, companyId, selectedRange);
            router.push(`/dashboard-new/integrations?success=true&shop=${shopDomain}&syncing=${integrationId}`);
            toast.success("Import Started", { description: "Streaming your Shopify data now." });
        } catch (err: any) {
            toast.error("Sync Failed", { description: "Wait a moment and try again." });
            setIsValidating(false);
        }
    };

    const ranges = [
        { label: "Last 3 Months", value: 3, desc: "Fastest import, recent history" },
        { label: "Last 12 Months", value: 12, desc: "Recommended for analysis", recommended: true },
        { label: "All Time", value: 0, desc: "Exhaustive historical backfill" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[460px] space-y-8"
            >
                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span>{isConfigMode ? "Step 2 of 3: Configuration" : "Step 1 of 3: Handshake"}</span>
                        <span>{isConfigMode ? "66%" : "33%"}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "33%" }}
                            animate={{ width: isConfigMode ? "66%" : "33%" }}
                            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {!isConfigMode ? (
                        <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                    <Store className="w-9 h-9 text-white" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Connect your Store</h1>
                                <p className="text-sm text-zinc-500">Sync your Shopify data securely with Unclutr Logic.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 pl-1">Shopify Domain</Label>
                                    <div className="relative group">
                                        <Input
                                            placeholder="my-store-name"
                                            value={shopDomain}
                                            onChange={(e) => setShopDomain(e.target.value)}
                                            className="h-14 pr-32 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-lg"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">.myshopify.com</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Button onClick={handleContinue} disabled={!shopDomain || isValidating} className="h-14 w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-2xl font-bold text-lg shadow-2xl transition-all active:scale-95">
                                        {isValidating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Initiate Handshake →"}
                                    </Button>

                                    {/* Manual Fallback for stalled redirects */}
                                    {isValidating && targetUrl && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 3 }}
                                            className="text-center"
                                        >
                                            <p className="text-xs text-zinc-400 mb-2">Taking longer than expected?</p>
                                            <Button
                                                variant="link"
                                                asChild
                                                className="text-emerald-500 h-auto p-0 text-xs font-bold"
                                            >
                                                <a href={targetUrl}>Click here to connect manually</a>
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <div className="flex justify-center scale-110">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                                        <CheckCircle2 className="w-9 h-9 text-white" />
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -inset-2 rounded-3xl border-2 border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Handshake Verified</h1>
                                <p className="text-sm text-zinc-500">Connected to <span className="font-bold text-zinc-900 dark:text-zinc-200">{shopDomain}</span>. Choose your import depth.</p>
                            </div>

                            <div className="grid gap-3">
                                {ranges.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => setSelectedRange(r.value)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group",
                                            selectedRange === r.value
                                                ? "border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-500/5"
                                                : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-3 rounded-xl transition-colors",
                                                selectedRange === r.value ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-500"
                                            )}>
                                                {r.value === 0 ? <History className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold flex items-center gap-2">
                                                    {r.label}
                                                    {r.recommended && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">Recommended</span>}
                                                </div>
                                                <div className="text-xs text-zinc-500 mt-0.5">{r.desc}</div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedRange === r.value ? "border-emerald-500 bg-emerald-500" : "border-zinc-200 dark:border-zinc-700"
                                        )}>
                                            {selectedRange === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <Button onClick={handleStartImport} disabled={isValidating || !integrationId} className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95">
                                {isValidating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
                                    <span className="flex items-center gap-2">
                                        <Database className="w-5 h-5" />
                                        Begin Data Import
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-center gap-6 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Immutable Sync</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Logic Powered</span>
                </div>
            </motion.div>
        </div>
    );
}

export default function ShopifySetupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <ShopifySetupContent />
        </Suspense>
    );
}
