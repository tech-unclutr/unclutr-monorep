"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Clock, ChevronRight, Trash2, Users, Eye, ShoppingCart, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
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
    topic_guide: { objectives: any[] } | null;
    created_at: string;
    updated_at: string;
}

interface ResearchTemplate {
    id: string;
    icon: React.ElementType;
    label: string;
    description: string;
    promptTemplate: string;
    color: string;
    iconBg: string;
    iconBgDark: string;
    iconColor: string;
}

const RESEARCH_TEMPLATES: ResearchTemplate[] = [
    {
        id: "consumer-behavior",
        icon: Users,
        label: "Consumer Behavior",
        description: "Understand decision-making and motivations",
        promptTemplate:
            "I want to understand how [target audience] makes decisions about [category/product]. Explore their motivations, hesitations, and what triggers a purchase.",
        color: "indigo",
        iconBg: "bg-indigo-50",
        iconBgDark: "dark:bg-indigo-500/10",
        iconColor: "text-indigo-500",
    },
    {
        id: "brand-discovery",
        icon: Eye,
        label: "Brand Discovery",
        description: "Explore brand perception and trust signals",
        promptTemplate:
            "How do [target audience] discover, evaluate, and form opinions about brands in the [category] space? What builds trust vs. what creates doubt?",
        color: "emerald",
        iconBg: "bg-emerald-50",
        iconBgDark: "dark:bg-emerald-500/10",
        iconColor: "text-emerald-500",
    },
    {
        id: "purchase-intent",
        icon: ShoppingCart,
        label: "Purchase Intent",
        description: "Map the journey from awareness to purchase",
        promptTemplate:
            "What drives [target audience] to buy [product/category]? Explore the decision journey from awareness to purchase — what accelerates and what blocks conversion.",
        color: "amber",
        iconBg: "bg-amber-50",
        iconBgDark: "dark:bg-amber-500/10",
        iconColor: "text-amber-500",
    },
    {
        id: "competitive-analysis",
        icon: BarChart3,
        label: "Competitive Analysis",
        description: "Uncover switching behavior and loyalty drivers",
        promptTemplate:
            "How do [target audience] compare and choose between options in [category]? What makes them switch brands, and what keeps them loyal?",
        color: "violet",
        iconBg: "bg-violet-50",
        iconBgDark: "dark:bg-violet-500/10",
        iconColor: "text-violet-500",
    },
];

function savedStudyToProgress(s: SavedStudy) {
    const study: StudyState = {
        id: s.id,
        title: s.title || "",
        briefing: s.briefing || "",
        executiveSummary: "",
        emotionDetection: false,
        participantLanguages: [],
        reportingLanguage: "English",
        advancedSettings: { maxDuration: 30, recordVideo: true, recordAudio: true, allowSkipQuestions: false },
        welcomePage: s.welcome_page || { title: "", description: "" },
        topicGuide: s.topic_guide || { objectives: [] },
        keyResearchQuestions: [],
    };
    return getStudyProgress(study);
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STEP_LABEL: Record<string, string> = {
    title: "Title",
    briefing: "Research Brief",
    welcome_page: "Welcome Page",
    objectives: "Objectives",
};

const VISIBLE_DRAFTS_LIMIT = 3;

interface StudyHomePageProps {
    onStudyUpdate?: (study: StudyState) => void;
    onDesignComplete?: () => void;
    activeStudyId?: string;
}

export function StudyHomePage({ onStudyUpdate, onDesignComplete, activeStudyId }: StudyHomePageProps = {}) {
    const [initialPrompt, setInitialPrompt] = useState<string | null>(activeStudyId ? "__resume__" : null);
    const [resumeStudyId, setResumeStudyId] = useState<string | null>(activeStudyId || null);
    const [savedStudies, setSavedStudies] = useState<SavedStudy[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [composerValue, setComposerValue] = useState("");
    const [showAllDrafts, setShowAllDrafts] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const prevComposerValueRef = useRef("");

    useEffect(() => {
        api.get("/study-planner/studies")
            .then((data) => setSavedStudies(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Clear selected template only when the user explicitly clears the composer
    // (value going from non-empty → empty), not on the initial template click.
    useEffect(() => {
        if (!composerValue && selectedTemplate && prevComposerValueRef.current) {
            setSelectedTemplate(null);
        }
        prevComposerValueRef.current = composerValue;
    }, [composerValue, selectedTemplate]);

    const handleArchive = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(null);
        try {
            await api.delete(`/study-planner/studies/${id}`);
            setSavedStudies((prev) => prev.filter((s) => s.id !== id));
        } catch {}
    };

    if (initialPrompt) {
        return (
            <StudyDesignerProvider initialPrompt={initialPrompt} savedStudyId={resumeStudyId || undefined} onStudyUpdate={onStudyUpdate} onDesignComplete={onDesignComplete}>
                <StudyDesignerPage />
            </StudyDesignerProvider>
        );
    }

    const visibleStudies = showAllDrafts ? savedStudies : savedStudies.slice(0, VISIBLE_DRAFTS_LIMIT);
    const hasMoreStudies = savedStudies.length > VISIBLE_DRAFTS_LIMIT && !showAllDrafts;

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-subtle bg-background">
            <div className="max-w-[680px] mx-auto px-6 pt-16 pb-10 space-y-10">
                {/* Prompt Composer */}
                <ResearchPromptComposer
                    onSubmit={setInitialPrompt}
                    templatePrompt={selectedTemplate ?? undefined}
                    onValueChange={setComposerValue}
                />

                {/* Research Templates */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25, ease: [0.175, 0.885, 0.32, 1.275] }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 px-1">
                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Or start with a template
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {RESEARCH_TEMPLATES.map((template, i) => {
                            const Icon = template.icon;
                            const isSelected = selectedTemplate === template.promptTemplate;
                            return (
                                <motion.button
                                    key={template.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: 0.25 + i * 0.05,
                                        ease: [0.175, 0.885, 0.32, 1.275],
                                    }}
                                    type="button"
                                    onClick={() => setSelectedTemplate(template.promptTemplate)}
                                    className={cn(
                                        "group text-left p-4 rounded-xl border",
                                        "bg-card transition-all duration-200",
                                        isSelected
                                            ? "border-[#FF8A4C]/50 shadow-[0_0_0_3px_rgba(255,138,76,0.08)] dark:shadow-[0_0_0_3px_rgba(255,138,76,0.12)]"
                                            : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                template.iconBg,
                                                template.iconBgDark
                                            )}
                                        >
                                            <Icon className={cn("w-4 h-4", template.iconColor)} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground leading-tight">
                                                {template.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Saved Studies */}
                {!loading && savedStudies.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Your Studies
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {visibleStudies.map((study) => {
                                const progress = savedStudyToProgress(study);
                                const isConfirming = confirmDeleteId === study.id;

                                return (
                                    <button
                                        key={study.id}
                                        onClick={() => {
                                            if (isConfirming) return;
                                            setResumeStudyId(study.id);
                                            setInitialPrompt(study.initial_prompt || study.title);
                                        }}
                                        className="group w-full text-left p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-card hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                                    >
                                        {/* Orange left-border accent on hover */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF8A4C] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

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
                                                                Next: {STEP_LABEL[progress.currentStep] ?? progress.currentStep}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                                                        Updated {formatRelativeTime(study.updated_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isConfirming ? (
                                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleArchive(study.id, e)}
                                                            className="text-[10px] font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                            className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(study.id); }}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <div className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                                                    study.status === "READY"
                                                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                                                        : "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
                                                )}>
                                                    {study.status === "READY" ? "Ready" : "Draft"}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {hasMoreStudies && (
                            <button
                                type="button"
                                onClick={() => setShowAllDrafts(true)}
                                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors text-center w-full mt-1"
                            >
                                View all {savedStudies.length} studies
                            </button>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
