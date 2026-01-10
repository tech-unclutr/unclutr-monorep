"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { shopifyApi } from "@/lib/api/shopify";
import { toast } from "sonner";

export default function ShopifySetupPage() {
    const router = useRouter();
    const { companyId } = useAuth();
    const [shopDomain, setShopDomain] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Restore shop domain from sessionStorage if user just logged in
    useEffect(() => {
        const savedDomain = sessionStorage.getItem('shopify_setup_domain');
        if (savedDomain) {
            setShopDomain(savedDomain);
            sessionStorage.removeItem('shopify_setup_domain');
        }
    }, []);


    const handleBack = () => {
        router.push("/integrations/shopify/connect");
    };

    const handleSkip = () => {
        router.push("/dashboard-new/integrations");
    };

    const handleContinue = async () => {
        if (!companyId) {
            // Store the shop domain in sessionStorage so we can resume after login
            if (shopDomain.trim()) {
                sessionStorage.setItem('shopify_setup_domain', shopDomain.trim());
            }

            // Redirect to login with return URL
            const returnUrl = encodeURIComponent('/integrations/shopify/setup');
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        setIsValidating(true);
        setError(null);

        // Sanitize domain
        let cleanDomain = shopDomain.trim().toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/admin.*$/, "")
            .replace(/\/$/, "");

        if (!cleanDomain.includes(".")) {
            cleanDomain += ".myshopify.com";
        }

        try {
            // Validate shop domain
            const isValid = await shopifyApi.validateShopDomain(cleanDomain, companyId);

            if (!isValid) {
                throw new Error("Could not reach store. Check if the URL is correct and public.");
            }

            // Get auth URL and redirect
            const authUrl = await shopifyApi.getAuthUrl(cleanDomain, companyId);
            window.location.href = authUrl;

        } catch (err: any) {
            setError(err.message || "Failed to validate store");
            setIsValidating(false);

            toast.error("Connection Failed", {
                description: err.message || "Failed to validate store. Please try again.",
            });
        }
    };

    const isValidInput = shopDomain.trim().length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[440px] space-y-8"
            >
                {/* Progress Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <span>Step 1 of 3</span>
                    </div>
                    <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "33.33%" }}
                            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                </motion.div>

                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex justify-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Store className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-center space-y-2"
                >
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        What's your store URL?
                    </h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Enter your Shopify store name to get started.
                    </p>
                </motion.div>

                {/* Input Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="store-url" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Store URL
                        </Label>
                        <div className="relative">
                            <Input
                                id="store-url"
                                type="text"
                                placeholder="your-store"
                                value={shopDomain}
                                onChange={(e) => {
                                    setShopDomain(e.target.value);
                                    setError(null);
                                }}
                                disabled={isValidating}
                                className="h-12 pr-32 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base font-medium"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500 pointer-events-none">
                                .myshopify.com
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-1">
                            💡 Find this in your Shopify admin URL
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl"
                        >
                            <span className="text-base">⚠️</span>
                            <span>{error}</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="flex items-center gap-3"
                >
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        disabled={isValidating}
                        className="h-12 px-6 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <Button
                        onClick={handleContinue}
                        disabled={!isValidInput || isValidating}
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isValidating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            "Continue →"
                        )}
                    </Button>
                </motion.div>

                {/* Skip Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="text-center"
                >
                    <button
                        onClick={handleSkip}
                        disabled={isValidating}
                        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 font-medium transition-colors disabled:opacity-50"
                    >
                        Skip for now →
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
