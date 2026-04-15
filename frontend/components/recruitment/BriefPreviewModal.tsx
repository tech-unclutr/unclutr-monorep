"use client";

import React, { useRef } from "react";
import { BookOpenIcon, UsersIcon, MessageSquareIcon, MicIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { INTERVIEW_TYPE_LABELS } from "@/lib/executionPromptTemplate";
import { type StudyContext } from "./ExecutionPromptView";
import { type InterviewQuestion } from "@/app/dashboard/playground/components/InterviewBuilder";

interface InterviewCategories {
    chat: InterviewQuestion[];
    audioA: InterviewQuestion[];
    audioB: InterviewQuestion[];
    audioC: InterviewQuestion[];
}

interface BriefPreviewModalProps {
    open: boolean;
    onClose: () => void;
    studyContext?: StudyContext;
    cohorts: string[];
    cohortCounts: Record<string, number>;
    getCohortCategories: (cohort: string) => InterviewCategories;
}

const BUCKET_KEYS = ["chat", "audioA", "audioB", "audioC"] as const;

const TYPE_BADGE_COLORS: Record<string, string> = {
    "open-ended": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    "close-ended": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    "scale": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

function BucketIcon({ bucket }: { bucket: string }) {
    if (bucket === "chat") return <MessageSquareIcon className="w-3.5 h-3.5" />;
    return <MicIcon className="w-3.5 h-3.5" />;
}

export function BriefPreviewModal({
    open,
    onClose,
    studyContext,
    cohorts,
    cohortCounts,
    getCohortCategories,
}: BriefPreviewModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    // Only show cohorts that have at least one selected question
    const activeCohorts = cohorts.filter((cohort) => {
        const cats = getCohortCategories(cohort);
        return BUCKET_KEYS.some((b) => cats[b].some((q) => q.selected));
    });

    const handleDownloadPdf = () => {
        const printWindow = window.open("", "_blank", "width=860,height=1000");
        if (!printWindow) return;

        const title = studyContext?.title || "Research Study";

        // ── Research brief section ──────────────────────────────────────
        let briefHtml = "";
        if (studyContext?.briefing) {
            briefHtml += `<p class="briefing">${studyContext.briefing.replace(/\n/g, "<br/>")}</p>`;
        }
        if (studyContext?.objectives?.length) {
            briefHtml += `<p class="section-label" style="margin-top:14px;">Objectives</p><ol class="objectives">`;
            studyContext.objectives.forEach((obj) => {
                briefHtml += `<li><span class="obj-title">${obj.title}</span>`;
                if (obj.description) briefHtml += `<span class="obj-desc">${obj.description}</span>`;
                briefHtml += `</li>`;
            });
            briefHtml += `</ol>`;
        }

        // ── Per-cohort sections ─────────────────────────────────────────
        let cohortsHtml = "";
        activeCohorts.forEach((cohort) => {
            const cats = getCohortCategories(cohort);
            const count = cohortCounts[cohort];
            let bucketsHtml = "";

            BUCKET_KEYS.forEach((bucket) => {
                const selected = cats[bucket].filter((q) => q.selected);
                if (!selected.length) return;
                bucketsHtml += `<div class="bucket">`;
                bucketsHtml += `<p class="bucket-label">${INTERVIEW_TYPE_LABELS[bucket]} <span class="bucket-count">(${selected.length})</span></p>`;
                bucketsHtml += `<ol class="questions">`;
                selected.forEach((q) => {
                    bucketsHtml += `<li>
                    <span class="q-text">${q.text}</span> <span class="q-type">[${q.type}]</span>
                    ${q.context ? `<span class="q-context">${q.context}</span>` : ""}
                    ${q.participantCount ? `<span class="q-participants">${q.participantCount} participants suggested</span>` : ""}
                </li>`;
                });
                bucketsHtml += `</ol></div>`;
            });

            cohortsHtml += `
            <div class="cohort-block">
                <div class="cohort-header">
                    <span class="cohort-name">${cohort.charAt(0).toUpperCase() + cohort.slice(1)}</span>
                    <span class="cohort-meta">${count} lead${count !== 1 ? "s" : ""}</span>
                </div>
                ${bucketsHtml}
            </div>`;
        });

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${title} — Brief</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 13px; color: #18181b; background: #fff; padding: 48px 56px; line-height: 1.7; }
  .doc-title { font-family: system-ui, sans-serif; font-size: 22px; font-weight: 700; color: #09090b; margin-bottom: 4px; }
  .doc-subtitle { font-family: system-ui, sans-serif; font-size: 11px; color: #a1a1aa; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 36px; }
  .section-title { font-family: system-ui, sans-serif; font-size: 10px; font-weight: 700; color: #a1a1aa; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
  .section-label { font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #a1a1aa; letter-spacing: 0.08em; text-transform: uppercase; }
  hr { border: none; border-top: 1px solid #e4e4e7; margin: 28px 0; }
  .briefing { font-size: 13.5px; color: #3f3f46; line-height: 1.8; margin-bottom: 8px; }
  .objectives { padding-left: 18px; margin-top: 8px; }
  .objectives li { margin-bottom: 8px; }
  .obj-title { font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; color: #27272a; display: block; }
  .obj-desc { font-size: 12px; color: #71717a; display: block; margin-top: 2px; }
  .cohort-block { margin-bottom: 28px; page-break-inside: avoid; }
  .cohort-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #18181b; padding-bottom: 6px; margin-bottom: 14px; }
  .cohort-name { font-family: system-ui, sans-serif; font-size: 15px; font-weight: 700; color: #09090b; }
  .cohort-meta { font-family: system-ui, sans-serif; font-size: 11px; color: #a1a1aa; }
  .bucket { margin-bottom: 14px; }
  .bucket-label { font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; color: #52525b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
  .bucket-count { font-weight: 400; color: #a1a1aa; }
  .questions { padding-left: 20px; }
  .questions li { font-size: 13px; color: #3f3f46; margin-bottom: 12px; line-height: 1.6; }
  .q-type { font-family: system-ui, sans-serif; font-size: 10px; color: #a1a1aa; }
  .q-context { display: block; font-size: 12px; color: #71717a; font-style: italic; margin-top: 3px; line-height: 1.5; }
  .q-participants { display: block; font-family: system-ui, sans-serif; font-size: 11px; color: #6366f1; margin-top: 2px; }
  @media print { body { padding: 24px 32px; } }
</style>
</head>
<body>
  <p class="doc-title">${title}</p>
  <p class="doc-subtitle">Research Brief</p>

  <p class="section-title">Research Brief</p>
  ${briefHtml || '<p style="color:#a1a1aa;font-size:13px;">No research brief provided.</p>'}

  ${cohortsHtml ? `<hr/><p class="section-title">Cohort Questions</p><div style="margin-top:20px;">${cohortsHtml}</div>` : ""}
</body>
</html>`);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl w-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                <BookOpenIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                                    Brief Preview
                                </DialogTitle>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-0.5">
                                    What feeds into agent prompt creation
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadPdf}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all mr-6"
                        >
                            Download PDF
                        </button>
                    </div>
                </DialogHeader>

                <div ref={printRef} className="overflow-y-auto max-h-[65vh] scrollbar-subtle px-6 py-5 space-y-5">

                    {/* Research Brief */}
                    <section>
                        <h4 className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                            Research Brief
                        </h4>
                        <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-4 space-y-3">
                            {studyContext?.title && (
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {studyContext.title}
                                </p>
                            )}
                            {studyContext?.briefing ? (
                                <p className="text-[13px] text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                    {studyContext.briefing}
                                </p>
                            ) : (
                                <p className="text-[13px] text-gray-400 dark:text-zinc-600 italic">
                                    No research brief provided.
                                </p>
                            )}
                            {studyContext?.objectives && studyContext.objectives.length > 0 && (
                                <div className="pt-2 border-t border-gray-100 dark:border-white/[0.05] space-y-2">
                                    <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
                                        Objectives
                                    </p>
                                    <ol className="space-y-1.5 list-none">
                                        {studyContext.objectives.map((obj, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-0.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="text-[13px] font-medium text-gray-700 dark:text-zinc-300">
                                                        {obj.title}
                                                    </p>
                                                    {obj.description && (
                                                        <p className="text-[12px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                                            {obj.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Per-cohort sections */}
                    {activeCohorts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] p-6 text-center">
                            <p className="text-[13px] text-gray-400 dark:text-zinc-500">
                                No questions selected yet. Select questions for your cohorts to see them here.
                            </p>
                        </div>
                    ) : (
                        <section className="space-y-4">
                            <h4 className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                                Cohort Questions
                            </h4>
                            {activeCohorts.map((cohort) => {
                                const cats = getCohortCategories(cohort);
                                const totalSelected = BUCKET_KEYS.reduce(
                                    (sum, b) => sum + cats[b].filter((q) => q.selected).length,
                                    0,
                                );

                                return (
                                    <div
                                        key={cohort}
                                        className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden"
                                    >
                                        {/* Cohort header */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.04]">
                                            <div className="flex items-center gap-2">
                                                <UsersIcon className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                                                    {capitalizeCohortName(cohort)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                                                    {cohortCounts[cohort]} lead{cohortCounts[cohort] !== 1 ? "s" : ""}
                                                </span>
                                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                                    {totalSelected}q
                                                </span>
                                            </div>
                                        </div>

                                        {/* Buckets */}
                                        <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                                            {BUCKET_KEYS.map((bucket) => {
                                                const selected = cats[bucket].filter((q) => q.selected);
                                                if (!selected.length) return null;
                                                return (
                                                    <div key={bucket} className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <BucketIcon bucket={bucket} />
                                                            <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                                                                {INTERVIEW_TYPE_LABELS[bucket]}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 dark:text-zinc-600">
                                                                ({selected.length})
                                                            </span>
                                                        </div>
                                                        <ol className="space-y-4">
                                                            {selected.map((q, i) => (
                                                                <li key={q.id} className="flex items-start gap-3">
                                                                    <span className="text-[11px] font-medium text-gray-300 dark:text-zinc-600 mt-0.5 w-4 flex-shrink-0 text-right">
                                                                        {i + 1}.
                                                                    </span>
                                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <span className="text-[13px] font-medium text-gray-800 dark:text-zinc-200 leading-snug">
                                                                                {q.text}
                                                                            </span>
                                                                            <Badge
                                                                                className={cn(
                                                                                    "text-[10px] px-1.5 py-0 rounded-full font-semibold border-0 flex-shrink-0 mt-0.5",
                                                                                    TYPE_BADGE_COLORS[q.type] ?? "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
                                                                                )}
                                                                            >
                                                                                {q.type}
                                                                            </Badge>
                                                                        </div>
                                                                        {q.context && (
                                                                            <p className="text-[12px] text-gray-400 dark:text-zinc-500 leading-relaxed italic">
                                                                                {q.context}
                                                                            </p>
                                                                        )}
                                                                        {q.participantCount && (
                                                                            <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">
                                                                                {q.participantCount} participants suggested
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
