"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Check,
    RefreshCcw,
    ArrowRight,
    AlertCircle,
    Plus,
    Trash2,
    ChevronDown,
    Video,
    Phone,
    MessageSquare,
    Users,
    Minus,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesigner, type Phase } from "./StudyDesignerContext";
import type {
    ResearchObjective,
    Question,
    QuestionType,
    InterviewMode,
} from "./types";

// ════════════════════════════════════════════════════════════
// Root
// ════════════════════════════════════════════════════════════

export function StudyDesignerPage() {
    const {
        phase,
        study,
        initialPrompt,
        isBusy,
        isSaving,
        error,
        updateField,
        looksGood,
        regenerate,
    } = useDesigner();

    // First-time generation: full-screen FirstLoadScreen, but only when there
    // is genuinely nothing to show yet. After the user has confirmed at least
    // one section, the loading state for the next section appears inline.
    if (phase === "loading_title" && !study.title) {
        return <FirstLoadScreen prompt={initialPrompt} />;
    }

    const titleConfirmed = isPhaseAfter(phase, "review_title");
    const welcomeConfirmed = isPhaseAfter(phase, "review_welcome");
    const objectivesConfirmed = isPhaseAfter(phase, "review_objectives");

    return (
        <div className="h-full w-full overflow-y-auto scrollbar-subtle bg-background">
            <div className="mx-auto max-w-[760px] px-8 py-12 space-y-6">
                <SaveIndicator isSaving={isSaving} />

                {/* Title & Brief — confirmed (editable, no buttons) or active review */}
                {titleConfirmed ? (
                    <TitleBriefStep
                        title={study.title}
                        briefing={study.briefing}
                        isBusy={isBusy}
                        confirmed
                        onTitle={(v) => updateField("title", v)}
                        onBriefing={(v) => updateField("briefing", v)}
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "review_title" ? (
                    <TitleBriefStep
                        title={study.title}
                        briefing={study.briefing}
                        isBusy={isBusy}
                        onTitle={(v) => updateField("title", v)}
                        onBriefing={(v) => updateField("briefing", v)}
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : null}

                {/* Welcome page */}
                {welcomeConfirmed ? (
                    <WelcomeStep
                        title={study.welcomePage.title}
                        description={study.welcomePage.description}
                        isBusy={isBusy}
                        confirmed
                        onTitle={(v) => updateField("welcomePage.title", v)}
                        onDescription={(v) =>
                            updateField("welcomePage.description", v)
                        }
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "review_welcome" ? (
                    <WelcomeStep
                        title={study.welcomePage.title}
                        description={study.welcomePage.description}
                        isBusy={isBusy}
                        onTitle={(v) => updateField("welcomePage.title", v)}
                        onDescription={(v) =>
                            updateField("welcomePage.description", v)
                        }
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "loading_welcome" ? (
                    <LoadingCard label="Designing your welcome page..." />
                ) : null}

                {/* Objectives */}
                {objectivesConfirmed ? (
                    <ObjectivesStep
                        objectives={study.topicGuide.objectives}
                        isBusy={isBusy}
                        confirmed
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "review_objectives" ? (
                    <ObjectivesStep
                        objectives={study.topicGuide.objectives}
                        isBusy={isBusy}
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "loading_objectives" ? (
                    <LoadingCard label="Structuring your research objectives..." />
                ) : null}

                {error && <ErrorBanner message={error} />}
            </div>
        </div>
    );
}

const PHASE_ORDER: Phase[] = [
    "loading_title",
    "review_title",
    "loading_welcome",
    "review_welcome",
    "loading_objectives",
    "review_objectives",
    "done",
];

function isPhaseAfter(current: Phase, target: Phase): boolean {
    return PHASE_ORDER.indexOf(current) > PHASE_ORDER.indexOf(target);
}

function SaveIndicator({ isSaving }: { isSaving: boolean }) {
    return (
        <div className="flex h-5 items-center justify-end">
            <AnimatePresence>
                {isSaving && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60"
                    >
                        Saving…
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// Card primitives
// ════════════════════════════════════════════════════════════

const CARD_CLASS =
    "rounded-3xl border border-gray-100 dark:border-[#27272A] bg-card p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/20";

function CardHeader({
    title,
    subtitle,
}: {
    title: string;
    subtitle: string;
}) {
    return (
        <div className="mb-6 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] shadow-lg shadow-[#FF8A4C]/25">
                <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-[15px] font-semibold leading-snug text-foreground">
                    {title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
        </label>
    );
}

const INPUT_CLASS =
    "w-full rounded-xl border border-gray-200 dark:border-[#27272A] bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/40 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20";

function StepActions({
    isBusy,
    onLooksGood,
    onRegenerate,
}: {
    isBusy: boolean;
    onLooksGood: () => void;
    onRegenerate: () => void;
}) {
    return (
        <div className="mt-7 flex items-center justify-end gap-2">
            <button
                type="button"
                onClick={onRegenerate}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            >
                <RefreshCcw className="h-3.5 w-3.5" />
                Regenerate
            </button>
            <button
                type="button"
                onClick={onLooksGood}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-50"
            >
                Looks Good
                <ArrowRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// Step 1 — Title & Brief
// ════════════════════════════════════════════════════════════

function TitleBriefStep({
    title,
    briefing,
    isBusy,
    confirmed = false,
    onTitle,
    onBriefing,
    onLooksGood,
    onRegenerate,
}: {
    title: string;
    briefing: string;
    isBusy: boolean;
    confirmed?: boolean;
    onTitle: (v: string) => void;
    onBriefing: (v: string) => void;
    onLooksGood: () => void;
    onRegenerate: () => void;
}) {
    return (
        <div className={CARD_CLASS}>
            <CardHeader
                title={confirmed ? "Title & Brief" : "Here's your study title and brief"}
                subtitle={
                    confirmed
                        ? "Edit anytime — changes save automatically."
                        : "Tweak anything you'd like, then confirm to continue."
                }
            />

            <div className="space-y-5">
                <div>
                    <FieldLabel>Study Title</FieldLabel>
                    <input
                        className={INPUT_CLASS}
                        value={title}
                        onChange={(e) => onTitle(e.target.value)}
                        placeholder="Untitled study"
                    />
                </div>

                <div>
                    <FieldLabel>Research Brief</FieldLabel>
                    <textarea
                        className={cn(INPUT_CLASS, "min-h-[160px] resize-y leading-relaxed")}
                        value={briefing}
                        onChange={(e) => onBriefing(e.target.value)}
                        placeholder="What this study is exploring..."
                    />
                </div>
            </div>

            {!confirmed && (
                <StepActions
                    isBusy={isBusy}
                    onLooksGood={onLooksGood}
                    onRegenerate={onRegenerate}
                />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// Step 2 — Welcome Page
// ════════════════════════════════════════════════════════════

function WelcomeStep({
    title,
    description,
    isBusy,
    confirmed = false,
    onTitle,
    onDescription,
    onLooksGood,
    onRegenerate,
}: {
    title: string;
    description: string;
    isBusy: boolean;
    confirmed?: boolean;
    onTitle: (v: string) => void;
    onDescription: (v: string) => void;
    onLooksGood: () => void;
    onRegenerate: () => void;
}) {
    return (
        <div className={CARD_CLASS}>
            <CardHeader
                title={confirmed ? "Welcome Page" : "Your participants will see this first"}
                subtitle={
                    confirmed
                        ? "Edit anytime — changes save automatically."
                        : "The welcome page sets the tone for the conversation."
                }
            />

            <div className="space-y-5">
                <div>
                    <FieldLabel>Headline</FieldLabel>
                    <input
                        className={INPUT_CLASS}
                        value={title}
                        onChange={(e) => onTitle(e.target.value)}
                        placeholder="Welcome headline"
                    />
                </div>

                <div>
                    <FieldLabel>Welcome Message</FieldLabel>
                    <textarea
                        className={cn(INPUT_CLASS, "min-h-[140px] resize-y leading-relaxed")}
                        value={description}
                        onChange={(e) => onDescription(e.target.value)}
                        placeholder="A short message that orients participants..."
                    />
                </div>
            </div>

            {!confirmed && (
                <StepActions
                    isBusy={isBusy}
                    onLooksGood={onLooksGood}
                    onRegenerate={onRegenerate}
                />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// Step 3 — Objectives + Questions (editable)
// ════════════════════════════════════════════════════════════

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
    { value: "open-ended", label: "Open-ended", description: "Answer freely" },
    { value: "single-select", label: "Single-select", description: "One answer from predefined options" },
    { value: "multiselect", label: "Multiselect", description: "Many answers from predefined options" },
];

const INTERVIEW_MODES: {
    value: InterviewMode;
    label: string;
    icon: React.ReactNode;
}[] = [
    { value: "video_call", label: "Video", icon: <Video className="w-3.5 h-3.5" /> },
    { value: "audio_call", label: "Audio", icon: <Phone className="w-3.5 h-3.5" /> },
    { value: "chat", label: "Chat", icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

function ObjectivesStep({
    objectives,
    isBusy,
    confirmed = false,
    onLooksGood,
    onRegenerate,
}: {
    objectives: ResearchObjective[];
    isBusy: boolean;
    confirmed?: boolean;
    onLooksGood: () => void;
    onRegenerate: () => void;
}) {
    const {
        updateObjective,
        deleteObjective,
        addObjective,
        updateQuestion,
        deleteQuestion,
        addQuestion,
    } = useDesigner();

    const totalQuestions = objectives.reduce((n, o) => n + o.questions.length, 0);

    return (
        <div className={CARD_CLASS}>
            <CardHeader
                title={confirmed ? "Research Objectives" : "Here's your research plan"}
                subtitle={
                    confirmed
                        ? "Edit anytime — changes save automatically."
                        : `${objectives.length} ${objectives.length === 1 ? "objective" : "objectives"}, ${totalQuestions} ${totalQuestions === 1 ? "question" : "questions"} in total.`
                }
            />

            <div className="space-y-5">
                {objectives.map((obj, i) => (
                    <ObjectiveEditor
                        key={obj.id}
                        objective={obj}
                        index={i}
                        onUpdate={(field, value) => updateObjective(obj.id, field, value)}
                        onDelete={() => deleteObjective(obj.id)}
                        onUpdateQuestion={(qid, field, value) =>
                            updateQuestion(obj.id, qid, field, value)
                        }
                        onDeleteQuestion={(qid) => deleteQuestion(obj.id, qid)}
                        onAddQuestion={() => addQuestion(obj.id)}
                    />
                ))}

                <button
                    type="button"
                    onClick={addObjective}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-4 text-[13px] font-medium text-muted-foreground/60 transition-all hover:border-[#FF8A4C]/50 hover:bg-[#FF8A4C]/[0.03] hover:text-foreground dark:border-[#27272A] dark:hover:border-[#FF8A4C]/40"
                >
                    <Plus className="h-3.5 w-3.5 transition-colors group-hover:text-[#FF8A4C]" />
                    Add objective
                </button>
            </div>

            {!confirmed && (
                <StepActions
                    isBusy={isBusy}
                    onLooksGood={onLooksGood}
                    onRegenerate={onRegenerate}
                />
            )}
        </div>
    );
}

function ObjectiveEditor({
    objective,
    index,
    onUpdate,
    onDelete,
    onUpdateQuestion,
    onDeleteQuestion,
    onAddQuestion,
}: {
    objective: ResearchObjective;
    index: number;
    onUpdate: (field: "title" | "description", value: string) => void;
    onDelete: () => void;
    onUpdateQuestion: (
        qid: string,
        field: keyof Question,
        value: string | number | string[] | QuestionType | InterviewMode
    ) => void;
    onDeleteQuestion: (qid: string) => void;
    onAddQuestion: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="rounded-2xl border border-gray-100 bg-muted/[0.25] p-5 transition-all dark:border-[#27272A] dark:bg-[#1c1c1f]"
        >
            <div className="mb-4 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[12px] font-semibold text-white shadow-sm shadow-indigo-500/30">
                    {index + 1}
                </div>

                <div className="flex-1 space-y-2">
                    <BorderedInput
                        value={objective.title}
                        placeholder="Objective title"
                        onChange={(v) => onUpdate("title", v)}
                        className="text-[14px] font-semibold text-foreground"
                    />
                    <BorderedTextarea
                        value={objective.description}
                        placeholder="What this objective is exploring..."
                        onChange={(v) => onUpdate("description", v)}
                        className="text-[12.5px] leading-relaxed text-foreground/70"
                    />
                </div>

                <button
                    type="button"
                    onClick={onDelete}
                    className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
                        hovered ? "opacity-100" : "opacity-0"
                    )}
                    aria-label="Delete objective"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="space-y-2.5 pl-10">
                {objective.questions.map((q, qi) => (
                    <QuestionEditor
                        key={q.id}
                        question={q}
                        index={qi}
                        onUpdate={(field, value) => onUpdateQuestion(q.id, field, value)}
                        onDelete={() => onDeleteQuestion(q.id)}
                    />
                ))}

                <button
                    type="button"
                    onClick={onAddQuestion}
                    className="group flex items-center gap-1.5 rounded-lg border border-dashed border-transparent px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/40 transition-all hover:border-gray-200 hover:bg-muted/30 hover:text-foreground dark:hover:border-[#27272A]"
                >
                    <Plus className="h-3 w-3 transition-colors group-hover:text-[#FF8A4C]" />
                    Add question
                </button>
            </div>
        </div>
    );
}

function QuestionEditor({
    question,
    index,
    onUpdate,
    onDelete,
}: {
    question: Question;
    index: number;
    onUpdate: (
        field: keyof Question,
        value: string | number | string[] | QuestionType | InterviewMode
    ) => void;
    onDelete: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const [typeOpen, setTypeOpen] = useState(false);
    const typeRef = useRef<HTMLDivElement>(null);

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

    const currentType =
        QUESTION_TYPES.find((t) => t.value === question.type) ?? QUESTION_TYPES[0];

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "rounded-xl border bg-card/50 p-4 transition-all duration-200",
                hovered
                    ? "border-gray-200 dark:border-[#3F3F46]"
                    : "border-gray-100 dark:border-[#27272A]"
            )}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground/40">
                    Q{index + 1}
                </span>

                <div className="flex items-center gap-1.5">
                    <div className="relative" ref={typeRef}>
                        <button
                            type="button"
                            onClick={() => setTypeOpen((o) => !o)}
                            className="flex items-center gap-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gray-300 dark:border-[#27272A] dark:hover:border-[#3F3F46]"
                        >
                            {currentType.label}
                            <ChevronDown
                                className={cn(
                                    "h-3 w-3 transition-transform",
                                    typeOpen && "rotate-180"
                                )}
                            />
                        </button>
                        {typeOpen && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-56 animate-in fade-in slide-in-from-top-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg shadow-black/10 duration-150 dark:border-[#27272A] dark:bg-[#1C1C1E] dark:shadow-black/30">
                                {QUESTION_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => {
                                            onUpdate("type", t.value);
                                            setTypeOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50",
                                            t.value === question.type && "bg-muted/30"
                                        )}
                                    >
                                        <div>
                                            <p className="text-xs font-medium text-foreground">
                                                {t.label}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                {t.description}
                                            </p>
                                        </div>
                                        {t.value === question.type && (
                                            <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onDelete}
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
                            hovered ? "opacity-100" : "opacity-0"
                        )}
                        aria-label="Delete question"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <MicroLabel>Question</MicroLabel>
                    <BorderedTextarea
                        value={question.text}
                        placeholder="What do you want to ask the participant?"
                        onChange={(v) => onUpdate("text", v)}
                        className="text-[13px] leading-relaxed text-foreground/80"
                    />
                </div>

                <div>
                    <MicroLabel>Context</MicroLabel>
                    <BorderedTextarea
                        value={question.context}
                        placeholder="How should the interviewer use this question? What to probe for..."
                        onChange={(v) => onUpdate("context", v)}
                        className="text-[12px] leading-relaxed text-foreground/60"
                    />
                </div>

                {(question.type === "single-select" ||
                    question.type === "multiselect") && (
                    <OptionsEditor
                        options={question.options ?? []}
                        onChange={(opts) => onUpdate("options", opts)}
                    />
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <MicroLabel>Participants</MicroLabel>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-3 py-2 transition-all duration-200 hover:border-gray-300 dark:border-[#27272A] dark:hover:border-[#3F3F46]">
                            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                            <button
                                type="button"
                                onClick={() =>
                                    onUpdate(
                                        "participantCount",
                                        Math.max(1, question.participantCount - 1)
                                    )
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/40 transition-all hover:bg-muted/50 hover:text-foreground"
                            >
                                <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[16px] text-center text-[13px] font-semibold tabular-nums text-foreground">
                                {question.participantCount}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    onUpdate(
                                        "participantCount",
                                        question.participantCount + 1
                                    )
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/40 transition-all hover:bg-muted/50 hover:text-foreground"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <MicroLabel>Mode</MicroLabel>
                        <InterviewModePicker
                            value={question.interviewMode}
                            onChange={(mode) => onUpdate("interviewMode", mode)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
            {children}
        </label>
    );
}

function InterviewModePicker({
    value,
    onChange,
}: {
    value: InterviewMode;
    onChange: (mode: InterviewMode) => void;
}) {
    return (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-background p-1 dark:border-[#27272A]">
            {INTERVIEW_MODES.map((mode) => (
                <button
                    key={mode.value}
                    type="button"
                    onClick={() => onChange(mode.value)}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all duration-200",
                        value === mode.value
                            ? "bg-[#FF8A4C] text-white shadow-sm shadow-[#FF8A4C]/20"
                            : "text-muted-foreground/50 hover:bg-muted/30 hover:text-foreground"
                    )}
                >
                    {mode.icon}
                    {mode.label}
                </button>
            ))}
        </div>
    );
}

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
                    : "border-gray-200 bg-background hover:border-gray-300 dark:border-[#27272A] dark:hover:border-[#3F3F46]"
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
                    : "border-gray-200 bg-background hover:border-gray-300 dark:border-[#27272A] dark:hover:border-[#3F3F46]"
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
                    "w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/25",
                    className
                )}
            />
        </div>
    );
}

function OptionsEditor({
    options,
    onChange,
}: {
    options: string[];
    onChange: (options: string[]) => void;
}) {
    const updateOption = (i: number, value: string) => {
        const next = [...options];
        next[i] = value;
        onChange(next);
    };
    const removeOption = (i: number) => onChange(options.filter((_, idx) => idx !== i));
    const addOption = () => onChange([...options, ""]);

    return (
        <div>
            <MicroLabel>Options</MicroLabel>
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
                type="button"
                onClick={addOption}
                className="group mt-1.5 flex items-center gap-1.5 rounded-lg border border-dashed border-transparent px-2.5 py-2 text-[11px] font-medium text-muted-foreground/40 transition-all hover:border-gray-200 hover:bg-muted/30 hover:text-foreground dark:hover:border-[#27272A]"
            >
                <Plus className="h-3 w-3 transition-colors group-hover:text-[#FF8A4C]" />
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
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="flex items-center gap-2"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span className="w-5 shrink-0 text-right text-[10px] font-medium tabular-nums text-muted-foreground/35">
                {index + 1}.
            </span>
            <div className="flex-1 rounded-lg border border-gray-200 px-3 py-2 transition-all duration-200 hover:border-gray-300 focus-within:border-[#FF8A4C]/40 focus-within:shadow-[0_0_0_3px_rgba(255,138,76,0.06)] dark:border-[#27272A] dark:hover:border-[#3F3F46]">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full bg-transparent text-[13px] text-foreground/80 outline-none placeholder:text-muted-foreground/25"
                />
            </div>
            <button
                type="button"
                onClick={onRemove}
                className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/30 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
                    hovered ? "opacity-100" : "opacity-0"
                )}
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// Loading card (steps 2 and 3)
// ════════════════════════════════════════════════════════════

function LoadingCard({ label }: { label: string }) {
    return (
        <div className={cn(CARD_CLASS, "flex flex-col items-center py-14")}>
            <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] shadow-lg shadow-[#FF8A4C]/30"
            >
                <Sparkles className="h-7 w-7 text-white" />
            </motion.div>

            <p className="mt-5 text-[14px] font-medium text-foreground">{label}</p>

            <div className="mt-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#FF8A4C]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                            duration: 1.2,
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


// ════════════════════════════════════════════════════════════
// Error banner
// ════════════════════════════════════════════════════════════

function ErrorBanner({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {message}
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════════
// First load screen — preserved from previous version
// ════════════════════════════════════════════════════════════

const THINKING_PHASES = [
    { text: "Reading your research goal..." },
    { text: "Mapping key themes to explore" },
    { text: "Structuring your study design" },
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

    const displayPrompt =
        prompt.length > 120
            ? prompt.slice(0, 117).replace(/\s+\S*$/, "") + "..."
            : prompt;

    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-[600px] w-[600px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(255,138,76,0.04) 0%, transparent 70%)",
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="relative z-10 w-full max-w-[520px] px-6"
            >
                <div className={CARD_CLASS}>
                    <div className="mb-6 flex items-start gap-4">
                        <motion.div
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] shadow-lg shadow-[#FF8A4C]/25"
                        >
                            <Sparkles className="h-5 w-5 text-white" />
                        </motion.div>
                        <div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-[14px] font-medium leading-snug text-foreground"
                            >
                                Great, let me design this study for you.
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-0.5 text-[12px] text-muted-foreground/50"
                            >
                                This will take a few seconds
                            </motion.p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="mb-6 rounded-xl border border-gray-100 bg-muted/30 px-4 py-3 dark:border-[#27272A] dark:bg-[#27272A]/30"
                    >
                        <p className="text-[13px] italic leading-relaxed text-foreground/70">
                            {displayPrompt}
                        </p>
                    </motion.div>

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
                                            transition={{
                                                duration: 0.4,
                                                ease: [0.175, 0.885, 0.32, 1.275],
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-center gap-3 py-2.5",
                                                    i < THINKING_PHASES.length - 1 &&
                                                        "border-b border-gray-50 dark:border-[#27272A]/50"
                                                )}
                                            >
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                                                    {isDone ? (
                                                        <motion.div
                                                            initial={{
                                                                scale: 0,
                                                                rotate: -90,
                                                            }}
                                                            animate={{
                                                                scale: 1,
                                                                rotate: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.35,
                                                                ease: [
                                                                    0.175, 0.885, 0.32,
                                                                    1.275,
                                                                ],
                                                            }}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/25"
                                                        >
                                                            <Check className="h-3.5 w-3.5 text-white" />
                                                        </motion.div>
                                                    ) : (
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#FF8A4C]/30">
                                                            <motion.div
                                                                className="h-2.5 w-2.5 rounded-full bg-[#FF8A4C]"
                                                                animate={{
                                                                    scale: [1, 0.5, 1],
                                                                    opacity: [0.8, 0.3, 0.8],
                                                                }}
                                                                transition={{
                                                                    duration: 1.2,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <span
                                                    className={cn(
                                                        "text-[13px] transition-all duration-500",
                                                        isDone
                                                            ? "text-muted-foreground/40"
                                                            : isActive
                                                            ? "font-medium text-foreground"
                                                            : "text-muted-foreground/60"
                                                    )}
                                                >
                                                    {step.text}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            );
                        })}
                    </div>

                    <div className="mt-5">
                        <div className="h-1 overflow-hidden rounded-full bg-muted/30 dark:bg-[#27272A]">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[#FF8A4C] to-[#FF6B2C]"
                                initial={{ width: "0%" }}
                                animate={{
                                    width:
                                        phase === 0
                                            ? "5%"
                                            : phase === 1
                                            ? "25%"
                                            : phase === 2
                                            ? "55%"
                                            : phase === 3
                                            ? "85%"
                                            : "100%",
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 select-none text-center text-[10px] text-muted-foreground/25"
                >
                    Powered by AI research design
                </motion.p>
            </motion.div>
        </div>
    );
}
