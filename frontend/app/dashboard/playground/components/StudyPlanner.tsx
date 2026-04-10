"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Users, CheckCircle2, Radio } from "lucide-react";
import { StudyHomePage } from "@/components/study-designer/StudyHomePage";
import { RecruitmentPage } from "@/components/recruitment/RecruitmentPage";
import { RecruitmentProvider } from "@/components/recruitment/RecruitmentContext";
import { type StudyContext } from "@/components/recruitment/ExecutionPromptView";
import { type StudyState } from "@/components/study-designer/types";
import { VoiceSandbox } from "@/components/voice-sandbox/VoiceSandbox";

type Phase = "design" | "recruit" | "execute";

const PHASES = [
    { key: "design" as const, label: "Study Design", icon: BookOpen },
    { key: "recruit" as const, label: "Recruitment", icon: Users },
    { key: "execute" as const, label: "Execution", icon: Radio },
];

export function StudyPlanner() {
    const [phase, setPhase] = useState<Phase>("design");
    const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());
    const [studyContext, setStudyContext] = useState<StudyContext | undefined>(undefined);

    const markComplete = (p: Phase) => {
        setCompletedPhases((prev) => new Set(prev).add(p));
    };

    const handleStudyUpdate = useCallback((study: StudyState) => {
        if (!study.title) return;
        setStudyContext({
            studyId: study.id,
            title: study.title,
            briefing: study.briefing || undefined,
            objectives: study.topicGuide.objectives.map((o) => ({
                title: o.title,
                description: o.description || undefined,
                questions: o.questions.map((q) => ({ text: q.text, type: q.type })),
            })),
        });
    }, []);

    const phaseIndex = PHASES.findIndex((p) => p.key === phase);

    const hasStudy = !!studyContext;

    return (
        <div className="h-full flex flex-col">
            {/* Phase Stepper — only show after a study is selected */}
            {hasStudy && (
                <div className="shrink-0 border-b border-gray-100 dark:border-[#27272A] bg-background/80 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-3">
                            {PHASES.map((p, i) => {
                                const isActive = phase === p.key;
                                const isCompleted = completedPhases.has(p.key);
                                const Icon = p.icon;

                                return (
                                    <React.Fragment key={p.key}>
                                        {i > 0 && (
                                            <div className={cn(
                                                "flex-1 h-px max-w-[80px] transition-colors duration-300",
                                                i <= phaseIndex || isCompleted
                                                    ? "bg-indigo-500"
                                                    : "bg-gray-200 dark:bg-zinc-800",
                                            )} />
                                        )}
                                        <button
                                            onClick={() => setPhase(p.key)}
                                            className={cn(
                                                "flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                    : isCompleted
                                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                                                        : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                            )}
                                        >
                                            {isCompleted && !isActive ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                <Icon className="w-4 h-4" />
                                            )}
                                            <span className="text-xs font-bold uppercase tracking-wide">{p.label}</span>
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Phase Content */}
            <div className="flex-1 min-h-0">
                {phase === "design" && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 min-h-0">
                            <StudyHomePage onStudyUpdate={handleStudyUpdate} activeStudyId={studyContext?.studyId} />
                        </div>
                        {hasStudy && (
                            <div className="shrink-0 border-t border-gray-100 dark:border-[#27272A] px-6 py-4 flex justify-end bg-background/80 backdrop-blur-sm">
                                <button
                                    onClick={() => {
                                        markComplete("design");
                                        setPhase("recruit");
                                    }}
                                    className="rounded-xl h-10 px-6 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Continue to Recruitment
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <RecruitmentProvider>
                    {phase === "recruit" && (
                        <RecruitmentPage
                            studyContext={studyContext}
                            onStartExecution={() => {
                                markComplete("recruit");
                                setPhase("execute");
                            }}
                        />
                    )}

                    {phase === "execute" && (
                        <VoiceSandbox className="h-full" studyId={studyContext?.studyId} />
                    )}
                </RecruitmentProvider>
            </div>
        </div>
    );
}
