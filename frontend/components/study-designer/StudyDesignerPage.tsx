"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    ArrowUp,
    Check,
    X,
    FileText,
    Target,
    MessageCircle,
    Plus,
    Trash2,
    ChevronDown,
    AlertCircle,
    Send,
    GripVertical,
    Video,
    Phone,
    MessageSquare,
    Users,
    Minus,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useDesigner } from "./StudyDesignerContext";
import type { StudyState, InterviewMode, ConversationMessage, PendingChange, ResearchObjective, Question, QuestionType } from "./types";

// ════════════════════════════════════════════════════════════
// Main Page — Two-pane layout
// ════════════════════════════════════════════════════════════

const MIN_FIRST_LOAD_MS = 2000; // Brief thinking animation before showing content

export function StudyDesignerPage() {
    const { state } = useDesigner();
    const { study, pendingChanges, isLoading } = state;
    const [firstLoadDone, setFirstLoadDone] = useState(false);
    const mountedAt = useRef(Date.now());

    const hasAnyContent = study.title || study.briefing ||
        pendingChanges.some((c) => c.status === "pending");

    // Once content arrives, wait for minimum display time before transitioning
    useEffect(() => {
        if (!hasAnyContent || firstLoadDone) return;
        const elapsed = Date.now() - mountedAt.current;
        const remaining = Math.max(0, MIN_FIRST_LOAD_MS - elapsed);
        const timer = setTimeout(() => setFirstLoadDone(true), remaining);
        return () => clearTimeout(timer);
    }, [hasAnyContent, firstLoadDone]);

    // Show first load screen until both: content has arrived AND minimum time has passed
    const showFirstLoad = !firstLoadDone;

    if (showFirstLoad) {
        return <FirstLoadScreen prompt={state.initialPrompt} />;
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <div className="flex-1 min-w-0 overflow-y-auto scrollbar-subtle bg-muted/[0.02]">
                <div className="max-w-[860px] mx-auto px-8 py-8">
                    <EditorPane />
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// First Load Screen — shown while AI generates the first response
// ════════════════════════════════════════════════════════════

const THINKING_PHASES = [
    { text: "Reading your research goal...", icon: "reading" },
    { text: "Mapping key themes to explore", icon: "mapping" },
    { text: "Structuring your study design", icon: "structuring" },
] as const;

const PHASE_DELAYS = [300, 800, 1400];

function FirstLoadScreen({ prompt }: { prompt: string }) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = PHASE_DELAYS.map((delay, i) =>
            setTimeout(() => setPhase(i + 1), delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    // Truncate prompt for display
    const displayPrompt = prompt.length > 120 ? prompt.slice(0, 117).replace(/\s+\S*$/, "") + "..." : prompt;

    return (
        <div className="flex h-full w-full items-center justify-center bg-background relative overflow-hidden">
            {/* Subtle radial glow behind the card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-[600px] h-[600px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(255,138,76,0.04) 0%, transparent 70%)",
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="relative z-10 max-w-[520px] w-full px-6"
            >
                {/* Card container */}
                <div className="rounded-3xl border border-gray-100 dark:border-[#27272A] bg-card p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/20">

                    {/* Top: AI avatar + greeting */}
                    <div className="flex items-start gap-4 mb-6">
                        <motion.div
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-lg shadow-[#FF8A4C]/25 shrink-0"
                        >
                            <Sparkles className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-[14px] font-medium text-foreground leading-snug"
                            >
                                Great, let me design this study for you.
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-[12px] text-muted-foreground/50 mt-0.5"
                            >
                                This will take a few seconds
                            </motion.p>
                        </div>
                    </div>

                    {/* User's prompt in a quote block */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="rounded-xl bg-muted/30 dark:bg-[#27272A]/30 border border-gray-100 dark:border-[#27272A] px-4 py-3 mb-6"
                    >
                        <p className="text-[13px] text-foreground/70 leading-relaxed italic">
                            {displayPrompt}
                        </p>
                    </motion.div>

                    {/* Thinking phases */}
                    <div className="space-y-0">
                        {THINKING_PHASES.map((step, i) => {
                            const isVisible = phase > i;
                            const isDone = phase > i + 1;
                            const isActive = phase === i + 1;

                            return (
                                <AnimatePresence key={i}>
                                    {isVisible && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
                                        >
                                            <div className={cn(
                                                "flex items-center gap-3 py-2.5",
                                                i < THINKING_PHASES.length - 1 && "border-b border-gray-50 dark:border-[#27272A]/50"
                                            )}>
                                                {/* Status indicator */}
                                                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                                    {isDone ? (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -90 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                                                            className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/25"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-white" />
                                                        </motion.div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border-2 border-[#FF8A4C]/30 flex items-center justify-center">
                                                            <motion.div
                                                                className="w-2.5 h-2.5 rounded-full bg-[#FF8A4C]"
                                                                animate={{
                                                                    scale: [1, 0.5, 1],
                                                                    opacity: [0.8, 0.3, 0.8],
                                                                }}
                                                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Text */}
                                                <span className={cn(
                                                    "text-[13px] transition-all duration-500",
                                                    isDone
                                                        ? "text-muted-foreground/40"
                                                        : isActive
                                                        ? "text-foreground font-medium"
                                                        : "text-muted-foreground/60"
                                                )}>
                                                    {step.text}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            );
                        })}
                    </div>

                    {/* Bottom progress bar — fills as phases complete */}
                    <div className="mt-5">
                        <div className="h-1 rounded-full bg-muted/30 dark:bg-[#27272A] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[#FF8A4C] to-[#FF6B2C]"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: phase === 0 ? "5%" : phase === 1 ? "25%" : phase === 2 ? "55%" : phase === 3 ? "85%" : "100%"
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Powered by line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-[10px] text-muted-foreground/25 text-center mt-4 select-none"
                >
                    Powered by AI research design
                </motion.p>
            </motion.div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// Editor Pane (left) — Study document with inline suggestions
// ════════════════════════════════════════════════════════════

function EditorPane() {
    const { state, dispatch, acceptChange, rejectChange } = useDesigner();
    const { study, pendingChanges, isLoading } = state;

    const pendingTitle = pendingChanges.find((c) => c.status === "pending" && c.type === "update_title");
    const pendingBriefing = pendingChanges.find((c) => c.status === "pending" && c.type === "update_briefing");
    const rejectedTitle = pendingChanges.some((c) => c.status === "rejected" && c.type === "update_title");
    const rejectedBriefing = pendingChanges.some((c) => c.status === "rejected" && c.type === "update_briefing");
    const pendingWelcomeTitle = pendingChanges.filter((c) => c.status === "pending" && c.type === "update_welcome_title");
    const pendingWelcomeDesc = pendingChanges.filter((c) => c.status === "pending" && c.type === "update_welcome_description");
    const pendingObjectives = pendingChanges.filter((c) => c.status === "pending" && c.type === "add_objective");
    const pendingQuestions = pendingChanges.filter((c) => c.status === "pending" && c.type === "add_question");
    const pendingSettings = pendingChanges.filter(
        (c) => c.status === "pending" && ["toggle_emotion_detection", "set_languages", "update_advanced_settings"].includes(c.type)
    );

    // Progressive reveal: only show sections that have content or pending proposals
    const hasOverview = study.title || study.briefing || pendingTitle || pendingBriefing;
    const hasWelcome = study.welcomePage.title || study.welcomePage.description || pendingWelcomeTitle.length > 0 || pendingWelcomeDesc.length > 0;
    const hasTopicGuide = study.topicGuide.objectives.length > 0 || pendingObjectives.length > 0 || pendingQuestions.length > 0;
    const isEmpty = !hasOverview && !hasWelcome && !hasTopicGuide;

    // Completion tracking
    const overviewDone = !!study.title && !!study.briefing && !pendingTitle && !pendingBriefing;
    const welcomeDone = !!study.welcomePage.title && !!study.welcomePage.description && pendingWelcomeTitle.length === 0 && pendingWelcomeDesc.length === 0;
    const objectivesDone = study.topicGuide.objectives.length >= 2 &&
        study.topicGuide.objectives.every((o) => o.questions.length > 0) &&
        pendingObjectives.length === 0 && pendingQuestions.length === 0;
    const isComplete = overviewDone && welcomeDone && objectivesDone;

    // Determine what's generating
    const getLoadingMessage = () => {
        if (!study.title && !study.briefing) return "Crafting your study overview...";
        if (!study.welcomePage.title) return "Writing a welcome message for participants...";
        if (study.topicGuide.objectives.length === 0) return "Designing research objectives...";
        if (study.topicGuide.objectives.some((o) => o.questions.length === 0)) return "Generating interview questions...";
        return "Refining your study...";
    };

    const handleAddObjective = () => {
        const obj: ResearchObjective = {
            id: crypto.randomUUID(),
            title: "New Objective",
            description: "",
            questions: [],
        };
        dispatch({ type: "ADD_OBJECTIVE", objective: obj });
    };

    const handleAddQuestion = (objectiveId: string) => {
        const q: Question = { id: crypto.randomUUID(), text: "", type: "open-ended", context: "", participantCount: 8, interviewMode: "video_call", probes: [] };
        dispatch({ type: "ADD_QUESTION", objectiveId, question: q });
    };

    // Progress steps
    const steps = [
        { label: "Overview", done: overviewDone, active: hasOverview && !overviewDone },
        { label: "Welcome", done: welcomeDone, active: hasWelcome && !welcomeDone },
        { label: "Objectives", done: objectivesDone, active: hasTopicGuide && !objectivesDone },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* ── Progress ── */}
            {hasOverview && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3"
                >
                    {/* Step dots */}
                    <div className="flex items-center gap-1.5">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.label}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-700",
                                    step.done
                                        ? "bg-emerald-500 w-6"
                                        : step.active
                                        ? "bg-[#FF8A4C] w-6"
                                        : "bg-muted/50 dark:bg-[#27272A] w-1.5"
                                )}
                                layout
                            />
                        ))}
                    </div>

                    {/* Status text — one line, conversational */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={isComplete ? "done" : isLoading ? "loading" : `step-${steps.filter(s => s.done).length}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.25 }}
                            className="text-[12px] text-muted-foreground/50"
                        >
                            {isComplete ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Study ready &middot; {study.topicGuide.objectives.length} objectives &middot; {study.topicGuide.objectives.reduce((s, o) => s + o.questions.length, 0)} questions
                                </span>
                            ) : isLoading ? (
                                <span className="text-[#FF8A4C]/70 font-medium">{getLoadingMessage()}</span>
                            ) : (
                                <span>
                                    {steps.filter(s => s.done).length} of {steps.length} sections complete
                                </span>
                            )}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Study Overview ── */}
            <AnimatePresence>
                {hasOverview && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
                    >
                        <StudyHeaderCard
                            study={study}
                            pendingTitle={pendingTitle}
                            pendingBriefing={pendingBriefing}
                            rejectedTitle={rejectedTitle && !study.title}
                            rejectedBriefing={rejectedBriefing && !study.briefing}
                            onTitleChange={(v) => dispatch({ type: "FIELD_UPDATE", field: "title", value: v })}
                            onBriefingChange={(v) => dispatch({ type: "FIELD_UPDATE", field: "briefing", value: v })}
                            onAccept={acceptChange}
                            onReject={rejectChange}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Settings suggestions ── */}
            <AnimatePresence>
                {pendingSettings.map((c) => (
                    <motion.div
                        key={c.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <InlineSuggestion change={c} onAccept={acceptChange} onReject={rejectChange} />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* ── Welcome Page ── */}
            <AnimatePresence>
                {hasWelcome && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
                    >
                        <WelcomePageCard
                            study={study}
                            pendingWelcomeTitle={pendingWelcomeTitle}
                            pendingWelcomeDesc={pendingWelcomeDesc}
                            dispatch={dispatch}
                            onAccept={acceptChange}
                            onReject={rejectChange}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Topic Guide ── */}
            <AnimatePresence>
                {hasTopicGuide && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
                    >
                        <TopicGuideCard
                            study={study}
                            pendingObjectives={pendingObjectives}
                            pendingQuestions={pendingQuestions}
                            dispatch={dispatch}
                            handleAddObjective={handleAddObjective}
                            handleAddQuestion={handleAddQuestion}
                            acceptChange={acceptChange}
                            rejectChange={rejectChange}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Generating indicator ── */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                        className="flex items-center gap-4 rounded-2xl border border-[#FF8A4C]/15 bg-gradient-to-r from-[#FF8A4C]/[0.03] to-transparent px-6 py-5"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF8A4C]/15 to-[#FF6B2C]/15 flex items-center justify-center shrink-0">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-4 h-4 text-[#FF8A4C]" />
                            </motion.div>
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-foreground/70">
                                {getLoadingMessage()}
                            </p>
                            <div className="flex items-center gap-0.5 mt-1.5">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-6 h-1 rounded-full bg-[#FF8A4C]/20"
                                        animate={{ backgroundColor: ["rgba(255,138,76,0.15)", "rgba(255,138,76,0.5)", "rgba(255,138,76,0.15)"] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* ── Completion celebration ── */}
            <AnimatePresence>
                {isComplete && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: [0.175, 0.885, 0.32, 1.275] }}
                        className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-emerald-50/20 dark:from-emerald-500/[0.06] dark:to-emerald-500/[0.02] p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
                            className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20"
                        >
                            <Check className="w-6 h-6 text-white" />
                        </motion.div>
                        <p className="text-[15px] font-semibold text-foreground">
                            Your study is ready
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-1">
                            {study.topicGuide.objectives.length} objectives &middot; {study.topicGuide.objectives.reduce((s, o) => s + o.questions.length, 0)} questions &middot; Review and edit anything above
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Study Header Card (Title + Brief) ──

function StudyHeaderCard({
    study,
    pendingTitle,
    pendingBriefing,
    rejectedTitle,
    rejectedBriefing,
    onTitleChange,
    onBriefingChange,
    onAccept,
    onReject,
}: {
    study: StudyState;
    pendingTitle?: PendingChange;
    pendingBriefing?: PendingChange;
    rejectedTitle: boolean;
    rejectedBriefing: boolean;
    onTitleChange: (v: string) => void;
    onBriefingChange: (v: string) => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}) {
    const hasPending = !!pendingTitle || !!pendingBriefing;
    const [justConfirmed, setJustConfirmed] = useState(false);

    const handleConfirm = () => {
        if (pendingTitle) onAccept(pendingTitle.id);
        if (pendingBriefing) onAccept(pendingBriefing.id);
        setJustConfirmed(true);
        setTimeout(() => setJustConfirmed(false), 1500);
    };

    const handleRegenerate = () => {
        if (pendingTitle) onReject(pendingTitle.id);
        if (pendingBriefing) onReject(pendingBriefing.id);
    };

    return (
        <motion.div
            className={cn(
                "rounded-2xl border bg-card overflow-hidden transition-all duration-500",
                justConfirmed
                    ? "border-emerald-300 dark:border-emerald-500/30"
                    : "border-gray-100 dark:border-[#27272A] hover:border-gray-200 dark:hover:border-[#3F3F46]"
            )}
            layout
        >
            {/* AI conversational header — only when reviewing */}
            <AnimatePresence>
                {hasPending && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                    >
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272A]">
                            <div className="flex items-start gap-3">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-sm shadow-[#FF8A4C]/20 shrink-0 mt-0.5"
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                </motion.div>
                                <div>
                                    <p className="text-[13px] text-foreground leading-snug">
                                        Here&apos;s what I came up with. Feel free to edit anything directly, then hit confirm when you&apos;re happy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmed micro-reward */}
            <AnimatePresence>
                {justConfirmed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 pt-4 pb-3 border-b border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <motion.div
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20"
                                >
                                    <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                                <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                                    Locked in. Moving to the next section...
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6">
                {/* Section label */}
                <p className="text-[10px] font-medium text-muted-foreground/35 uppercase tracking-widest mb-5">
                    Study Overview
                </p>

                {/* Fields */}
                <div className="space-y-5">
                    {/* Title */}
                    <motion.div
                        initial={hasPending ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                    >
                        <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2 block">
                            Study Title
                        </label>
                        <BorderedInput
                            value={study.title}
                            placeholder="Give your study a clear, descriptive title..."
                            onChange={onTitleChange}
                            className="text-[16px] font-semibold text-foreground font-display tracking-tight"
                        />
                    </motion.div>

                    {/* Brief */}
                    <motion.div
                        initial={hasPending ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.12 }}
                    >
                        <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2 block">
                            Research Brief
                        </label>
                        <BorderedTextarea
                            value={study.briefing}
                            placeholder="What is this study about? What do you want to learn and why does it matter?"
                            onChange={onBriefingChange}
                            className="text-[14px] text-foreground/80 leading-relaxed"
                            minRows={3}
                        />
                    </motion.div>

                </div>

                {/* Action footer */}
                <AnimatePresence>
                    {hasPending && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="flex items-center justify-end gap-2 mt-6"
                        >
                            <motion.button
                                onClick={handleRegenerate}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2.5 rounded-xl text-[12px] font-medium text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                                Try again
                            </motion.button>
                            <motion.button
                                onClick={handleConfirm}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-foreground text-background hover:opacity-90 transition-all"
                            >
                                Looks good
                                <ArrowUp className="w-3.5 h-3.5 rotate-90" />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── Welcome Page Card ──

function WelcomePageCard({
    study,
    pendingWelcomeTitle,
    pendingWelcomeDesc,
    dispatch,
    onAccept,
    onReject,
}: {
    study: StudyState;
    pendingWelcomeTitle: PendingChange[];
    pendingWelcomeDesc: PendingChange[];
    dispatch: React.Dispatch<any>;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}) {
    const hasPending = pendingWelcomeTitle.length > 0 || pendingWelcomeDesc.length > 0;
    const [justConfirmed, setJustConfirmed] = useState(false);

    const handleConfirm = () => {
        pendingWelcomeTitle.forEach((c) => onAccept(c.id));
        pendingWelcomeDesc.forEach((c) => onAccept(c.id));
        setJustConfirmed(true);
        setTimeout(() => setJustConfirmed(false), 1500);
    };

    const handleRegenerate = () => {
        pendingWelcomeTitle.forEach((c) => onReject(c.id));
        pendingWelcomeDesc.forEach((c) => onReject(c.id));
    };

    return (
        <motion.div
            className={cn(
                "rounded-2xl border bg-card overflow-hidden transition-all duration-500",
                justConfirmed
                    ? "border-emerald-300 dark:border-emerald-500/30"
                    : "border-gray-100 dark:border-[#27272A] hover:border-gray-200 dark:hover:border-[#3F3F46]"
            )}
            layout
        >
            {/* AI header */}
            <AnimatePresence>
                {hasPending && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                    >
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272A]">
                            <div className="flex items-start gap-3">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-sm shadow-[#FF8A4C]/20 shrink-0 mt-0.5"
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                </motion.div>
                                <p className="text-[13px] text-foreground leading-snug">
                                    I&apos;ve written a welcome page for your participants. This is the first thing they&apos;ll see — make sure it feels warm and clear.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmed reward */}
            <AnimatePresence>
                {justConfirmed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 pt-4 pb-3 border-b border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <motion.div
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20"
                                >
                                    <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                                <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                                    Welcome page saved. Now let&apos;s build your interview guide...
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6">
                {/* Section label */}
                <p className="text-[10px] font-medium text-muted-foreground/35 uppercase tracking-widest mb-5">
                    Welcome Page
                </p>

                {/* Fields */}
                <div className="space-y-5">
                    <motion.div
                        initial={hasPending ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                    >
                        <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2 block">
                            Title
                        </label>
                        <BorderedInput
                            value={study.welcomePage.title}
                            placeholder="A warm, inviting title for your participants..."
                            onChange={(v) => dispatch({ type: "FIELD_UPDATE", field: "welcomePage.title", value: v })}
                            className="text-sm font-medium text-foreground"
                        />
                    </motion.div>

                    <motion.div
                        initial={hasPending ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.12 }}
                    >
                        <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2 block">
                            Message
                        </label>
                        <BorderedTextarea
                            value={study.welcomePage.description}
                            placeholder="What should participants know before the interview? Set expectations, build trust..."
                            onChange={(v) => dispatch({ type: "FIELD_UPDATE", field: "welcomePage.description", value: v })}
                            className="text-[13px] text-foreground/80 leading-relaxed"
                            minRows={3}
                        />
                    </motion.div>
                </div>

                {/* Actions */}
                <AnimatePresence>
                    {hasPending && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="flex items-center justify-end gap-2 mt-6"
                        >
                            <motion.button
                                onClick={handleRegenerate}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2.5 rounded-xl text-[12px] font-medium text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                                Try again
                            </motion.button>
                            <motion.button
                                onClick={handleConfirm}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-foreground text-background hover:opacity-90 transition-all"
                            >
                                Looks good
                                <ArrowUp className="w-3.5 h-3.5 rotate-90" />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── Topic Guide Card ──

function TopicGuideCard({
    study,
    pendingObjectives,
    pendingQuestions,
    dispatch,
    handleAddObjective,
    handleAddQuestion,
    acceptChange,
    rejectChange,
}: {
    study: StudyState;
    pendingObjectives: PendingChange[];
    pendingQuestions: PendingChange[];
    dispatch: React.Dispatch<any>;
    handleAddObjective: () => void;
    handleAddQuestion: (objectiveId: string) => void;
    acceptChange: (id: string) => void;
    rejectChange: (id: string) => void;
}) {
    const hasPending = pendingObjectives.length > 0 || pendingQuestions.length > 0;
    const [justConfirmed, setJustConfirmed] = useState(false);

    const handleConfirm = () => {
        pendingObjectives.forEach((c) => acceptChange(c.id));
        pendingQuestions.forEach((c) => acceptChange(c.id));
        setJustConfirmed(true);
        setTimeout(() => setJustConfirmed(false), 1500);
    };

    const handleRegenerate = () => {
        pendingObjectives.forEach((c) => rejectChange(c.id));
        pendingQuestions.forEach((c) => rejectChange(c.id));
    };

    return (
        <motion.div
            className={cn(
                "rounded-2xl border bg-card overflow-hidden transition-all duration-500",
                justConfirmed
                    ? "border-emerald-300 dark:border-emerald-500/30"
                    : "border-gray-100 dark:border-[#27272A] hover:border-gray-200 dark:hover:border-[#3F3F46]"
            )}
            layout
        >
            {/* AI header */}
            <AnimatePresence>
                {hasPending && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                    >
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272A]">
                            <div className="flex items-start gap-3">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-sm shadow-[#FF8A4C]/20 shrink-0 mt-0.5"
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                </motion.div>
                                <p className="text-[13px] text-foreground leading-snug">
                                    {pendingObjectives.length > 0
                                        ? `I\u2019ve outlined ${pendingObjectives.length} research objective${pendingObjectives.length !== 1 ? "s" : ""} with interview questions. Review each one — you can edit, reorder, or add more.`
                                        : `Here are some additional questions. Edit them to fit your study\u2019s tone and goals.`
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmed reward */}
            <AnimatePresence>
                {justConfirmed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 pt-4 pb-3 border-b border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <motion.div
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
                                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20"
                                >
                                    <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                                <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                                    Topic guide locked in. Your study is taking shape.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6">
                {/* Section label */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-[10px] font-medium text-muted-foreground/35 uppercase tracking-widest">
                        Topic Guide
                    </p>
                    {study.topicGuide.objectives.length > 0 && (
                        <span className="text-[10px] text-muted-foreground/35 tabular-nums">
                            {study.topicGuide.objectives.length} objective{study.topicGuide.objectives.length !== 1 ? "s" : ""} &middot; {study.topicGuide.objectives.reduce((s, o) => s + o.questions.length, 0)} questions
                        </span>
                    )}
                </div>

                {/* Objectives */}
                <div className="space-y-3">
                    <SortableObjectiveList
                        objectives={study.topicGuide.objectives}
                        pendingQuestions={pendingQuestions}
                        dispatch={dispatch}
                        handleAddQuestion={handleAddQuestion}
                        acceptChange={acceptChange}
                        rejectChange={rejectChange}
                    />

                    {/* Pending new objectives — shown as preview cards */}
                    <AnimatePresence>
                        {pendingObjectives.map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.08 }}
                            >
                                <div className="rounded-xl border border-dashed border-[#FF8A4C]/20 bg-[#FF8A4C]/[0.02] dark:bg-[#FF8A4C]/[0.04] p-4">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-6 h-6 rounded-lg bg-[#FF8A4C]/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-[#FF8A4C]">
                                                {study.topicGuide.objectives.length + i + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-foreground/70">
                                                {c.value?.title}
                                            </p>
                                            {c.value?.description && (
                                                <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                                                    {c.value.description}
                                                </p>
                                            )}
                                            {c.value?.questions?.length > 0 && (
                                                <div className="mt-3 space-y-1.5">
                                                    {c.value.questions.map((q: any, qi: number) => (
                                                        <div key={qi} className="flex items-start gap-2 text-[12px] text-foreground/50">
                                                            <MessageCircle className="w-3 h-3 mt-0.5 shrink-0 text-[#FF8A4C]/30" />
                                                            <span>{q.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add objective button */}
                    <motion.button
                        onClick={handleAddObjective}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 w-full py-3 px-3 rounded-xl text-[12px] font-medium text-muted-foreground/50 hover:text-foreground border border-dashed border-gray-200 dark:border-[#27272A] hover:border-[#FF8A4C]/30 hover:bg-[#FF8A4C]/[0.02] transition-all group"
                    >
                        <Plus className="w-3.5 h-3.5 group-hover:text-[#FF8A4C] transition-colors" />
                        Add objective
                    </motion.button>
                </div>

                {/* Actions */}
                <AnimatePresence>
                    {hasPending && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="flex items-center justify-end gap-2 mt-6"
                        >
                            <motion.button
                                onClick={handleRegenerate}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2.5 rounded-xl text-[12px] font-medium text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                                Try again
                            </motion.button>
                            <motion.button
                                onClick={handleConfirm}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-foreground text-background hover:opacity-90 transition-all"
                            >
                                Looks good
                                <ArrowUp className="w-3.5 h-3.5 rotate-90" />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── Interview Mode Picker ──

const INTERVIEW_MODES: { value: InterviewMode; label: string; icon: React.ReactNode; description: string }[] = [
    { value: "video_call", label: "Video", icon: <Video className="w-3.5 h-3.5" />, description: "Face-to-face" },
    { value: "audio_call", label: "Audio", icon: <Phone className="w-3.5 h-3.5" />, description: "Voice only" },
    { value: "chat", label: "Chat", icon: <MessageSquare className="w-3.5 h-3.5" />, description: "Text-based" },
];

function InterviewModePicker({
    value,
    onChange,
}: {
    value: InterviewMode;
    onChange: (mode: InterviewMode) => void;
}) {
    return (
        <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-[#27272A] bg-background p-1">
            {INTERVIEW_MODES.map((mode) => (
                <button
                    key={mode.value}
                    onClick={() => onChange(mode.value)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all duration-200",
                        value === mode.value
                            ? "bg-[#FF8A4C] text-white shadow-sm shadow-[#FF8A4C]/20"
                            : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    {mode.icon}
                    {mode.label}
                </button>
            ))}
        </div>
    );
}

// ── Bordered Input Primitives (visible border + focus glow) ──

function BorderedInput({
    value,
    placeholder,
    onChange,
    className,
}: {
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    className?: string;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div
            className={cn(
                "rounded-xl border px-3.5 py-2.5 transition-all duration-200",
                focused
                    ? "border-[#FF8A4C]/40 bg-background shadow-[0_0_0_3px_rgba(255,138,76,0.06)]"
                    : "border-gray-200 dark:border-[#27272A] bg-background hover:border-gray-300 dark:hover:border-[#3F3F46]"
            )}
        >
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                className={cn(
                    "w-full bg-transparent outline-none placeholder:text-muted-foreground/25",
                    className
                )}
            />
        </div>
    );
}

function BorderedTextarea({
    value,
    placeholder,
    onChange,
    className,
    minRows = 2,
}: {
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    className?: string;
    minRows?: number;
}) {
    const [focused, setFocused] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }, [value]);

    return (
        <div
            className={cn(
                "rounded-xl border px-3.5 py-2.5 transition-all duration-200",
                focused
                    ? "border-[#FF8A4C]/40 bg-background shadow-[0_0_0_3px_rgba(255,138,76,0.06)]"
                    : "border-gray-200 dark:border-[#27272A] bg-background hover:border-gray-300 dark:hover:border-[#3F3F46]"
            )}
        >
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                rows={minRows}
                className={cn(
                    "w-full bg-transparent outline-none placeholder:text-muted-foreground/25 resize-none",
                    className
                )}
            />
        </div>
    );
}

// ── Editable Primitives (borderless, used internally) ──

function EditableInput({
    value,
    placeholder,
    onChange,
    className,
}: {
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    className?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
                "bg-transparent outline-none placeholder:text-muted-foreground/25 border-0 p-0",
                "focus:ring-0 focus:outline-none",
                "hover:bg-muted/20 focus:bg-muted/20 rounded-lg px-2 py-1 -mx-2 transition-all duration-150",
                className
            )}
        />
    );
}

function EditableTextarea({
    value,
    placeholder,
    onChange,
    className,
    minRows = 1,
}: {
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    className?: string;
    minRows?: number;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={minRows}
            className={cn(
                "bg-transparent outline-none placeholder:text-muted-foreground/25 border-0 p-0 resize-none",
                "focus:ring-0 focus:outline-none",
                "hover:bg-muted/20 focus:bg-muted/20 rounded-lg px-2 py-1 -mx-2 transition-all duration-150",
                className
            )}
        />
    );
}

// ── Sortable Objective List ──

function SortableObjectiveList({
    objectives,
    pendingQuestions,
    dispatch,
    handleAddQuestion,
    acceptChange,
    rejectChange,
}: {
    objectives: ResearchObjective[];
    pendingQuestions: PendingChange[];
    dispatch: React.Dispatch<any>;
    handleAddQuestion: (objectiveId: string) => void;
    acceptChange: (id: string) => void;
    rejectChange: (id: string) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const fromIndex = objectives.findIndex((o) => o.id === active.id);
        const toIndex = objectives.findIndex((o) => o.id === over.id);
        if (fromIndex === -1 || toIndex === -1) return;
        dispatch({ type: "REORDER_OBJECTIVES", fromIndex, toIndex });
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={objectives.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                {objectives.map((obj, idx) => {
                    const questionsForObj = pendingQuestions.filter((c) => c.parentId === obj.id);
                    return (
                        <SortableObjectiveItem
                            key={obj.id}
                            objective={obj}
                            index={idx}
                            pendingQuestions={questionsForObj}
                            dispatch={dispatch}
                            handleAddQuestion={handleAddQuestion}
                            acceptChange={acceptChange}
                            rejectChange={rejectChange}
                        />
                    );
                })}
            </SortableContext>
        </DndContext>
    );
}

function SortableObjectiveItem({
    objective,
    index,
    pendingQuestions,
    dispatch,
    handleAddQuestion,
    acceptChange,
    rejectChange,
}: {
    objective: ResearchObjective;
    index: number;
    pendingQuestions: PendingChange[];
    dispatch: React.Dispatch<any>;
    handleAddQuestion: (objectiveId: string) => void;
    acceptChange: (id: string) => void;
    rejectChange: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: objective.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "mb-3 last:mb-0",
                isDragging && "opacity-90 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-xl"
            )}
        >
            <ObjectiveCard
                objective={objective}
                index={index}
                pendingQuestions={pendingQuestions}
                dragHandleProps={{ ...attributes, ...listeners }}
                onUpdateField={(field, value) =>
                    dispatch({ type: "UPDATE_OBJECTIVE", id: objective.id, field, value })
                }
                onDelete={() => dispatch({ type: "DELETE_OBJECTIVE", id: objective.id })}
                onUpdateQuestion={(qId, field, value) =>
                    dispatch({ type: "UPDATE_QUESTION", objectiveId: objective.id, questionId: qId, field, value })
                }
                onDeleteQuestion={(qId) =>
                    dispatch({ type: "DELETE_QUESTION", objectiveId: objective.id, questionId: qId })
                }
                onReorderQuestion={(fromIndex, toIndex) =>
                    dispatch({ type: "REORDER_QUESTIONS", objectiveId: objective.id, fromIndex, toIndex })
                }
                onAddQuestion={() => handleAddQuestion(objective.id)}
                onAcceptChange={acceptChange}
                onRejectChange={rejectChange}
            />
        </div>
    );
}

// ── Objective Card ──

function ObjectiveCard({
    objective,
    index,
    pendingQuestions,
    dragHandleProps,
    onUpdateField,
    onDelete,
    onUpdateQuestion,
    onDeleteQuestion,
    onReorderQuestion,
    onAddQuestion,
    onAcceptChange,
    onRejectChange,
}: {
    objective: ResearchObjective;
    index: number;
    pendingQuestions: PendingChange[];
    dragHandleProps?: Record<string, any>;
    onUpdateField: (field: "title" | "description", value: string) => void;
    onDelete: () => void;
    onUpdateQuestion: (questionId: string, field: string, value: any) => void;
    onDeleteQuestion: (questionId: string) => void;
    onReorderQuestion: (fromIndex: number, toIndex: number) => void;
    onAddQuestion: () => void;
    onAcceptChange: (id: string) => void;
    onRejectChange: (id: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(objective.title === "New Objective" || objective.questions.length === 0);
    const [isHovered, setIsHovered] = useState(false);

    const questionSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleQuestionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const fromIndex = objective.questions.findIndex((q) => q.id === active.id);
        const toIndex = objective.questions.findIndex((q) => q.id === over.id);
        if (fromIndex === -1 || toIndex === -1) return;
        onReorderQuestion(fromIndex, toIndex);
    };

    const questionCount = objective.questions.length;

    return (
        <div
            className={cn(
                "rounded-xl border bg-background transition-all duration-200",
                isHovered ? "border-gray-200 dark:border-[#3F3F46] shadow-sm" : "border-gray-100 dark:border-[#27272A]"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3">
                {/* Drag handle */}
                <button
                    {...dragHandleProps}
                    className={cn(
                        "shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors touch-none",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-muted-foreground/40 hover:text-foreground transition-all shrink-0"
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                <div className="w-6 h-6 rounded-lg bg-[#FF8A4C]/10 dark:bg-[#FF8A4C]/15 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#FF8A4C]">{index + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate block">
                        {objective.title || <span className="text-muted-foreground/30">Untitled Objective</span>}
                    </span>
                </div>

                {questionCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/40 font-medium tabular-nums shrink-0 bg-muted/50 px-1.5 py-0.5 rounded-md">
                        {questionCount} Q{questionCount !== 1 ? "s" : ""}
                    </span>
                )}

                <button
                    onClick={onDelete}
                    className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {/* Body */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 space-y-4">
                            {/* Title + Description */}
                            <div className="pl-[46px] space-y-3">
                                <div>
                                    <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">Objective Title</label>
                                    <BorderedInput
                                        value={objective.title}
                                        placeholder="What do you want to explore?"
                                        onChange={(v) => onUpdateField("title", v)}
                                        className="text-[13px] font-medium text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">Description</label>
                                    <BorderedTextarea
                                        value={objective.description}
                                        placeholder="What should the interviewer understand about this objective?"
                                        onChange={(v) => onUpdateField("description", v)}
                                        className="text-xs text-foreground/70 leading-relaxed"
                                        minRows={2}
                                    />
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="pl-[46px] space-y-2.5">
                                <DndContext
                                    sensors={questionSensors}
                                    collisionDetection={closestCenter}
                                    modifiers={[restrictToVerticalAxis]}
                                    onDragEnd={handleQuestionDragEnd}
                                >
                                    <SortableContext items={objective.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                                        {objective.questions.map((q, qi) => (
                                            <SortableQuestionItem
                                                key={q.id}
                                                question={q}
                                                index={qi}
                                                onUpdateField={(field, value) => onUpdateQuestion(q.id, field, value)}
                                                onDelete={() => onDeleteQuestion(q.id)}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>

                                {/* Pending question suggestions */}
                                <AnimatePresence>
                                    {pendingQuestions.map((c) => (
                                        <motion.div
                                            key={c.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <InlineSuggestion change={c} onAccept={onAcceptChange} onReject={onRejectChange}>
                                                <div className="flex items-start gap-2 text-[12px] text-foreground/60">
                                                    <MessageCircle className="w-3 h-3 mt-0.5 shrink-0 text-[#FF8A4C]/40" />
                                                    <span>{c.value?.text ?? String(c.value)}</span>
                                                </div>
                                            </InlineSuggestion>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Add question button */}
                                <button
                                    onClick={onAddQuestion}
                                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground/40 hover:text-foreground border border-dashed border-transparent hover:border-gray-200 dark:hover:border-[#27272A] hover:bg-muted/30 transition-all group"
                                >
                                    <Plus className="w-3 h-3 group-hover:text-[#FF8A4C] transition-colors" />
                                    Add question
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Sortable Question Item ──

function SortableQuestionItem({
    question,
    index,
    onUpdateField,
    onDelete,
}: {
    question: Question;
    index: number;
    onUpdateField: (field: string, value: any) => void;
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "mb-2.5 last:mb-0",
                isDragging && "opacity-90 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-xl"
            )}
        >
            <QuestionCard
                question={question}
                index={index}
                dragHandleProps={{ ...attributes, ...listeners }}
                onUpdateField={onUpdateField}
                onDelete={onDelete}
            />
        </div>
    );
}

// ── Question Card ──

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
    { value: "open-ended", label: "Open-ended", description: "Answer freely" },
    { value: "single-select", label: "Single-select", description: "One answer from predefined options" },
    { value: "multiselect", label: "Multiselect", description: "Many answers from predefined options" },
];

function QuestionCard({
    question,
    index,
    dragHandleProps,
    onUpdateField,
    onDelete,
}: {
    question: Question;
    index: number;
    dragHandleProps?: Record<string, any>;
    onUpdateField: (field: string, value: any) => void;
    onDelete: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [typeOpen, setTypeOpen] = useState(false);
    const typeRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!typeOpen) return;
        const handler = (e: MouseEvent) => {
            if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
                setTypeOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [typeOpen]);

    const currentType = QUESTION_TYPES.find((t) => t.value === question.type) ?? QUESTION_TYPES[0];

    return (
        <div
            className={cn(
                "rounded-xl border bg-card/50 p-4 transition-all duration-200",
                isHovered ? "border-gray-200 dark:border-[#3F3F46]" : "border-gray-100 dark:border-[#27272A]"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header: drag handle + Question N + type dropdown + delete */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <button
                        {...dragHandleProps}
                        className={cn(
                            "shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors touch-none",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-semibold text-muted-foreground/40 tabular-nums">
                        Q{index + 1}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Type dropdown */}
                    <div className="relative" ref={typeRef}>
                        <button
                            onClick={() => setTypeOpen(!typeOpen)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground border border-gray-200 dark:border-[#27272A] hover:border-gray-300 dark:hover:border-[#3F3F46] bg-background transition-colors"
                        >
                            {currentType.label}
                            <ChevronDown className={cn("w-3 h-3 transition-transform", typeOpen && "rotate-180")} />
                        </button>
                        {typeOpen && (
                            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#1C1C1E] shadow-lg shadow-black/10 dark:shadow-black/30 z-20 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                {QUESTION_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => {
                                            onUpdateField("type", t.value);
                                            setTypeOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors",
                                            t.value === question.type && "bg-muted/30"
                                        )}
                                    >
                                        <div>
                                            <p className="text-xs font-medium text-foreground">{t.label}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                                        </div>
                                        {t.value === question.type && (
                                            <Check className="w-3.5 h-3.5 text-foreground shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Delete */}
                    <button
                        onClick={onDelete}
                        className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Text + Context */}
            <div className="space-y-3">
                <div>
                    <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">
                        Question
                    </label>
                    <BorderedTextarea
                        value={question.text}
                        placeholder="What do you want to ask the participant?"
                        onChange={(v) => onUpdateField("text", v)}
                        className="text-[13px] text-foreground/80 leading-relaxed"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">
                        Context
                    </label>
                    <BorderedTextarea
                        value={question.context}
                        placeholder="How should the interviewer use this question? What to probe for..."
                        onChange={(v) => onUpdateField("context", v)}
                        className="text-[12px] text-foreground/60 leading-relaxed"
                    />
                </div>

                {/* Options — only for single-select / multiselect */}
                {(question.type === "single-select" || question.type === "multiselect") && (
                    <OptionsEditor
                        options={question.options ?? []}
                        onChange={(opts) => onUpdateField("options", opts)}
                    />
                )}

                {/* Participants + Interview Mode */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">
                            Participants
                        </label>
                        <div className="rounded-xl border border-gray-200 dark:border-[#27272A] hover:border-gray-300 dark:hover:border-[#3F3F46] bg-background px-3 py-2 flex items-center gap-2 transition-all duration-200">
                            <Users className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                            <button
                                onClick={() => onUpdateField("participantCount", Math.max(1, question.participantCount - 1))}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[13px] font-semibold text-foreground tabular-nums min-w-[16px] text-center">
                                {question.participantCount}
                            </span>
                            <button
                                onClick={() => onUpdateField("participantCount", question.participantCount + 1)}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">
                            Mode
                        </label>
                        <InterviewModePicker
                            value={question.interviewMode}
                            onChange={(mode) => onUpdateField("interviewMode", mode)}
                        />
                    </div>
                </div>

                {/* Stimulus */}
                <div>
                    <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-1.5 block">
                        Stimulus
                    </label>
                    <button
                        className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground/40 hover:text-foreground border border-dashed border-transparent hover:border-gray-200 dark:hover:border-[#27272A] hover:bg-muted/30 transition-all group"
                    >
                        <Plus className="w-3 h-3 group-hover:text-[#FF8A4C] transition-colors" />
                        Add stimulus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Options Editor (for single-select / multiselect questions) ──

function OptionsEditor({
    options,
    onChange,
}: {
    options: string[];
    onChange: (options: string[]) => void;
}) {
    const updateOption = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        onChange(updated);
    };

    const removeOption = (index: number) => {
        onChange(options.filter((_, i) => i !== index));
    };

    const addOption = () => {
        onChange([...options, ""]);
    };

    return (
        <div>
            <label className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2 block">
                Options
            </label>
            <div className="space-y-1.5">
                {options.map((opt, i) => (
                    <OptionRow
                        key={i}
                        index={i}
                        value={opt}
                        onChange={(v) => updateOption(i, v)}
                        onRemove={() => removeOption(i)}
                    />
                ))}
            </div>
            <button
                onClick={addOption}
                className="flex items-center gap-1.5 py-2 px-2.5 mt-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/40 hover:text-foreground border border-dashed border-transparent hover:border-gray-200 dark:hover:border-[#27272A] hover:bg-muted/30 transition-all group"
            >
                <Plus className="w-3 h-3 group-hover:text-[#FF8A4C] transition-colors" />
                Add option
            </button>
        </div>
    );
}

function OptionRow({
    index,
    value,
    onChange,
    onRemove,
}: {
    index: number;
    value: string;
    onChange: (v: string) => void;
    onRemove: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex items-center gap-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="text-[10px] font-medium text-muted-foreground/35 shrink-0 w-5 text-right tabular-nums">
                {index + 1}.
            </span>
            <div className="flex-1 rounded-lg border border-gray-200 dark:border-[#27272A] hover:border-gray-300 dark:hover:border-[#3F3F46] focus-within:border-[#FF8A4C]/40 focus-within:shadow-[0_0_0_3px_rgba(255,138,76,0.06)] px-3 py-2 transition-all duration-200">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full text-[13px] text-foreground/80 bg-transparent outline-none placeholder:text-muted-foreground/25"
                />
            </div>
            <button
                onClick={onRemove}
                className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0",
                    isHovered ? "opacity-100" : "opacity-0"
                )}
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

function SectionCard({
    icon,
    title,
    count,
    total,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    count?: number;
    total?: number | null;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-[#27272A] bg-card p-5 transition-colors hover:border-gray-200 dark:hover:border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-muted/50 dark:bg-[#27272A]/50 flex items-center justify-center text-muted-foreground/50">
                    {icon}
                </div>
                <h3 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest flex-1">
                    {title}
                </h3>
                {count !== undefined && (
                    <span className="text-[10px] font-medium text-muted-foreground/40 tabular-nums">
                        {count}{total !== null && total !== undefined ? `/${total}` : ""}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

// ── Inline Suggestion ──

function InlineSuggestion({
    change,
    onAccept,
    onReject,
    children,
    className,
}: {
    change: PendingChange;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border border-dashed border-[#FF8A4C]/30 bg-gradient-to-br from-[#FF8A4C]/[0.02] to-[#FF6B2C]/[0.04] dark:from-[#FF8A4C]/[0.04] dark:to-[#FF6B2C]/[0.06] p-3.5 transition-all",
                className
            )}
        >
            {/* Header: badge + accept/reject */}
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-[#FF8A4C]/10 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-[#FF8A4C]" />
                    </div>
                    <span className="text-[9px] font-semibold text-[#FF8A4C]/70 uppercase tracking-widest">
                        AI Suggestion
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <motion.button
                        onClick={() => onAccept(change.id)}
                        whileTap={{ scale: 0.92 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-colors"
                    >
                        <Check className="w-3 h-3" />
                        Accept
                    </motion.button>
                    <motion.button
                        onClick={() => onReject(change.id)}
                        whileTap={{ scale: 0.92 }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground transition-all"
                    >
                        <X className="w-3 h-3" />
                    </motion.button>
                </div>
            </div>

            {/* Content preview — either custom children or fallback label */}
            {children || (
                <p className="text-xs text-foreground/60">{change.label}</p>
            )}
        </div>
    );
}

// ── Reviewable Field ──
// Wraps a field with accept/reject when AI has proposed a value.
// Shows alert state when rejected and field is empty.

function ReviewableField({
    pending,
    rejected,
    emptyLabel,
    onAccept,
    onReject,
    children,
}: {
    pending?: PendingChange;
    rejected: boolean;
    emptyLabel: string;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    children: React.ReactNode;
}) {
    // Pending: wrap in accept/reject container
    if (pending) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="rounded-2xl border border-dashed border-[#FF8A4C]/30 bg-gradient-to-br from-[#FF8A4C]/[0.02] to-[#FF6B2C]/[0.04] dark:from-[#FF8A4C]/[0.04] dark:to-[#FF6B2C]/[0.06] p-5 transition-all"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-[#FF8A4C]/10 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-[#FF8A4C]" />
                        </div>
                        <span className="text-[9px] font-semibold text-[#FF8A4C]/70 uppercase tracking-widest">
                            AI Suggestion
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <motion.button
                            onClick={() => onAccept(pending.id)}
                            whileTap={{ scale: 0.92 }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                            Accept
                        </motion.button>
                        <motion.button
                            onClick={() => onReject(pending.id)}
                            whileTap={{ scale: 0.92 }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground transition-all"
                        >
                            <X className="w-3 h-3" />
                            Reject
                        </motion.button>
                    </div>
                </div>
                {children}
            </motion.div>
        );
    }

    // Rejected + empty: alert state
    if (rejected) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/[0.04] p-5 transition-all"
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-red-500/70 dark:text-red-400/70 uppercase tracking-widest">
                        {emptyLabel}
                    </span>
                </div>
                {children}
            </motion.div>
        );
    }

    // Normal: just render the field
    return <div>{children}</div>;
}

// ════════════════════════════════════════════════════════════
// Assistant Pane (right) — Chat + Proposals
// ════════════════════════════════════════════════════════════

function AssistantPane() {
    const { state, sendMessage } = useDesigner();
    const { conversation, isLoading } = state;
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation, isLoading]);

    // Auto-resize input
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 96) + "px";
    }, [input]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isLoading) return;
        sendMessage(text);
        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChipClick = (chip: string) => {
        if (isLoading) return;
        sendMessage(chip);
    };

    const hasInput = input.trim().length > 0;

    return (
        <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-[#27272A] shrink-0 bg-background/80 backdrop-blur-sm">
                <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-sm shadow-orange-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    {/* Breathing pulse */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                </div>
                <div>
                    <p className="text-[13px] font-semibold text-foreground leading-none">
                        Research Assistant
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isLoading ? (
                            <span className="text-[#FF8A4C]">Thinking...</span>
                        ) : (
                            "Designing your study"
                        )}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-subtle">
                <AnimatePresence initial={false}>
                    {conversation.map((msg, idx) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.25, ease: [0.175, 0.885, 0.32, 1.275] }}
                        >
                            {msg.role === "user" ? (
                                <UserBubble content={msg.content} />
                            ) : (
                                <AssistantBubble message={msg} />
                            )}

                            {/* Follow-up chips — only on last assistant message */}
                            {msg.role === "assistant" &&
                                msg.followUpChips &&
                                msg.followUpChips.length > 0 &&
                                msg.id === conversation[conversation.length - 1]?.id && (
                                    <FollowUpChips
                                        chips={msg.followUpChips}
                                        onChipClick={handleChipClick}
                                        disabled={isLoading}
                                    />
                                )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TypingIndicator />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1.5 shrink-0">
                <div
                    className={cn(
                        "flex items-end gap-2 rounded-2xl border px-3.5 py-2.5 transition-all duration-200",
                        "bg-muted/20 dark:bg-[#1C1C1E]",
                        isFocused
                            ? "border-[#FF8A4C]/40 shadow-[0_0_0_3px_rgba(255,138,76,0.06)]"
                            : "border-gray-200 dark:border-[#27272A]"
                    )}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Ask anything..."
                        rows={1}
                        className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed py-0.5"
                    />
                    <motion.button
                        onClick={handleSend}
                        disabled={!hasInput || isLoading}
                        whileTap={hasInput && !isLoading ? { scale: 0.88 } : undefined}
                        className={cn(
                            "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                            hasInput && !isLoading
                                ? "bg-gradient-to-r from-[#FF8A4C] to-[#FF6B2C] text-white shadow-sm shadow-orange-500/25"
                                : "bg-transparent text-muted-foreground/25 cursor-not-allowed"
                        )}
                    >
                        <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </motion.button>
                </div>
                <p className="text-[9px] text-muted-foreground/30 text-center mt-1.5 select-none">
                    Powered by Gemini &middot; Press Enter to send
                </p>
            </div>
        </>
    );
}

// ── Message Bubbles ──

function UserBubble({ content }: { content: string }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed bg-gradient-to-br from-[#FF8A4C] to-[#FF6B2C] text-white rounded-2xl rounded-br-sm shadow-sm shadow-orange-500/10">
                {content}
            </div>
        </div>
    );
}

function AssistantBubble({ message }: { message: ConversationMessage }) {
    const proposalCount = message.proposals?.length ?? 0;
    return (
        <div className="flex justify-start gap-2">
            {/* Avatar */}
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF8A4C]/10 to-[#FF6B2C]/10 dark:from-[#FF8A4C]/20 dark:to-[#FF6B2C]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-[#FF8A4C]" />
            </div>
            <div className="max-w-[85%] space-y-1.5">
                <div className="px-3.5 py-2.5 text-[13px] leading-relaxed bg-muted/50 dark:bg-[#27272A]/50 text-foreground rounded-2xl rounded-tl-sm">
                    {message.content}
                </div>
                {proposalCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                        className="flex items-center gap-1.5 px-1 text-[10px] text-[#FF8A4C] font-medium"
                    >
                        <span className="w-1 h-1 rounded-full bg-[#FF8A4C] animate-pulse" />
                        <span>{proposalCount} suggestion{proposalCount !== 1 ? "s" : ""} in editor</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ── Follow-up Chips ──

function FollowUpChips({
    chips,
    onChipClick,
    disabled,
}: {
    chips: string[];
    onChipClick: (chip: string) => void;
    disabled: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="flex flex-wrap gap-1.5 mt-2.5 pl-8"
        >
            {chips.map((chip, i) => (
                <motion.button
                    key={chip}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.2 }}
                    onClick={() => onChipClick(chip)}
                    disabled={disabled}
                    className={cn(
                        "text-[10px] font-medium px-2.5 py-1.5 rounded-full border transition-all duration-200",
                        "border-gray-200 dark:border-[#27272A] text-foreground/60 bg-background",
                        "hover:border-[#FF8A4C]/40 hover:text-[#FF8A4C] hover:bg-[#FF8A4C]/5 hover:shadow-sm hover:shadow-[#FF8A4C]/5",
                        "active:scale-[0.96]",
                        disabled && "opacity-30 pointer-events-none"
                    )}
                >
                    {chip}
                </motion.button>
            ))}
        </motion.div>
    );
}

// ── Typing Indicator ──

function TypingIndicator() {
    return (
        <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF8A4C]/10 to-[#FF6B2C]/10 dark:from-[#FF8A4C]/20 dark:to-[#FF6B2C]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-[#FF8A4C]" />
            </div>
            <div className="bg-muted/50 dark:bg-[#27272A]/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#FF8A4C]/50"
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
