"use client";

import React, { useMemo, useEffect, useState } from "react";
import { UsersIcon } from "lucide-react";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { InterviewBuilder, initializeCategories, type InterviewQuestion } from "@/app/dashboard/playground/components/InterviewBuilder";
import { api } from "@/lib/api";
import { type StudyContext } from "./ExecutionPromptView";
import { useRecruitment } from "./RecruitmentContext";

interface DbQuestion {
    id: string;
    text: string;
    type: string;
    context?: string;
    interview_mode?: string;
    participant_count?: number;
    sort_order: number;
    meta_data?: { objective_title?: string };
}

interface LeadsCohortConfiguratorProps {
    onBack: () => void;
    onComplete: () => void;
    className?: string;
    studyContext?: StudyContext;
}

export function LeadsCohortConfigurator({
    onBack,
    onComplete,
    className,
    studyContext,
}: LeadsCohortConfiguratorProps) {
    const {
        extractedLeads: leads,
        setSelectedCohorts,
        getCohortCategories, setCohortCategories,
        getCohortIncentives, setCohortIncentives,
        cohortInterviews,
    } = useRecruitment();

    // ── Derive cohorts from leads ───────────────────────────────────────

    const { cohorts, cohortCounts } = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach((lead) => {
            const c = lead.cohort || "Default";
            counts[c] = (counts[c] || 0) + 1;
        });
        return { cohorts: Object.keys(counts), cohortCounts: counts };
    }, [leads]);

    // ── Active tab ──────────────────────────────────────────────────────

    const [activeTab, setActiveTab] = useState<string | null>(null);

    // Default to first cohort
    useEffect(() => {
        if (!activeTab && cohorts.length > 0) setActiveTab(cohorts[0]);
    }, [cohorts, activeTab]);

    // ── Fetch questions from DB ─────────────────────────────────────────

    const [dbQuestions, setDbQuestions] = useState<InterviewQuestion[]>([]);

    useEffect(() => {
        if (!studyContext?.studyId) return;
        api.get(`/study-planner/studies/${studyContext.studyId}/questions`)
            .then((data: DbQuestion[]) => {
                setDbQuestions(data.map((q) => ({
                    id: q.id,
                    text: q.text,
                    type: (q.type?.replace("_", "-") || "open-ended") as InterviewQuestion["type"],
                    interviewMode: (q.interview_mode || "chat") as InterviewQuestion["interviewMode"],
                    objective: q.meta_data?.objective_title,
                    selected: false,
                })));
            })
            .catch(() => setDbQuestions([]));
    }, [studyContext?.studyId]);

    // Initialize categories for cohorts that don't have them yet
    useEffect(() => {
        if (dbQuestions.length === 0) return;
        const cats = initializeCategories(dbQuestions);
        cohorts.forEach((c) => {
            if (!cohortInterviews[c]) setCohortCategories(c, cats);
        });
    }, [cohorts, dbQuestions]);

    // Cohorts that have at least 1 question selected
    const readyCohorts = cohorts.filter((c) => {
        const cats = getCohortCategories(c);
        return [...cats.chat, ...cats.audioA, ...cats.audioB, ...cats.audioC].some((q) => q.selected);
    });

    const canContinue = readyCohorts.length > 0;

    const handleStartExecution = () => {
        setSelectedCohorts(readyCohorts);
        onComplete();
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
        )}>
            <CardContent className="p-6 md:p-8 flex flex-col relative z-10 min-h-0 flex-1">
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                <UsersIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Configure Cohorts</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Select questions for each cohort across interview types.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cohort Tabs */}
                    <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
                        {cohorts.map((c) => {
                            const isActive = activeTab === c;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setActiveTab(c)}
                                    className={cn(
                                        "relative px-4 py-2.5 text-xs font-semibold transition-colors duration-200 whitespace-nowrap",
                                        isActive
                                            ? "text-indigo-600 dark:text-indigo-400"
                                            : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300",
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {capitalizeCohortName(c)}
                                        <span className={cn(
                                            "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full",
                                            isActive
                                                ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                                : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500",
                                        )}>
                                            {cohortCounts[c]}
                                        </span>
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="cohort-tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 dark:bg-indigo-400"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Cohort Content */}
                    <div className="flex-1 min-h-0">
                        {activeTab && (
                            <div key={activeTab}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {capitalizeCohortName(activeTab)}
                                    </h3>
                                    <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                                        <UsersIcon className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                                            {cohortCounts[activeTab]} lead{cohortCounts[activeTab] !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>
                                <InterviewBuilder
                                    categories={getCohortCategories(activeTab)}
                                    onCategoriesChange={(c) => setCohortCategories(activeTab, c)}
                                    bucketIncentives={getCohortIncentives(activeTab)}
                                    onBucketIncentivesChange={(i) => setCohortIncentives(activeTab, i)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white font-semibold text-xs uppercase tracking-wide px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                        >
                            Back
                        </Button>

                        <Button
                            type="button"
                            disabled={!canContinue}
                            onClick={handleStartExecution}
                            className={cn(
                                "rounded-xl h-11 px-8 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0",
                                canContinue
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 ring-4 ring-indigo-500/10"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/10",
                            )}
                        >
                            Start Execution
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
