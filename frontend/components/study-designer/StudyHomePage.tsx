"use client";

import { useState, useEffect } from "react";
import { BookOpen, Clock, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { ResearchPromptComposer } from "./ResearchPromptComposer";
import { StudyDesignerProvider } from "./StudyDesignerContext";
import { StudyDesignerPage } from "./StudyDesignerPage";
import { type StudyState, getStudyProgress } from "./types";

interface SavedStudy {
    id: string;
    title: string;
    status: string;
    initial_prompt: string | null;
    briefing: string | null;
    welcome_page: { title: string; description: string } | null;
    topic_guide: { introQuestions: any[]; objectives: any[] } | null;
    created_at: string;
    updated_at: string;
}

function savedStudyToProgress(s: SavedStudy) {
    const study: StudyState = {
        id: s.id,
        title: s.title || "",
        briefing: s.briefing || "",
        emotionDetection: false,
        participantLanguages: [],
        reportingLanguage: "English",
        advancedSettings: { maxDuration: 30, recordVideo: true, recordAudio: true, allowSkipQuestions: false },
        welcomePage: s.welcome_page || { title: "", description: "" },
        topicGuide: s.topic_guide || { introQuestions: [], objectives: [] },
    };
    return getStudyProgress(study);
}

interface StudyHomePageProps {
    onStudyUpdate?: (study: StudyState) => void;
}

export function StudyHomePage({ onStudyUpdate }: StudyHomePageProps = {}) {
    const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
    const [resumeStudyId, setResumeStudyId] = useState<string | null>(null);
    const [savedStudies, setSavedStudies] = useState<SavedStudy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/study-designer/studies")
            .then((data) => setSavedStudies(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleArchive = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/study-designer/studies/${id}`);
            setSavedStudies((prev) => prev.filter((s) => s.id !== id));
        } catch {}
    };

    if (initialPrompt) {
        return (
            <StudyDesignerProvider initialPrompt={initialPrompt} savedStudyId={resumeStudyId || undefined} onStudyUpdate={onStudyUpdate}>
                <StudyDesignerPage />
            </StudyDesignerProvider>
        );
    }

    const draftStudies = savedStudies.filter((s) => s.status === "DRAFT");

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-subtle bg-background">
            <div className="max-w-[820px] mx-auto px-6 py-10 space-y-10">
                <ResearchPromptComposer onSubmit={setInitialPrompt} />

                {/* Saved Studies */}
                {!loading && draftStudies.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Continue Designing
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {draftStudies.map((study) => {
                                const progress = savedStudyToProgress(study);
                                return (
                                <button
                                    key={study.id}
                                    onClick={() => {
                                        setResumeStudyId(study.id);
                                        setInitialPrompt(study.initial_prompt || study.title);
                                    }}
                                    className="group w-full text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-card hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {study.title || "Untitled Study"}
                                                </p>
                                                {study.briefing && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {study.briefing}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden max-w-[120px]">
                                                        <div
                                                            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                                                            style={{ width: `${progress.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                                        {progress.completedSteps.length}/{progress.totalSteps}
                                                    </span>
                                                    {progress.currentStep && (
                                                        <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                            Next: {progress.currentStep.replace("_", " ")}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                                                    Updated {new Date(study.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={(e) => handleArchive(study.id, e)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className={cn(
                                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                                                "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
                                            )}>
                                                Draft
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                                        </div>
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
