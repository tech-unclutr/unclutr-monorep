"use client";

import { useEffect, useState, useRef } from "react";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { syncUserWithBackend, getFriendlyErrorMessage } from "@/lib/auth-helpers";
import { trackEvent } from "@/lib/analytics";

export default function VerifyPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [errorMsg, setErrorMsg] = useState("");
    const effectRan = useRef(false);

    useEffect(() => {
        if (effectRan.current) return; // Prevent double firing in React Strict Mode
        effectRan.current = true;

        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');

            if (!email) {
                // User opened link on different device. Ask for email.
                email = window.prompt('Please provide your email for confirmation');
            }

            if (email) {
                signInWithEmailLink(auth, email, window.location.href)
                    .then(async (result) => {
                        window.localStorage.removeItem('emailForSignIn');
                        await syncUserWithBackend(result.user);
                        trackEvent("login_success", { method: "email_link" });
                        setStatus("success");
                        setTimeout(() => {
                            router.push("/dashboard");
                        }, 1000);
                    })
                    .catch((error) => {
                        console.error(error);
                        setStatus("error");
                        setErrorMsg(getFriendlyErrorMessage(error));
                        trackEvent("login_failure", { method: "email_link", error: error.message });
                    });
            }
        } else {
            // Not a valid link
            router.push("/login");
        }
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Side: The Promise (Identical to Login for continuity) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />

                <div className="relative z-10">
                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-black font-bold text-lg mb-12">
                        U
                    </div>
                    <h1 className="text-5xl font-semibold text-white tracking-tight leading-[1.1] max-w-md">
                        Unclutr your <br />
                        <span className="text-neutral-500">decisions.</span>
                    </h1>
                </div>

                <div className="relative z-10 space-y-4 max-w-sm">
                    <p className="text-neutral-400 text-sm font-medium uppercase tracking-widest mb-6">
                        Live Highlights
                    </p>

                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both text-left">
                        <div className="group bg-[#171717] border border-white/5 p-4 rounded-xl flex items-start space-x-4 transition-all hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <div>
                                <p className="text-white text-sm font-medium">Margin Protection</p>
                                <p className="text-neutral-500 text-xs mt-1">Meta Ad Spend automatically paused on low-margin SKUs.</p>
                            </div>
                        </div>

                        <div className="group bg-[#171717] border border-white/5 p-4 rounded-xl flex items-start space-x-4 opacity-80 scale-95 translate-x-4 transition-all hover:translate-x-0 hover:opacity-100 hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] duration-500">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div>
                                <p className="text-white text-sm font-medium">Inventory Alert</p>
                                <p className="text-neutral-500 text-xs mt-1">Forecast Alert: Stock-out risk for 'Summer Tote' in 12 days.</p>
                            </div>
                        </div>

                        <div className="group bg-[#171717] border border-white/5 p-4 rounded-xl flex items-start space-x-4 opacity-60 scale-90 translate-x-8 transition-all hover:translate-x-0 hover:opacity-100 hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] duration-500">
                            <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <div>
                                <p className="text-white text-sm font-medium">Attribution Truth</p>
                                <p className="text-neutral-500 text-xs mt-1">Channel Corrected: YouTube ROAS is actually 4.2x (not 1.8x).</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-neutral-500 text-xs">
                    &copy; 2025 Unclutr AI. Built for the next generation of D2C.
                </div>
            </div>

            {/* Right Side: Verification Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-[360px] space-y-10 text-center">
                    <div className="flex flex-col items-center space-y-6">
                        {status === "verifying" && (
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full border-2 border-neutral-100 dark:border-neutral-800" />
                                <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-2 border-black dark:border-white animate-spin" />
                            </div>
                        )}
                        {status === "success" && (
                            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center dark:bg-emerald-950/30">
                                <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {status === "error" && (
                            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center dark:bg-red-950/30">
                                <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {status === "verifying" && "Confirming identity"}
                                {status === "success" && "Welcome aboard"}
                                {status === "error" && "Link expired"}
                            </h1>
                            <p className="text-[15px] text-neutral-500 leading-relaxed">
                                {status === "verifying" && "Hold tight while we verify your magic link."}
                                {status === "success" && "Verification successful. Redirecting to your command center..."}
                                {status === "error" && (errorMsg || "The sign-in link is no longer valid or has been used. Please try again.")}
                            </p>
                        </div>
                    </div>

                    {status === "error" && (
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-zinc-800 transition-all active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                        >
                            Back to Login
                        </button>
                    )}

                    <div className="pt-8 text-neutral-400 text-xs">
                        {status === "verifying" && "Powered by Unclutr Trust Layer"}
                    </div>
                </div>
            </div>
        </div>
    );
}
