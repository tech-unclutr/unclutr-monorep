"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, CheckCircle2, AlertCircle, Sparkles, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react";
import { shopifyApi } from "@/lib/api/shopify";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface ShopifySetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
}

type Step = "input" | "validating" | "redirecting";

export function ShopifySetupModal({ isOpen, onClose, companyId }: ShopifySetupModalProps) {
    const [shopDomain, setShopDomain] = useState("");
    const [step, setStep] = useState<Step>("input");
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep("input");
            setError(null);
        }
    }, [isOpen]);

    const handleConnect = async () => {
        setStep("validating");
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
            // 1. Validate
            const isValid = await shopifyApi.validateShopDomain(cleanDomain, companyId);
            if (!isValid) {
                setStep("input");
                throw new Error("Could not reach store. Check if the URL is correct and public.");
            }

            // 2. Transition to redirecting
            setStep("redirecting");

            // 3. Get Auth URL
            const authUrl = await shopifyApi.getAuthUrl(cleanDomain, companyId);

            // 4. Redirect
            window.location.href = authUrl;

        } catch (err: any) {
            setError(err.message || "Failed to initiate connection");
            setStep("input");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden rounded-3xl shadow-2xl transition-all duration-500">
                <VisuallyHidden>
                    <DialogTitle>Connect Shopify Store</DialogTitle>
                    <DialogDescription>
                        Step: {step}. {step === 'input' ? 'Enter your shop domain to begin.' : 'Connecting to your store.'}
                    </DialogDescription>
                </VisuallyHidden>
                <AnimatePresence mode="wait">
                    {step === "input" ? (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="p-8"
                        >
                            <DialogHeader className="mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                    <Store className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Connect Shopify
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 text-base">
                                    Sync your orders, products, and insights securely.
                                </p>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="domain" className="text-sm font-semibold flex items-center gap-2">
                                            Store Domain
                                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        </Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button className="text-zinc-400 hover:text-zinc-500 transition-colors">
                                                        <HelpCircle className="w-4 h-4" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[200px] text-[11px] p-2 bg-zinc-900 border-zinc-800 text-zinc-400">
                                                    Your store domain is usually <strong>your-name.myshopify.com</strong>. You can find it in your Shopify Admin URL.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            id="domain"
                                            placeholder="my-brand-store.myshopify.com"
                                            value={shopDomain}
                                            onChange={(e) => setShopDomain(e.target.value)}
                                            className="h-12 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base px-4 font-medium"
                                            disabled={step !== "input"}
                                        />
                                        <div className="absolute inset-0 rounded-xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                                    </div>
                                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider pl-1">
                                        Tip: Just the name works (e.g. "unclutr-dev")
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3 text-sm text-red-500 bg-red-500/5 border border-red-500/10 p-4 rounded-xl leading-relaxed"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <div className="flex flex-col gap-4 mt-8">
                                    <Button
                                        onClick={handleConnect}
                                        disabled={!shopDomain.trim() || step !== "input"}
                                        className="h-12 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl font-bold text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Initialize Handshake
                                    </Button>

                                    <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 opacity-80">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="flex items-center gap-1.5 cursor-help hover:text-emerald-500 transition-colors"><ShieldCheck className="w-3.5 h-3.5" /> AES-256</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                                                    Encrypted with authenticated symmetric encryption.
                                                </TooltipContent>
                                            </Tooltip>

                                            <div className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="flex items-center gap-1.5 cursor-help hover:text-emerald-500 transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Safe OAuth</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                                                    Uses official Shopify OAuth 2.0 flow. No passwords shared.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
                        >
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-24 h-24 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 relative"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Store className="w-10 h-10 text-emerald-500 animate-pulse" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping opacity-75" />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold tracking-tight">
                                    {step === "validating" ? "Validating Reachability" : "Preparing Secure Tunnel"}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[240px] leading-relaxed mx-auto">
                                    {step === "validating"
                                        ? `Establishing initial contact with ${shopDomain}...`
                                        : "Generating signed OAuth transition. Almost there."}
                                </p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-12 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20"
                            >
                                <Sparkles className="w-3 h-3" />
                                Powered by Unclutr Logic
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
