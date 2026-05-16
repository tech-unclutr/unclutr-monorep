"use client";

import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    ContradictionItem,
    DebateBundle,
    EvidenceItem,
    InsightItem,
    SourceTheme,
} from "./mockData";

interface SynthesisInsightCardProps {
    insight: InsightItem;
    rank: number;
}

// Color stripes per severity bucket — only used for the left rail.
function severityRail(sev: number | null | undefined): string {
    if (sev == null) return "from-zinc-300/40 to-zinc-300/0 dark:from-zinc-700/40";
    if (sev >= 9) return "from-rose-500/80 to-rose-500/0";
    if (sev >= 7) return "from-amber-500/80 to-amber-500/0";
    if (sev >= 5) return "from-yellow-500/70 to-yellow-500/0";
    return "from-emerald-500/70 to-emerald-500/0";
}

function severityFill(sev: number | null | undefined): string {
    if (sev == null) return "bg-zinc-300 dark:bg-zinc-700";
    if (sev >= 9) return "bg-rose-500";
    if (sev >= 7) return "bg-amber-500";
    if (sev >= 5) return "bg-yellow-500";
    return "bg-emerald-500";
}

function priorityStyle(p?: string | null): string {
    switch (p) {
        case "P0":
            return "bg-rose-600 text-white";
        case "P1":
            return "bg-amber-500 text-white";
        case "P2":
            return "bg-yellow-500 text-white";
        case "P3":
            return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
        default:
            return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
    }
}

const AGENT_LABEL: Record<string, string> = {
    conservative: "Conservative",
    aggressive: "Aggressive",
    balanced: "Balanced",
};

function fmt(n: number | null | undefined, decimals = 1): string {
    if (n == null || Number.isNaN(n)) return "—";
    return Number.isInteger(n) ? String(n) : n.toFixed(decimals);
}

export function SynthesisInsightCard({ insight, rank }: SynthesisInsightCardProps) {
    const [showDebate, setShowDebate] = useState(false);

    const sev = insight.avg_severity ?? null;
    const sevPct = sev != null ? Math.max(0, Math.min(10, sev)) * 10 : 0;
    const winner = insight.debate?.winner;
    const winningProposal = insight.debate?.proposals?.find((p) => p.agent === winner);
    const isMulti = (insight.transcripts_total ?? 1) > 1;

    return (
        <article
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card",
                "border-gray-100 dark:border-[#27272A]",
                "transition-all duration-300",
                "hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55)]",
            )}
        >
            {/* Left severity rail — vertical color cue */}
            <div
                aria-hidden
                className={cn(
                    "absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b",
                    severityRail(sev),
                )}
            />

            <div className="p-7 sm:p-8">
                {/* TOP BAR — rank + category + raw pills (only fields that exist in JSON) */}
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                        <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">
                            {String(rank).padStart(2, "0")}
                        </span>
                        {insight.category && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                {insight.category.replace(/_/g, " ")}
                            </span>
                        )}
                        {isMulti && (
                            <Pill className="bg-[#FF8A4C]/10 text-[#FF8A4C] ring-1 ring-[#FF8A4C]/30">
                                {insight.transcripts_total} transcripts
                            </Pill>
                        )}
                    </div>
                    {insight.action?.priority && (
                        <Pill
                            className={cn(
                                "font-bold tracking-wider",
                                priorityStyle(insight.action.priority),
                            )}
                        >
                            {insight.action.priority}
                        </Pill>
                    )}
                </div>

                {/* THEME — main headline */}
                <h3 className="font-display text-[22px] sm:text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-foreground">
                    {insight.theme_name}
                </h3>

                {/* EXECUTIVE SUMMARY — only if debate winner produced one */}
                {winningProposal?.executive_summary && (
                    <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/75">
                        {winningProposal.executive_summary}
                    </p>
                )}

                {/* SIGNAL STRIP — severity (with bar) + frequency + urgency + valence + impact */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
                    {insight.avg_severity != null && (
                        <Signal label="Severity">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-[28px] font-semibold tracking-tight tabular-nums text-foreground">
                                    {fmt(insight.avg_severity)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">/ 10</span>
                            </div>
                            <div className="mt-2 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all", severityFill(sev))}
                                    style={{ width: `${sevPct}%` }}
                                />
                            </div>
                            {insight.max_severity != null &&
                                insight.min_severity != null &&
                                insight.max_severity !== insight.min_severity && (
                                    <div className="mt-1 text-[10.5px] text-muted-foreground tabular-nums">
                                        range {fmt(insight.min_severity)}–{fmt(insight.max_severity)}
                                    </div>
                                )}
                        </Signal>
                    )}

                    {(insight.transcripts_total != null || insight.frequency_pct != null) && (
                        <Signal label="Frequency">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-[28px] font-semibold tracking-tight tabular-nums text-foreground">
                                    {insight.transcripts_mentioning?.length ?? "—"}
                                </span>
                                {insight.transcripts_total != null && (
                                    <span className="text-[11px] text-muted-foreground">
                                        of {insight.transcripts_total}
                                    </span>
                                )}
                            </div>
                            {insight.frequency_pct != null && (
                                <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                                    {insight.frequency_pct}% of transcripts
                                </div>
                            )}
                            {insight.total_mentions != null && (
                                <div className="mt-1 text-[10.5px] text-muted-foreground tabular-nums">
                                    {insight.total_mentions} mentions
                                </div>
                            )}
                        </Signal>
                    )}

                    {insight.modal_urgency && (
                        <Signal label="Urgency">
                            <div className="font-display text-[24px] font-semibold tracking-tight capitalize text-foreground leading-none">
                                {insight.modal_urgency}
                            </div>
                            {insight.emotional_valence_majority && (
                                <div className="mt-2 text-[11px] text-muted-foreground capitalize">
                                    {insight.emotional_valence_majority}
                                </div>
                            )}
                        </Signal>
                    )}

                    {insight.impact_score != null && (
                        <Signal label="Impact">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-[28px] font-semibold tracking-tight tabular-nums text-foreground">
                                    {fmt(insight.impact_score)}
                                </span>
                            </div>
                        </Signal>
                    )}
                </div>

                {/* EVIDENCE */}
                {insight.evidence_pool.length > 0 && (
                    <Section title="Evidence" count={insight.evidence_pool.length}>
                        <div className="space-y-3">
                            {insight.evidence_pool.map((e, i) => (
                                <EvidenceCard key={i} evidence={e} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* CONTRADICTIONS */}
                {insight.contradictions.length > 0 && (
                    <Section title="Contradictions" count={insight.contradictions.length}>
                        <div className="space-y-4">
                            {insight.contradictions.map((c, i) => (
                                <ContradictionBlock key={i} contradiction={c} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* ACTION — only when an action object exists */}
                {insight.action && (
                    <Section title="Recommended action">
                        <ActionBlock action={insight.action} />
                    </Section>
                )}

                {/* SOURCE THEMES — show only if there's anything (mostly useful for cross-runs) */}
                {insight.source_themes.length > 0 && isMulti && (
                    <Section title="Source themes" count={insight.source_themes.length}>
                        <SourceThemesList themes={insight.source_themes} />
                    </Section>
                )}

                {/* DEBATE TRANSPARENCY — collapsible */}
                {insight.debate && (
                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#27272A]">
                        <button
                            type="button"
                            onClick={() => setShowDebate((v) => !v)}
                            aria-expanded={showDebate}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronDown
                                className={cn(
                                    "w-3 h-3 transition-transform",
                                    showDebate ? "rotate-180" : "rotate-0",
                                )}
                            />
                            3-agent debate
                            {!showDebate && winner && (
                                <span className="ml-1 text-muted-foreground/60 normal-case tracking-normal">
                                    · {AGENT_LABEL[winner] ?? winner} won
                                </span>
                            )}
                        </button>
                        {showDebate && <DebateGrid debate={insight.debate} />}
                    </div>
                )}
            </div>
        </article>
    );
}

/* ─── Small composables ──────────────────────────────────────────────────── */

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                className,
            )}
        >
            {children}
        </span>
    );
}

function Signal({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80 mb-2">
                {label}
            </div>
            {children}
        </div>
    );
}

function Section({
    title,
    count,
    children,
}: {
    title: string;
    count?: number;
    children: React.ReactNode;
}) {
    return (
        <section className="mt-7 pt-6 border-t border-gray-100/70 dark:border-[#27272A]/70">
            <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {title}
                </h4>
                {count != null && count > 1 && (
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        · {count}
                    </span>
                )}
            </div>
            {children}
        </section>
    );
}

function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
    return (
        <figure className="relative pl-5">
            <Quote
                aria-hidden
                className="absolute left-0 top-0 w-3.5 h-3.5 text-emerald-500/60 dark:text-emerald-400/60"
            />
            <blockquote className="font-display text-[15px] leading-relaxed text-foreground/90 italic">
                &ldquo;{evidence.verbatim}&rdquo;
            </blockquote>
            <figcaption className="mt-1.5 text-[11px] text-muted-foreground">
                {evidence.speaker && <span className="lowercase">{evidence.speaker}</span>}
                {typeof evidence.source_theme_confidence === "number" && (
                    <>
                        {evidence.speaker && (
                            <span className="text-zinc-300 dark:text-zinc-700 mx-1.5">·</span>
                        )}
                        <span className="tabular-nums">
                            confidence {Math.round(evidence.source_theme_confidence * 100)}%
                        </span>
                    </>
                )}
                {evidence.transcript_id &&
                    typeof evidence.start_char === "number" &&
                    typeof evidence.end_char === "number" && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-700 mx-1.5">·</span>
                            <span className="tabular-nums font-mono text-[10px]">
                                char {evidence.start_char}–{evidence.end_char}
                            </span>
                        </>
                    )}
            </figcaption>
        </figure>
    );
}

function ContradictionBlock({ contradiction }: { contradiction: ContradictionItem }) {
    const a = contradiction.claim_a;
    const b = contradiction.claim_b;
    const hasPair = Boolean(a?.verbatim && b?.verbatim);

    return (
        <div className="rounded-xl border border-purple-200/50 dark:border-purple-500/15 bg-purple-50/30 dark:bg-purple-500/[0.04] p-5">
            {contradiction.type && (
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-700 dark:text-purple-300">
                    {contradiction.type.replace(/_/g, " ")}
                </div>
            )}
            {contradiction.summary && (
                <p className="text-[14px] font-medium leading-snug text-foreground">
                    {contradiction.summary}
                </p>
            )}

            {hasPair && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    <ClaimPanel label={a!.label} claim={a!} />
                    <ClaimPanel label={b!.label} claim={b!} accent />
                </div>
            )}

            {contradiction.rationale && (
                <div className="mt-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                        Rationale
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground/80">
                        {contradiction.rationale}
                    </p>
                </div>
            )}

            {contradiction.actionability_hint && (
                <div className="mt-4 rounded-lg bg-[#FF8A4C]/8 dark:bg-[#FF8A4C]/[0.08] border border-[#FF8A4C]/20 px-3.5 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C] mb-1">
                        Actionability hint
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground/90">
                        {contradiction.actionability_hint}
                    </p>
                </div>
            )}

            {contradiction.confidence && (
                <div className="mt-3 text-[10.5px] text-muted-foreground capitalize">
                    Confidence: {contradiction.confidence}
                </div>
            )}
        </div>
    );
}

function ClaimPanel({
    label,
    claim,
    accent = false,
}: {
    label?: string | null;
    claim: { verbatim: string; speaker?: string | null; summary_role?: string | null };
    accent?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-lg px-3.5 py-3 border",
                accent
                    ? "bg-purple-100/50 dark:bg-purple-500/[0.10] border-purple-200/70 dark:border-purple-500/25"
                    : "bg-white/70 dark:bg-zinc-900/40 border-purple-100 dark:border-purple-500/15",
            )}
        >
            {(label || claim.speaker) && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-purple-700 dark:text-purple-300">
                    {label && <span>{label}</span>}
                    {label && claim.speaker && (
                        <span className="text-purple-400/60 dark:text-purple-500/40">·</span>
                    )}
                    {claim.speaker && (
                        <span className="lowercase tracking-normal text-muted-foreground">
                            {claim.speaker}
                        </span>
                    )}
                </div>
            )}
            <p className="font-display text-[13px] italic leading-snug text-foreground/90">
                &ldquo;{claim.verbatim}&rdquo;
            </p>
            {claim.summary_role && (
                <p className="mt-1.5 text-[11px] not-italic text-muted-foreground leading-snug">
                    {claim.summary_role}
                </p>
            )}
        </div>
    );
}

function ActionBlock({ action }: { action: NonNullable<InsightItem["action"]> }) {
    return (
        <div className="rounded-xl border border-[#FF8A4C]/25 bg-gradient-to-br from-[#FF8A4C]/[0.06] via-[#FF8A4C]/[0.02] to-transparent p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {action.owner_team && (
                    <Pill className="bg-[#FF8A4C]/10 text-[#FF8A4C] ring-1 ring-[#FF8A4C]/30 capitalize">
                        {action.owner_team}
                    </Pill>
                )}
                {action.deadline && (
                    <Pill className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {action.deadline}
                    </Pill>
                )}
                {action.confidence && (
                    <Pill className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 capitalize">
                        {action.confidence} confidence
                    </Pill>
                )}
            </div>
            {action.action_text && (
                <p className="text-[14.5px] leading-relaxed text-foreground">
                    {action.action_text}
                </p>
            )}
            {action.expected_impact && (
                <div className="mt-3 text-[13px] text-foreground/75 leading-relaxed">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mr-2">
                        Expected impact
                    </span>
                    {action.expected_impact}
                </div>
            )}
            {action.context_for_team && (
                <div className="mt-3 text-[13px] text-foreground/70 leading-relaxed">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mr-2">
                        Context
                    </span>
                    {action.context_for_team}
                </div>
            )}
        </div>
    );
}

function SourceThemesList({ themes }: { themes: SourceTheme[] }) {
    return (
        <ul className="space-y-1.5">
            {themes.map((t, i) => (
                <li
                    key={i}
                    className="text-[12.5px] text-foreground/80 flex items-baseline gap-2"
                >
                    {t.theme_name && <span className="font-medium">{t.theme_name}</span>}
                    {t.transcript_id && (
                        <span className="font-mono text-[10.5px] text-muted-foreground">
                            {t.transcript_id}
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

function DebateGrid({ debate }: { debate: DebateBundle }) {
    const agents = Object.keys(debate.scores);
    return (
        <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {agents.map((agent) => {
                    const isWinner = debate.winner === agent;
                    const s = debate.scores[agent];
                    return (
                        <div
                            key={agent}
                            className={cn(
                                "rounded-xl border p-3.5 transition-colors",
                                isWinner
                                    ? "border-[#FF8A4C]/60 bg-[#FF8A4C]/[0.06]"
                                    : "border-gray-200/70 dark:border-[#27272A] bg-card",
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-semibold text-foreground/85">
                                    {AGENT_LABEL[agent] ?? agent}
                                </span>
                                {isWinner && (
                                    <span className="text-[11px] text-[#FF8A4C] font-bold">★</span>
                                )}
                            </div>
                            <div className="font-display text-[20px] font-semibold tabular-nums text-foreground leading-none">
                                {s.total}
                                <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                                    /100
                                </span>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-1 text-[9px] text-muted-foreground tabular-nums">
                                <div title="Evidence">E:{s.evidence}</div>
                                <div title="Actionability">A:{s.actionability}</div>
                                <div title="Impact">I:{s.impact}</div>
                                <div title="Specificity">S:{s.specificity}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {debate.judge_reasoning && (
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
                        Judge
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-foreground/80">
                        {debate.judge_reasoning}
                    </p>
                </div>
            )}
        </div>
    );
}
