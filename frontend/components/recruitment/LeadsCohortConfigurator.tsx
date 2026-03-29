"use client";

import React, { useMemo, useEffect } from "react";
import {
    UsersIcon,
    LayoutGrid,
} from "lucide-react";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getUniqueCohortAvatars } from "@/lib/avatar-utils";
import { motion, AnimatePresence } from "framer-motion";
import { InterviewBuilder } from "@/app/dashboard/playground/components/InterviewBuilder";
import { useRecruitment } from "./RecruitmentContext";

interface LeadsCohortConfiguratorProps {
    onBack: () => void;
    onComplete: () => void;
    className?: string;
}

export function LeadsCohortConfigurator({
    onBack,
    onComplete,
    className,
}: LeadsCohortConfiguratorProps) {
    const { extractedLeads: leads } = useRecruitment();

    // ── Derive cohorts from leads ─────────────────────────────────────────

    const { cohorts, cohortCounts } = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach((lead) => {
            const c = lead.cohort || "Default";
            counts[c] = (counts[c] || 0) + 1;
        });
        return {
            cohorts: Object.keys(counts),
            cohortCounts: counts,
        };
    }, [leads]);

    const assignedAvatars = useMemo(() => getUniqueCohortAvatars(cohorts), [cohorts]);

    // ── State ─────────────────────────────────────────────────────────────

    const {
        selectedCohorts, setSelectedCohorts,
        activeCohort, setActiveCohort,
        getCohortCategories, setCohortCategories,
        getCohortIncentives, setCohortIncentives,
    } = useRecruitment();

    // Auto-select first cohort on mount if nothing selected
    useEffect(() => {
        if (selectedCohorts.length === 0 && cohorts.length > 0) {
            setSelectedCohorts([cohorts[0]]);
            setActiveCohort(cohorts[0]);
        }
    }, [cohorts, selectedCohorts.length, setSelectedCohorts, setActiveCohort]);

    const currentCohort = activeCohort || selectedCohorts[0] || null;

    const toggleCohort = (c: string) => {
        const isSelected = selectedCohorts.includes(c);
        if (isSelected) {
            // Already selected — just focus it
            setActiveCohort(c);
        } else {
            // Select and focus
            setSelectedCohorts((prev) => [...prev, c]);
            setActiveCohort(c);
        }
    };

    const deselectCohort = (c: string) => {
        setSelectedCohorts((prev) => prev.filter((sc) => sc !== c));
        if (activeCohort === c) {
            const remaining = selectedCohorts.filter((sc) => sc !== c);
            setActiveCohort(remaining[0] || null);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
        )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(16,185,129,0.04),transparent_50%)]" />
            </div>

            <CardContent className="p-6 md:p-8 flex flex-col relative z-10 min-h-0 flex-1">
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                <UsersIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Configure Cohorts</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Select cohorts and set engagement targets for {leads.length} leads.
                                </p>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                {cohorts.length} cohort{cohorts.length !== 1 ? "s" : ""} detected
                            </span>
                        </div>
                    </div>

                    {/* Cohort Selection */}
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {cohorts.map((c) => {
                            const isSelected = selectedCohorts.includes(c);
                            const isActive = currentCohort === c;
                            const avatarIdx = assignedAvatars[c] || 1;

                            return (
                                <button
                                    key={c}
                                    onClick={() => toggleCohort(c)}
                                    onDoubleClick={() => { if (isSelected) deselectCohort(c); }}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-3xl transition-all duration-300 min-w-[140px]",
                                        isSelected
                                            ? isActive
                                                ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 scale-105"
                                                : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-md"
                                            : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                    )}
                                >
                                    <Avatar className="w-12 h-12 border-2 border-white/20">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=cohort-${avatarIdx}&backgroundColor=e0e7ff`} />
                                    </Avatar>
                                    <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">
                                        {capitalizeCohortName(c)}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-bold",
                                        isSelected ? "opacity-80" : "text-gray-400",
                                    )}>
                                        {cohortCounts[c]} leads
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Cohort Detail */}
                    <div className="flex-1 min-h-0 mt-4">
                        <AnimatePresence mode="wait">
                            {currentCohort && selectedCohorts.includes(currentCohort) ? (
                                <motion.div
                                    key={currentCohort}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col gap-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                            Strategy for {capitalizeCohortName(currentCohort)}
                                        </h3>
                                        <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                                            <UsersIcon className="w-4 h-4 text-indigo-500" />
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                                {cohortCounts[currentCohort]} Leads Available
                                            </span>
                                        </div>
                                    </div>

                                    {/* Interview Builder */}
                                    <div className="mt-2">
                                        <InterviewBuilder
                                            categories={getCohortCategories(currentCohort)}
                                            onCategoriesChange={(c) => setCohortCategories(currentCohort, c)}
                                            bucketIncentives={getCohortIncentives(currentCohort)}
                                            onBucketIncentivesChange={(i) => setCohortIncentives(currentCohort, i)}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-1 flex flex-col items-center justify-center py-16 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]"
                                >
                                    <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-[10px]">
                                        {cohorts.length > 1
                                            ? "Select a cohort to begin configuration"
                                            : "Click on the cohort above to configure it"}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                            disabled={selectedCohorts.length === 0}
                            onClick={() => onComplete()}
                            className={cn(
                                "rounded-xl h-11 px-8 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0",
                                selectedCohorts.length > 0
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 ring-4 ring-indigo-500/10"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/10",
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span>Continue with {selectedCohorts.length} Cohort{selectedCohorts.length !== 1 ? "s" : ""}</span>
                            </span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
