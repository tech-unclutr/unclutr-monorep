"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Clock,
    Users,
    Zap,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    BarChart3,
    Shield,
    DollarSign,
    Layers,
    Lock,
    Bookmark,
    Share2,
    FlaskConical,
    MessageSquareQuote,
    Gauge,
    Building2,
    MapPin,
    Languages,
    Play,
    Sparkles,
    Volume2,
    ArrowRight,
    Search,
    RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Static Mock Data ─────────────────────────────────

const MOCK_STUDY = {
    id: "study-7",
    name: "Consumer ICP Definition (B2C ICP)",
    family: "Customer & Audience Understanding",
    category: "Audience Research",
    tagline: "Define who you win with — and who you should stop targeting.",
    alternate_names: "Target audience profiling, Ideal customer analysis, Core segment definition",
    signal_type: "Qualitative",
    urgency: "P0" as const,
    method: "Mixed-method",
    time_to_insight: "3–4 weeks",
    is_locked: true,
    is_featured: true,

    questions_answered:
        "Are we building for the right customer — or are we optimizing for a segment that will never scale?",

    why_it_matters:
        "Without a clear ICP, every rupee spent on acquisition is a bet. You're targeting broadly, converting expensively, and retaining poorly — because you're optimizing for a customer you haven't actually defined. Teams end up misaligned, campaigns underperform, and product decisions lack a clear north star.",

    outcomes: [
        "Allocate acquisition budget to the segment with the highest LTV",
        "Brief your agency with data-backed targeting criteria instead of assumptions",
        "Kill campaigns aimed at segments that will never convert at scale",
        "Align product, marketing, and CX around a shared customer definition",
        "Prioritize the product roadmap based on who actually matters most",
    ],

    best_execution_method:
        "Combines a quantitative segmentation survey (n=200–500) with 15–20 depth interviews across emerging segments. The quant identifies behavioral clusters; the qual brings them to life with motivations, language, and context. Results are synthesized into actionable persona cards with targeting criteria.",

    typical_sample_type: "Existing customers, Lapsed customers, Prospect panel",
    typical_sample_size: "200–500 (quant) + 15–20 (qual)",
    online_vs_offline: "Primarily online",
    frequency_cadence: "Annual refresh, or after major market shift",

    scrappy_version:
        "5–8 depth interviews with your top customers using a structured JTBD script. You get a working ICP doc in 2 weeks. Enough to align the team and sharpen near-term targeting.",
    gold_standard_version:
        "Quant segmentation survey (n=500+) combined with 15–20 depth interviews across segments. Full persona cards, segment sizing, channel preference mapping, and targeting recommendations. 6–8 weeks.",

    deliverables: [
        "Segmentation map with sizing",
        "Persona cards (3–5 segments)",
        "Targeting criteria matrix",
        "Channel preference analysis",
        "Executive summary deck",
        "Raw interview transcripts",
    ],
    kpis: [
        "Segment size by estimated LTV",
        "Acquisition cost by segment",
        "Channel preference by cohort",
        "Retention rate by persona",
        "Brand perception by segment",
    ],

    success_criteria: [
        "Sample includes both active and lapsed customers",
        "Minimum 3 distinct behavior-based segments must emerge",
        "All findings validated against actual purchase data",
        "Personas are actionable — teams can use them immediately",
        "Statistical significance achieved on key segment differences",
    ],
    common_mistakes: [
        "Defining ICP based on demographics alone instead of behavior",
        "Interviewing only happy customers and missing churn signals",
        "Creating personas that are vivid but no one in the org actually uses",
        "Running quant without qual — segments without human context",
        "Treating ICP as a one-time exercise instead of a living document",
    ],

    departments: [
        { name: "Marketing", ownership_type: "DRI" },
        { name: "Product", ownership_type: "co_owned" },
        { name: "CX / Support", ownership_type: "consumed" },
        { name: "Growth", ownership_type: "consumed" },
    ],
    dri_role: "Head of Marketing / Brand Lead",
    industries: [
        { name: "D2C / Ecommerce", must_do: true },
        { name: "Health & Wellness", must_do: true },
        { name: "Fashion & Apparel", must_do: true },
        { name: "Fintech", must_do: false },
        { name: "EdTech", must_do: false },
        { name: "Food & Beverage", must_do: false },
        { name: "SaaS", must_do: false },
    ],
    lifecycle_stages: ["Growth", "Scale", "Maturity"],
    startup_stages: ["Series A+", "Growth Stage", "Established"],

    costs: [
        { tier: "DIY", min_inr: 15000, max_inr: 30000 },
        { tier: "Lean", min_inr: 50000, max_inr: 80000 },
        { tier: "Assisted", min_inr: 150000, max_inr: 300000 },
        { tier: "Agency", min_inr: 200000, max_inr: 400000 },
    ],
    main_cost_drivers: "Sample size, number of cities covered, language requirements, depth of qual component",
    roi_score: "8.5/10",
    roi_conditions:
        "Pays for itself when you redirect even 10% of acquisition spend toward the right segment. Most brands see measurable CAC improvement within one quarter.",

    india_execution_notes:
        "Tier 2/3 city recruitment requires field partners — online panels underrepresent these markets. Phone-based interviews consistently outperform video in non-metro markets. Expect 15–20% no-show rates and over-recruit accordingly. Festival seasons (Diwali, Navratri) significantly impact respondent availability.",
    language_regional_notes:
        "Hindi belt respondents strongly prefer Hindi-first discussion guides. South India requires separate Tamil/Kannada/Telugu recruitment streams. Bilingual moderators significantly improve data quality full launch.",

    priority_score: 9,
    best_timing_trigger:
        "When you're scaling spend but CAC is rising and you can't explain why. Or when the team keeps debating 'who is our customer' without data to settle it.",
    decisions_unlocked:
        "You'll know exactly which customer segment to double down on, which to deprioritize, and how to brief every team from product to performance marketing with a shared, data-backed definition.",
};

// ── Types ─────────────────────────────────────────

type UrgencyLevel = "P0" | "P1" | "P2" | "P3";

// ── Urgency Config ───────────────────────────────

const urgencyConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    P0: { label: "High Priority", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20", dot: "bg-red-500" },
    P1: { label: "Recommended", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20", dot: "bg-orange-500" },
    P2: { label: "Standard", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", dot: "bg-blue-500" },
    P3: { label: "Optional", color: "text-gray-500 dark:text-zinc-400", bg: "bg-gray-50 dark:bg-zinc-500/10 border-gray-200 dark:border-zinc-500/20", dot: "bg-gray-400" },
};

// ── Helpers ───────────────────────────────────────

function formatINR(val: number | null): string {
    if (val === null || val === undefined) return "—";
    if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
}

// ── Avatars ───────────────────────────────────────

const AVATAR_IMG = "/images/study-detail/avatar.png";
const AVATAR_LEAD = AVATAR_IMG;
const AVATAR_OPS = AVATAR_IMG;

// ── Voice Waveform Avatar (AI-native speaking indicator)
function VoiceWaveformAvatar() {
    const bars = [
        { h: 8, pattern: [0.4, 0.8, 0.3, 0.7, 0.4] },
        { h: 12, pattern: [0.7, 0.4, 0.9, 0.5, 0.7] },
        { h: 15, pattern: [1, 0.5, 0.7, 1, 1] },
        { h: 12, pattern: [0.5, 0.9, 0.4, 0.8, 0.5] },
        { h: 8, pattern: [0.3, 0.7, 0.5, 0.3, 0.3] },
    ];

    return (
        <div className="w-11 h-11 rounded-full border-2 border-white dark:border-[#18181B] shadow-md bg-gradient-to-br from-[#FF8A4C]/10 to-[#FF8A4C]/5 dark:from-[#FF8A4C]/15 dark:to-[#FF8A4C]/5 flex items-center justify-center gap-[2.5px]">
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

// ── Reusable Component: Avatar Chat Bubble
function ChatBubble({
    avatarUrl,
    avatar,
    name,
    children,
    delay = 0,
    className,
    isSecondary = false
}: {
    avatarUrl?: string,
    avatar?: React.ReactNode,
    name: string,
    children: React.ReactNode,
    delay?: number,
    className?: string,
    isSecondary?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={cn("flex gap-4 items-start", className)}
        >
            <div className="flex flex-col items-center gap-1.5 shrink-0">
                {avatar || (
                    <img src={avatarUrl} className="w-11 h-11 rounded-full border-2 border-white dark:border-[#18181B] shadow-md object-cover bg-[#F0EBE6] dark:bg-[#1C1C1E]" alt={name} />
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{name}</span>
            </div>
            <div className={cn(
                "relative rounded-2xl p-5 shadow-sm border",
                isSecondary
                    ? "bg-violet-50/50 dark:bg-violet-500/5 border-violet-100 dark:border-violet-500/10 rounded-tl-sm"
                    : "bg-white dark:bg-[#18181B]/80 border-gray-100 dark:border-[#27272A] rounded-tl-sm backdrop-blur-xl"
            )}>
                {children}
            </div>
        </motion.div>
    );
}

// ── CTA Button
function CTAButton({ size = "default", className, isLocked, children }: { size?: "default" | "sm", className?: string, isLocked?: boolean, children?: React.ReactNode }) {
    return (
        <Button
            className={cn(
                "bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white shadow-[0_0_20px_rgba(255,138,76,0.3)] font-semibold",
                "active:scale-[0.98] transition-all duration-200 border-none relative",
                size === "sm" ? "h-9 text-[13px] px-5 rounded-lg" : "h-12 text-[15px] px-8 rounded-xl",
                className
            )}
        >
            <span className="relative z-10 flex items-center justify-center pointer-events-none">
                {isLocked ? (
                    <><Lock className="w-4 h-4 mr-2" />Unlock This Study</>
                ) : (
                    <><Play className="w-4 h-4 mr-2" />Start This Study</>
                )}
            </span>
            {children}
        </Button>
    );
}

// ── Animated Speaker Avatar
function AnimatedAvatar() {
    return (
        <div className="relative shrink-0 w-[100px] h-[100px] sm:w-[84px] sm:h-[84px]">
            <video
                src="/images/study-detail/avatar-speaking.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full rounded-full border-2 border-white dark:border-[#27272A] shadow-md object-cover bg-[#F0EBE6] dark:bg-[#1C1C1E]"
            />
        </div>
    );
}

// ── Main Component ────────────────────────────────

export function StudyDetailPage({ studyId }: { studyId: string }) {
    const router = useRouter();
    const [bookmarked, setBookmarked] = useState(false);
    const [executionMode, setExecutionMode] = useState<"scrappy" | "gold">("scrappy");

    const study = MOCK_STUDY;
    const urgency = urgencyConfig[study.urgency] || urgencyConfig.P2;

    // ── Right Panel: conversational guide data ──
    const panelFadeUp = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
    };

    const timelineSteps = [
        { title: "Design", desc: "Quant survey + interview guide tailored to your market" },
        { title: "Field Research", desc: "200-500 surveys + 15-20 depth interviews across segments" },
        { title: "Deliver", desc: "Persona cards, targeting matrix & executive summary" },
    ];

    const whyBullets = [
        "Cut acquisition cost by focusing spend on the right segment",
        "Align product, marketing & CX around one customer definition",
        "Replace gut-feel targeting with data-backed decisions",
    ];

    const bestForTags = [
        study.dri_role.split(" / ")[0],
        ...study.lifecycle_stages.slice(0, 2),
        study.industries[0]?.name,
    ].filter(Boolean);

    const costMin = formatINR(study.costs[0]?.min_inr);
    const costMax = formatINR(study.costs[study.costs.length - 1]?.max_inr);
    const costRange = `${costMin}–${costMax.replace("₹", "")}`;

    return (
        <div className="min-h-screen pb-32 lg:pb-16 bg-[#FAFAFA] dark:bg-[#0C0C0E] selection:bg-[#FF8A4C]/20">

            {/* ═══════════════════════════════════════════════
                GLOBAL STICKY HEADER
            ═══════════════════════════════════════════════ */}
            <div className="sticky top-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0C0C0E]/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-[#27272A]/50">
                <div className="flex items-center justify-between px-6 lg:px-10 py-3.5 max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-4.5 h-4.5 text-muted-foreground" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800 shrink-0" />
                        <span className="text-[12px] font-medium text-muted-foreground truncate hidden sm:block">
                            {study.family}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 hidden sm:block" />
                        <span className="text-[13px] font-semibold text-foreground truncate">
                            {study.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                MAIN CONTENT AREA
            ═══════════════════════════════════════════════ */}
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-10 lg:pt-14 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-20">

                {/* ════════════ LEFT COLUMN: THE NARRATIVE ════════════ */}
                <div className="min-w-0 space-y-14">

                    {/* ──── HERO: Welcome & The Hook ──── */}
                    <section className="relative">
                        {/* Hero ambient spotlight — warm presence */}
                        <div className="absolute -top-16 -left-16 w-72 h-72 bg-[#FF8A4C]/[0.03] dark:bg-[#FF8A4C]/[0.02] blur-[80px] rounded-full pointer-events-none" />

                        {/* Beat 1 — Signal Badges */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="relative flex items-center flex-wrap gap-2 mb-5"
                        >
                            <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border", urgency.bg, urgency.color)}>
                                <span className={cn("w-2 h-2 rounded-full animate-pulse", urgency.dot)} />
                                {urgency.label}
                            </span>
                            {study.is_featured && (
                                <Badge className="bg-[#FF8A4C]/10 text-[#FF8A4C] border-[#FF8A4C]/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 relative overflow-hidden">
                                    <Sparkles className="w-3 h-3 mr-1" /> Featured
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
                                </Badge>
                            )}
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-50 dark:bg-zinc-800/50 text-muted-foreground border border-gray-100 dark:border-zinc-700/50">
                                <FlaskConical className="w-3 h-3" /> {study.method}
                            </span>
                        </motion.div>

                        {/* Beat 2 — Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="relative text-[36px] lg:text-[42px] font-bold text-foreground tracking-tight leading-[1.1] font-display"
                        >
                            {study.name}
                        </motion.h1>

                        {/* Beat 3 — Breathing gradient accent (visual connector to waveform) */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
                            className="origin-left mt-4 mb-5"
                        >
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="h-[3px] w-20 rounded-full bg-gradient-to-r from-[#FF8A4C] via-[#FF8A4C]/40 to-transparent"
                            />
                        </motion.div>

                        {/* Beat 4 — Tagline with tension */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative text-[17px] max-w-2xl leading-relaxed mb-6"
                        >
                            {study.tagline.includes(" — ") ? (
                                <>
                                    <span className="text-muted-foreground font-medium">{study.tagline.split(" — ")[0]}</span>
                                    <span className="text-foreground font-semibold"> — {study.tagline.split(" — ")[1]}</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground font-medium">{study.tagline}</span>
                            )}
                        </motion.p>

                        {/* Beat 5 — The Core Question (conversational) */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="relative"
                        >
                            {/* Warm glow behind the bubble */}
                            <div className="absolute -inset-3 bg-[#FF8A4C]/[0.02] dark:bg-[#FF8A4C]/[0.015] blur-2xl rounded-3xl pointer-events-none" />
                            <div className="group relative rounded-2xl p-6 shadow-[0_4px_24px_-4px_rgba(255,138,76,0.1)] dark:shadow-[0_4px_24px_-4px_rgba(255,138,76,0.08)] border border-[#FF8A4C]/15 dark:border-[#FF8A4C]/10 bg-gradient-to-br from-[#FF8A4C]/[0.025] via-white to-white dark:from-[#FF8A4C]/[0.03] dark:via-[#18181B]/80 dark:to-[#18181B]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.15)] dark:hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.12)] hover:border-[#FF8A4C]/25">
                                {/* Speaker identity */}
                                <div className="flex items-center gap-3 mb-4">
                                    <VoiceWaveformAvatar />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-foreground leading-tight">Sarah</p>
                                        <p className="text-[11px] text-muted-foreground">Lead Researcher</p>
                                    </div>
                                    {/* Live indicator */}
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF8A4C]/[0.08] dark:bg-[#FF8A4C]/[0.12]">
                                        <motion.span
                                            animate={{ opacity: [1, 0.4, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-1.5 h-1.5 rounded-full bg-[#FF8A4C]"
                                        />
                                        <span className="text-[10px] font-semibold text-[#FF8A4C]">Speaking</span>
                                    </div>
                                </div>
                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-[#FF8A4C]/15 via-gray-100 dark:via-zinc-700/50 to-transparent mb-4" />
                                <p className="text-[13px] text-muted-foreground font-medium mb-3">
                                    The question your team really needs answered →
                                </p>
                                <p className="text-[18px] lg:text-[20px] font-semibold text-foreground font-display leading-[1.4] tracking-tight">
                                    &ldquo;{study.questions_answered}&rdquo;
                                </p>
                            </div>
                        </motion.div>
                    </section>

                    {/* ──── THE "WHY NOW" CARD ──── */}
                    <section>
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="group relative rounded-3xl border border-[#FF8A4C]/15 dark:border-[#FF8A4C]/10 bg-white dark:bg-[#18181B]/80 shadow-[0_4px_24px_-4px_rgba(255,138,76,0.1)] dark:shadow-[0_4px_24px_-4px_rgba(255,138,76,0.08)] p-6 lg:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.15)] dark:hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.12)] hover:border-[#FF8A4C]/25"
                        >
                            {/* Ambient gradient — warm, not alarming */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FF8A4C]/[0.04] dark:bg-[#FF8A4C]/[0.025] blur-[80px] rounded-full" />
                                <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-400/[0.03] dark:bg-amber-400/[0.015] blur-[60px] rounded-full" />
                            </div>

                            {/* Timing chip */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                                className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF8A4C]/[0.08] dark:bg-[#FF8A4C]/[0.12] border border-[#FF8A4C]/15 dark:border-[#FF8A4C]/20 mb-5"
                            >
                                <motion.span
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-1.5 h-1.5 rounded-full bg-[#FF8A4C]"
                                />
                                <span className="text-[11px] font-bold text-[#FF8A4C] tracking-wide">Timing matters</span>
                            </motion.div>

                            {/* Heading */}
                            <h3 className="relative text-[22px] lg:text-[24px] font-bold text-foreground font-display tracking-tight leading-[1.2] mb-2">
                                Every week without clarity costs you
                            </h3>

                            {/* One-liner */}
                            <p className="relative text-[15px] text-muted-foreground font-medium leading-relaxed mb-6 max-w-xl">
                                Without a defined ICP, your team is spending on the wrong audience — and the gap compounds the longer you wait.
                            </p>

                            {/* Impact bullets */}
                            <div className="relative space-y-3 mb-7">
                                {[
                                    { icon: DollarSign, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", text: "Acquisition spend leaks into segments that will never convert at scale" },
                                    { icon: Users, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", text: "Product, marketing & CX stay misaligned on who the customer actually is" },
                                    { icon: TrendingUp, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "One quarter of focused targeting can measurably lower your CAC" },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.35, delay: 0.2 + i * 0.08 }}
                                        className="flex items-start gap-3 group/row"
                                    >
                                        <div className={cn("shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover/row:scale-110 group-hover/row:shadow-sm", item.bg)}>
                                            <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                                        </div>
                                        <p className="text-[14px] text-foreground leading-snug font-medium">{item.text}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="relative">
                                <CTAButton size="sm" isLocked={study.is_locked} className="w-full sm:w-auto" />
                                <p className="text-[12px] text-muted-foreground mt-3 text-center sm:text-left">
                                    No commitment — explore the study, then decide.
                                </p>
                            </div>
                        </motion.div>
                    </section>

                    {/* ──── COMPARATIVE ANALYSIS: Traditional vs SquareUp ──── */}
                    <section>
                        {/* Section Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[20px] font-bold text-foreground font-display tracking-tight">
                                    From scattered research to one seamless system
                                </h3>
                                <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1 ml-4" />
                            </div>
                            <p className="text-[15px] text-muted-foreground max-w-xl leading-relaxed mb-8">
                                Most teams piece together research with agencies, spreadsheets, and manual work. Here&apos;s what that costs — and what changes with SquareUp.
                            </p>
                        </motion.div>

                        {/* ── Main Comparison Container (matches "Why Now" card pattern) ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="group/container relative rounded-3xl border border-gray-200/60 dark:border-[#27272A] bg-white dark:bg-[#18181B]/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] p-5 lg:p-7 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)]"
                        >
                            {/* Ambient gradients inside container */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FF8A4C]/[0.03] dark:bg-[#FF8A4C]/[0.02] blur-[80px] rounded-full" />
                                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/[0.025] dark:bg-emerald-500/[0.015] blur-[60px] rounded-full" />
                            </div>

                            {/* ── Side-by-side comparison ── */}
                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                                {/* ── Traditional Side ── */}
                                <div className="rounded-2xl border border-gray-200/80 dark:border-[#27272A]/80 bg-gray-50/60 dark:bg-zinc-900/30 p-5 relative overflow-hidden">
                                    {/* Subtle noise ambient */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.04] dark:bg-red-500/[0.025] blur-[40px] rounded-full pointer-events-none" />

                                    {/* Header with time badge */}
                                    <div className="relative flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <AlertTriangle className="w-3 h-3 text-gray-400 dark:text-zinc-500" />
                                            </div>
                                            <h4 className="text-[13px] font-bold text-foreground">The traditional way</h4>
                                        </div>
                                        <span className="text-[10px] font-semibold text-red-400/80 dark:text-red-400/60 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-500/15">~6–8 weeks</span>
                                    </div>

                                    {/* Steps — dashed connectors = disconnected */}
                                    <div className="relative space-y-0">
                                        {[
                                            { icon: Search, label: "Hire an agency, wait", desc: "Brief consultants, wait weeks for a PDF" },
                                            { icon: RefreshCw, label: "Stitch data by hand", desc: "Merge surveys, transcripts & exports manually" },
                                            { icon: Clock, label: "Static deliverables", desc: "A deck that sits in a folder — never refreshed" },
                                            { icon: Users, label: "Team interprets differently", desc: "Everyone builds their own version of the customer" },
                                        ].map((step, i, arr) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -6 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                                                className="flex items-start gap-3 group/step"
                                            >
                                                <div className="flex flex-col items-center shrink-0">
                                                    <div className="w-6 h-6 rounded-md bg-red-50 dark:bg-red-500/10 flex items-center justify-center transition-transform duration-200 group-hover/step:scale-110">
                                                        <step.icon className="w-3 h-3 text-red-400 dark:text-red-400/70" />
                                                    </div>
                                                    {i < arr.length - 1 && (
                                                        <div className="w-px h-7 border-l border-dashed border-gray-300 dark:border-zinc-700 my-1" />
                                                    )}
                                                </div>
                                                <div className="pb-0.5 min-w-0">
                                                    <p className="text-[12px] font-semibold text-foreground leading-tight">{step.label}</p>
                                                    <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">{step.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── SquareUp Side ── */}
                                <div className="rounded-2xl border border-[#FF8A4C]/20 dark:border-[#FF8A4C]/12 bg-gradient-to-br from-[#FF8A4C]/[0.02] via-white to-white dark:from-[#FF8A4C]/[0.03] dark:via-[#18181B] dark:to-[#18181B] p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF8A4C]/[0.06]">
                                    {/* Warm ambient glow */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF8A4C]/[0.05] dark:bg-[#FF8A4C]/[0.03] blur-[50px] rounded-full pointer-events-none" />
                                    <motion.div
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.025] blur-[40px] rounded-full pointer-events-none"
                                    />
                                    {/* Living shimmer sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_6s_ease-in-out_infinite] pointer-events-none" />

                                    {/* Header with time badge */}
                                    <div className="relative flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-[#FF8A4C]/10 flex items-center justify-center">
                                                <Sparkles className="w-3 h-3 text-[#FF8A4C]" />
                                            </div>
                                            <h4 className="text-[13px] font-bold text-foreground">How SquareUp does it</h4>
                                        </div>
                                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/15">~3–4 weeks</span>
                                    </div>

                                    {/* Steps — solid gradient connectors = unified */}
                                    <div className="relative space-y-0">
                                        {[
                                            { icon: Layers, label: "Structured research framework", desc: "Purpose-built template with proven methodology" },
                                            { icon: Zap, label: "AI-powered synthesis", desc: "Patterns and segments surface as data flows in" },
                                            { icon: BarChart3, label: "Living, actionable insights", desc: "Findings stay current and connected to decisions" },
                                            { icon: Shield, label: "One shared customer definition", desc: "Whole team acts on the same data-backed ICP" },
                                        ].map((step, i, arr) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 6 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                                                className="flex items-start gap-3 group/step"
                                            >
                                                <div className="flex flex-col items-center shrink-0">
                                                    <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-all duration-200 group-hover/step:scale-110 group-hover/step:shadow-[0_0_8px_rgba(16,185,129,0.12)]">
                                                        <step.icon className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                                    </div>
                                                    {i < arr.length - 1 && (
                                                        <div className="w-px h-7 bg-gradient-to-b from-emerald-300 to-emerald-100 dark:from-emerald-500/30 dark:to-emerald-500/10 my-1" />
                                                    )}
                                                </div>
                                                <div className="pb-0.5 min-w-0">
                                                    <p className="text-[12px] font-semibold text-foreground leading-tight">{step.label}</p>
                                                    <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">{step.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Gradient Divider ── */}
                            <div className="relative h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent mb-5" />

                            {/* ── Impact Metrics Strip ── */}
                            <div className="relative grid grid-cols-3 gap-3 mb-4">
                                {[
                                    { label: "Timeline", old: "6–8 weeks", fresh: "3–4 weeks", icon: Clock },
                                    { label: "Tools", old: "5+ platforms", fresh: "1 system", icon: Layers },
                                    { label: "Process", old: "Manual", fresh: "AI-powered", icon: Zap },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
                                        className="text-center p-3 rounded-xl bg-gray-50/80 dark:bg-zinc-800/30 border border-gray-100/80 dark:border-zinc-700/30 transition-all duration-200 hover:border-gray-200 dark:hover:border-zinc-600/50 hover:shadow-sm"
                                    >
                                        <stat.icon className="w-3.5 h-3.5 text-muted-foreground/50 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{stat.label}</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-[11px] text-muted-foreground/50 line-through">{stat.old}</span>
                                            <ArrowRight className="w-2.5 h-2.5 text-[#FF8A4C]" />
                                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{stat.fresh}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* ── Outcome ── */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="relative text-center text-[14px] text-muted-foreground font-medium pt-1"
                            >
                                Less waiting. Less guesswork. <span className="text-foreground font-semibold">Sharper decisions.</span>
                            </motion.p>
                        </motion.div>

                        {/* ── Conversational Closer (reconnects to Sarah's voice) ── */}
                        <div className="mt-7">
                            <ChatBubble avatar={<VoiceWaveformAvatar />} name="Sarah" delay={0.3}>
                                <p className="text-[14px] text-foreground font-medium leading-relaxed">
                                    &ldquo;That&apos;s the shift — same research rigor, a fraction of the friction. Want to see how it works for your team?&rdquo;
                                </p>
                            </ChatBubble>
                        </div>
                    </section>

                    {/* ──── WHAT YOU GET (Interactive Deliverables) ──── */}
                    <section>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <h3 className="text-[20px] font-bold text-foreground font-display tracking-tight">What you'll walk away with</h3>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/15">
                                    <CheckCircle2 className="w-3 h-3" />
                                    6 deliverables
                                </span>
                                <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1 ml-2" />
                            </div>
                            <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl">
                                Not a deck that collects dust. A <span className="text-foreground font-semibold">complete decision toolkit</span> your team can act on the day it lands.
                            </p>
                        </motion.div>

                        {/* ── Primary deliverables (high-impact outputs) ── */}
                        <div className="space-y-3 mb-6">
                            {[
                                {
                                    name: "Segmentation map with sizing",
                                    icon: Layers,
                                    value: "Stop guessing who to target. See exactly how your market splits — with real numbers behind each segment.",
                                    accent: "violet" as const,
                                },
                                {
                                    name: "Persona cards (3–5 segments)",
                                    icon: Users,
                                    value: "Living profiles your whole team rallies around — from ad briefs to product roadmap to CX scripts.",
                                    accent: "blue" as const,
                                },
                                {
                                    name: "Targeting criteria matrix",
                                    icon: BarChart3,
                                    value: "The exact filters you plug into Meta, Google, and your CRM tomorrow. No translation needed.",
                                    accent: "emerald" as const,
                                },
                            ].map((item, i) => {
                                const colorMap = {
                                    violet: {
                                        iconBg: "bg-violet-50 dark:bg-violet-500/10",
                                        iconColor: "text-violet-600 dark:text-violet-400",
                                        borderHover: "hover:border-violet-200 dark:hover:border-violet-500/25",
                                        shadowHover: "hover:shadow-violet-500/[0.06]",
                                        glow: "bg-violet-500/[0.03] dark:bg-violet-500/[0.02]",
                                    },
                                    blue: {
                                        iconBg: "bg-blue-50 dark:bg-blue-500/10",
                                        iconColor: "text-blue-600 dark:text-blue-400",
                                        borderHover: "hover:border-blue-200 dark:hover:border-blue-500/25",
                                        shadowHover: "hover:shadow-blue-500/[0.06]",
                                        glow: "bg-blue-500/[0.03] dark:bg-blue-500/[0.02]",
                                    },
                                    emerald: {
                                        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
                                        iconColor: "text-emerald-600 dark:text-emerald-400",
                                        borderHover: "hover:border-emerald-200 dark:hover:border-emerald-500/25",
                                        shadowHover: "hover:shadow-emerald-500/[0.06]",
                                        glow: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]",
                                    },
                                };
                                const c = colorMap[item.accent];
                                return (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.45, delay: i * 0.1 }}
                                        className={cn(
                                            "group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] p-5 lg:p-6",
                                            "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
                                            c.borderHover, c.shadowHover
                                        )}
                                    >
                                        {/* Ambient glow on hover */}
                                        <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", c.glow)} />

                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className={cn(
                                                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                                                "transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm",
                                                c.iconBg
                                            )}>
                                                <item.icon className={cn("w-[18px] h-[18px]", c.iconColor)} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[15px] font-semibold text-foreground leading-snug mb-1.5">
                                                    {item.name}
                                                </p>
                                                <p className="text-[13px] text-muted-foreground leading-relaxed">
                                                    {item.value}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* ── Supporting deliverables ── */}
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Also included</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[
                                    { name: "Channel preference analysis", icon: TrendingUp },
                                    { name: "Executive summary deck", icon: Sparkles },
                                    { name: "Raw interview transcripts", icon: MessageSquareQuote },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
                                        className="group flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-[#27272A]/60 bg-gray-50/50 dark:bg-zinc-900/30 transition-all duration-200 hover:bg-white dark:hover:bg-[#18181B] hover:border-gray-200 dark:hover:border-[#27272A] hover:shadow-sm"
                                    >
                                        <div className="shrink-0 w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50 flex items-center justify-center group-hover:border-[#FF8A4C]/20 transition-all duration-200">
                                            <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#FF8A4C] transition-colors duration-200" />
                                        </div>
                                        <p className="text-[12.5px] font-medium text-foreground leading-snug">
                                            {item.name}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ──── EXECUTION STRATEGY ──── */}
                    <section>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[20px] font-bold text-foreground font-display tracking-tight">How we&apos;d run this for you</h3>
                                <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1 ml-4" />
                            </div>
                            <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl">
                                Two paths to the same clarity. Pick the one that matches your <span className="text-foreground font-semibold">timeline and budget</span> — we handle the rest.
                            </p>
                        </motion.div>

                        {/* ── Interactive Option Card ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="relative rounded-3xl border border-gray-200/60 dark:border-[#27272A] bg-white dark:bg-[#18181B]/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)]"
                        >
                            {/* Ambient glow — shifts color with active tab */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className={cn(
                                    "absolute -top-16 -right-16 w-48 h-48 blur-[60px] rounded-full transition-all duration-700",
                                    executionMode === "scrappy"
                                        ? "bg-amber-400/[0.04] dark:bg-amber-400/[0.025] opacity-100"
                                        : "bg-amber-400/[0.04] dark:bg-amber-400/[0.025] opacity-0"
                                )} />
                                <div className={cn(
                                    "absolute -top-16 -right-16 w-48 h-48 blur-[60px] rounded-full transition-all duration-700",
                                    executionMode === "gold"
                                        ? "bg-violet-400/[0.04] dark:bg-violet-400/[0.025] opacity-100"
                                        : "bg-violet-400/[0.04] dark:bg-violet-400/[0.025] opacity-0"
                                )} />
                                <div className={cn(
                                    "absolute -bottom-12 -left-12 w-36 h-36 blur-[50px] rounded-full transition-all duration-700",
                                    executionMode === "scrappy"
                                        ? "bg-amber-300/[0.03] dark:bg-amber-300/[0.015] opacity-100"
                                        : "bg-violet-300/[0.03] dark:bg-violet-300/[0.015] opacity-100"
                                )} />
                            </div>

                            {/* ── Tab Header ── */}
                            <div className="relative flex border-b border-gray-100 dark:border-[#27272A]">
                                {([
                                    { key: "scrappy" as const, icon: Zap, label: "Lean Sprint", sub: "Validate fast, iterate later" },
                                    { key: "gold" as const, icon: Shield, label: "Full Study", sub: "Comprehensive & definitive" },
                                ]).map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setExecutionMode(tab.key)}
                                        className={cn(
                                            "flex-1 relative py-4 px-5 text-left transition-all duration-200",
                                            executionMode === tab.key
                                                ? "bg-white dark:bg-[#18181B]"
                                                : "bg-gray-50/50 dark:bg-zinc-900/30 hover:bg-gray-50 dark:hover:bg-zinc-900/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                                                executionMode === tab.key
                                                    ? tab.key === "scrappy"
                                                        ? "bg-amber-50 dark:bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.08)]"
                                                        : "bg-violet-50 dark:bg-violet-500/10 shadow-[0_0_10px_rgba(139,92,246,0.08)]"
                                                    : "bg-gray-100 dark:bg-zinc-800"
                                            )}>
                                                <tab.icon className={cn(
                                                    "w-4 h-4 transition-colors duration-200",
                                                    executionMode === tab.key
                                                        ? tab.key === "scrappy" ? "text-amber-500" : "text-violet-500"
                                                        : "text-muted-foreground"
                                                )} />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-[13px] font-bold leading-tight transition-colors duration-200",
                                                    executionMode === tab.key ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {tab.label}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{tab.sub}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {/* Separator line between tabs */}
                                <div className="absolute top-3 bottom-3 left-1/2 w-px bg-gray-100 dark:bg-[#27272A]" />
                                {/* Sliding active indicator */}
                                <motion.div
                                    layout
                                    className={cn(
                                        "absolute bottom-0 h-[2px] w-1/2 transition-colors duration-300",
                                        executionMode === "scrappy"
                                            ? "left-0 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-300"
                                            : "left-1/2 bg-gradient-to-r from-violet-400 via-violet-400 to-violet-300"
                                    )}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            </div>

                            {/* ── Tab Content ── */}
                            <AnimatePresence mode="wait">
                                {(() => {
                                    const opt = executionMode === "scrappy" ? {
                                        bestFor: "Teams that need direction now — not perfection",
                                        desc: study.scrappy_version,
                                        bullets: [
                                            "Working ICP doc you can act on in 2 weeks",
                                            "Structured JTBD interview framework",
                                            "Quick team alignment on who your customer is",
                                        ],
                                        metrics: [
                                            { icon: Clock, label: "Timeline", value: "2 weeks" },
                                            { icon: Users, label: "Sample", value: "5–8 interviews" },
                                            { icon: DollarSign, label: "Budget", value: `${formatINR(study.costs[0]?.min_inr)}–${formatINR(study.costs[1]?.max_inr).replace("₹", "")}` },
                                        ],
                                        badgeCls: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/15 text-amber-600 dark:text-amber-400",
                                        checkCls: "bg-amber-50 dark:bg-amber-500/10",
                                        checkIcon: "text-amber-500",
                                        metricCls: "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100/60 dark:border-amber-500/10",
                                        metricIcon: "text-amber-500",
                                    } : {
                                        bestFor: "Brands ready to make a definitive bet on their ICP",
                                        desc: study.gold_standard_version,
                                        bullets: [
                                            "Full persona cards with segment sizing",
                                            "Channel preference mapping per segment",
                                            "Data-backed targeting recommendations",
                                        ],
                                        metrics: [
                                            { icon: Clock, label: "Timeline", value: "6–8 weeks" },
                                            { icon: Users, label: "Sample", value: "500+ quant · 15–20 qual" },
                                            { icon: DollarSign, label: "Budget", value: `${formatINR(study.costs[2]?.min_inr)}–${formatINR(study.costs[3]?.max_inr).replace("₹", "")}` },
                                        ],
                                        badgeCls: "bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/15 text-violet-600 dark:text-violet-400",
                                        checkCls: "bg-violet-50 dark:bg-violet-500/10",
                                        checkIcon: "text-violet-500",
                                        metricCls: "bg-violet-50/50 dark:bg-violet-500/5 border-violet-100/60 dark:border-violet-500/10",
                                        metricIcon: "text-violet-500",
                                    };
                                    return (
                                        <motion.div
                                            key={executionMode}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.25 }}
                                            className="relative p-6 lg:p-7"
                                        >
                                            {/* Best-for badge */}
                                            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold mb-5", opt.badgeCls)}>
                                                Best for: {opt.bestFor}
                                            </div>

                                            {/* Description */}
                                            <p className="text-[14px] text-foreground leading-relaxed mb-5 max-w-xl">
                                                {opt.desc}
                                            </p>

                                            {/* What's included */}
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">What you get</p>
                                            <div className="space-y-2.5 mb-6">
                                                {opt.bullets.map((item, i) => (
                                                    <motion.div
                                                        key={item}
                                                        initial={{ opacity: 0, x: -6 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: 0.05 + i * 0.06 }}
                                                        className="flex items-start gap-2.5 group/check"
                                                    >
                                                        <div className={cn("shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-200 group-hover/check:scale-110", opt.checkCls)}>
                                                            <CheckCircle2 className={cn("w-3 h-3", opt.checkIcon)} />
                                                        </div>
                                                        <p className="text-[13px] text-foreground font-medium leading-snug">{item}</p>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Metrics strip */}
                                            <div className="grid grid-cols-3 gap-2.5">
                                                {opt.metrics.map((m, i) => (
                                                    <motion.div
                                                        key={m.label}
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                                                        className={cn("flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 hover:shadow-sm", opt.metricCls)}
                                                    >
                                                        <m.icon className={cn("w-3.5 h-3.5 mb-1.5", opt.metricIcon)} />
                                                        <span className="text-[12px] font-bold text-foreground leading-tight">{m.value}</span>
                                                        <span className="text-[10px] text-muted-foreground mt-0.5">{m.label}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </motion.div>

                        {/* ── Sarah's recommendation ── */}
                        <div className="mt-7">
                            <ChatBubble avatar={<VoiceWaveformAvatar />} name="Sarah" delay={0.2}>
                                <p className="text-[14px] text-foreground font-medium leading-relaxed">
                                    &ldquo;Most teams start with the Lean Sprint to validate their hypothesis, then layer on the Full Study once they&apos;re ready to commit. Either way — you walk out with something actionable.&rdquo;
                                </p>
                            </ChatBubble>
                        </div>
                    </section>

                    {/* ──── EXECUTION GUARDRAILS ──── */}
                    <section>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[20px] font-bold text-foreground font-display tracking-tight">What makes or breaks this study</h3>
                                <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1 ml-4" />
                            </div>
                            <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl">
                                We&apos;ve run hundreds of these. Here&apos;s what separates studies that <span className="text-foreground font-semibold">change how teams operate</span> from ones that gather dust.
                            </p>
                        </motion.div>

                        {/* ── Do / Don't split cards ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ── Success Criteria (DO) ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: 0.05 }}
                                className="group relative rounded-2xl border border-emerald-200/60 dark:border-emerald-500/15 bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-500/[0.03] dark:via-[#18181B] dark:to-[#18181B] p-5 lg:p-6 overflow-hidden shadow-[0_4px_24px_-4px_rgba(16,185,129,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(16,185,129,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-6px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_12px_36px_-6px_rgba(16,185,129,0.1)] hover:border-emerald-300/60 dark:hover:border-emerald-500/25"
                            >
                                {/* Ambient glow */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.025] blur-[50px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                        <h4 className="text-[13px] font-bold text-foreground">Get these right</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {study.success_criteria.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -6 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                                                className="flex items-start gap-2.5 group/item"
                                            >
                                                <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-transform duration-200 group-hover/item:scale-110">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                <p className="text-[13px] text-foreground leading-snug">{item}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── Common Mistakes (AVOID) ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: 0.15 }}
                                className="group relative rounded-2xl border border-red-200/40 dark:border-red-500/10 bg-gradient-to-br from-red-50/30 via-white to-white dark:from-red-500/[0.02] dark:via-[#18181B] dark:to-[#18181B] p-5 lg:p-6 overflow-hidden shadow-[0_4px_24px_-4px_rgba(239,68,68,0.07)] dark:shadow-[0_4px_24px_-4px_rgba(239,68,68,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-6px_rgba(239,68,68,0.1)] dark:hover:shadow-[0_12px_36px_-6px_rgba(239,68,68,0.08)] hover:border-red-200/60 dark:hover:border-red-500/15"
                            >
                                {/* Ambient glow */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/[0.03] dark:bg-red-500/[0.02] blur-[50px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 dark:text-red-400/80" />
                                        </div>
                                        <h4 className="text-[13px] font-bold text-foreground">Traps to avoid</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {study.common_mistakes.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -6 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                                                className="flex items-start gap-2.5 group/item"
                                            >
                                                <div className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-300 dark:bg-red-400/50" />
                                                <p className="text-[13px] text-muted-foreground leading-snug">{item}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Field Intelligence Card ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="mt-6 relative rounded-2xl border border-violet-200/40 dark:border-violet-500/12 bg-gradient-to-br from-violet-50/30 via-white to-white dark:from-violet-500/[0.02] dark:via-[#18181B] dark:to-[#18181B] p-5 lg:p-6 overflow-hidden shadow-[0_4px_24px_-4px_rgba(139,92,246,0.07)] dark:shadow-[0_4px_24px_-4px_rgba(139,92,246,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-6px_rgba(139,92,246,0.1)] dark:hover:shadow-[0_12px_36px_-6px_rgba(139,92,246,0.08)]"
                        >
                            {/* Ambient glow */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/[0.03] dark:bg-violet-500/[0.02] blur-[50px] rounded-full pointer-events-none" />

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                                        <MapPin className="w-3.5 h-3.5 text-violet-500" />
                                    </div>
                                    <h4 className="text-[13px] font-bold text-foreground">India field intelligence</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/15">From our ops team</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mb-4 ml-[38px]">Real learnings from running consumer studies across Indian markets</p>

                                {/* Structured tips */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-0">
                                    {[
                                        { icon: Building2, label: "Tier 2/3 recruitment", tip: "Online panels underrepresent these markets — field partners are essential. Expect 15–20% no-show rates and over-recruit." },
                                        { icon: Languages, label: "Language nuances", tip: "Hindi belt respondents prefer Hindi-first guides. South India needs separate Tamil/Kannada/Telugu recruitment streams." },
                                        { icon: Users, label: "Interview format", tip: "Phone interviews consistently outperform video in non-metro markets. Bilingual moderators significantly improve data quality." },
                                        { icon: Clock, label: "Timing matters", tip: "Festival seasons (Diwali, Navratri) significantly impact respondent availability — plan field windows accordingly." },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, y: 8 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/30 border border-violet-100/40 dark:border-violet-500/8 group/tip transition-all duration-200 hover:bg-white dark:hover:bg-zinc-900/50 hover:border-violet-200/60 dark:hover:border-violet-500/15 hover:shadow-sm"
                                        >
                                            <div className="shrink-0 mt-0.5 w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center transition-transform duration-200 group-hover/tip:scale-110">
                                                <item.icon className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold text-foreground leading-tight mb-0.5">{item.label}</p>
                                                <p className="text-[11.5px] text-muted-foreground leading-snug">{item.tip}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Alex's voice (conversational closer) ── */}
                        <div className="mt-7">
                            <ChatBubble avatarUrl={AVATAR_OPS} name="Alex • Ops" isSecondary delay={0.2} className="ml-auto w-full md:w-[85%]">
                                <p className="text-[14px] text-foreground font-medium leading-relaxed">
                                    &ldquo;We handle the local execution complexity — recruitment, moderation, translations. You focus on the decisions the data unlocks.&rdquo;
                                </p>
                            </ChatBubble>
                        </div>
                    </section>

                </div>

                {/* ════════════ RIGHT COLUMN: CONVERSATIONAL GUIDE ════════════ */}
                <div className="hidden lg:block relative z-10 w-full">
                    <div className="sticky top-28">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
                            }}
                            className="rounded-[28px] border border-gray-200/60 dark:border-[#27272A] bg-white/90 dark:bg-[#18181B]/95 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] hover:border-[#FF8A4C]/20"
                        >
                            {/* ── Ambient living glow ── */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <motion.div
                                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-20 -right-20 w-60 h-60 bg-[#FF8A4C]/[0.04] dark:bg-[#FF8A4C]/[0.03] blur-3xl rounded-full"
                                />
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                    className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/[0.03] dark:bg-blue-400/[0.02] blur-3xl rounded-full"
                                />
                            </div>

                            {/* ── 1. Avatar + Conversational Intro ── */}
                            <motion.div variants={panelFadeUp} className="relative z-10 px-6 pt-6">
                                <div className="flex items-start gap-3">
                                    <AnimatedAvatar />
                                    <div className="min-w-0 pt-0.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                            Sarah · Lead Researcher
                                        </p>
                                        <p className="text-[15px] font-medium text-foreground leading-[1.5] tracking-[-0.01em]">
                                            &ldquo;This study helps you define exactly who your ideal customer is — so every rupee goes further.&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── 2. At a Glance ── */}
                            <motion.div variants={panelFadeUp} className="relative z-10 px-6 mt-5">
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { icon: Clock, value: study.time_to_insight, label: "Timeline", iconColor: "text-blue-500" },
                                        { icon: FlaskConical, value: study.method, label: "Method", iconColor: "text-violet-500" },
                                        { icon: DollarSign, value: costRange, label: "Budget", iconColor: "text-emerald-500" },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-100/80 dark:border-zinc-700/30 transition-all duration-200 hover:bg-white dark:hover:bg-zinc-800/70 hover:shadow-sm hover:border-gray-200 dark:hover:border-zinc-600/50"
                                        >
                                            <item.icon className={cn("w-3.5 h-3.5 mb-1.5", item.iconColor)} />
                                            <span className="text-[12px] font-bold text-foreground leading-tight">{item.value}</span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* ── Divider ── */}
                            <motion.div variants={panelFadeUp} className="px-6 mt-5">
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent" />
                            </motion.div>

                            {/* ── 3. How It Works — Mini Timeline ── */}
                            <motion.div variants={panelFadeUp} className="relative z-10 px-6 mt-5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3.5">
                                    How it works
                                </p>
                                <div className="space-y-0">
                                    {timelineSteps.map((step, i) => (
                                        <div key={step.title} className="flex items-start gap-3 group">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-[#FF8A4C]/10 text-[#FF8A4C] group-hover:bg-[#FF8A4C]/20 group-hover:shadow-[0_0_12px_rgba(255,138,76,0.15)] transition-all duration-300">
                                                    {i + 1}
                                                </div>
                                                {i < timelineSteps.length - 1 && (
                                                    <div className="w-px h-8 bg-gradient-to-b from-[#FF8A4C]/20 to-gray-200 dark:to-zinc-700 my-1.5" />
                                                )}
                                            </div>
                                            <div className="pb-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-foreground leading-tight">{step.title}</p>
                                                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* ── 4. Best For ── */}
                            <motion.div variants={panelFadeUp} className="relative z-10 px-6 mt-5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                                    Best for
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {bestForTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#FF8A4C]/5 dark:bg-[#FF8A4C]/10 text-foreground border border-[#FF8A4C]/20 dark:border-[#FF8A4C]/15 transition-all duration-200 hover:border-[#FF8A4C]/40 hover:bg-[#FF8A4C]/10 hover:shadow-[0_0_8px_rgba(255,138,76,0.08)]"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>

                            {/* ── 5. Why Teams Run This ── */}
                            <motion.div variants={panelFadeUp} className="relative z-10 px-6 mt-5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                    Why teams run this
                                </p>
                                <ul className="space-y-2.5">
                                    {whyBullets.map((bullet, i) => (
                                        <li key={i} className="flex items-start gap-2.5 group/bullet">
                                            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover/bullet:bg-emerald-100 dark:group-hover/bullet:bg-emerald-500/20 transition-colors duration-200">
                                                <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                                            </div>
                                            <span className="text-[12.5px] text-foreground leading-snug">{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* ── 6. Conversational Bridge + CTA ── */}
                            <motion.div variants={panelFadeUp} className="relative z-10 px-6 mt-6 mb-6">
                                <p className="text-[13px] text-muted-foreground text-center mb-4 italic">
                                    &ldquo;Ready when you are — let&apos;s get clarity.&rdquo;
                                </p>

                                <div className="relative">
                                    {/* Breathing glow behind CTA */}
                                    <motion.div
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-xl bg-[#FF8A4C]/20 blur-xl pointer-events-none"
                                    />
                                    <Button
                                        className={cn(
                                            "relative w-full h-12 text-[15px] font-semibold rounded-xl",
                                            "bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white",
                                            "shadow-[0_0_20px_rgba(255,138,76,0.3)]",
                                            "active:scale-[0.98] transition-all duration-200 border-none",
                                            "overflow-hidden group"
                                        )}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {study.is_locked ? (
                                                <><Lock className="w-4 h-4" /> Unlock My Study Plan</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" /> See My Study Plan</>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                    </Button>
                                </div>

                                <p className="text-center text-[11px] text-muted-foreground mt-3">
                                    Takes 2 minutes · No commitment yet
                                </p>

                                {/* ROI trust signal */}
                                <div className="flex items-center justify-center mt-2.5">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100/80 dark:border-emerald-500/15">
                                        <Gauge className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{study.roi_score} ROI</span>
                                        <span className="text-[10px] text-emerald-600/60 dark:text-emerald-400/50">·</span>
                                        <span className="text-[10px] text-emerald-600/60 dark:text-emerald-400/50">High impact</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

            </div>

            {/* ═══════════════════════════════════════════════
                STICKY FOOTER ACTION BAR (Mobile & Desktop)
            ═══════════════════════════════════════════════ */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-2xl border-t border-gray-200/50 dark:border-[#27272A]/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_30px_rgba(0,0,0,0.4)]"
            >
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="hidden sm:flex relative">
                            <img src={AVATAR_LEAD} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#27272A] object-cover bg-[#F0EBE6] dark:bg-[#1C1C1E]" alt="Sarah" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#18181B] rounded-full animate-pulse" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-bold text-foreground truncate max-w-[200px] md:max-w-[350px]">
                                Ready to find your ideal customers?
                            </span>
                            <span className="text-[12px] font-medium text-muted-foreground hidden sm:block">
                                Unlock the full {study.name} study framework.
                            </span>
                        </div>
                    </div>
                    <CTAButton />
                </div>
            </motion.div>

        </div>
    );
}
