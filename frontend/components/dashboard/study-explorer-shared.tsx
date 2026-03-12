"use client";

import {
    ShoppingCart,
    Package,
    Sparkles,
    Shirt,
    Zap,
    UtensilsCrossed,
    Landmark,
    HeartPulse,
    GraduationCap,
    Plane,
    Monitor,
    Store,
    MapPin,
    Building2,
    Lock,
    FlaskConical,
    Clock,
    TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────

export interface Study {
    id: string;
    name: string;
    family: string;
    description: string;
    departments: string[];
    industries: string[];
    urgency: "P0" | "P1" | "P2" | "P3";
    method: string;
    is_locked?: boolean;
    outcome_statement?: string;
    when_to_use?: string;
    duration_weeks?: number;
    effort_level?: "light" | "medium" | "heavy";
    impact_score?: number;
    popularity_score?: number;
    recommended_stages?: string[];
    recommended_roles?: string[];
    unlocks?: string[];
}

export type Industry = string;

// ── Industry icon + color mapping ──────────────

export const industryMeta: Record<
    string,
    { icon: React.ElementType; color: string; accent: string; heroGradient: string; image?: string }
> = {
    Fintech: {
        icon: Landmark,
        color: "text-blue-400",
        accent: "#3b82f6",
        heroGradient: "from-blue-600/30 via-blue-900/20 to-transparent",
        image: "fintech.png",
    },
    "D2C / Ecommerce": {
        icon: ShoppingCart,
        color: "text-orange-400",
        accent: "#f97316",
        heroGradient: "from-orange-600/30 via-orange-900/20 to-transparent",
        image: "d2c.png",
    },
    FMCG: {
        icon: Package,
        color: "text-emerald-400",
        accent: "#10b981",
        heroGradient: "from-emerald-600/30 via-emerald-900/20 to-transparent",
        image: "fmcg.png",
    },
    Beauty: {
        icon: Sparkles,
        color: "text-pink-400",
        accent: "#ec4899",
        heroGradient: "from-pink-600/30 via-pink-900/20 to-transparent",
        image: "beauty.png",
    },
    Fashion: {
        icon: Shirt,
        color: "text-violet-400",
        accent: "#8b5cf6",
        heroGradient: "from-violet-600/30 via-violet-900/20 to-transparent",
        image: "fashion.png",
    },
    "Quick Commerce": {
        icon: Zap,
        color: "text-yellow-400",
        accent: "#eab308",
        heroGradient: "from-yellow-600/30 via-yellow-900/20 to-transparent",
        image: "quick_commerce.png",
    },
    QSR: {
        icon: UtensilsCrossed,
        color: "text-red-400",
        accent: "#ef4444",
        heroGradient: "from-red-600/30 via-red-900/20 to-transparent",
        image: "qsr.png",
    },
    Healthtech: {
        icon: HeartPulse,
        color: "text-teal-400",
        accent: "#14b8a6",
        heroGradient: "from-teal-600/30 via-teal-900/20 to-transparent",
        image: "healthtech.png",
    },
    Edtech: {
        icon: GraduationCap,
        color: "text-indigo-400",
        accent: "#6366f1",
        heroGradient: "from-indigo-600/30 via-indigo-900/20 to-transparent",
        image: "edtech.png",
    },
    Travel: {
        icon: Plane,
        color: "text-sky-400",
        accent: "#0ea5e9",
        heroGradient: "from-sky-600/30 via-sky-900/20 to-transparent",
        image: "travel.png",
    },
    "Media / OTT": {
        icon: Monitor,
        color: "text-purple-400",
        accent: "#a855f7",
        heroGradient: "from-purple-600/30 via-purple-900/20 to-transparent",
        image: "media_ott.png",
    },
    "Omnichannel Retail": {
        icon: Store,
        color: "text-amber-400",
        accent: "#f59e0b",
        heroGradient: "from-amber-600/30 via-amber-900/20 to-transparent",
        image: "omnichannel_retail.png",
    },
    Hyperlocal: {
        icon: MapPin,
        color: "text-lime-400",
        accent: "#84cc16",
        heroGradient: "from-lime-600/30 via-lime-900/20 to-transparent",
        image: "hyperlocal.png",
    },
    Franchise: {
        icon: Building2,
        color: "text-stone-400",
        accent: "#78716c",
        heroGradient: "from-stone-600/30 via-stone-900/20 to-transparent",
        image: "franchise.png",
    },
    // ── Extended industries ──
    Logistics: {
        icon: Package,
        color: "text-cyan-400",
        accent: "#06b6d4",
        heroGradient: "from-cyan-600/30 via-cyan-900/20 to-transparent",
    },
    "Real Estate": {
        icon: Building2,
        color: "text-slate-400",
        accent: "#64748b",
        heroGradient: "from-slate-600/30 via-slate-900/20 to-transparent",
    },
    Gaming: {
        icon: Monitor,
        color: "text-fuchsia-400",
        accent: "#d946ef",
        heroGradient: "from-fuchsia-600/30 via-fuchsia-900/20 to-transparent",
    },
    Agriculture: {
        icon: MapPin,
        color: "text-green-400",
        accent: "#22c55e",
        heroGradient: "from-green-600/30 via-green-900/20 to-transparent",
    },
    Insurance: {
        icon: Lock,
        color: "text-blue-300",
        accent: "#93c5fd",
        heroGradient: "from-blue-500/30 via-blue-800/20 to-transparent",
    },
    Automotive: {
        icon: Zap,
        color: "text-zinc-400",
        accent: "#a1a1aa",
        heroGradient: "from-zinc-600/30 via-zinc-900/20 to-transparent",
    },
    "Fitness & Wellness": {
        icon: HeartPulse,
        color: "text-rose-400",
        accent: "#fb7185",
        heroGradient: "from-rose-600/30 via-rose-900/20 to-transparent",
    },
    "Pet Care": {
        icon: Sparkles,
        color: "text-orange-300",
        accent: "#fdba74",
        heroGradient: "from-orange-500/30 via-orange-800/20 to-transparent",
    },
    Sustainability: {
        icon: FlaskConical,
        color: "text-emerald-300",
        accent: "#6ee7b7",
        heroGradient: "from-emerald-500/30 via-emerald-800/20 to-transparent",
    },
    Luxury: {
        icon: Sparkles,
        color: "text-amber-300",
        accent: "#fcd34d",
        heroGradient: "from-amber-500/30 via-amber-800/20 to-transparent",
    },
    SaaS: {
        icon: Monitor,
        color: "text-indigo-300",
        accent: "#a5b4fc",
        heroGradient: "from-indigo-500/30 via-indigo-800/20 to-transparent",
    },
};

// ── Family → poster gradient ───────────────────

export const familyGradient: Record<string, string> = {
    "Foundational market understanding": "from-indigo-500 via-indigo-700 to-slate-900",
    "Customer / audience understanding": "from-violet-500 via-purple-700 to-slate-900",
    "Need / pain-point discovery": "from-emerald-500 via-teal-700 to-slate-900",
    "Concept / proposition validation": "from-amber-500 via-orange-700 to-slate-900",
    "Product / UX research": "from-cyan-500 via-sky-700 to-slate-900",
    "Pricing / monetization research": "from-rose-500 via-red-700 to-slate-900",
    "Acquisition / growth research": "from-green-500 via-emerald-700 to-slate-900",
    "Retention / loyalty / churn research": "from-yellow-500 via-amber-700 to-slate-900",
    "Continuous listening / VoC / tracking": "from-blue-500 via-indigo-700 to-slate-900",
    "Brand / positioning / comms research": "from-fuchsia-500 via-pink-700 to-slate-900",
    "Shopper / path-to-purchase / retail research": "from-orange-500 via-amber-700 to-slate-900",
    "QSR / sensory / menu / store experience research": "from-red-500 via-rose-700 to-slate-900",
    "Service & operations research": "from-teal-500 via-cyan-700 to-slate-900",
    "Community / sentiment / trust research": "from-purple-500 via-violet-700 to-slate-900",
};

export const familyIcon: Record<string, React.ElementType> = {
    "Foundational market understanding": TrendingUp,
    "Customer / audience understanding": Sparkles,
    "Need / pain-point discovery": FlaskConical,
    "Concept / proposition validation": Zap,
    "Product / UX research": Monitor,
    "Pricing / monetization research": Landmark,
    "Acquisition / growth research": TrendingUp,
    "Retention / loyalty / churn research": HeartPulse,
    "Continuous listening / VoC / tracking": Clock,
    "Brand / positioning / comms research": Sparkles,
    "Shopper / path-to-purchase / retail research": ShoppingCart,
    "QSR / sensory / menu / store experience research": UtensilsCrossed,
    "Service & operations research": Package,
    "Community / sentiment / trust research": Lock,
};

// ── Urgency styling ────────────────────────────

export const urgencyStyle: Record<string, string> = {
    P0: "bg-red-500/20 text-red-300 border-red-500/30",
    P1: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    P2: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    P3: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export const urgencyStyleLight: Record<string, string> = {
    P0: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    P1: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    P2: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    P3: "bg-gray-100 text-gray-600 dark:bg-zinc-500/20 dark:text-zinc-400",
};

export const urgencyLabel: Record<string, string> = {
    P0: "High Priority",
    P1: "Recommended",
    P2: "Standard",
    P3: "Optional",
};

// ── Voice Waveform Avatar (AI guide presence) ──

export function VoiceWaveformAvatar({ size = "md" }: { size?: "sm" | "md" }) {
    const bars = [
        { h: size === "sm" ? 6 : 8, pattern: [0.4, 0.8, 0.3, 0.7, 0.4] },
        { h: size === "sm" ? 9 : 12, pattern: [0.7, 0.4, 0.9, 0.5, 0.7] },
        { h: size === "sm" ? 11 : 15, pattern: [1, 0.5, 0.7, 1, 1] },
        { h: size === "sm" ? 9 : 12, pattern: [0.5, 0.9, 0.4, 0.8, 0.5] },
        { h: size === "sm" ? 6 : 8, pattern: [0.3, 0.7, 0.5, 0.3, 0.3] },
    ];

    return (
        <div className={cn(
            "rounded-full border-2 border-white dark:border-[#18181B] shadow-md shrink-0",
            "bg-gradient-to-br from-[#FF8A4C]/10 to-[#FF8A4C]/5 dark:from-[#FF8A4C]/15 dark:to-[#FF8A4C]/5",
            "flex items-center justify-center gap-[2.5px]",
            size === "sm" ? "w-9 h-9" : "w-11 h-11"
        )}>
            {bars.map((bar, i) => (
                <motion.div
                    key={i}
                    animate={{ scaleY: bar.pattern }}
                    transition={{
                        duration: 1.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                    }}
                    className="w-[2.5px] rounded-full bg-[#FF8A4C]/70 origin-center"
                    style={{ height: bar.h }}
                />
            ))}
        </div>
    );
}

// ── Derived value helpers ─────────────────────

export function deriveDuration(study: Study): number {
    if (study.duration_weeks) return study.duration_weeks;
    const m = study.method.toLowerCase();
    if (m.includes("analytics") || m.includes("data review")) return 1.5;
    if (m.includes("survey")) return 2.5;
    if (m.includes("focus group")) return 3.5;
    if (m.includes("interview")) return 5;
    if (m.includes("ethnograph")) return 7;
    return 4;
}

export function deriveEffort(study: Study): "light" | "medium" | "heavy" {
    if (study.effort_level) return study.effort_level;
    const m = study.method.toLowerCase();
    if (m.includes("survey") || m.includes("analytics") || m.includes("data review")) return "light";
    if (m.includes("ethnograph")) return "heavy";
    return "medium";
}

export function deriveImpact(study: Study): number {
    if (study.impact_score) return study.impact_score;
    return { P0: 5, P1: 4, P2: 3, P3: 2 }[study.urgency] ?? 3;
}

export function derivePopularity(study: Study): number {
    if (study.popularity_score) return study.popularity_score;
    const base = { P0: 55, P1: 30, P2: 15, P3: 8 }[study.urgency] ?? 15;
    const hash = study.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return base + (hash % 15);
}

export function formatDuration(weeks: number): string {
    if (weeks <= 1.5) return "1–2 wks";
    if (weeks <= 3) return "2–3 wks";
    if (weeks <= 5) return "4–5 wks";
    if (weeks <= 7) return "6–7 wks";
    return `${Math.round(weeks)}+ wks`;
}

// ── Filter & preset constants ─────────────────

export const goalFilterOptions = [
    { value: "understand-market", label: "Understand my market", question: "What does the landscape look like?", families: ["Foundational market understanding"] },
    { value: "validate-idea", label: "Validate an idea or concept", question: "Will this idea work?", families: ["Concept / proposition validation", "Need / pain-point discovery"] },
    { value: "improve-product", label: "Improve an existing product", question: "How can I make this better?", families: ["Product / UX research", "Service & operations research"] },
    { value: "optimize-pricing", label: "Optimize pricing or monetization", question: "What should I charge?", families: ["Pricing / monetization research"] },
    { value: "grow-reduce-churn", label: "Grow acquisition or reduce churn", question: "How do I grow and retain?", families: ["Acquisition / growth research", "Retention / loyalty / churn research"] },
    { value: "brand-positioning", label: "Strengthen brand or positioning", question: "How is my brand perceived?", families: ["Brand / positioning / comms research", "Community / sentiment / trust research"] },
];

export const timeFilterOptions = [
    { value: "under-2", label: "Under 2 weeks", maxWeeks: 2, descriptor: "⚡ Fast insight" },
    { value: "2-4", label: "2–4 weeks", maxWeeks: 4, descriptor: "Most common" },
    { value: "4-8", label: "4–8 weeks", maxWeeks: 8, descriptor: "Deep research" },
];

export type SmartSignal = { type: "popular" | "fast" | "strategic" | "foundational"; label: string };

export function computeSmartSignal(study: Study, industry: string, popularIds: Set<string>): SmartSignal | null {
    if (popularIds.has(study.id)) return { type: "popular", label: `Popular in ${industry}` };
    if (deriveDuration(study) <= 2) return { type: "fast", label: "Fast insight" };
    if (
        (study.urgency === "P0" || study.urgency === "P1") &&
        (study.method.toLowerCase().includes("interview") || study.method.toLowerCase().includes("ethnograph"))
    ) return { type: "strategic", label: "Strategic insight" };
    if (
        study.family.toLowerCase().includes("foundational") ||
        study.family.toLowerCase().includes("customer")
    ) return { type: "foundational", label: "Foundational" };
    return null;
}
