"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
    Zap,
    Users,
    MessageSquare,
    Mic,
    Copy,
    CheckIcon,
    ArrowLeft,
} from "lucide-react";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecruitment } from "./RecruitmentContext";
import { buildExecutionPrompt, fetchPromptTemplate } from "@/lib/executionPromptTemplate";

export interface StudyContext {
    title: string;
    briefing?: string;
    objectives?: Array<{
        title: string;
        description?: string;
        questions: Array<{ text: string; type: string }>;
    }>;
}

interface ExecutionPromptViewProps {
    onBack: () => void;
    onExecute: () => void;
    className?: string;
    studyContext?: StudyContext;
}

export function ExecutionPromptView({
    onBack,
    onExecute,
    className,
    studyContext,
}: ExecutionPromptViewProps) {
    const { extractedLeads: leads, selectedCohorts, getCohortCategories, getCohortIncentives, cohortInterviews, cohortIncentives } = useRecruitment();
    const [copied, setCopied] = React.useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");

    useEffect(() => {
        fetchPromptTemplate().then(setPromptTemplate).catch(console.error);
    }, []);

    // ── Derive stats ──────────────────────────────────────────────────────

    const cohortBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach((lead) => {
            const c = lead.cohort || "Default";
            if (selectedCohorts.includes(c)) {
                counts[c] = (counts[c] || 0) + 1;
            }
        });
        return counts;
    }, [leads, selectedCohorts]);

    const totalSelectedLeads = Object.values(cohortBreakdown).reduce((a, b) => a + b, 0);

    const totalSelectedQuestions = useMemo(() => {
        let count = 0;
        selectedCohorts.forEach((c) => {
            const cat = getCohortCategories(c);
            count += [...cat.chat, ...cat.audioA, ...cat.audioB, ...cat.audioC].filter((q) => q.selected).length;
        });
        return count;
    }, [selectedCohorts, cohortInterviews, getCohortCategories]);

    // ── Build prompt ──────────────────────────────────────────────────────

    const prompt = useMemo(() =>
        promptTemplate ? buildExecutionPrompt(promptTemplate, { studyContext, selectedCohorts, getCohortCategories, getCohortIncentives }) : "",
    [promptTemplate, studyContext, selectedCohorts, cohortInterviews, cohortIncentives, getCohortCategories, getCohortIncentives]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
        )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(245,158,11,0.04),transparent_50%)]" />
            </div>

            <CardContent className="p-6 md:p-8 flex flex-col relative z-10 min-h-0 flex-1">
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Execution Prompt</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Review the compiled prompt before sending to the execution engine.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleCopy}
                            className={cn(
                                "rounded-xl px-4 h-9 text-xs font-bold uppercase tracking-wide transition-all",
                                copied
                                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5",
                            )}
                        >
                            {copied ? (
                                <><CheckIcon className="w-3.5 h-3.5 mr-1.5" /> Copied</>
                            ) : (
                                <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Prompt</>
                            )}
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-zinc-900 dark:text-white tabular-nums">{totalSelectedLeads}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Leads</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-zinc-900 dark:text-white tabular-nums">{selectedCohorts.length}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cohorts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                <Mic className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-zinc-900 dark:text-white tabular-nums">{totalSelectedQuestions}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Questions</p>
                            </div>
                        </div>
                    </div>

                    {/* Cohort Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {selectedCohorts.map((c) => (
                            <div
                                key={c}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                                    {capitalizeCohortName(c)}
                                </span>
                                <span className="text-[10px] font-medium text-indigo-400 dark:text-indigo-500">
                                    {cohortBreakdown[c] || 0}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Prompt Block */}
                    <div className="flex-1 min-h-0 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                    Execution Engine Prompt
                                </span>
                            </div>
                            <span className="text-[10px] font-medium text-zinc-400">
                                {prompt.split("\n").length} lines
                            </span>
                        </div>
                        <div className="p-5 overflow-y-auto max-h-[400px] scrollbar-subtle">
                            <pre className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                                {prompt}
                            </pre>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white font-semibold text-xs uppercase tracking-wide px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                            Back
                        </Button>

                        <Button
                            type="button"
                            onClick={onExecute}
                            className="rounded-xl h-11 px-8 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/25 ring-4 ring-amber-500/10"
                        >
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                <span>Launch Execution</span>
                            </span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
