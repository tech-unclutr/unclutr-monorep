"use client";

import { useState, useEffect, SetStateAction } from "react";
import { signInWithGoogle, sendEmailSignInLink, getFriendlyErrorMessage } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();

    // Redirect If already authenticated
    useEffect(() => {
        let isForwarding = false;

        if (isAuthenticated) {
            console.log("DEBUG: LoginPage - Authenticated discovered, initiating force redirection...");
            isForwarding = true;

            // 1. Immediate Next.js router replace
            router.replace("/dashboard");

            // 2. Immediate hard redirect if not moving (Prevents any router hang)
            const forceTimer = setTimeout(() => {
                if (window.location.pathname.includes("/login")) {
                    console.warn("DEBUG: Router Replace failed or slow, using window.location.assign('/dashboard')");
                    window.location.assign("/dashboard");
                }
            }, 500); // 500ms is more than enough for a local push

            return () => clearTimeout(forceTimer);
        }
    }, [isAuthenticated, router]);

    const isGlobalLoading = authLoading && !isAuthenticated;

    const handleGoogleSignIn = async () => {
        console.log("DEBUG: handleGoogleSignIn clicked");
        setGoogleLoading(true);
        try {
            console.log("DEBUG: Calling signInWithGoogle()...");
            // Execution will stop here as the page redirects to Google
            await signInWithGoogle();
        } catch (error: any) {
            console.error("DEBUG: signInWithGoogle error:", error);
            setMessage(getFriendlyErrorMessage(error));
            setGoogleLoading(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("DEBUG: handleEmailSignIn submitted", email);
        setEmailLoading(true);
        setMessage("");

        try {
            console.log("DEBUG: Calling sendEmailSignInLink()...");
            await sendEmailSignInLink(email);
            console.log("DEBUG: sendEmailSignInLink() success");
            setMessage("Check your email for the login link!");
        } catch (error: any) {
            console.error("DEBUG: sendEmailSignInLink error:", error);
            setMessage(getFriendlyErrorMessage(error));
        } finally {
            setEmailLoading(false);
        }
    };

    const isAnyLoading = googleLoading || emailLoading;


    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Side: The Promise (Aha Moment) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative background element */}
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

                    {/* Insight Cards (Value Stream) */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                        <div className="group bg-[#171717] border border-white/5 p-4 rounded-xl flex items-start space-x-4 transition-all hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <div>
                                <p className="text-white text-sm font-medium">Margin Protection</p>
                                <p className="text-neutral-500 text-xs mt-1">Meta Ad Spend automatically paused on low-margin SKUs.</p>
                            </div>
                        </div>

                        <div className="group bg-[#171717] border border-white/5 p-4 rounded-xl flex items-start space-x-4 opacity-80 scale-95 translate-x-12 transition-all hover:translate-x-0 hover:opacity-100 hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] duration-500">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div>
                                <p className="text-white text-sm font-medium">Inventory Alert</p>
                                <p className="text-neutral-500 text-xs mt-1">Forecast Alert: Stock-out risk for 'Summer Tote' in 12 days.</p>
                            </div>
                        </div>

                        <div className="group bg-[#171717] border border-white/5 p-4 rounded-xl flex items-start space-x-4 opacity-60 scale-90 translate-x-24 transition-all hover:translate-x-0 hover:opacity-100 hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] duration-500">
                            <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <div>
                                <p className="text-white text-sm font-medium">Attribution Truth</p>
                                <p className="text-neutral-500 text-xs mt-1">Channel Corrected: YouTube ROAS is actually 4.2x (not 1.8x).</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-neutral-500 text-xs">
                    &copy; 2025 Unclutr AI. The decision layer for D2C.
                </div>
            </div>

            {/* Right Side: The Entry (Auth) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-[360px] space-y-10">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex flex-col items-center space-y-4 text-center mb-8">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                            U
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Unclutr your decisions
                        </h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Welcome back
                        </h2>
                        <p className="text-[15px] text-neutral-500">
                            Sign in to your Unclutr command center.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <Button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isAnyLoading || isGlobalLoading}
                            className="w-full h-12 text-[15px] font-normal border-neutral-200 hover:bg-neutral-50 transition-all active:scale-[0.98] dark:border-neutral-800 dark:hover:bg-neutral-900"
                            variant="outline"
                        >
                            {isGlobalLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying session...
                                </span>
                            ) : googleLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connecting...
                                </span>
                            ) : (
                                <>
                                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-100 dark:border-neutral-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-zinc-950 px-4 text-neutral-400 font-medium">
                                    or
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setEmail(e.target.value)}
                                    required
                                    disabled={isAnyLoading}
                                    className="h-12 border-neutral-200 focus-visible:ring-1 focus-visible:ring-black transition-all bg-neutral-50/30 dark:border-neutral-800 dark:bg-neutral-900/30 dark:focus-visible:ring-white"
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 text-[15px] bg-black text-white hover:bg-zinc-800 transition-all font-medium dark:bg-white dark:text-black dark:hover:bg-neutral-200" disabled={isAnyLoading || isGlobalLoading}>
                                {emailLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending link...
                                    </span>
                                ) : "Continue with Email"}
                            </Button>
                        </form>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm border animate-in fade-in slide-in-from-top-2 ${message.includes("Check") ? "bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-900 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"}`}>
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center space-y-4 pt-10 border-t border-neutral-50 dark:border-neutral-900">
                        <p className="text-[13px] text-neutral-400 text-center leading-relaxed">
                            By continuing, you agree to our{" "}
                            <button type="button" className="text-neutral-900 dark:text-neutral-300 underline underline-offset-4 hover:text-black dark:hover:text-white">Terms of Service</button>
                            {" "}and{" "}
                            <button type="button" className="text-neutral-900 dark:text-neutral-300 underline underline-offset-4 hover:text-black dark:hover:text-white">Privacy Policy</button>.
                        </p>

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => {
                                    console.log("DIAGNOSTIC DUMP:");
                                    console.log("Auth State:", { isAuthenticated, authLoading });
                                    console.log("URL:", window.location.href);
                                    console.log("Local Storage:", { ...localStorage });
                                    console.log("Session Storage:", { ...sessionStorage });
                                    alert("Diagnostics printed to console (F12). Please check the 'Console' tab.");
                                }}
                                className="text-[11px] text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                            >
                                Run Diagnostics
                            </button>
                            <span className="text-neutral-300 text-[10px]">|</span>
                            <a
                                href="https://console.firebase.google.com/project/unclutr-monorep/authentication/settings"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                Check Firebase Console
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
