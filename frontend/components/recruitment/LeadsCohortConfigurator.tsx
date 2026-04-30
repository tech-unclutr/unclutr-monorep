"use client";

import React, { useMemo, useEffect, useState } from "react";
import { UsersIcon, BookOpenIcon, SparklesIcon, Loader2 } from "lucide-react";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { type StudyContext } from "./ExecutionPromptView";
import { useRecruitment } from "./RecruitmentContext";
import { CohortBriefSections } from "./CohortBriefSections";
import { BriefPreviewModal } from "./BriefPreviewModal";
import { AgentPromptModal } from "./AgentPromptModal";
import type { CohortBriefData } from "./cohort-brief/useCohortBrief";
import type {
    PreviewBrief,
    PreviewBriefCohort,
    PreviewBriefStudy,
} from "./preview-brief-model";

interface LeadsCohortConfiguratorProps {
    onBack: () => void;
    className?: string;
    studyContext?: StudyContext;
}

export function LeadsCohortConfigurator({
    onBack,
    className,
    studyContext,
}: LeadsCohortConfiguratorProps) {
    const { extractedLeads: leads } = useRecruitment();

    // ── Derive cohorts from leads ───────────────────────────────────────

    const { cohorts, cohortCounts, cohortIdByName } = useMemo(() => {
        const counts: Record<string, number> = {};
        const idByName: Record<string, string> = {};
        leads.forEach((lead) => {
            const c = lead.cohort || "Default";
            counts[c] = (counts[c] || 0) + 1;
            if (lead.cohort_id && !idByName[c]) idByName[c] = lead.cohort_id;
        });
        return {
            cohorts: Object.keys(counts),
            cohortCounts: counts,
            cohortIdByName: idByName,
        };
    }, [leads]);

    // ── Active tab ──────────────────────────────────────────────────────

    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewModel, setPreviewModel] = useState<PreviewBrief | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [agentPromptOpen, setAgentPromptOpen] = useState(false);

    // ── Preview brief: fetch on click, then open modal ──────────────────

    const handleOpenPreview = async () => {
        const studyId = studyContext?.studyId;
        if (!studyId || cohorts.length === 0 || previewLoading) return;

        setPreviewLoading(true);
        try {
            const cohortsWithIds = cohorts
                .filter((name) => cohortIdByName[name])
                .map((name) => ({ name, cohortId: cohortIdByName[name] }));

            const studyPromise = api
                .get(`/study-planner/studies/${studyId}`)
                .catch(() => null) as Promise<PreviewBriefStudy | null>;

            const briefPromises = cohortsWithIds.map(({ name, cohortId }) =>
                api
                    .get(
                        `/study-planner/studies/${studyId}/cohorts/${cohortId}/brief`,
                    )
                    .then((data: CohortBriefData) => ({ name, cohortId, brief: data }))
                    .catch(() => ({ name, cohortId, brief: null })),
            );

            const [study, cohortsList] = await Promise.all([
                studyPromise,
                Promise.all(briefPromises),
            ]);

            const resolvedTitle =
                study?.title || studyContext?.title || "Research Study";

            const model: PreviewBrief = {
                studyId,
                title: resolvedTitle,
                study: study ?? {
                    title: studyContext?.title,
                    briefing: studyContext?.briefing,
                    topic_guide: studyContext?.objectives
                        ? { objectives: studyContext.objectives }
                        : undefined,
                },
                cohorts: cohortsList satisfies PreviewBriefCohort[],
            };

            setPreviewModel(model);
            setPreviewOpen(true);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        if (!activeTab && cohorts.length > 0) setActiveTab(cohorts[0]);
    }, [cohorts, activeTab]);

    const activeCohortId = activeTab ? cohortIdByName[activeTab] : undefined;

    // ── Render ──────────────────────────────────────────────────────────

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
                                    Review the cohort brief for each uploaded cohort.
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
                                <CohortBriefSections
                                    cohort={activeTab}
                                    studyId={studyContext?.studyId}
                                    cohortId={activeCohortId}
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
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleOpenPreview}
                                disabled={
                                    previewLoading ||
                                    !studyContext?.studyId ||
                                    cohorts.length === 0
                                }
                                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-gray-900 font-semibold text-xs uppercase tracking-wide px-5 rounded-xl shadow-sm active:scale-[0.98] transition-all inline-flex items-center gap-2"
                            >
                                {previewLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <BookOpenIcon className="w-3.5 h-3.5" />
                                )}
                                Preview Brief
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setAgentPromptOpen(true)}
                                disabled={!studyContext?.studyId || cohorts.length === 0}
                                className="font-semibold text-xs uppercase tracking-wide px-5 rounded-xl shadow-sm active:scale-[0.98] transition-all inline-flex items-center gap-2"
                            >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                Get Agent Prompt
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
            <BriefPreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                model={previewModel}
            />
            <AgentPromptModal
                open={agentPromptOpen}
                onClose={() => setAgentPromptOpen(false)}
                cohorts={cohorts}
                studyId={studyContext?.studyId}
                cohortIdByName={cohortIdByName}
            />
        </Card>
    );
}
