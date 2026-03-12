"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Lock,
    Play,
    FlaskConical,
    Sparkles,
    ArrowRight,
    Search,
    X,
    Flame,
    Zap,
    BarChart3,
    Brain,
    Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    type Study,
    type Industry,
    type SmartSignal,
    industryMeta,
    familyGradient,
    urgencyStyleLight,
    urgencyLabel,
    VoiceWaveformAvatar,
    deriveDuration,
    deriveEffort,
    deriveImpact,
    derivePopularity,
    formatDuration,
    goalFilterOptions,
    timeFilterOptions,
    computeSmartSignal,
} from "./study-explorer-shared";

// ── Impact meter ──────────────────────────────

function ImpactMeter({ score, max = 5 }: { score: number; max?: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Impact
            </span>
            <div className="flex gap-[2px]">
                {Array.from({ length: max }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-1 h-2.5 rounded-[1px]",
                            i < score
                                ? "bg-[#FF8A4C]/80"
                                : "bg-gray-200 dark:bg-zinc-700/50"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Smart signal chip ─────────────────────────

const signalConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    popular: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/15" },
    fast: { icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/15" },
    strategic: { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/15" },
    foundational: { icon: Brain, color: "text-violet-500", bg: "bg-violet-500/10 dark:bg-violet-500/15" },
};

function SmartSignalChip({ signal }: { signal: SmartSignal }) {
    const c = signalConfig[signal.type] || signalConfig.popular;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", c.bg, c.color)}>
            <Icon className="w-3 h-3" />
            {signal.label}
        </span>
    );
}

// ── Study card (redesigned) ───────────────────

function StudyCard({
    study,
    onClick,
    index = 0,
    isLead = false,
    smartSignal,
    showRunCount = false,
}: {
    study: Study;
    onClick: () => void;
    index?: number;
    isLead?: boolean;
    smartSignal?: SmartSignal | null;
    showRunCount?: boolean;
}) {
    const gradient = familyGradient[study.family] || "from-zinc-500 via-zinc-700 to-slate-900";
    const duration = deriveDuration(study);
    const impact = deriveImpact(study);
    const popularity = derivePopularity(study);
    const isTopPick = study.urgency === "P0";
    const isRecommended = study.urgency === "P1";
    const outcomeText = study.outcome_statement || study.description;

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-shrink-0 flex flex-col text-left rounded-2xl",
                isLead ? "w-[300px]" : "w-[272px]",
                "bg-white dark:bg-[#18181B]/80 backdrop-blur-sm",
                "border",
                isLead
                    ? "border-[#FF8A4C]/15 dark:border-[#FF8A4C]/10"
                    : isTopPick
                        ? "border-[#FF8A4C]/10 dark:border-[#FF8A4C]/8"
                        : "border-gray-200/80 dark:border-[#27272A]",
                study.is_locked && "opacity-[0.88]",
                "shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.25)]",
                "hover:shadow-[0_20px_48px_-12px_rgba(255,138,76,0.15)] dark:hover:shadow-[0_20px_48px_-12px_rgba(255,138,76,0.1)]",
                "hover:border-[#FF8A4C]/25 dark:hover:border-[#FF8A4C]/15",
                "hover:-translate-y-1.5",
                "transition-all duration-300 cursor-pointer group relative overflow-hidden"
            )}
        >
            {/* Accent strip */}
            <div className={cn("w-full bg-gradient-to-r", gradient, isLead ? "h-1" : "h-[3px]", study.is_locked && "opacity-70")} />

            {/* Hover warm tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A4C]/[0.015] via-transparent to-[#FF8A4C]/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Ambient glow on hover */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#FF8A4C]/[0.06] dark:bg-[#FF8A4C]/[0.04] blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Lock icon */}
            {study.is_locked && (
                <div className="absolute top-4 right-4 z-10">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
            )}

            <div className="relative z-10 p-4 pt-3.5 flex flex-col flex-1">
                {/* Layer 1: Method+Duration | Priority */}
                <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                        {study.method} · {formatDuration(duration)}
                    </span>
                    {!study.is_locked && isTopPick && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF8A4C]/10 text-[#FF8A4C] border border-[#FF8A4C]/15 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A4C] animate-pulse" />
                            Top Pick
                        </span>
                    )}
                    {!study.is_locked && isRecommended && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400 shrink-0">
                            Recommended
                        </span>
                    )}
                </div>

                {/* Study name */}
                <h4 className={cn(
                    "text-[14px] font-semibold text-foreground leading-snug mb-2 line-clamp-2 min-h-[40px]",
                    "group-hover:text-[#FF8A4C] transition-colors duration-200",
                    study.is_locked && "text-foreground/80"
                )}>
                    {study.name}
                </h4>

                {/* Layer 2: Outcome statement */}
                <p className={cn(
                    "text-[12px] text-muted-foreground mb-3 line-clamp-3 min-h-[48px] leading-relaxed",
                    study.is_locked && "text-muted-foreground/70"
                )}>
                    {outcomeText}
                </p>

                {/* When to use — hover reveal */}
                {study.when_to_use && (
                    <div className="max-h-0 group-hover:max-h-[60px] overflow-hidden transition-all duration-300 ease-out mb-0 group-hover:mb-3">
                        <div className="border-l-2 border-[#FF8A4C]/20 pl-2.5 py-0.5">
                            <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2">
                                {study.when_to_use}
                            </p>
                        </div>
                    </div>
                )}

                {/* Smart signal + Impact */}
                <div className="flex items-center justify-between mb-3 mt-auto">
                    {smartSignal ? (
                        <SmartSignalChip signal={smartSignal} />
                    ) : showRunCount ? (
                        <span className="text-[10px] font-medium text-muted-foreground/60">
                            Run by {popularity} teams
                        </span>
                    ) : (
                        <div />
                    )}
                    <ImpactMeter score={impact} />
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-gray-100 via-gray-200/60 to-transparent dark:from-zinc-800 dark:via-zinc-700/40 dark:to-transparent group-hover:from-[#FF8A4C]/10 group-hover:via-[#FF8A4C]/5 group-hover:to-transparent transition-colors duration-500" />

                {/* Layer 3: Team tag + CTA */}
                <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-medium text-muted-foreground/50 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {study.departments[0] || "Research"}
                    </span>
                    <div className={cn(
                        "flex items-center gap-1.5 text-[11px] font-semibold text-[#FF8A4C]",
                        "opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0",
                        "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                    )}>
                        <span>{study.is_locked ? "Unlock" : "Explore"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        </button>
    );
}

// ── Generic study rail ────────────────────────

function StudyRail({
    title,
    subtitle,
    emoji,
    count,
    items,
    onStudyClick,
    sectionIndex = 0,
    allStudies = [],
    industry = "",
    popularIds,
    showRunCount = false,
    showLeadCard = false,
    nudge,
    id,
}: {
    title: string;
    subtitle?: string;
    emoji?: React.ReactNode;
    count: number;
    items: Study[];
    onStudyClick: (study: Study) => void;
    sectionIndex?: number;
    allStudies?: Study[];
    industry?: string;
    popularIds?: Set<string>;
    showRunCount?: boolean;
    showLeadCard?: boolean;
    nudge?: string;
    id?: string;
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
        el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }, []);

    return (
        <section id={id}>
            {/* Section header */}
            <div className="mb-1 px-1">
                <div className="flex items-center gap-2 mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                        {emoji && <span className="shrink-0">{emoji}</span>}
                        <h2 className="text-[17px] font-semibold text-foreground tracking-tight font-display">
                            {title}
                        </h2>
                    </div>
                    <span className="text-[12px] text-muted-foreground shrink-0">
                        {count} {count === 1 ? "study" : "studies"}
                    </span>
                    <div className="h-px bg-gradient-to-r from-gray-200 dark:from-zinc-700 to-transparent flex-1" />
                </div>
                {subtitle && (
                    <p className="text-[12px] text-muted-foreground/70 mb-1 pl-0.5">{subtitle}</p>
                )}
            </div>

            {/* Nudge */}
            {nudge && (
                <p className="text-[11.5px] text-muted-foreground/60 italic mb-2 px-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#FF8A4C]/50 shrink-0" />
                    {nudge}
                </p>
            )}

            <div className="relative group/rail mt-2">
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
                    className="flex gap-3.5 overflow-x-auto scrollbar-show-on-hover pb-2 scroll-smooth"
                >
                    {items.map((s, i) => (
                        <StudyCard
                            key={s.id}
                            study={s}
                            onClick={() => onStudyClick(s)}
                            index={i}
                            isLead={showLeadCard && i === 0}
                            smartSignal={popularIds ? computeSmartSignal(s, industry, popularIds) : null}
                            showRunCount={showRunCount}
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
                    <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#FAFAFA] dark:from-[#0C0C0E] to-transparent pointer-events-none" />
                )}
            </div>
        </section>
    );
}

// ── Featured study card (redesigned) ──────────

function FeaturedStudyCard({
    study,
    industry,
    onClick,
}: {
    study: Study;
    industry: string;
    onClick: () => void;
}) {
    const impact = deriveImpact(study);
    const duration = deriveDuration(study);
    const popularity = derivePopularity(study);
    const outcomeText = study.outcome_statement || study.description;

    const rationale = useMemo(() => {
        const f = study.family.toLowerCase();
        if (f.includes("foundational") || f.includes("market"))
            return `Most ${industry} teams run this first. It creates the foundation for pricing, acquisition, and retention studies — without it, you're guessing.`;
        if (f.includes("customer") || f.includes("audience"))
            return `Understanding your customer is the highest-leverage research you can do. Every decision downstream gets sharper when you know who you're building for.`;
        if (f.includes("pricing") || f.includes("monetization"))
            return `Pricing drives unit economics. This study tells you what customers will actually pay — most teams see ROI within the first pricing change.`;
        if (f.includes("acquisition") || f.includes("growth"))
            return `Growth without insight is expensive. This study shows you where to invest — and where to stop wasting budget.`;
        if (f.includes("retention") || f.includes("churn"))
            return `At scale, retention compounds faster than acquisition. This study finds the real reasons customers leave — before the numbers get worse.`;
        return `This is the most impactful study for ${industry} teams right now. It addresses the biggest open question most teams face at this stage.`;
    }, [study.family, industry]);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-2xl p-6 relative overflow-hidden",
                "border border-[#FF8A4C]/15 dark:border-[#FF8A4C]/10",
                "bg-gradient-to-r from-white via-white to-gray-50",
                "dark:from-[#18181B] dark:via-[#18181B] dark:to-[#1C1C1F]",
                "shadow-[0_4px_24px_-4px_rgba(255,138,76,0.1)] dark:shadow-[0_4px_24px_-4px_rgba(255,138,76,0.08)]",
                "hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.15)] dark:hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.12)]",
                "hover:border-[#FF8A4C]/25 hover:-translate-y-0.5",
                "transition-all duration-300 group"
            )}
        >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FF8A4C]/[0.04] dark:bg-[#FF8A4C]/[0.025] blur-[60px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex gap-6">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-[#FF8A4C]/10 text-[#FF8A4C] border-[#FF8A4C]/20 text-[10px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 mr-1" /> Recommended for {industry}
                        </Badge>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            urgencyStyleLight[study.urgency]
                        )}>
                            {urgencyLabel[study.urgency]}
                        </span>
                    </div>

                    <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-3 group-hover:text-[#FF8A4C] transition-colors duration-200 font-display">
                        {study.name}
                    </h2>

                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 max-w-lg">
                        {outcomeText}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap mb-4">
                        <Badge variant="secondary" className="text-[11px] font-medium bg-gray-100 dark:bg-[#27272A] text-muted-foreground border-0">
                            {study.method} · {formatDuration(duration)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground/60">
                            Run by {popularity} teams
                        </span>
                        <ImpactMeter score={impact} />
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 text-[13px] font-semibold text-[#FF8A4C]",
                        "opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                    )}>
                        {study.is_locked ? (
                            <><Lock className="w-3.5 h-3.5" /><span>Unlock Study</span></>
                        ) : (
                            <><Play className="w-3.5 h-3.5" /><span>Explore Study</span></>
                        )}
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>

                {/* Rationale panel */}
                <div className="hidden lg:flex w-[260px] shrink-0">
                    <div className={cn(
                        "rounded-xl p-4 w-full",
                        "bg-gradient-to-br from-[#FF8A4C]/[0.04] to-transparent",
                        "border border-[#FF8A4C]/10 dark:border-[#FF8A4C]/8"
                    )}>
                        <div className="flex items-center gap-2 mb-2.5">
                            <VoiceWaveformAvatar size="sm" />
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Why this?
                            </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                            {rationale}
                        </p>
                    </div>
                </div>
            </div>
        </button>
    );
}

// ── Department nav pills ──────────────────────

function DepartmentNavPills({
    sections,
    onSelect,
}: {
    sections: { department: string; items: Study[] }[];
    onSelect: (department: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {sections.map(({ department, items }) => (
                <button
                    key={department}
                    onClick={() => onSelect(department)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-[12px] font-medium",
                        "border border-gray-200 dark:border-[#27272A]",
                        "bg-white dark:bg-[#18181B]",
                        "hover:bg-[#FF8A4C]/[0.04] hover:border-[#FF8A4C]/20 hover:text-[#FF8A4C]",
                        "transition-all duration-200 text-muted-foreground"
                    )}
                >
                    {department}
                    <span className="ml-1.5 text-muted-foreground/40">{items.length}</span>
                </button>
            ))}
        </div>
    );
}

// ── Filter dropdown ───────────────────────────

function FilterDropdown({
    label,
    options,
    value,
    onChange,
    multi = false,
    multiValue,
    onMultiChange,
}: {
    label: string;
    options: { value: string; label: string; descriptor?: string }[];
    value?: string | null;
    onChange?: (v: string | null) => void;
    multi?: boolean;
    multiValue?: string[];
    onMultiChange?: (v: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const hasValue = multi ? (multiValue && multiValue.length > 0) : !!value;
    const displayLabel = multi
        ? (multiValue && multiValue.length > 0 ? `${label}: ${multiValue.length}` : label)
        : (value ? `${label}: ${options.find(o => o.value === value)?.label || value}` : label);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium",
                    "border transition-all duration-200",
                    hasValue
                        ? "border-[#FF8A4C]/20 bg-[#FF8A4C]/[0.04] text-foreground"
                        : "border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-muted-foreground",
                    "hover:border-[#FF8A4C]/25 hover:bg-[#FF8A4C]/[0.04]"
                )}
            >
                {hasValue && <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A4C]" />}
                <span className="max-w-[160px] truncate">{displayLabel}</span>
                <ChevronDown className={cn("w-3 h-3 text-muted-foreground/60 transition-transform duration-200", open && "rotate-180")} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className={cn(
                        "absolute left-0 top-full mt-1.5 z-50 w-[240px] rounded-xl",
                        "bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A]",
                        "shadow-xl shadow-gray-200/50 dark:shadow-black/50",
                        "py-1.5 max-h-[320px] overflow-y-auto scrollbar-subtle"
                    )}>
                        {options.map((opt) => {
                            const isSelected = multi
                                ? multiValue?.includes(opt.value)
                                : value === opt.value;

                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        if (multi && onMultiChange && multiValue) {
                                            const next = isSelected
                                                ? multiValue.filter(v => v !== opt.value)
                                                : [...multiValue, opt.value];
                                            onMultiChange(next);
                                        } else if (onChange) {
                                            onChange(isSelected ? null : opt.value);
                                            setOpen(false);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center justify-between w-full px-3 py-2 text-left text-[13px]",
                                        "hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors duration-150",
                                        isSelected ? "font-semibold text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-4 h-4 flex items-center justify-center shrink-0 border",
                                            multi ? "rounded" : "rounded-full",
                                            isSelected
                                                ? "bg-[#FF8A4C] border-[#FF8A4C]"
                                                : "border-gray-300 dark:border-zinc-600"
                                        )}>
                                            {isSelected && (
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                    {opt.descriptor && (
                                        <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{opt.descriptor}</span>
                                    )}
                                </button>
                            );
                        })}
                        {hasValue && (
                            <>
                                <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1" />
                                <button
                                    onClick={() => {
                                        if (multi && onMultiChange) onMultiChange([]);
                                        else if (onChange) onChange(null);
                                        setOpen(false);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors"
                                >
                                    Clear selection
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Industry switcher dropdown ────────────────

function IndustrySwitcher({
    selected,
    onSelect,
    industries,
}: {
    selected: Industry;
    onSelect: (industry: Industry) => void;
    industries: string[];
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
                        {industries.map((industry) => {
                            const m = industryMeta[industry];
                            const I = m.icon;
                            return (
                                <button
                                    key={industry}
                                    onClick={() => { onSelect(industry); setOpen(false); }}
                                    className={cn(
                                        "flex items-center gap-2.5 w-full px-3 py-2 text-left text-[13px]",
                                        "hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors duration-150",
                                        selected === industry ? "font-semibold text-foreground" : "text-muted-foreground"
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

// ── First-time orientation strip ──────────────

function FirstTimeOrientation({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div className="mx-6 mb-4">
            <div className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-2xl",
                "bg-gradient-to-r from-[#FF8A4C]/[0.03] via-white to-white",
                "dark:from-[#FF8A4C]/[0.04] dark:via-[#18181B]/80 dark:to-[#18181B]/80",
                "border border-[#FF8A4C]/10 dark:border-[#FF8A4C]/8",
                "backdrop-blur-sm"
            )}>
                <VoiceWaveformAvatar size="sm" />
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground mb-1.5">Quick orientation</p>
                    <ul className="space-y-1">
                        <li className="text-[12px] text-muted-foreground">
                            <span className="text-muted-foreground/40 mr-1.5">·</span>
                            The study at the top is our #1 pick for your industry
                        </li>
                        <li className="text-[12px] text-muted-foreground">
                            <span className="text-muted-foreground/40 mr-1.5">·</span>
                            Studies are grouped by team — scroll to find yours
                        </li>
                        <li className="text-[12px] text-muted-foreground">
                            <span className="text-muted-foreground/40 mr-1.5">·</span>
                            Use the search bar to jump to a specific topic
                        </li>
                    </ul>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

// ── Bottom decision support CTA ───────────────

const decisionGoals = [
    { id: "validate", label: "Validate a new idea", families: ["Concept / proposition validation", "Need / pain-point discovery"] },
    { id: "churn", label: "Understand why users churn", families: ["Retention / loyalty / churn research", "Customer / audience understanding"] },
    { id: "pricing", label: "Optimize pricing", families: ["Pricing / monetization research"] },
    { id: "market", label: "Enter a new market", families: ["Foundational market understanding"] },
    { id: "conversion", label: "Improve conversion", families: ["Acquisition / growth research", "Product / UX research"] },
];

function BottomDecisionSupport({
    industry,
    allStudies,
    onStudyClick,
}: {
    industry: string;
    allStudies: Study[];
    onStudyClick: (study: Study) => void;
}) {
    const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

    const recommendations = useMemo(() => {
        if (!selectedGoal) return [];
        const goal = decisionGoals.find(g => g.id === selectedGoal);
        if (!goal) return [];

        const urgencyOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
        return allStudies
            .filter(s => goal.families.some(f => s.family.toLowerCase().includes(f.toLowerCase().split(" / ")[0])))
            .sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9))
            .slice(0, 2);
    }, [selectedGoal, allStudies]);

    const goalLabel = decisionGoals.find(g => g.id === selectedGoal)?.label;

    return (
        <div className="px-6 pb-10">
            <div className={cn(
                "rounded-2xl p-5 max-w-xl",
                "bg-white/60 dark:bg-[#18181B]/60",
                "border border-gray-100 dark:border-[#27272A]",
                "backdrop-blur-sm shadow-sm"
            )}>
                    {!selectedGoal ? (
                        <div>
                            <div className="flex items-center gap-2.5 mb-4">
                                <VoiceWaveformAvatar size="sm" />
                                <p className="text-[14px] font-semibold text-foreground">Still deciding?</p>
                            </div>
                            <p className="text-[12px] text-muted-foreground mb-3">
                                Tell me your situation and I&apos;ll narrow it down:
                            </p>
                            <div className="space-y-1.5">
                                {decisionGoals.map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => setSelectedGoal(goal.id)}
                                        className={cn(
                                            "w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-medium",
                                            "border border-gray-100 dark:border-[#27272A]",
                                            "bg-white dark:bg-[#18181B]",
                                            "hover:border-[#FF8A4C]/20 hover:bg-[#FF8A4C]/[0.03] hover:text-[#FF8A4C]",
                                            "transition-all duration-200 text-muted-foreground"
                                        )}
                                    >
                                        {goal.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2.5 mb-3">
                                <VoiceWaveformAvatar size="sm" />
                                <p className="text-[13px] text-muted-foreground">
                                    For <span className="text-foreground font-semibold">{goalLabel?.toLowerCase()}</span>, start here:
                                </p>
                            </div>

                            {recommendations.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {recommendations.map((study, i) => (
                                        <button
                                            key={study.id}
                                            onClick={() => onStudyClick(study)}
                                            className={cn(
                                                "w-full text-left p-3.5 rounded-xl",
                                                "border border-gray-100 dark:border-[#27272A]",
                                                "bg-white dark:bg-[#18181B]",
                                                "hover:border-[#FF8A4C]/20 hover:shadow-sm",
                                                "transition-all duration-200 group/rec"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-medium text-muted-foreground/50 mb-1">
                                                        {i + 1}. {study.method} · {formatDuration(deriveDuration(study))}
                                                    </p>
                                                    <p className="text-[13px] font-semibold text-foreground group-hover/rec:text-[#FF8A4C] transition-colors">
                                                        {study.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                                                        {study.outcome_statement || study.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover/rec:text-[#FF8A4C] shrink-0 mt-2 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[12px] text-muted-foreground/60 mb-4 italic">
                                    No exact matches for this goal in {industry}. Try browsing the catalog above.
                                </p>
                            )}

                            <button
                                onClick={() => setSelectedGoal(null)}
                                className="text-[11px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                                ← Pick again
                            </button>
                        </div>
                    )}
                {/* end goal selection */}
            </div>
        </div>
    );
}

// ── Main browse page ──────────────────────────

export function StudyBrowsePage({
    selectedIndustry,
    onBack,
    onSwitchIndustry,
    industries,
    departmentSections,
    featuredStudy,
    totalStudies,
    openStudy,
    allStudies = [],
}: {
    selectedIndustry: string;
    onBack: () => void;
    onSwitchIndustry: (industry: Industry) => void;
    industries: string[];
    departmentSections: { department: string; items: Study[] }[];
    featuredStudy: Study | null;
    totalStudies: number;
    openStudy: (study: Study) => void;
    allStudies?: Study[];
}) {
    // ── Filter state ──
    const [searchQuery, setSearchQuery] = useState("");
    const [goalFilter, setGoalFilter] = useState<string | null>(null);
    const [methodFilter, setMethodFilter] = useState<string[]>([]);
    const [timeFilter, setTimeFilter] = useState<string | null>(null);
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [showOrientation, setShowOrientation] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Check first-time visit
    useEffect(() => {
        try {
            const key = "study-browser-visited";
            if (!localStorage.getItem(key)) {
                setShowOrientation(true);
                localStorage.setItem(key, "1");
            }
        } catch { /* SSR or privacy mode */ }
    }, []);

    const dismissOrientation = useCallback(() => setShowOrientation(false), []);

    // ── Available methods from data ──
    const availableMethods = useMemo(() => {
        const methods = new Map<string, number>();
        allStudies.forEach(s => {
            methods.set(s.method, (methods.get(s.method) || 0) + 1);
        });
        return Array.from(methods.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([method, count]) => ({ value: method, label: method, descriptor: `${count}` }));
    }, [allStudies]);

    // ── Popular study IDs (top 20%) ──
    const popularIds = useMemo(() => {
        const sorted = [...allStudies].sort((a, b) => derivePopularity(b) - derivePopularity(a));
        const top = Math.max(1, Math.ceil(sorted.length * 0.2));
        return new Set(sorted.slice(0, top).map(s => s.id));
    }, [allStudies]);

    // ── Recommendation engines ──
    const recommendations = useMemo(() => {
        const used = new Set<string>();
        if (featuredStudy) used.add(featuredStudy.id);

        const urgencyOrder = (s: Study) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[s.urgency] ?? 9);

        const popular = [...allStudies]
            .filter(s => !used.has(s.id))
            .sort((a, b) => derivePopularity(b) - derivePopularity(a))
            .slice(0, 8);
        popular.forEach(s => used.add(s.id));

        const quick = allStudies
            .filter(s => !used.has(s.id) && deriveDuration(s) <= 2.5 && deriveEffort(s) === "light")
            .sort((a, b) => urgencyOrder(a) - urgencyOrder(b))
            .slice(0, 8);
        quick.forEach(s => used.add(s.id));

        const strategic = allStudies
            .filter(s => {
                if (used.has(s.id)) return false;
                const m = s.method.toLowerCase();
                return deriveImpact(s) >= 4 && (m.includes("interview") || m.includes("ethnograph") || m.includes("focus group"));
            })
            .sort((a, b) => deriveImpact(b) - deriveImpact(a))
            .slice(0, 8);
        strategic.forEach(s => used.add(s.id));

        const foundational = allStudies
            .filter(s => {
                if (used.has(s.id)) return false;
                const f = s.family.toLowerCase();
                return f.includes("foundational") || f.includes("customer") || f.includes("need");
            })
            .sort((a, b) => urgencyOrder(a) - urgencyOrder(b))
            .slice(0, 6);

        return { popular, quick, strategic, foundational };
    }, [allStudies, featuredStudy]);

    // ── Filtering ──
    const isFiltering = !!(searchQuery || goalFilter || methodFilter.length || timeFilter);

    const filteredStudies = useMemo(() => {
        if (!isFiltering) return allStudies;
        let result = allStudies;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.method.toLowerCase().includes(q) ||
                s.departments.some(d => d.toLowerCase().includes(q))
            );
        }

        if (goalFilter) {
            const opt = goalFilterOptions.find(o => o.value === goalFilter);
            if (opt) {
                result = result.filter(s =>
                    opt.families.some(f => s.family.toLowerCase().includes(f.toLowerCase().split(" / ")[0]))
                );
            }
        }

        if (methodFilter.length) {
            result = result.filter(s => methodFilter.includes(s.method));
        }

        if (timeFilter) {
            const opt = timeFilterOptions.find(o => o.value === timeFilter);
            if (opt) {
                result = result.filter(s => deriveDuration(s) <= opt.maxWeeks);
            }
        }

        return result;
    }, [allStudies, searchQuery, goalFilter, methodFilter, timeFilter, isFiltering]);

    const filteredDepartmentSections = useMemo(() => {
        if (!isFiltering) return departmentSections;
        const filteredIds = new Set(filteredStudies.map(s => s.id));
        return departmentSections
            .map(section => ({
                ...section,
                items: section.items.filter(s => filteredIds.has(s.id)),
            }))
            .filter(section => section.items.length > 0);
    }, [departmentSections, filteredStudies, isFiltering]);

    // ── Presets ──
    const applyPreset = useCallback((presetId: string) => {
        setSearchQuery("");
        setMethodFilter([]);
        if (activePreset === presetId) {
            setActivePreset(null);
            setGoalFilter(null);
            setTimeFilter(null);
            return;
        }
        setActivePreset(presetId);
        switch (presetId) {
            case "quick-wins": setGoalFilter(null); setTimeFilter("under-2"); break;
            case "foundational": setGoalFilter("understand-market"); setTimeFilter(null); break;
            case "pre-launch": setGoalFilter("validate-idea"); setTimeFilter(null); break;
            case "pricing": setGoalFilter("optimize-pricing"); setTimeFilter(null); break;
        }
    }, [activePreset]);

    const clearAllFilters = useCallback(() => {
        setSearchQuery("");
        setGoalFilter(null);
        setMethodFilter([]);
        setTimeFilter(null);
        setActivePreset(null);
    }, []);

    const scrollToDepartment = useCallback((dept: string) => {
        const el = document.getElementById(`dept-${dept.replace(/\s+/g, "-")}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    // ── Search dropdown ──
    const searchResults = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const q = searchQuery.toLowerCase();
        return allStudies
            .filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
            .slice(0, 5);
    }, [searchQuery, allStudies]);

    const [searchFocused, setSearchFocused] = useState(false);

    // ── Department nudges ──
    const deptNudges: Record<string, string> = {
        Marketing: "If acquisition costs are rising, start with the first two studies in this row.",
        Product: "Pre-launch? The first study here validates before you build.",
        Growth: "These studies pay for themselves — they find the leaks in your funnel.",
    };

    const featuredMatchesFilter = useMemo(() => {
        if (!isFiltering || !featuredStudy) return true;
        return filteredStudies.some(s => s.id === featuredStudy.id);
    }, [isFiltering, featuredStudy, filteredStudies]);

    const hasRecommendationRails =
        recommendations.popular.length >= 3 ||
        recommendations.quick.length >= 2 ||
        recommendations.strategic.length >= 2 ||
        recommendations.foundational.length >= 2;

    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════

    return (
        <>
            {/* Ambient spotlights */}
            <div className="absolute -top-20 right-1/4 w-72 h-72 bg-[#FF8A4C]/[0.025] dark:bg-[#FF8A4C]/[0.015] blur-[100px] rounded-full pointer-events-none" />

            {/* ── Sticky top bar ── */}
            <div className="sticky top-0 z-30 bg-[#FAFAFA]/80 dark:bg-[#0C0C0E]/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-[#27272A]/50">
                <div className="flex items-center justify-between px-6 py-3 w-full">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800" />
                        <span className="text-[12px] font-medium text-muted-foreground">All Industries</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <div className="flex items-center gap-2">
                            {(() => {
                                const meta = industryMeta[selectedIndustry];
                                const Icon = meta.icon;
                                return <Icon className={cn("w-4 h-4", meta.color)} />;
                            })()}
                            <span className="text-[13px] font-semibold text-foreground">{selectedIndustry}</span>
                        </div>
                        <span className="text-[12px] text-muted-foreground ml-1">
                            {totalStudies} studies
                        </span>
                    </div>
                    <IndustrySwitcher
                        selected={selectedIndustry}
                        onSelect={onSwitchIndustry}
                        industries={industries}
                    />
                </div>
            </div>

            {/* ── First-time orientation ── */}
            {showOrientation && (
                <div className="pt-4">
                    <FirstTimeOrientation onDismiss={dismissOrientation} />
                </div>
            )}

            {/* ── Featured study card ── */}
            {featuredStudy && (
                <div className={cn(
                    "px-6 pt-5 pb-2 w-full transition-opacity duration-300",
                    !featuredMatchesFilter && isFiltering && "opacity-40"
                )}>
                    <FeaturedStudyCard
                        study={featuredStudy}
                        industry={selectedIndustry}
                        onClick={() => openStudy(featuredStudy)}
                    />
                    {!featuredMatchesFilter && isFiltering && (
                        <p className="text-[11px] text-muted-foreground/50 mt-2 px-1 italic">
                            Featured study doesn&apos;t match your current filters
                        </p>
                    )}
                </div>
            )}

            {/* ── Department nav pills ── */}
            {departmentSections.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                    <DepartmentNavPills
                        sections={departmentSections}
                        onSelect={scrollToDepartment}
                    />
                </div>
            )}

            {/* ── Filter bar ── */}
            <div className="px-6 pt-3 pb-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] w-[200px]",
                            "transition-all duration-200",
                            searchFocused
                                ? "border-[#FF8A4C]/30 bg-white dark:bg-[#18181B] ring-1 ring-[#FF8A4C]/10"
                                : "border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#18181B]"
                        )}>
                            <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search studies..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setActivePreset(null); }}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground/40 text-[12px]"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="shrink-0">
                                    <X className="w-3 h-3 text-muted-foreground/40 hover:text-foreground transition-colors" />
                                </button>
                            )}
                        </div>

                        {/* Search dropdown */}
                        {searchFocused && searchResults.length > 0 && (
                            <div className={cn(
                                "absolute left-0 top-full mt-1.5 z-50 w-[320px] rounded-xl",
                                "bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A]",
                                "shadow-xl py-1.5"
                            )}>
                                <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                                    Results ({searchResults.length})
                                </p>
                                {searchResults.map((s) => (
                                    <button
                                        key={s.id}
                                        onMouseDown={() => { openStudy(s); setSearchQuery(""); }}
                                        className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-medium text-foreground truncate">{s.name}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {s.method} · {formatDuration(deriveDuration(s))} · {s.departments[0]}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 ml-2" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Goal filter */}
                    <FilterDropdown
                        label="Goal"
                        options={goalFilterOptions.map(o => ({ value: o.value, label: o.label }))}
                        value={goalFilter}
                        onChange={(v) => { setGoalFilter(v); setActivePreset(null); }}
                    />

                    {/* Method filter */}
                    <FilterDropdown
                        label="Method"
                        options={availableMethods}
                        multi
                        multiValue={methodFilter}
                        onMultiChange={(v) => { setMethodFilter(v); setActivePreset(null); }}
                    />

                    {/* Time filter */}
                    <FilterDropdown
                        label="Time"
                        options={timeFilterOptions.map(o => ({ value: o.value, label: o.label, descriptor: o.descriptor }))}
                        value={timeFilter}
                        onChange={(v) => { setTimeFilter(v); setActivePreset(null); }}
                    />
                </div>

                {/* Smart presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mr-1">Quick:</span>
                    {[
                        { id: "quick-wins", label: "Quick wins", icon: Zap },
                        { id: "foundational", label: "Foundational", icon: Brain },
                        { id: "pre-launch", label: "Pre-launch", icon: FlaskConical },
                        { id: "pricing", label: "Pricing & revenue", icon: BarChart3 },
                    ].map((preset) => {
                        const Icon = preset.icon;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => applyPreset(preset.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium",
                                    "border transition-all duration-200 active:scale-[0.98]",
                                    activePreset === preset.id
                                        ? "border-[#FF8A4C]/25 bg-[#FF8A4C]/[0.06] text-[#FF8A4C]"
                                        : "border-gray-200/80 dark:border-[#27272A] text-muted-foreground hover:border-[#FF8A4C]/15 hover:text-[#FF8A4C]/80"
                                )}
                            >
                                <Icon className="w-3 h-3" />
                                {preset.label}
                            </button>
                        );
                    })}
                </div>

                {/* Active filter pills */}
                {isFiltering && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {goalFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF8A4C]/[0.06] text-[#FF8A4C] text-[11px] font-medium">
                                {goalFilterOptions.find(o => o.value === goalFilter)?.label}
                                <button onClick={() => { setGoalFilter(null); setActivePreset(null); }}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {methodFilter.map(m => (
                            <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF8A4C]/[0.06] text-[#FF8A4C] text-[11px] font-medium">
                                {m}
                                <button onClick={() => { setMethodFilter(prev => prev.filter(v => v !== m)); setActivePreset(null); }}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {timeFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF8A4C]/[0.06] text-[#FF8A4C] text-[11px] font-medium">
                                {timeFilterOptions.find(o => o.value === timeFilter)?.label}
                                <button onClick={() => { setTimeFilter(null); setActivePreset(null); }}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        <span className="text-[11px] text-muted-foreground/50">
                            Showing {filteredStudies.length} of {totalStudies}
                        </span>
                        <button
                            onClick={clearAllFilters}
                            className="text-[11px] text-muted-foreground/40 hover:text-foreground transition-colors ml-1"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* ── Recommendation rails (hidden when filtering) ── */}
            {!isFiltering && (
                <div className="px-6 py-4 w-full space-y-8">
                    {recommendations.popular.length >= 3 && (
                        <StudyRail
                            title={`Most used by ${selectedIndustry} teams`}
                            subtitle="What other teams in your space are running right now."
                            emoji={<Flame className="w-4 h-4 text-orange-500" />}
                            count={recommendations.popular.length}
                            items={recommendations.popular}
                            onStudyClick={openStudy}
                            sectionIndex={0}
                            allStudies={allStudies}
                            industry={selectedIndustry}
                            popularIds={popularIds}
                            showRunCount
                        />
                    )}

                    {recommendations.quick.length >= 2 && (
                        <StudyRail
                            title="Quick insights"
                            subtitle="Results in under 2 weeks. Low effort. High signal."
                            emoji={<Zap className="w-4 h-4 text-emerald-500" />}
                            count={recommendations.quick.length}
                            items={recommendations.quick}
                            onStudyClick={openStudy}
                            sectionIndex={1}
                            allStudies={allStudies}
                            industry={selectedIndustry}
                            popularIds={popularIds}
                        />
                    )}

                    {recommendations.strategic.length >= 2 && (
                        <StudyRail
                            title="Strategic research"
                            subtitle="Deeper studies that shape product direction for quarters."
                            emoji={<BarChart3 className="w-4 h-4 text-blue-500" />}
                            count={recommendations.strategic.length}
                            items={recommendations.strategic}
                            onStudyClick={openStudy}
                            sectionIndex={2}
                            allStudies={allStudies}
                            industry={selectedIndustry}
                            popularIds={popularIds}
                        />
                    )}

                    {recommendations.foundational.length >= 2 && (
                        <StudyRail
                            title="Foundational research"
                            subtitle="Start here if you're building your research practice from scratch."
                            emoji={<Brain className="w-4 h-4 text-violet-500" />}
                            count={recommendations.foundational.length}
                            items={recommendations.foundational}
                            onStudyClick={openStudy}
                            sectionIndex={3}
                            allStudies={allStudies}
                            industry={selectedIndustry}
                            popularIds={popularIds}
                        />
                    )}
                </div>
            )}

            {/* ── Separator ── */}
            {!isFiltering && hasRecommendationRails && departmentSections.length > 0 && (
                <div className="px-6 pt-2 pb-4">
                    <div className="h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-zinc-700 dark:via-zinc-700 dark:to-transparent" />
                    <p className="text-[13px] font-medium text-muted-foreground/50 mt-3">
                        All studies by department
                    </p>
                    <p className="text-[11px] text-muted-foreground/35 mt-0.5">
                        The complete catalog, organized by team.
                    </p>
                </div>
            )}

            {/* ── Department rails ── */}
            <div className="px-6 py-2 w-full space-y-10">
                {(isFiltering ? filteredDepartmentSections : departmentSections).map(({ department, items }, i) => (
                    <StudyRail
                        key={department}
                        id={`dept-${department.replace(/\s+/g, "-")}`}
                        title={department}
                        subtitle={
                            isFiltering
                                ? `${items.length} of ${departmentSections.find(s => s.department === department)?.items.length || items.length} studies match`
                                : undefined
                        }
                        count={items.length}
                        items={items}
                        onStudyClick={openStudy}
                        sectionIndex={i}
                        allStudies={allStudies}
                        industry={selectedIndustry}
                        popularIds={popularIds}
                        showLeadCard={!isFiltering}
                        nudge={!isFiltering ? deptNudges[department] : undefined}
                    />
                ))}
            </div>

            {/* ── Empty state ── */}
            {isFiltering && filteredDepartmentSections.length === 0 && (
                <div className="px-6 py-12">
                    <div className={cn(
                        "flex items-start gap-3 px-5 py-4 rounded-2xl max-w-md mx-auto",
                        "bg-white/60 dark:bg-[#18181B]/60",
                        "border border-gray-100 dark:border-[#27272A]"
                    )}>
                        <VoiceWaveformAvatar size="sm" />
                        <div>
                            <p className="text-[13px] font-medium text-foreground mb-1.5">
                                No studies match those filters.
                            </p>
                            <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                                Try broadening your search or removing a filter to see more options.
                            </p>
                            <button
                                onClick={clearAllFilters}
                                className="text-[12px] font-semibold text-[#FF8A4C] hover:text-[#FF8A4C]/80 transition-colors"
                            >
                                Clear all filters →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bottom decision support ── */}
            {(isFiltering ? filteredDepartmentSections : departmentSections).length > 0 && (
                <BottomDecisionSupport
                    industry={selectedIndustry}
                    allStudies={allStudies}
                    onStudyClick={openStudy}
                />
            )}
        </>
    );
}
