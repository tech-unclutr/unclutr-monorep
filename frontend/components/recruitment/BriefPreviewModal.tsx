"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BookOpenIcon, UsersIcon, CheckIcon, XIcon, DownloadIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { api } from "@/lib/api";
import { type StudyContext } from "./ExecutionPromptView";
import { getDummyBrief, type CohortBriefData as DummyBrief } from "./cohortBriefDummyData";
import type {
    CohortBriefData,
    ScriptKrqGroup,
    ScriptQuestion,
} from "./cohort-brief/useCohortBrief";

interface BriefPreviewModalProps {
    open: boolean;
    onClose: () => void;
    studyContext?: StudyContext;
    cohorts: string[];
    cohortIdByName: Record<string, string>;
}

interface StudyDetail {
    title?: string;
    briefing?: string;
    executive_summary?: string;
    topic_guide?: {
        objectives?: Array<{ title?: string; description?: string }>;
    };
    key_research_questions?: Array<{ title?: string; question?: string }>;
}

type CohortBriefRecord = Record<string, CohortBriefData>;

export function BriefPreviewModal({
    open,
    onClose,
    studyContext,
    cohorts,
    cohortIdByName,
}: BriefPreviewModalProps) {
    const studyId = studyContext?.studyId;

    const [study, setStudy] = useState<StudyDetail | null>(null);
    const [briefs, setBriefs] = useState<CohortBriefRecord>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orderedCohorts = useMemo(
        () => cohorts.filter((c) => cohortIdByName[c]),
        [cohorts, cohortIdByName],
    );

    useEffect(() => {
        if (!open || !studyId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        const studyPromise = api.get(`/study-planner/studies/${studyId}`);
        const briefPromises = orderedCohorts.map((name) =>
            api
                .get(
                    `/study-planner/studies/${studyId}/cohorts/${cohortIdByName[name]}/brief`,
                )
                .then((data: CohortBriefData) => [name, data] as const)
                .catch(() => [name, null] as const),
        );

        Promise.all([studyPromise, Promise.all(briefPromises)])
            .then(([studyRes, briefResList]) => {
                if (cancelled) return;
                setStudy(studyRes as StudyDetail);
                const record: CohortBriefRecord = {};
                briefResList.forEach(([name, data]) => {
                    if (data) record[name] = data;
                });
                setBriefs(record);
            })
            .catch((e: any) => {
                if (cancelled) return;
                setError(e?.message || "Failed to load brief");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, studyId, orderedCohorts, cohortIdByName]);

    const handleDownloadPdf = () => {
        renderPrintableBrief({
            title: study?.title || studyContext?.title || "Research Study",
            study,
            studyContext,
            orderedCohorts,
            briefs,
        });
    };

    const canDownload = !loading && !error && orderedCohorts.length > 0;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-4xl w-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                <BookOpenIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                                    Study Brief Preview
                                </DialogTitle>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-0.5">
                                    End-to-end research document for {study?.title || studyContext?.title || "this study"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={!canDownload}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all mr-6",
                                canDownload
                                    ? "text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white active:scale-[0.98]"
                                    : "text-gray-300 dark:text-zinc-600 border-gray-100 dark:border-white/5 cursor-not-allowed",
                            )}
                        >
                            <DownloadIcon className="w-3.5 h-3.5" />
                            Download PDF
                        </button>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[75vh] scrollbar-subtle">
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} />
                    ) : (
                        <div className="px-8 py-8 space-y-16">
                            <ReceivedBrief study={study} studyContext={studyContext} />
                            {orderedCohorts.map((name, i) => (
                                <CohortBlock
                                    key={name}
                                    index={i + 1}
                                    name={name}
                                    brief={briefs[name]}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Received Brief (study-level) ──────────────────────────────────────

function ReceivedBrief({
    study,
    studyContext,
}: {
    study: StudyDetail | null;
    studyContext?: StudyContext;
}) {
    const execSummary = study?.executive_summary || "";
    const briefing = study?.briefing || studyContext?.briefing || "";
    const objectives = (study?.topic_guide?.objectives || []).filter(
        (o) => o?.title,
    );
    const krqs = (study?.key_research_questions || []).filter(
        (q) => q?.question || q?.title,
    );

    return (
        <section className="space-y-5">
            <BlockHeader number="" label="Received Brief" accent="indigo" />

            <Field label="Executive Summary">
                {execSummary ? (
                    <p className="whitespace-pre-wrap">{execSummary}</p>
                ) : (
                    <Muted>No executive summary captured.</Muted>
                )}
            </Field>

            <Field label="Research Brief">
                {briefing ? (
                    <p className="whitespace-pre-wrap">{briefing}</p>
                ) : (
                    <Muted>No research brief provided.</Muted>
                )}
            </Field>

            <Field label="Objectives">
                {objectives.length > 0 ? (
                    <ol className="list-decimal list-outside ml-5 space-y-2">
                        {objectives.map((o, i) => (
                            <li key={i}>
                                <span className="font-semibold text-gray-800 dark:text-zinc-200">
                                    {o.title}
                                </span>
                                {o.description && (
                                    <span className="block text-gray-500 dark:text-zinc-400 mt-0.5">
                                        {o.description}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <Muted>No objectives defined.</Muted>
                )}
            </Field>

            <Field label="Key Research Questions">
                {krqs.length > 0 ? (
                    <ol className="list-decimal list-outside ml-5 space-y-2">
                        {krqs.map((q, i) => (
                            <li key={i}>
                                {q.title && (
                                    <span className="font-semibold text-gray-800 dark:text-zinc-200">
                                        {q.title}
                                        {q.question ? ": " : ""}
                                    </span>
                                )}
                                {q.question && <span>{q.question}</span>}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <Muted>No key research questions defined.</Muted>
                )}
            </Field>
        </section>
    );
}

// ─── Cohort Block (title + 5 sections) ─────────────────────────────────

function CohortBlock({
    index,
    name,
    brief,
}: {
    index: number;
    name: string;
    brief: CohortBriefData | undefined;
}) {
    const dummy = getDummyBrief(name);
    const context = brief?.context_section;
    const script = brief?.script_section;
    const screening = brief?.screening_section;

    return (
        <section className="space-y-10 pt-8 border-t-2 border-gray-200 dark:border-white/[0.08]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Cohort {index}: {capitalizeCohortName(name)}
            </h2>

            {/* Section 1 */}
            <div className="space-y-4">
                <SectionHeader number={1} label="Cohort Context" />
                <Field label="Cohort Definition">
                    {context?.definition ? (
                        <p>{context.definition}</p>
                    ) : (
                        <Muted>Not available.</Muted>
                    )}
                </Field>
                <Field label="Hypothesis">
                    {context?.hypothesis ? (
                        <p>{context.hypothesis}</p>
                    ) : (
                        <Muted>Not available.</Muted>
                    )}
                </Field>
                <Field label="Key Research Objectives">
                    {context?.objectives && context.objectives.length > 0 ? (
                        <ol className="list-decimal list-outside ml-5 space-y-1">
                            {context.objectives.map((o, i) => (
                                <li key={i}>{o}</li>
                            ))}
                        </ol>
                    ) : (
                        <Muted>Not available.</Muted>
                    )}
                </Field>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
                <SectionHeader number={2} label="Detailed Question Script" />
                {script && script.krq_groups.length > 0 ? (
                    <div className="space-y-5">
                        {script.krq_groups.map((g) => (
                            <KrqBlock key={g.krq_index} group={g} />
                        ))}
                        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
                            Estimated total: ~{formatMinutes(script.total_estimated_minutes)} min
                        </p>
                    </div>
                ) : (
                    <Muted>Interview script not generated yet.</Muted>
                )}
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
                <SectionHeader number={3} label="Screening & Logistics" />
                <MetricsRow
                    interviewCount={scriptQuestionCount(script)}
                    durationMinutes={script?.total_estimated_minutes ?? 0}
                />
                <Field label="Screening Criteria">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CriteriaBlock
                            label="Include"
                            tone="include"
                            items={screening?.include_criteria || []}
                        />
                        <CriteriaBlock
                            label="Exclude"
                            tone="exclude"
                            items={screening?.exclude_criteria || []}
                        />
                    </div>
                </Field>
                <Field label="Ideal Respondent Profile">
                    <p>{dummy.screening.idealProfile}</p>
                </Field>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
                <SectionHeader number={4} label="Moderator Instructions" />
                <ModeratorBlock data={dummy.moderator} />
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
                <SectionHeader number={5} label="Interview Structure" />
                <StructureBlock phases={dummy.structure.phases} />
            </div>
        </section>
    );
}

function KrqBlock({ group }: { group: ScriptKrqGroup }) {
    return (
        <div className="space-y-2">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-rose-500/20">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 tabular-nums shrink-0 mt-0.5">
                        KRQ {group.krq_index}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-snug">
                        {group.krq_section_text}
                    </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    ~{formatMinutes(group.total_estimated_minutes)} min
                </span>
            </div>
            <ol className="space-y-2 pl-2">
                {group.questions.map((q) => (
                    <QuestionRow key={q.id} q={q} />
                ))}
            </ol>
        </div>
    );
}

function QuestionRow({ q }: { q: ScriptQuestion }) {
    return (
        <li className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            <p className="font-medium text-gray-900 dark:text-zinc-100">
                <span className="text-rose-500/70 dark:text-rose-400/70 mr-1">
                    {q.question_number}.
                </span>
                {q.text}
            </p>
            {q.uncovers && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 pl-4 italic">
                    Uncovers: {q.uncovers}
                </p>
            )}
            {q.probes && q.probes.length > 0 && (
                <ul className="pl-4 mt-1 space-y-0.5">
                    {q.probes.map((p, i) => (
                        <li key={i} className="text-xs text-gray-500 dark:text-zinc-400">
                            ↳ {p}
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

// ─── Section 3 sub-components ──────────────────────────────────────────

function MetricsRow({
    interviewCount,
    durationMinutes,
}: {
    interviewCount: number;
    durationMinutes: number;
}) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Interviews">
                <p className="font-semibold tabular-nums">{interviewCount}</p>
            </Field>
            <Field label="Interview Duration">
                <p className="font-semibold tabular-nums">~{formatMinutes(durationMinutes)} min</p>
            </Field>
        </div>
    );
}

function CriteriaBlock({
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
    const dotColor = tone === "include" ? "bg-emerald-500/60" : "bg-rose-500/60";

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
            {items.length === 0 ? (
                <Muted>Not available.</Muted>
            ) : (
                <ul className="space-y-1.5">
                    {items.map((item, i) => (
                        <li
                            key={i}
                            className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300 flex gap-2"
                        >
                            <span className={cn("shrink-0 mt-2 w-1 h-1 rounded-full", dotColor)} />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Section 4 Moderator ────────────────────────────────────────────────

function ModeratorBlock({ data }: { data: DummyBrief["moderator"] }) {
    return (
        <div className="space-y-4">
            <Field label="Introduction Script">
                <p className="whitespace-pre-wrap">{data.introScript}</p>
            </Field>
            <Field label="Consent & Recording">
                <p>{data.consent}</p>
            </Field>
            <Field label="Tone Guidance">
                <p>{data.tone}</p>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Do's">
                    <ul className="space-y-1">
                        {data.dos.map((d, i) => (
                            <li key={i} className="flex gap-2">
                                <CheckIcon className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </Field>
                <Field label="Don'ts">
                    <ul className="space-y-1">
                        {data.donts.map((d, i) => (
                            <li key={i} className="flex gap-2">
                                <XIcon className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </Field>
            </div>
        </div>
    );
}

// ─── Section 5 Structure ────────────────────────────────────────────────

function StructureBlock({ phases }: { phases: DummyBrief["structure"]["phases"] }) {
    return (
        <ol className="space-y-3">
            {phases.map((phase, i) => (
                <li
                    key={i}
                    className="flex items-start gap-4 rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02] p-3"
                >
                    <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-bold tabular-nums">
                        {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                {phase.name}
                            </p>
                            <span className="shrink-0 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                {phase.duration}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {phase.description}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

// ─── Small atoms ───────────────────────────────────────────────────────

function BlockHeader({
    number,
    label,
    accent,
}: {
    number: string;
    label: string;
    accent: "indigo" | "rose";
}) {
    const accentClasses =
        accent === "indigo"
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-rose-600 dark:text-rose-400";
    return (
        <h3
            className={cn(
                "text-[11px] font-bold uppercase tracking-widest",
                accentClasses,
            )}
        >
            {number && <span className="tabular-nums mr-1.5">{number}</span>}
            {label}
        </h3>
    );
}

function SectionHeader({ number, label }: { number: number; label: string }) {
    return (
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="tabular-nums text-gray-400 dark:text-zinc-600">
                Section {number}
            </span>
            <span className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
            <span className="text-gray-700 dark:text-zinc-300">{label}</span>
        </h4>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
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

function Muted({ children }: { children: React.ReactNode }) {
    return <span className="text-muted-foreground italic text-sm">{children}</span>;
}

function LoadingState() {
    return (
        <div className="px-8 py-12 space-y-4">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-4 w-full rounded bg-gray-100 dark:bg-white/5 animate-pulse"
                />
            ))}
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="px-8 py-12 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">
                Couldn&rsquo;t load the brief
            </p>
            <p className="text-xs text-muted-foreground mt-2">{message}</p>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function scriptQuestionCount(
    script: CohortBriefData["script_section"] | null | undefined,
): number {
    if (!script) return 0;
    return script.krq_groups.reduce((sum, g) => sum + g.questions.length, 0);
}

function formatMinutes(n: number): string {
    if (!n) return "0";
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
}

// ─── Print / PDF renderer ──────────────────────────────────────────────

interface PrintArgs {
    title: string;
    study: StudyDetail | null;
    studyContext?: StudyContext;
    orderedCohorts: string[];
    briefs: CohortBriefRecord;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderPrintableBrief({
    title,
    study,
    studyContext,
    orderedCohorts,
    briefs,
}: PrintArgs) {
    const execSummary = study?.executive_summary || "";
    const briefing = study?.briefing || studyContext?.briefing || "";
    const objectives = (study?.topic_guide?.objectives || []).filter((o) => o?.title);
    const krqs = (study?.key_research_questions || []).filter(
        (q) => q?.question || q?.title,
    );

    const nl2br = (s: string) => escapeHtml(s).replace(/\n/g, "<br/>");

    const receivedHtml = `
        <section class="block">
            <h3 class="block-title">Received Brief</h3>
            <div class="field">
                <p class="field-label">Executive Summary</p>
                ${
                    execSummary
                        ? `<p class="field-body">${nl2br(execSummary)}</p>`
                        : `<p class="muted">No executive summary captured.</p>`
                }
            </div>
            <div class="field">
                <p class="field-label">Research Brief</p>
                ${
                    briefing
                        ? `<p class="field-body">${nl2br(briefing)}</p>`
                        : `<p class="muted">No research brief provided.</p>`
                }
            </div>
            <div class="field">
                <p class="field-label">Objectives</p>
                ${
                    objectives.length
                        ? `<ol class="ol">${objectives
                              .map(
                                  (o) =>
                                      `<li><span class="ol-title">${escapeHtml(o.title || "")}</span>${
                                          o.description
                                              ? `<span class="ol-desc">${escapeHtml(o.description)}</span>`
                                              : ""
                                      }</li>`,
                              )
                              .join("")}</ol>`
                        : `<p class="muted">No objectives defined.</p>`
                }
            </div>
            <div class="field">
                <p class="field-label">Key Research Questions</p>
                ${
                    krqs.length
                        ? `<ol class="ol">${krqs
                              .map((q) => {
                                  const titlePart = q.title
                                      ? `<span class="ol-title">${escapeHtml(q.title)}${q.question ? ": " : ""}</span>`
                                      : "";
                                  const questionPart = q.question
                                      ? `<span>${escapeHtml(q.question)}</span>`
                                      : "";
                                  return `<li>${titlePart}${questionPart}</li>`;
                              })
                              .join("")}</ol>`
                        : `<p class="muted">No key research questions defined.</p>`
                }
            </div>
        </section>`;

    const cohortsHtml = orderedCohorts
        .map((name, i) => {
            const brief = briefs[name];
            const dummy = getDummyBrief(name);
            const ctx = brief?.context_section;
            const script = brief?.script_section;
            const screening = brief?.screening_section;
            const interviewCount = scriptQuestionCount(script);
            const duration = script?.total_estimated_minutes ?? 0;

            const krqsHtml = script
                ? script.krq_groups
                      .map((g) => {
                          const questionsHtml = g.questions
                              .map((q) => {
                                  const probesHtml = q.probes?.length
                                      ? `<ul class="probes">${q.probes
                                            .map((p) => `<li>↳ ${escapeHtml(p)}</li>`)
                                            .join("")}</ul>`
                                      : "";
                                  const uncoversHtml = q.uncovers
                                      ? `<p class="q-uncovers"><em>Uncovers:</em> ${escapeHtml(q.uncovers)}</p>`
                                      : "";
                                  return `<li>
                                      <p class="q-text"><span class="q-num">${q.question_number}.</span> ${escapeHtml(q.text)}</p>
                                      ${uncoversHtml}
                                      ${probesHtml}
                                  </li>`;
                              })
                              .join("");
                          return `<div class="krq-block">
                              <p class="krq-head"><span class="krq-tag">KRQ ${g.krq_index}</span> ${escapeHtml(g.krq_section_text)} <span class="krq-mins">~${formatMinutes(g.total_estimated_minutes)} min</span></p>
                              <ol class="questions">${questionsHtml}</ol>
                          </div>`;
                      })
                      .join("")
                : `<p class="muted">Interview script not generated yet.</p>`;

            const include = screening?.include_criteria || [];
            const exclude = screening?.exclude_criteria || [];
            const criteriaHtml = `
                <div class="criteria-grid">
                    <div>
                        <p class="chip chip-include">Include</p>
                        ${
                            include.length
                                ? `<ul class="bullets">${include.map((s) => `<li>• ${escapeHtml(s)}</li>`).join("")}</ul>`
                                : `<p class="muted">Not available.</p>`
                        }
                    </div>
                    <div>
                        <p class="chip chip-exclude">Exclude</p>
                        ${
                            exclude.length
                                ? `<ul class="bullets">${exclude.map((s) => `<li>• ${escapeHtml(s)}</li>`).join("")}</ul>`
                                : `<p class="muted">Not available.</p>`
                        }
                    </div>
                </div>`;

            const moderatorHtml = `
                <div class="field"><p class="field-label">Introduction Script</p><p class="field-body">${nl2br(dummy.moderator.introScript)}</p></div>
                <div class="field"><p class="field-label">Consent & Recording</p><p class="field-body">${escapeHtml(dummy.moderator.consent)}</p></div>
                <div class="field"><p class="field-label">Tone Guidance</p><p class="field-body">${escapeHtml(dummy.moderator.tone)}</p></div>
                <div class="criteria-grid">
                    <div>
                        <p class="chip chip-include">Do's</p>
                        <ul class="bullets">${dummy.moderator.dos.map((d) => `<li>✓ ${escapeHtml(d)}</li>`).join("")}</ul>
                    </div>
                    <div>
                        <p class="chip chip-exclude">Don'ts</p>
                        <ul class="bullets">${dummy.moderator.donts.map((d) => `<li>✗ ${escapeHtml(d)}</li>`).join("")}</ul>
                    </div>
                </div>`;

            const structureHtml = `<ol class="phases">${dummy.structure.phases
                .map(
                    (p, pi) => `
                    <li>
                        <div class="phase-head"><span class="phase-num">${pi + 1}</span><span class="phase-name">${escapeHtml(p.name)}</span><span class="phase-duration">${escapeHtml(p.duration)}</span></div>
                        <p class="phase-desc">${escapeHtml(p.description)}</p>
                    </li>`,
                )
                .join("")}</ol>`;

            return `
                <section class="cohort">
                    <h2 class="cohort-title">Cohort ${i + 1}: ${escapeHtml(capitalizeCohortName(name))}</h2>

                    <div class="section">
                        <h4 class="section-title"><span>Section 1</span> Cohort Context</h4>
                        <div class="field"><p class="field-label">Cohort Definition</p>${ctx?.definition ? `<p class="field-body">${escapeHtml(ctx.definition)}</p>` : `<p class="muted">Not available.</p>`}</div>
                        <div class="field"><p class="field-label">Hypothesis</p>${ctx?.hypothesis ? `<p class="field-body">${escapeHtml(ctx.hypothesis)}</p>` : `<p class="muted">Not available.</p>`}</div>
                        <div class="field"><p class="field-label">Key Research Objectives</p>${
                            ctx?.objectives?.length
                                ? `<ol class="ol">${ctx.objectives.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ol>`
                                : `<p class="muted">Not available.</p>`
                        }</div>
                    </div>

                    <div class="section">
                        <h4 class="section-title"><span>Section 2</span> Detailed Question Script</h4>
                        ${krqsHtml}
                        ${script ? `<p class="script-total">Estimated total: ~${formatMinutes(script.total_estimated_minutes)} min</p>` : ""}
                    </div>

                    <div class="section">
                        <h4 class="section-title"><span>Section 3</span> Screening & Logistics</h4>
                        <div class="metrics">
                            <div class="field"><p class="field-label">Number of Interviews</p><p class="field-body strong">${interviewCount}</p></div>
                            <div class="field"><p class="field-label">Interview Duration</p><p class="field-body strong">~${formatMinutes(duration)} min</p></div>
                        </div>
                        <div class="field"><p class="field-label">Screening Criteria</p>${criteriaHtml}</div>
                        <div class="field"><p class="field-label">Ideal Respondent Profile</p><p class="field-body">${escapeHtml(dummy.screening.idealProfile)}</p></div>
                    </div>

                    <div class="section">
                        <h4 class="section-title"><span>Section 4</span> Moderator Instructions</h4>
                        ${moderatorHtml}
                    </div>

                    <div class="section">
                        <h4 class="section-title"><span>Section 5</span> Interview Structure</h4>
                        ${structureHtml}
                    </div>
                </section>`;
        })
        .join("");

    const win = window.open("", "_blank", "width=900,height=1080");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)} — Study Brief</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; color: #18181b; background: #fff; padding: 48px 56px; line-height: 1.6; }
  .doc-title { font-size: 22px; font-weight: 700; color: #09090b; margin-bottom: 4px; }
  .doc-subtitle { font-size: 11px; color: #a1a1aa; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 40px; }
  hr.thick { border: none; border-top: 2px solid #e4e4e7; margin: 40px 0 32px; }
  .block { margin-bottom: 48px; }
  .block-title { font-size: 11px; font-weight: 700; color: #6366f1; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 20px; }
  .cohort { margin-bottom: 48px; padding-top: 32px; border-top: 2px solid #e4e4e7; page-break-before: auto; }
  .cohort-title { font-size: 17px; font-weight: 700; color: #09090b; margin-bottom: 28px; }
  .section { margin-bottom: 32px; page-break-inside: avoid; }
  .section-title { font-size: 11px; font-weight: 700; color: #52525b; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .section-title span { color: #a1a1aa; font-weight: 700; }
  .field { margin-bottom: 16px; }
  .field-label { font-size: 10px; font-weight: 600; color: #a1a1aa; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .field-body { font-size: 13px; color: #3f3f46; line-height: 1.65; }
  .field-body.strong { font-weight: 600; color: #18181b; }
  .muted { font-size: 12px; color: #a1a1aa; font-style: italic; }
  .ol { padding-left: 20px; }
  .ol li { margin-bottom: 8px; }
  .ol-title { font-weight: 600; color: #27272a; }
  .ol-desc { display: block; font-size: 12px; color: #71717a; margin-top: 2px; }
  .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }
  .krq-block { margin-bottom: 18px; }
  .krq-head { font-size: 13px; font-weight: 600; color: #18181b; padding-bottom: 6px; border-bottom: 1px solid #fecaca; margin-bottom: 10px; display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline; }
  .krq-tag { font-size: 10px; font-weight: 700; color: #e11d48; text-transform: uppercase; letter-spacing: 0.08em; }
  .krq-mins { font-size: 10px; font-weight: 700; color: #e11d48; background: #fff1f2; padding: 2px 8px; border-radius: 999px; border: 1px solid #fecdd3; margin-left: auto; }
  .questions { padding-left: 8px; list-style: none; }
  .questions > li { margin-bottom: 12px; }
  .q-text { font-size: 13px; color: #18181b; font-weight: 500; }
  .q-num { color: rgba(225, 29, 72, 0.7); font-weight: 700; margin-right: 4px; }
  .q-uncovers { font-size: 12px; color: #71717a; margin-top: 3px; padding-left: 14px; font-style: italic; }
  .q-uncovers em { font-style: normal; font-weight: 600; }
  .probes { padding-left: 14px; margin-top: 4px; list-style: none; }
  .probes li { font-size: 12px; color: #71717a; }
  .script-total { font-size: 13px; font-weight: 600; color: #3f3f46; padding-top: 10px; border-top: 1px solid #f4f4f5; margin-top: 12px; }
  .criteria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .chip { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; margin-bottom: 8px; }
  .chip-include { background: rgba(16, 185, 129, 0.1); color: #059669; }
  .chip-exclude { background: rgba(225, 29, 72, 0.1); color: #e11d48; }
  .bullets { list-style: none; padding: 0; }
  .bullets li { font-size: 13px; color: #3f3f46; margin-bottom: 5px; line-height: 1.5; }
  .phases { list-style: none; padding: 0; }
  .phases li { border: 1px solid #f4f4f5; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; background: #fafafa; page-break-inside: avoid; }
  .phase-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
  .phase-num { width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 999px; background: rgba(139, 92, 246, 0.1); color: #7c3aed; font-size: 11px; font-weight: 700; }
  .phase-name { font-size: 13px; font-weight: 600; color: #18181b; flex: 1; }
  .phase-duration { font-size: 10px; font-weight: 700; color: #7c3aed; background: rgba(139, 92, 246, 0.1); padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(139, 92, 246, 0.2); }
  .phase-desc { font-size: 12px; color: #52525b; line-height: 1.55; }
  @media print {
    body { padding: 28px 36px; }
    .cohort, .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
    <p class="doc-title">${escapeHtml(title)}</p>
    <p class="doc-subtitle">Study Brief</p>
    ${receivedHtml}
    ${cohortsHtml}
</body>
</html>`);

    win.document.close();
    win.focus();
    // Wait a tick for styles to settle before triggering the print dialog.
    setTimeout(() => {
        win.print();
    }, 300);
}
