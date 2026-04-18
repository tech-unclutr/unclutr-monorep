"use client";

import React, { useState } from "react";
import {
    BookOpenIcon,
    FilterIcon,
    MessageCircleIcon,
    GitBranchIcon,
    ListChecksIcon,
    ChevronDownIcon,
    CheckIcon,
    XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CohortBriefData } from "./cohortBriefDummyData";

type SectionId = "context" | "screening" | "moderator" | "structure" | "script";
type Accent = "indigo" | "emerald" | "amber" | "violet" | "rose";

interface CohortBriefSectionsProps {
    cohort: string;
    data: CohortBriefData;
}

export function CohortBriefSections({ cohort, data }: CohortBriefSectionsProps) {
    // Per-cohort open-state: { `${cohort}:${section}`: boolean }
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const isOpen = (section: SectionId) => {
        const key = `${cohort}:${section}`;
        if (key in openMap) return openMap[key];
        // Default: section 1 (context) open, rest closed
        return section === "context";
    };

    const toggle = (section: SectionId) => (open: boolean) => {
        setOpenMap((prev) => ({ ...prev, [`${cohort}:${section}`]: open }));
    };

    return (
        <div className="space-y-3 mb-6">
            <SectionCard
                id="context"
                number={1}
                title="Cohort Context"
                subtitle="Definition, hypothesis, and research objectives"
                icon={<BookOpenIcon className="w-4 h-4" />}
                accent="indigo"
                open={isOpen("context")}
                onOpenChange={toggle("context")}
            >
                <Field label="Definition">
                    <p>{data.context.definition}</p>
                </Field>
                <Field label="Hypothesis">
                    <p>{data.context.hypothesis}</p>
                </Field>
                <Field label="Key Research Objectives">
                    <ol className="list-decimal list-outside ml-4 space-y-1.5">
                        {data.context.objectives.map((o, i) => (
                            <li key={i}>{o}</li>
                        ))}
                    </ol>
                </Field>
            </SectionCard>

            <SectionCard
                id="screening"
                number={2}
                title="Screening & Logistics"
                subtitle="Counts, duration, and qualification rules"
                icon={<FilterIcon className="w-4 h-4" />}
                accent="emerald"
                open={isOpen("screening")}
                onOpenChange={toggle("screening")}
            >
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Number of Interviews">
                        <p className="font-semibold tabular-nums">{data.screening.interviewCount}</p>
                    </Field>
                    <Field label="Interview Duration">
                        <p className="font-semibold">{data.screening.duration}</p>
                    </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CriteriaList
                        label="Include"
                        tone="include"
                        items={data.screening.include}
                    />
                    <CriteriaList
                        label="Exclude"
                        tone="exclude"
                        items={data.screening.exclude}
                    />
                </div>
                <Field label="Ideal Respondent Profile">
                    <p>{data.screening.idealProfile}</p>
                </Field>
            </SectionCard>

            <SectionCard
                id="moderator"
                number={3}
                title="Moderator Instructions"
                subtitle="Script, consent, tone, and behavior rules"
                icon={<MessageCircleIcon className="w-4 h-4" />}
                accent="amber"
                open={isOpen("moderator")}
                onOpenChange={toggle("moderator")}
            >
                <Field label="Introduction Script">
                    <p className="italic">&ldquo;{data.moderator.introScript}&rdquo;</p>
                </Field>
                <Field label="Consent & Recording">
                    <p className="italic">&ldquo;{data.moderator.consent}&rdquo;</p>
                </Field>
                <Field label="Tone Guidance">
                    <p>{data.moderator.tone}</p>
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CriteriaList label="Do's" tone="include" items={data.moderator.dos} />
                    <CriteriaList label="Don'ts" tone="exclude" items={data.moderator.donts} />
                </div>
            </SectionCard>

            <SectionCard
                id="structure"
                number={4}
                title="Interview Structure"
                subtitle="The narrative flow and phase timing"
                icon={<GitBranchIcon className="w-4 h-4" />}
                accent="violet"
                open={isOpen("structure")}
                onOpenChange={toggle("structure")}
            >
                <div className="space-y-2">
                    {data.structure.phases.map((phase, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-[#27272A] bg-gray-50/60 dark:bg-white/[0.02] px-3.5 py-3"
                        >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-bold tabular-nums shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {phase.name}
                                    </span>
                                    <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full tabular-nums">
                                        {phase.duration}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
                                    {phase.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard
                id="script"
                number={5}
                title="Detailed Question Script"
                subtitle="Canonical questions with follow-up probes"
                icon={<ListChecksIcon className="w-4 h-4" />}
                accent="rose"
                open={isOpen("script")}
                onOpenChange={toggle("script")}
            >
                <ol className="space-y-4">
                    {data.script.questions.map((q, i) => (
                        <li key={q.id} className="flex gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold tabular-nums shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-relaxed">
                                    {q.question}
                                </p>
                                {q.probes.length > 0 && (
                                    <ul className="space-y-1 pl-3 border-l-2 border-rose-500/20">
                                        {q.probes.map((p, pi) => (
                                            <li
                                                key={pi}
                                                className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
                                            >
                                                <span className="text-rose-500/70 dark:text-rose-400/70 mr-1.5">
                                                    ↳
                                                </span>
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </SectionCard>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────

const ACCENT_STYLES: Record<Accent, { chip: string; number: string }> = {
    indigo: {
        chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        number: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
        chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        number: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        number: "text-amber-600 dark:text-amber-400",
    },
    violet: {
        chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        number: "text-violet-600 dark:text-violet-400",
    },
    rose: {
        chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        number: "text-rose-600 dark:text-rose-400",
    },
};

interface SectionCardProps {
    id: SectionId;
    number: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accent: Accent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

function SectionCard({
    number,
    title,
    subtitle,
    icon,
    accent,
    open,
    onOpenChange,
    children,
}: SectionCardProps) {
    const styles = ACCENT_STYLES[accent];
    return (
        <Collapsible
            open={open}
            onOpenChange={onOpenChange}
            className={cn(
                "rounded-xl border border-gray-100 dark:border-[#27272A] bg-white dark:bg-zinc-950 shadow-sm transition-colors",
                open && "shadow-md",
            )}
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.02] rounded-xl transition-colors"
                >
                    <div
                        className={cn(
                            "p-2 rounded-lg shrink-0",
                            styles.chip,
                        )}
                    >
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "text-[11px] font-bold tabular-nums uppercase tracking-wide",
                                    styles.number,
                                )}
                            >
                                Section {number}
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                            {title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {subtitle}
                        </p>
                    </div>
                    <ChevronDownIcon
                        className={cn(
                            "w-4 h-4 text-gray-400 dark:text-zinc-500 transition-transform duration-200 shrink-0",
                            open && "rotate-180",
                        )}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                <div className="px-5 pb-5 pt-4 space-y-4 border-t border-gray-100 dark:border-[#27272A]">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
                {children}
            </div>
        </div>
    );
}

function CriteriaList({
    label,
    tone,
    items,
}: {
    label: string;
    tone: "include" | "exclude";
    items: string[];
}) {
    const toneStyles =
        tone === "include"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    const Icon = tone === "include" ? CheckIcon : XIcon;
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                        toneStyles,
                    )}
                >
                    <Icon className="w-3 h-3" />
                    {label}
                </span>
            </div>
            <ul className="space-y-1.5">
                {items.map((item, i) => (
                    <li
                        key={i}
                        className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300 flex gap-2"
                    >
                        <span
                            className={cn(
                                "shrink-0 mt-2 w-1 h-1 rounded-full",
                                tone === "include"
                                    ? "bg-emerald-500/60"
                                    : "bg-rose-500/60",
                            )}
                        />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
