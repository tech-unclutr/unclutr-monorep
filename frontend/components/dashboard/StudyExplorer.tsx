"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
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
    Bookmark,
    Play,
    Plus,
    FlaskConical,
    Clock,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    studies,
    INDUSTRIES,
    DEPARTMENTS,
    type Study,
    type Industry,
} from "@/data/studies";

// ── Industry icon + color mapping ──────────────

const industryMeta: Record<
    Industry,
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
};

// ── Family → poster gradient ───────────────────

const familyGradient: Record<string, string> = {
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

const familyIcon: Record<string, React.ElementType> = {
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

const urgencyStyle: Record<string, string> = {
    P0: "bg-red-500/20 text-red-300 border-red-500/30",
    P1: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    P2: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    P3: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const urgencyStyleLight: Record<string, string> = {
    P0: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    P1: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    P2: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    P3: "bg-gray-100 text-gray-600 dark:bg-zinc-500/20 dark:text-zinc-400",
};

const urgencyLabel: Record<string, string> = {
    P0: "High Priority",
    P1: "Recommended",
    P2: "Standard",
    P3: "Optional",
};

// ── Poster card ────────────────────────────────

function PosterCard({
    study,
    onClick,
}: {
    study: Study;
    onClick: () => void;
}) {
    const gradient = familyGradient[study.family] || "from-zinc-500 via-zinc-700 to-slate-900";
    const FamilyIcon = familyIcon[study.family] || FlaskConical;

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-shrink-0 w-[200px] aspect-[2/3] rounded-lg overflow-hidden relative",
                "hover:scale-105 hover:z-10 hover:shadow-2xl hover:shadow-black/40",
                "transition-all duration-300 cursor-pointer group",
                "ring-1 ring-black/10 dark:ring-white/10"
            )}
        >
            {/* Gradient poster background */}
            <div className={cn("absolute inset-0 bg-gradient-to-b", gradient)} />

            {/* Decorative icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
                <FamilyIcon className="w-24 h-24 text-white" />
            </div>

            {/* Urgency badge - top right */}
            {study.urgency === "P0" && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF8A4C] text-white">
                        Top Pick
                    </span>
                </div>
            )}

            {/* Bottom gradient + text overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20 pb-4 px-4">
                {/* Family tag */}
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50 mb-1.5 truncate">
                    {study.family}
                </p>

                {/* Study name */}
                <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-3">
                    {study.name}
                </h4>

                {/* Method + urgency */}
                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white/80">
                        {study.method}
                    </span>
                    <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                        urgencyStyle[study.urgency]
                    )}>
                        {study.urgency}
                    </span>
                </div>
            </div>
        </button>
    );
}

// ── Info-style study card (browse page) ────────

function StudyCard({
    study,
    onClick,
}: {
    study: Study;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-shrink-0 w-[300px] text-left rounded-xl border border-gray-200 dark:border-[#27272A]",
                "bg-white dark:bg-[#18181B]/80 p-5",
                "hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20",
                "hover:border-gray-300 dark:hover:border-[#3F3F46]",
                "hover:-translate-y-0.5",
                "transition-all duration-200 cursor-pointer group"
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[65%]">
                    {study.family}
                </span>
                <span
                    className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        urgencyStyleLight[study.urgency] || urgencyStyleLight.P2
                    )}
                >
                    {urgencyLabel[study.urgency] || study.urgency}
                </span>
            </div>

            <h4 className="text-[14px] font-semibold text-foreground leading-snug mb-2 line-clamp-2 min-h-[40px] group-hover:text-[#FF8A4C] transition-colors duration-200">
                {study.name}
            </h4>

            <p className="text-[12px] text-muted-foreground mb-4 line-clamp-2 min-h-[34px] leading-relaxed">
                {study.description}
            </p>

            <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium bg-gray-100 dark:bg-[#27272A] text-muted-foreground border-0">
                    {study.method}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#FF8A4C] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Lock className="w-3 h-3" />
                    <span>Unlock</span>
                </div>
            </div>
        </button>
    );
}

// ── Info-card horizontal rail (browse page) ────

function StudyRailCards({
    title,
    count,
    items,
    onStudyClick,
}: {
    title: string;
    count: number;
    items: Study[];
    onStudyClick: (study: Study) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    const scroll = useCallback((dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
    }, []);

    return (
        <section>
            <div className="flex items-baseline gap-2.5 mb-4 px-1">
                <h2 className="text-[16px] font-bold text-foreground tracking-tight">
                    {title}
                </h2>
                <span className="text-[12px] text-muted-foreground">
                    {count} {count === 1 ? "study" : "studies"}
                </span>
            </div>

            <div className="relative group/rail">
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className={cn(
                            "absolute -left-3 top-1/2 -translate-y-1/2 z-10",
                            "w-9 h-9 rounded-full",
                            "bg-white dark:bg-[#27272A] shadow-lg border border-gray-200 dark:border-[#3F3F46]",
                            "flex items-center justify-center",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <ChevronLeft className="w-4 h-4 text-foreground" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    onScroll={updateArrows}
                    className="flex gap-4 overflow-x-auto scrollbar-show-on-hover pb-2 scroll-smooth"
                >
                    {items.map((s) => (
                        <StudyCard
                            key={s.id}
                            study={s}
                            onClick={() => onStudyClick(s)}
                        />
                    ))}
                </div>

                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className={cn(
                            "absolute -right-3 top-1/2 -translate-y-1/2 z-10",
                            "w-9 h-9 rounded-full",
                            "bg-white dark:bg-[#27272A] shadow-lg border border-gray-200 dark:border-[#3F3F46]",
                            "flex items-center justify-center",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <ChevronRight className="w-4 h-4 text-foreground" />
                    </button>
                )}

                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#F8FAFC] dark:from-[#0C0C0E] to-transparent pointer-events-none" />
                )}
            </div>
        </section>
    );
}

// ── Poster-style horizontal rail (industry selection) ──

function StudyRail({
    title,
    items,
    onStudyClick,
}: {
    title: string;
    items: Study[];
    onStudyClick: (study: Study) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    const scroll = useCallback((dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
    }, []);

    return (
        <section className="relative">
            <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-3 px-1">
                {title}
            </h2>

            <div className="relative group/rail -mx-1">
                {/* Left arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className={cn(
                            "absolute left-0 top-0 bottom-0 z-10 w-12",
                            "bg-gradient-to-r from-[#F8FAFC] dark:from-[#0C0C0E] to-transparent",
                            "flex items-center justify-start pl-1",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg flex items-center justify-center border border-gray-200 dark:border-[#3F3F46]">
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                        </div>
                    </button>
                )}

                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    onScroll={updateArrows}
                    className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 scroll-smooth px-1"
                >
                    {items.map((s) => (
                        <PosterCard
                            key={s.id}
                            study={s}
                            onClick={() => onStudyClick(s)}
                        />
                    ))}
                </div>

                {/* Right arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className={cn(
                            "absolute right-0 top-0 bottom-0 z-10 w-12",
                            "bg-gradient-to-l from-[#F8FAFC] dark:from-[#0C0C0E] to-transparent",
                            "flex items-center justify-end pr-1",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg flex items-center justify-center border border-gray-200 dark:border-[#3F3F46]">
                            <ChevronRight className="w-4 h-4 text-foreground" />
                        </div>
                    </button>
                )}
            </div>
        </section>
    );
}

// ── Study detail dialog ────────────────────────

function StudyDetailDialog({
    study,
    open,
    onClose,
}: {
    study: Study | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!study) return null;

    const gradient = familyGradient[study.family] || "from-zinc-500 via-zinc-700 to-slate-900";
    const FamilyIcon = familyIcon[study.family] || FlaskConical;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[560px] rounded-xl p-0 overflow-hidden bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A]">
                {/* Visual header with poster gradient */}
                <div className={cn("relative h-36 bg-gradient-to-br", gradient)}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.1]">
                        <FamilyIcon className="w-20 h-20 text-white" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white dark:from-[#18181B] to-transparent h-16" />
                    <div className="absolute top-4 left-5 flex items-center gap-2">
                        <Badge className="bg-white/20 backdrop-blur text-white border-white/20 text-[10px] font-bold uppercase tracking-wider">
                            {study.family}
                        </Badge>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            urgencyStyle[study.urgency]
                        )}>
                            {urgencyLabel[study.urgency]}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 -mt-4 relative z-10">
                    <DialogHeader>
                        <DialogTitle className="text-[22px] font-bold text-foreground leading-tight tracking-tight font-display">
                            {study.name}
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                            {study.description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Why it matters */}
                    <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Why this matters
                        </h4>
                        <p className="text-[13px] text-foreground leading-relaxed">
                            This study helps your team make confident, data-backed decisions instead of relying on assumptions. It directly addresses gaps that can impact growth, retention, or product-market fit.
                        </p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-gray-50 dark:bg-[#27272A]/50 px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Method</p>
                            <span className="text-[13px] font-medium text-foreground">{study.method}</span>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-[#27272A]/50 px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Priority</p>
                            <span className="text-[13px] font-medium text-foreground">{urgencyLabel[study.urgency]}</span>
                        </div>
                    </div>

                    {/* Departments */}
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Relevant teams
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {study.departments.map((dept) => (
                                <Badge
                                    key={dept}
                                    variant="outline"
                                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border-gray-200 dark:border-[#3F3F46] text-muted-foreground"
                                >
                                    {dept}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer CTAs */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#27272A] flex items-center gap-3">
                    <Button className="flex-1 bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white shadow-[0_0_15px_rgba(255,138,76,0.25)] h-11 text-[14px] font-semibold">
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock Study
                    </Button>
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                        <Bookmark className="w-4 h-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Industry switcher dropdown ─────────────────

function IndustrySwitcher({
    selected,
    onSelect,
}: {
    selected: Industry;
    onSelect: (industry: Industry) => void;
}) {
    const [open, setOpen] = useState(false);
    const meta = industryMeta[selected];
    const Icon = meta.icon;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#27272A]",
                    "bg-white dark:bg-[#18181B] hover:bg-gray-50 dark:hover:bg-[#27272A]",
                    "transition-colors duration-200 text-sm font-medium text-foreground"
                )}
            >
                <Icon className={cn("w-4 h-4", meta.color)} />
                <span className="max-w-[140px] truncate">{selected}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className={cn(
                        "absolute right-0 top-full mt-2 z-50 w-[220px] rounded-xl",
                        "bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A]",
                        "shadow-xl shadow-gray-200/50 dark:shadow-black/50",
                        "py-1.5 max-h-[320px] overflow-y-auto scrollbar-subtle"
                    )}>
                        {INDUSTRIES.map((industry) => {
                            const m = industryMeta[industry];
                            const I = m.icon;
                            return (
                                <button
                                    key={industry}
                                    onClick={() => { onSelect(industry); setOpen(false); }}
                                    className={cn(
                                        "flex items-center gap-2.5 w-full px-3 py-2 text-left text-[13px]",
                                        "hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors duration-150",
                                        selected === industry
                                            ? "font-semibold text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <I className={cn("w-4 h-4", m.color)} />
                                    <span className="truncate">{industry}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Industry Netflix-style Rail ────────────────
function IndustryRail({
    title,
    items,
    selectedIndustry,
    onSelect,
    industryCounts,
}: {
    title: string;
    items: Industry[];
    selectedIndustry: Industry | null;
    onSelect: (industry: Industry) => void;
    industryCounts: Record<string, number>;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    const scroll = useCallback((dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
    }, []);

    return (
        <section className="min-w-0 px-8 overflow-hidden relative">
            <h2 className="text-[15px] font-bold text-foreground tracking-tight mb-3 px-1">
                {title}
            </h2>

            <div className="relative group/rail -mx-1">
                {/* Left arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className={cn(
                            "absolute left-0 top-0 bottom-0 z-10 w-12",
                            "bg-gradient-to-r from-[#F8FAFC] dark:from-[#0C0C0E] to-transparent",
                            "flex items-center justify-start pl-1",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg flex items-center justify-center border border-gray-200 dark:border-[#3F3F46]">
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                        </div>
                    </button>
                )}

                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    onScroll={updateArrows}
                    className="flex gap-3 overflow-x-auto scrollbar-show-on-hover pb-3 px-1 scroll-smooth"
                >
                    {items.map((industry) => {
                        const m = industryMeta[industry];
                        const I = m.icon;

                        return (
                            <button
                                key={industry}
                                onClick={() => onSelect(industry)}
                                className={cn(
                                    "flex-shrink-0 w-[180px] aspect-square rounded-xl overflow-visible",
                                    "flex flex-col",
                                    "hover:scale-[1.04] hover:z-10",
                                    "transition-all duration-300 cursor-pointer group"
                                )}
                            >
                                {/* Avatar / Icon area */}
                                <div className="flex-1 flex items-center justify-center pt-4 pb-1">
                                    {m.image ? (
                                        <div className="relative w-48 h-48 group-hover:-translate-y-0.2 transition-all duration-500 rounded-2xl border-2 border-[#FF8A4C]/40 overflow-hidden">
                                            <img
                                                src={`/images/study-explorer/${m.image}`}
                                                alt={industry}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "relative w-20 h-20 group-hover:-translate-y-1 transition-all duration-500"
                                        )}>
                                            {/* Outer frosted glass shell */}
                                            <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-white/[0.06] backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]" />

                                            {/* Inner gradient glow */}
                                            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-br from-blue-500/10 via-transparent to-blue-600/5 dark:from-blue-400/15 dark:to-blue-600/10" />

                                            {/* Icon */}
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <I className="w-8 h-8 text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                                            </div>

                                            {/* Subtle reflection line */}
                                            <div className="absolute top-2 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                        </div>
                                    )}
                                </div>

                                {/* Bottom text area */}
                                <div className="shrink-0 px-4 pb-4 pt-1">
                                    <h3 className="text-[14px] font-semibold text-foreground leading-snug text-center">
                                        {industry}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-1 text-center">
                                        {industryCounts[industry]} studies
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className={cn(
                            "absolute right-0 top-0 bottom-0 z-10 w-12",
                            "bg-gradient-to-l from-[#F8FAFC] dark:from-[#0C0C0E] to-transparent",
                            "flex items-center justify-end pr-1",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg flex items-center justify-center border border-gray-200 dark:border-[#3F3F46]">
                            <ChevronRight className="w-4 h-4 text-foreground" />
                        </div>
                    </button>
                )}
            </div>
        </section>
    );
}

// ── Main component ─────────────────────────────

export function StudyExplorer() {
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const openStudy = useCallback((study: Study) => {
        setSelectedStudy(study);
        setDialogOpen(true);
    }, []);

    // Group studies by department for the selected industry
    const departmentSections = useMemo(() => {
        if (!selectedIndustry) return [];

        const filtered = studies.filter((s) =>
            s.industries.includes(selectedIndustry)
        );

        const sortByUrgency = (a: Study, b: Study) => {
            const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
            return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
        };

        const grouped: { department: string; items: Study[] }[] = [];

        for (const dept of DEPARTMENTS) {
            const items = filtered
                .filter((s) => s.departments.includes(dept))
                .sort(sortByUrgency);
            if (items.length > 0) {
                grouped.push({ department: dept, items });
            }
        }

        return grouped;
    }, [selectedIndustry]);

    // Featured study: first P0 study
    const featuredStudy = useMemo(() => {
        if (!selectedIndustry) return null;
        return studies.find(
            (s) => s.industries.includes(selectedIndustry) && s.urgency === "P0"
        ) || null;
    }, [selectedIndustry]);

    const totalStudies = useMemo(() => {
        if (!selectedIndustry) return 0;
        return studies.filter((s) => s.industries.includes(selectedIndustry)).length;
    }, [selectedIndustry]);

    // Industry study counts (stable across renders)
    const industryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const ind of INDUSTRIES) {
            counts[ind] = studies.filter((s) => s.industries.includes(ind)).length;
        }
        return counts;
    }, []);

    // Split industries into rows for the shelf layout
    const industryRows = useMemo(() => {
        const row1 = INDUSTRIES.slice(0, 7);
        const row2 = INDUSTRIES.slice(7);
        return [
            { title: "Popular Industries", items: row1 },
            { title: "Explore More", items: row2 },
        ];
    }, []);

    // ── Industry selection ──

    if (!selectedIndustry) {
        return (
            <div className="h-screen flex flex-col overflow-hidden w-full">
                {/* ──── Hero area ──── */}
                <div className="px-8 pt-10 pb-6 shrink-0">
                    {/* Brand tag */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded bg-[#FF8A4C] flex items-center justify-center">
                            <img src="/brand/icon.svg" alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                            Research Catalog
                        </span>
                    </div>

                    <div>
                        {/* Title */}
                        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 leading-tight font-display">
                            Study Explorer
                        </h1>

                        {/* Description */}
                        <p className="text-[14px] text-muted-foreground max-w-md leading-relaxed mb-4">
                            Select your industry to browse curated research studies built for your teams.
                        </p>

                        {/* Quick stats */}
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[22px] font-bold text-foreground font-display">{studies.length}</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Studies</span>
                            </div>
                            <div className="w-px h-6 bg-gray-200 dark:bg-[#27272A]" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-[22px] font-bold text-foreground font-display">{INDUSTRIES.length}</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Industries</span>
                            </div>
                            <div className="w-px h-6 bg-gray-200 dark:bg-[#27272A]" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-[22px] font-bold text-foreground font-display">{DEPARTMENTS.length}</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Teams</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ──── Industry Rails ──── */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-subtle pb-8 space-y-6">
                    {industryRows.map((row) => (
                        <IndustryRail
                            key={row.title}
                            title={row.title}
                            items={row.items}
                            selectedIndustry={selectedIndustry}
                            onSelect={setSelectedIndustry}
                            industryCounts={industryCounts}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // ── Browse page (after industry selection) ──

    const meta = industryMeta[selectedIndustry];
    const Icon = meta.icon;

    return (
        <div className="min-h-screen">
            {/* Sticky top bar */}
            <div className="sticky top-0 z-30 bg-[#F8FAFC]/80 dark:bg-[#0C0C0E]/80 backdrop-blur-xl border-b border-gray-100 dark:border-[#27272A]">
                <div className="flex items-center justify-between px-6 py-3 max-w-[1400px]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedIndustry(null)}
                            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">All Industries</span>
                        </button>
                        <span className="text-gray-300 dark:text-[#3F3F46]">/</span>
                        <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", meta.color)} />
                            <span className="text-[13px] font-semibold text-foreground">{selectedIndustry}</span>
                        </div>
                        <span className="text-[12px] text-muted-foreground ml-1">
                            {totalStudies} studies
                        </span>
                    </div>
                    <IndustrySwitcher
                        selected={selectedIndustry}
                        onSelect={setSelectedIndustry}
                    />
                </div>
            </div>

            {/* Featured study card */}
            {featuredStudy && (
                <div className="px-6 pt-8 pb-2 max-w-[1400px]">
                    <button
                        onClick={() => openStudy(featuredStudy)}
                        className={cn(
                            "w-full text-left rounded-xl p-6 border border-gray-200 dark:border-[#27272A]",
                            "bg-gradient-to-r from-white via-white to-gray-50",
                            "dark:from-[#18181B] dark:via-[#18181B] dark:to-[#1C1C1F]",
                            "hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20",
                            "transition-all duration-200 group"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-[#FF8A4C]/10 text-[#FF8A4C] border-[#FF8A4C]/20 text-[10px] font-bold uppercase tracking-wider">
                                        Featured
                                    </Badge>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        urgencyStyleLight[featuredStudy.urgency]
                                    )}>
                                        {urgencyLabel[featuredStudy.urgency]}
                                    </span>
                                </div>
                                <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2 group-hover:text-[#FF8A4C] transition-colors duration-200 font-display">
                                    {featuredStudy.name}
                                </h2>
                                <p className="text-[14px] text-muted-foreground leading-relaxed mb-4 max-w-xl">
                                    {featuredStudy.description}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[11px] font-medium bg-gray-100 dark:bg-[#27272A] text-muted-foreground border-0">
                                        {featuredStudy.method}
                                    </Badge>
                                    <span className="text-[11px] text-muted-foreground">{featuredStudy.family}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[13px] font-semibold text-[#FF8A4C] opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2 shrink-0">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* Department rails */}
            <div className="px-6 py-6 max-w-[1400px] space-y-10">
                {departmentSections.map(({ department, items }) => (
                    <StudyRailCards
                        key={department}
                        title={department}
                        count={items.length}
                        items={items}
                        onStudyClick={openStudy}
                    />
                ))}
            </div>

            {/* Detail dialog */}
            <StudyDetailDialog
                study={selectedStudy}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </div>
    );
}
