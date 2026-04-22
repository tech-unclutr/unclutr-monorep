"use client";

import React, { useMemo } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useCohortBrief,
    type ScriptQuestion,
    type ScriptKrqGroup,
    type ScriptSectionData,
} from "./useCohortBrief";
import { useCohortBriefContext } from "./CohortBriefContext";

interface ScriptSectionProps {
    studyId?: string;
    cohortId?: string;
    script?: ScriptSectionData | null;
    loading?: boolean;
    error?: string | null;
}

export function ScriptSection({
    studyId,
    cohortId,
    script: scriptProp,
    loading: loadingProp,
    error: errorProp,
}: ScriptSectionProps) {
    // The provider hydrates from the shared brief fetch, but fall back to a
    // local fetch (legacy standalone usage) when props aren't passed in.
    const hookResult = useCohortBrief(
        scriptProp === undefined ? studyId : undefined,
        scriptProp === undefined ? cohortId : undefined,
    );
    const script =
        scriptProp !== undefined ? scriptProp : hookResult.data?.script_section;
    const loading = loadingProp ?? hookResult.loading;
    const error = errorProp ?? hookResult.error;

    const { excluded, toggleExcluded } = useCohortBriefContext();

    const groupTotals = useMemo(() => {
        const totals: Record<number, number> = {};
        if (script) {
            for (const g of script.krq_groups) {
                let gt = 0;
                for (const q of g.questions) {
                    if (!excluded.has(q.id)) gt += q.estimated_minutes || 0;
                }
                totals[g.krq_index] = gt;
            }
        }
        return totals;
    }, [script, excluded]);

    const grandTotal = useMemo(
        () => Object.values(groupTotals).reduce((a, b) => a + b, 0),
        [groupTotals],
    );

    if (loading) return <SkeletonList />;
    if (error) return <Muted>Couldn&rsquo;t load the interview script.</Muted>;
    if (!script || script.krq_groups.length === 0) {
        return (
            <Muted>
                Interview script isn&rsquo;t ready yet. Finish the study-designer flow to generate one.
            </Muted>
        );
    }

    return (
        <div className="space-y-6">
            {script.krq_groups.map((group) => (
                <KrqGroupBlock
                    key={group.krq_index}
                    group={group}
                    adjustedMinutes={groupTotals[group.krq_index] ?? 0}
                    excluded={excluded}
                    onToggle={toggleExcluded}
                />
            ))}
            <TotalTimeFooter totalMinutes={grandTotal} />
        </div>
    );
}

function KrqGroupBlock({
    group,
    adjustedMinutes,
    excluded,
    onToggle,
}: {
    group: ScriptKrqGroup;
    adjustedMinutes: number;
    excluded: Set<string>;
    onToggle: (id: string) => void;
}) {
    return (
        <div className="space-y-3">
            {/* KRQ Header */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-rose-500/20">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 tabular-nums shrink-0 mt-1">
                        KRQ {group.krq_index}
                    </span>
                    <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-snug">
                        {group.krq_section_text}
                    </p>
                </div>
                <MinutesPill minutes={adjustedMinutes} />
            </div>

            {/* Questions */}
            <ol className="space-y-3">
                {group.questions.map((q) => (
                    <QuestionCard
                        key={q.id}
                        q={q}
                        checked={!excluded.has(q.id)}
                        onToggle={() => onToggle(q.id)}
                    />
                ))}
            </ol>
        </div>
    );
}

function QuestionCard({
    q,
    checked,
    onToggle,
}: {
    q: ScriptQuestion;
    checked: boolean;
    onToggle: () => void;
}) {
    const isMustAsk = q.priority === "must_ask";
    return (
        <li
            className={cn(
                "rounded-lg border px-4 py-3 space-y-2 transition-colors duration-200",
                checked
                    ? "border-gray-100 dark:border-[#27272A] bg-white dark:bg-white/[0.02]"
                    : "border-gray-100/70 dark:border-[#27272A]/70 bg-gray-50/60 dark:bg-white/[0.01] opacity-60",
            )}
        >
            {/* Row 1: checkbox + number + question + priority pill */}
            <div className="flex items-start gap-3">
                <QuestionCheckbox checked={checked} onToggle={onToggle} label={`Include question ${q.question_number}`} />
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold tabular-nums shrink-0 mt-0.5">
                    {q.question_number}
                </div>
                <p
                    className={cn(
                        "flex-1 min-w-0 text-sm font-semibold leading-relaxed",
                        checked
                            ? "text-gray-900 dark:text-zinc-100"
                            : "text-gray-500 dark:text-zinc-500 line-through",
                    )}
                >
                    {q.text}
                </p>
                <PriorityPill mustAsk={isMustAsk} />
            </div>

            {/* Row 2: metadata chips */}
            <div className="flex flex-wrap items-center gap-1.5 pl-[4.25rem]">
                {q.tag && <MetaChip label={q.tag} />}
                <DepthBadge depth={q.depth} />
                {q.type_descriptor && <MetaChip label={q.type_descriptor} muted />}
                <MetaChip label={`~${formatMinutes(q.estimated_minutes)} min`} muted />
            </div>

            {/* Row 3: Uncovers */}
            {q.uncovers && (
                <MetaLine label="Uncovers" value={q.uncovers} className="pl-[4.25rem]" />
            )}

            {/* Row 4: Objective Link */}
            {q.objective_link && (
                <MetaLine label="Objective Link" value={q.objective_link} className="pl-[4.25rem]" />
            )}

            {/* Row 5: Probes */}
            {q.probes.length > 0 && (
                <ul className="space-y-1 pl-[4.25rem] mt-2">
                    {q.probes.map((p, pi) => (
                        <li
                            key={pi}
                            className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed pl-3 border-l-2 border-rose-500/20"
                        >
                            <span className="text-rose-500/70 dark:text-rose-400/70 mr-1.5">
                                ↳
                            </span>
                            {p}
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

function QuestionCheckbox({
    checked,
    onToggle,
    label,
}: {
    checked: boolean;
    onToggle: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={onToggle}
            className={cn(
                "shrink-0 mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 active:scale-[0.92]",
                checked
                    ? "bg-rose-500 border-rose-500 text-white shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
                    : "bg-white dark:bg-white/[0.03] border-gray-300 dark:border-[#3F3F46] hover:border-rose-400 dark:hover:border-rose-400/60",
            )}
        >
            {checked && <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />}
        </button>
    );
}

// ─── Small atoms ─────────────────────────────────────────────────────────

function PriorityPill({ mustAsk }: { mustAsk: boolean }) {
    if (mustAsk) {
        return (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#FF8A4C]/10 text-[#FF8A4C] border border-[#FF8A4C]/25">
                Must Ask
            </span>
        );
    }
    return (
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-muted-foreground border border-gray-200/60 dark:border-white/[0.06]">
            If Time Permits
        </span>
    );
}

function DepthBadge({ depth }: { depth: number }) {
    const isDeep = depth >= 2;
    return (
        <span
            className={cn(
                "inline-flex items-center text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded border",
                isDeep
                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                    : "bg-gray-100 dark:bg-white/5 text-muted-foreground border-gray-200/60 dark:border-white/[0.06]",
            )}
            title={isDeep ? "Deep reasoning / emotional / decision-making" : "Surface-level"}
        >
            D{depth}
        </span>
    );
}

function MetaChip({ label, muted = false }: { label: string; muted?: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                muted
                    ? "bg-gray-50 dark:bg-white/[0.02] text-muted-foreground border-gray-200/60 dark:border-white/[0.06]"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            )}
        >
            {label}
        </span>
    );
}

function MetaLine({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <p className={cn("text-xs text-muted-foreground leading-relaxed", className)}>
            <span className="font-semibold text-gray-600 dark:text-zinc-400">{label}:</span>{" "}
            {value}
        </p>
    );
}

function MinutesPill({ minutes }: { minutes: number }) {
    return (
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            ~{formatMinutes(minutes)} min
        </span>
    );
}

function TotalTimeFooter({ totalMinutes }: { totalMinutes: number }) {
    return (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#27272A]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Estimated interview time
            </span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                ~{formatMinutes(totalMinutes)} min
            </span>
        </div>
    );
}

function SkeletonList() {
    return (
        <div className="space-y-4">
            {[0, 1].map((i) => (
                <div key={i} className="space-y-2">
                    <span className="block h-4 w-3/5 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                    <span className="block h-12 w-full rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                    <span className="block h-12 w-full rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                </div>
            ))}
        </div>
    );
}

function Muted({ children }: { children: React.ReactNode }) {
    return <span className="text-muted-foreground italic text-sm">{children}</span>;
}

function formatMinutes(n: number): string {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
}
