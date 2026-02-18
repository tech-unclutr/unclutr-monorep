"use client";

import { useState, useEffect, SetStateAction } from "react";
import { signInWithGoogle, sendEmailSignInLink, getFriendlyErrorMessage } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { MagicLoader } from "@/components/ui/magic-loader";

const SLOTS = [
    { top: "10%", left: "5%" },   // Top-Left
    { top: "35%", left: "45%" },  // Middle-Right (Focus)
    { top: "70%", left: "10%" }   // Bottom-Left
];

const LAB_USE_CASES = [
    {
        id: "identity",
        color: "#3B82F6",
        title: "Identity Lab",
        tag: "Identity Resolution",
        result: "2,430 anonymous visitors resolved to high-fidelity profiles.",
        avatars: ["/images/avatars/avatar_1.png", "/images/avatars/avatar_2.png", "/images/avatars/avatar_3.png"]
    },
    {
        id: "cohort",
        color: "#10B981",
        title: "Cohort Lab",
        tag: "Segment Intelligence",
        result: "Isolated 3 high-value cohorts representing 60% of total GMV.",
        avatars: ["/images/avatars/avatar_10.png", "/images/avatars/avatar_11.png", "/images/avatars/avatar_12.png"]
    },
    {
        id: "engagement",
        color: "#6366F1",
        title: "Engagement Lab",
        tag: "Behavior Analysis",
        result: "Identified optimal re-engagement window: 48h post-purchase.",
        avatars: ["/images/avatars/avatar_20.png", "/images/avatars/avatar_21.png", "/images/avatars/avatar_22.png"]
    },
    {
        id: "acquisition",
        color: "#F59E0B",
        title: "Acquisition Lab",
        tag: "Efficiency",
        result: "CAC reduced by 22% via high-intent segment targeting.",
        avatars: ["/images/avatars/avatar_30.png", "/images/avatars/avatar_31.png", "/images/avatars/avatar_32.png"]
    },
    {
        id: "product",
        color: "#EC4899",
        title: "Product Lab",
        tag: "Merchandising",
        result: "Identified 'Sticky SKUs' driving 3x higher repeat purchase rate.",
        avatars: ["/images/avatars/avatar_40.png", "/images/avatars/avatar_41.png", "/images/avatars/avatar_42.png"]
    },
    {
        id: "zero-party",
        color: "#8B5CF6",
        title: "Zero-Party Lab",
        tag: "Data Enrichment",
        result: "Enriched 1.2k profiles with direct intent via our voice AI agents.",
        avatars: ["/images/avatars/avatar_43.png", "/images/avatars/avatar_44.png", "/images/avatars/avatar_45.png"]
    },
    {
        id: "sentiment",
        color: "#14B8A6",
        title: "Sentiment Lab",
        tag: "Customer Experience",
        result: "Mapped 92% positive sentiment shift after v2 support rollout.",
        avatars: ["/images/avatars/avatar_46.png", "/images/avatars/avatar_47.png", "/images/avatars/avatar_48.png"]
    },
    {
        id: "win-back",
        color: "#EF4444",
        title: "Win-back Lab",
        tag: "Re-activation",
        result: "$9.2k revenue generated from previously 'dormant' segments.",
        avatars: ["/images/avatars/avatar_4.png", "/images/avatars/avatar_5.png", "/images/avatars/avatar_6.png"]
    }
];

const HEADER_OPTIONS = [
    "that Squares Up.",
    "at Scale.",
    "that Converts.",
    "that Retains.",
    "before they churn.",
    "before they bounce.",
    "that drives revenue.",
    "that wins loyalty."
];

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [activeIndices, setActiveIndices] = useState([0, 1, 2]);
    const [rotationStep, setRotationStep] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [headerIndex, setHeaderIndex] = useState(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20
            });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotationStep(prev => (prev + 1) % 3);
            setActiveIndices(prev => {
                const next = [...prev];
                const slotToUpdate = rotationStep;
                let nextVal = (next[slotToUpdate] + 3) % LAB_USE_CASES.length;

                // Ensure no duplicates across slots
                while (next.includes(nextVal)) {
                    nextVal = (nextVal + 1) % LAB_USE_CASES.length;
                }

                next[slotToUpdate] = nextVal;
                return next;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [rotationStep]);

    // Cycle through header options
    useEffect(() => {
        const interval = setInterval(() => {
            setHeaderIndex(prev => (prev + 1) % HEADER_OPTIONS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Redirect If already authenticated
    useEffect(() => {
        let isForwarding = false;

        if (isAuthenticated) {
            isForwarding = true;
            router.replace("/dashboard");

            const forceTimer = setTimeout(() => {
                if (window.location.pathname.includes("/login")) {
                    window.location.assign("/dashboard");
                }
            }, 500);

            return () => clearTimeout(forceTimer);
        }
    }, [isAuthenticated, router]);

    const isGlobalLoading = authLoading && !isAuthenticated;

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            // Execution will stop here as the page redirects to Google
            await signInWithGoogle();
        } catch (error: any) {
            setMessage(getFriendlyErrorMessage(error));
            setGoogleLoading(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailLoading(true);
        setMessage("");

        try {
            await sendEmailSignInLink(email);
            setMessage("Check your email for the login link!");
        } catch (error: any) {
            setMessage(getFriendlyErrorMessage(error));
        } finally {
            setEmailLoading(false);
        }
    };

    const isAnyLoading = googleLoading || emailLoading;
    const isInitialLoading = authLoading && !isAuthenticated;

    // Loading Gate: If we are still checking firebase session, show a clean, 
    // consistent loader instead of the login form to prevent 'flicker'.
    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <MagicLoader text="Verifying session..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "linear" }}
            className="fixed inset-0 flex flex-col lg:flex-row bg-background overflow-hidden"
        >
            {/* Left Side: The Intelligence Canvas (World Class 15/10) */}
            <div className="hidden lg:flex lg:w-[45%] bg-[#030303] px-12 py-10 flex-col relative overflow-hidden border-r border-white-[0.03]">

                {/* 1. Particle Constellation Background (Neural Density) */}
                <motion.div
                    className="absolute inset-0 z-0 opacity-40"
                    style={{ x: mousePosition.x, y: mousePosition.y }}
                >
                    {[...Array(16)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute rounded-full blur-[1.5px] ${i % 3 === 0 ? 'bg-blue-500/20' : i % 3 === 1 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                                }`}
                            style={{
                                width: Math.random() * 3 + 2 + 'px',
                                height: Math.random() * 3 + 2 + 'px',
                                left: Math.random() * 100 + '%',
                                top: Math.random() * 100 + '%',
                            }}
                            animate={{
                                opacity: [0.1, 0.5, 0.1],
                                scale: [1, 1.2, 1],
                                x: [0, Math.random() * 30 - 15, 0],
                                y: [0, Math.random() * 30 - 15, 0],
                            }}
                            transition={{
                                duration: Math.random() * 15 + 15,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: Math.random() * 5
                            }}
                        />
                    ))}
                    {/* Neural Glows */}
                    <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] animate-pulse" />
                    <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" />
                </motion.div>

                {/* 2. Heroic Typography & Central Hub */}
                <div className="relative z-20 flex-shrink-0">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.2
                        }}
                        className="relative group cursor-pointer"
                        onClick={() => router.push("/dashboard")}
                    >
                        <div className="h-16 flex items-center justify-start mb-6 relative z-10">
                            <img src="/brand/wordmark-light.svg" alt="SquareUp" className="h-12 w-auto object-contain relative z-20" />
                        </div>
                        {/* Hub Aura */}
                        <div className="absolute inset-0 h-12 w-12 rounded-[18px] bg-white/10 blur-xl -z-10 animate-pulse" />
                    </motion.div>

                    <h1 className="text-3xl lg:text-[2.6rem] font-black text-white tracking-[-0.03em] leading-[1.0] max-w-lg font-display perspective-1000">
                        <motion.span
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="block text-white/90"
                        >
                            Customer Understanding
                        </motion.span>
                        <div className="block mt-1 relative min-h-[1.5em]">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={headerIndex}
                                    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="block bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_8s_infinite_linear]"
                                >
                                    {HEADER_OPTIONS[headerIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </h1>
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-4 inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md"
                    >
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse shadow-[0_0_8px_#10B981]" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em]">Customer Intelligence Lab</span>
                    </motion.div>
                </div>

                {/* 3. The Organic Node Canvas (Non-Grid) - Centered */}
                <div className="relative z-10 flex-grow flex items-center justify-center -mt-4">
                    <div className="w-full relative h-[400px]">
                        <AnimatePresence mode="popLayout">
                            {activeIndices.map((idx, slotIndex) => {
                                const node = LAB_USE_CASES[idx];
                                const slotPos = SLOTS[slotIndex];
                                return (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, scale: 0.7, rotateY: -25, filter: "blur(15px)" }}
                                        animate={{ opacity: 1, scale: 1, rotateY: 0, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.7, rotateY: 25, filter: "blur(15px)" }}
                                        className="absolute group cursor-pointer"
                                        style={slotPos}
                                        whileHover={{
                                            scale: 1.08,
                                            rotateY: 5,
                                            z: 50,
                                            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 120,
                                            damping: 20,
                                            opacity: { duration: 1 },
                                            rotateY: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                y: [0, -12, 0],
                                                rotateZ: [0, 1, 0]
                                            }}
                                            transition={{
                                                duration: 7 + (idx % 3),
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="relative flex flex-col items-start min-w-[280px]"
                                            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <div className="h-4 w-4 rounded-full bg-white relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                                                        <div className="absolute inset-0 rounded-full animate-ping bg-white/40" />
                                                    </div>
                                                    <div className={`absolute inset-[-12px] rounded-full blur-xl opacity-40`} style={{ backgroundColor: node.color }} />
                                                </div>
                                                <motion.div
                                                    className="p-5 rounded-[20px] backdrop-blur-[40px] bg-white/[0.04] border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                                                    whileHover={{
                                                        backgroundColor: "rgba(255,255,255,0.1)",
                                                        borderColor: "rgba(255,255,255,0.3)",
                                                        boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 40px ${node.color}40`,
                                                        transition: { duration: 0.3 }
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{node.tag}</span>
                                                            <div className="h-1 w-1 rounded-full" style={{ backgroundColor: node.color }} />
                                                        </div>
                                                        {/* Avatar Stack */}
                                                        <div className="flex -space-x-1.5">
                                                            {node.avatars.map((avatar, i) => (
                                                                <div key={i} className="h-5 w-5 rounded-full border border-black/80 overflow-hidden bg-zinc-800 ring-1 ring-white/10">
                                                                    <img
                                                                        src={avatar}
                                                                        alt="User"
                                                                        onError={(e) => {
                                                                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.id}-${i}`;
                                                                        }}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <h3 className="text-white font-bold text-lg tracking-tight mb-1">{node.title}</h3>
                                                    <p className="text-white/50 text-[13px] leading-relaxed max-w-[210px] font-medium selection:bg-white/20">
                                                        "{node.result}"
                                                    </p>

                                                    {/* Magnetic Glow on Hover */}
                                                    <motion.div
                                                        className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 pointer-events-none"
                                                        style={{
                                                            background: `radial-gradient(circle at center, ${node.color}20, transparent 70%)`
                                                        }}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        whileHover={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.4 }}
                                                    />
                                                </motion.div>
                                            </div>

                                            {/* Magical Particle Trail System */}
                                            <div className="absolute top-8 left-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {[...Array(8)].map((_, j) => (
                                                    <motion.div
                                                        key={j}
                                                        className="absolute h-[2px] w-[2px] rounded-full"
                                                        style={{ backgroundColor: node.color }}
                                                        animate={{
                                                            x: [0, 120 + Math.random() * 50],
                                                            y: [0, (Math.random() - 0.5) * 80],
                                                            opacity: [0, 1, 0],
                                                            scale: [0, 1.5, 0]
                                                        }}
                                                        transition={{
                                                            duration: 1.8,
                                                            repeat: Infinity,
                                                            delay: j * 0.2,
                                                            ease: [0.16, 1, 0.3, 1]
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Orbital Ring Effect */}
                                            <motion.div
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100"
                                                initial={{ scale: 0.8, rotate: 0 }}
                                                whileHover={{ scale: 1.2, rotate: 360 }}
                                                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                                            >
                                                <div
                                                    className="w-[320px] h-[320px] rounded-full border border-white/10"
                                                    style={{ borderColor: `${node.color}30` }}
                                                />
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 4. Footer - Fixed at bottom */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="relative z-20 flex-shrink-0 flex items-center justify-between text-white/30 text-[11px] font-medium tracking-wide"
                >
                    <div className="flex items-center space-x-6">
                        <span className="flex items-center">
                            <span className="h-[2px] w-4 bg-white/20 mr-2" />
                            © 2026 SquareUp AI
                        </span>
                        <span>The intelligence layer for modern growth.</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-white/40">Aggregating Live Data</span>
                    </div>
                </motion.div>

                {/* Vertical Scanning Beam */}
                <motion.div
                    className="absolute left-0 right-0 h-[80px] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent shadow-[0_0_40px_rgba(255,255,255,0.05)] pointer-events-none z-30"
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Right Side: The Entry (Auth) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:px-24 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-[360px] space-y-8">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex flex-col items-center space-y-4 text-center mb-8">
                        <div className="h-12 flex items-center justify-center mb-2">
                            <img src="/brand/wordmark-dark.svg" alt="SquareUp" className="h-10 w-auto object-contain" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            SquareUp your intelligence
                        </h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Welcome back
                        </h2>
                        <p className="text-[15px] text-neutral-500">
                            Sign in to your SquareUp command center.
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

                </div>
            </div>
        </motion.div>
    );
}
