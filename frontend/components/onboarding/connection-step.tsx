"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Lock, Sparkles, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { MagicLoader } from "@/components/ui/magic-loader";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface ConnectionStepProps {
    selectedStack: string[];
    brandName: string;
    onBack: () => void;
}

const SUPPORTED_KEYS = ["shopify", "razorpay", "amazon_in"];

export function ConnectionStep({ selectedStack, brandName, onBack }: ConnectionStepProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Just a decorative delay for "Magic" feel
        const timer = setTimeout(() => setSubmitting(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const { refreshAuth, onboardingCompleted } = useAuth();

    const handleFinish = async () => {
        setRedirecting(true);
        try {
            await api.post("/onboarding/finish", {});

            // Refresh auth state to update onboardingCompleted flag
            console.log("DEBUG: handleFinish - Refreshing auth...");
            await refreshAuth();

            setTimeout(() => {
                console.log("DEBUG: handleFinish - Navigating to dashboard. Status:", onboardingCompleted);
                router.push("/dashboard");
            }, 800);
        } catch (err: any) {
            console.error("DEBUG: handleFinish - Error:", err);
            setError(err.message || "Failed to finalize onboarding");
            setRedirecting(false);
        }
    };

    const supported = selectedStack.filter((s) => SUPPORTED_KEYS.includes(s));
    const requested = selectedStack.filter((s) => !SUPPORTED_KEYS.includes(s));

    if (redirecting) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12"
            >
                <MagicLoader text="Finalizing your financial control layer" />
            </motion.div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="space-y-3">
                <h1 className="text-4xl font-light tracking-tight text-white/90">
                    Ready to <span className="font-medium text-white">Connect</span>.
                </h1>
                <p className="text-lg text-white/40">
                    {brandName} is set. Let’s link your supported sources to begin.
                </p>
            </div>

            {submitting ? (
                <div className="py-12">
                    <MagicLoader text="Syncing your stack discovery" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {supported.map((key) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/10 group hover:border-indigo-500/50 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold">
                                    {key[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white capitalize">{key.replace("_", " ")}</h3>
                                    <p className="text-sm text-white/40">Direct API Integration</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-6 py-3 rounded-xl font-medium hover:bg-indigo-500 hover:text-white transition-all">
                                    Connect API
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button className="text-[10px] text-white/20 hover:text-white/40 uppercase tracking-widest font-bold transition-colors">
                                    Alternative: Secure CSV Upload
                                </button>
                            </div>
                        </div>
                    ))}

                    {requested.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-2 text-white/30 uppercase tracking-[0.2em] text-[10px] font-bold">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                Early Access Needed
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {requested.map((key) => (
                                    <div
                                        key={key}
                                        className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/5 opacity-60"
                                    >
                                        <Lock className="w-4 h-4 text-white/20" />
                                        <span className="text-sm text-white/60 capitalize">{key.replace("_", " ")}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-white/30 leading-relaxed">
                                We’ve captured your intent for these sources. You’ll be notified as soon as automated
                                truth-matching is live for them.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={onBack}
                    disabled={submitting}
                    className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Stack
                </button>
                <button
                    onClick={handleFinish}
                    disabled={submitting}
                    className="text-white/40 hover:text-white transition-colors text-sm font-medium underline underline-offset-4 disabled:opacity-50"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
