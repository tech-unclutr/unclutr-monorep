"use client";

import React, { useEffect, useState } from "react";
import { SparklesIcon, CopyIcon, CheckIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { fetchCohortAgentPrompt } from "@/lib/executionPromptTemplate";

interface AgentPromptModalProps {
    open: boolean;
    onClose: () => void;
    cohorts: string[];
    studyId?: string;
    cohortIdByName: Record<string, string>;
}

export function AgentPromptModal({
    open,
    onClose,
    cohorts,
    studyId,
    cohortIdByName,
}: AgentPromptModalProps) {
    const [promptByCohort, setPromptByCohort] = useState<Record<string, string>>({});
    const [loadingCohort, setLoadingCohort] = useState<string | null>(null);
    const [errorByCohort, setErrorByCohort] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    // Reset transient UI state when the modal closes.
    useEffect(() => {
        if (!open) setCopied(false);
    }, [open]);

    // Default to the first cohort whenever the modal opens or cohorts change.
    useEffect(() => {
        if (!open) return;
        if (cohorts.length === 0) {
            setActiveTab(null);
            return;
        }
        if (!activeTab || !cohorts.includes(activeTab)) {
            setActiveTab(cohorts[0]);
        }
    }, [open, cohorts, activeTab]);

    // Fetch the active cohort's prompt on open / tab switch (cache by cohort name).
    useEffect(() => {
        if (!open || !activeTab || !studyId) return;
        const cohortId = cohortIdByName[activeTab];
        if (!cohortId) return;
        if (promptByCohort[activeTab]) return;

        let cancelled = false;
        setLoadingCohort(activeTab);
        setErrorByCohort((prev) => {
            if (!prev[activeTab]) return prev;
            const next = { ...prev };
            delete next[activeTab];
            return next;
        });

        fetchCohortAgentPrompt(studyId, cohortId)
            .then((prompt) => {
                if (cancelled) return;
                setPromptByCohort((prev) => ({ ...prev, [activeTab]: prompt }));
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                const msg = e instanceof Error ? e.message : "Failed to load prompt";
                setErrorByCohort((prev) => ({ ...prev, [activeTab]: msg }));
            })
            .finally(() => {
                if (!cancelled) setLoadingCohort((curr) => (curr === activeTab ? null : curr));
            });

        return () => {
            cancelled = true;
        };
    }, [open, activeTab, studyId, cohortIdByName, promptByCohort]);

    // Reset cache when the modal closes so a re-open fetches fresh data.
    useEffect(() => {
        if (open) return;
        setPromptByCohort({});
        setErrorByCohort({});
        setLoadingCohort(null);
    }, [open]);

    const activePrompt = activeTab ? promptByCohort[activeTab] : undefined;
    const activeError = activeTab ? errorByCohort[activeTab] : undefined;
    const isLoadingActive = loadingCohort === activeTab;
    const canCopy = !isLoadingActive && !activeError && !!activePrompt;

    const handleCopy = async () => {
        if (!activePrompt) return;
        try {
            await navigator.clipboard.writeText(activePrompt);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard write failed (rare — usually a permission issue); silently no-op.
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-4xl w-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                                <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                                    Agent Prompt
                                </DialogTitle>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-0.5">
                                    System prompt rendered per cohort
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!canCopy}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all mr-6",
                                canCopy
                                    ? "text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white active:scale-[0.98]"
                                    : "text-gray-300 dark:text-zinc-600 border-gray-100 dark:border-white/5 cursor-not-allowed",
                            )}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-3.5 h-3.5" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </DialogHeader>

                {/* Cohort Tabs */}
                {cohorts.length > 0 && (
                    <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 px-8">
                        {cohorts.map((c) => {
                            const isActive = activeTab === c;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setActiveTab(c)}
                                    className={cn(
                                        "relative px-4 py-2.5 text-xs font-semibold transition-colors duration-200 whitespace-nowrap",
                                        isActive
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300",
                                    )}
                                >
                                    {capitalizeCohortName(c)}
                                    {isActive && (
                                        <motion.div
                                            layoutId="agent-prompt-tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 dark:bg-amber-400"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="overflow-y-auto max-h-[70vh] scrollbar-subtle">
                    {cohorts.length === 0 ? (
                        <EmptyState />
                    ) : !studyId ? (
                        <ErrorState message="Study context missing — open this from the Study Planner flow." />
                    ) : activeTab && !cohortIdByName[activeTab] ? (
                        <ErrorState message="This cohort hasn't been saved yet. Generate cohorts first." />
                    ) : isLoadingActive ? (
                        <LoadingState />
                    ) : activeError ? (
                        <ErrorState message={activeError} />
                    ) : activePrompt ? (
                        <div className="px-8 py-6">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    Cohort
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {activeTab ? capitalizeCohortName(activeTab) : ""}
                                </span>
                            </div>
                            <pre className="text-[12.5px] leading-relaxed text-gray-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                                {activePrompt}
                            </pre>
                        </div>
                    ) : (
                        <LoadingState />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LoadingState() {
    return (
        <div className="px-8 py-12 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="h-3 w-full rounded bg-gray-100 dark:bg-white/5 animate-pulse"
                />
            ))}
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="px-8 py-12 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">
                Couldn&rsquo;t load the agent prompt
            </p>
            <p className="text-xs text-muted-foreground mt-2">{message}</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="px-8 py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-semibold">
                No cohorts available
            </p>
            <p className="text-xs text-muted-foreground mt-2">
                Upload leads to see per-cohort agent prompts.
            </p>
        </div>
    );
}
