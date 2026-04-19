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
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesigner, type Phase } from "./StudyDesignerContext";
import type { ResearchObjective, KeyResearchQuestion } from "./types";

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
        isFinalizingCohorts,
        finalizeError,
        updateField,
        looksGood,
        regenerate,
        retryFinalize,
    } = useDesigner();

    // First-time generation: full-screen FirstLoadScreen, but only when there
    // is genuinely nothing to show yet. After the user has confirmed at least
    // one section, the loading state for the next section appears inline.
    if (phase === "loading_executive_summary" && !study.executiveSummary) {
        return <FirstLoadScreen prompt={initialPrompt} />;
    }

    const execSummaryConfirmed = isPhaseAfter(phase, "review_executive_summary");
    const titleConfirmed = isPhaseAfter(phase, "review_title");
    const welcomeConfirmed = isPhaseAfter(phase, "review_welcome");
    const objectivesConfirmed = isPhaseAfter(phase, "review_objectives");
    const researchQuestionsConfirmed = isPhaseAfter(phase, "review_research_questions");

    return (
        <div className="h-full w-full overflow-y-auto scrollbar-subtle bg-background">
            <div className="mx-auto max-w-[760px] px-8 py-12 space-y-6">
                <SaveIndicator isSaving={isSaving} />

                {/* Executive Summary — always first */}
                {execSummaryConfirmed ? (
                    <ExecutiveSummaryStep
                        summary={study.executiveSummary}
                        isBusy={isBusy}
                        confirmed
                        onSummary={(v) => updateField("executiveSummary", v)}
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "review_executive_summary" ? (
                    <ExecutiveSummaryStep
                        summary={study.executiveSummary}
                        isBusy={isBusy}
                        onSummary={(v) => updateField("executiveSummary", v)}
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : null}

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
                ) : phase === "loading_title" ? (
                    <LoadingCard label="Drafting your title and brief..." />
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

                {/* Key Research Questions — view-only */}
                {researchQuestionsConfirmed ? (
                    <ResearchQuestionsStep
                        items={study.keyResearchQuestions}
                        isBusy={isBusy}
                        confirmed
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "review_research_questions" ? (
                    <ResearchQuestionsStep
                        items={study.keyResearchQuestions}
                        isBusy={isBusy}
                        onLooksGood={looksGood}
                        onRegenerate={regenerate}
                    />
                ) : phase === "loading_research_questions" ? (
                    <LoadingCard label="Distilling your key research questions..." />
                ) : null}

                {phase === "done" && (isFinalizingCohorts || finalizeError) && (
                    <FinalizingBanner
                        isFinalizing={isFinalizingCohorts}
                        error={finalizeError}
                        onRetry={retryFinalize}
                    />
                )}

                {error && <ErrorBanner message={error} />}
            </div>
        </div>
    );
}

function FinalizingBanner({
    isFinalizing,
    error,
    onRetry,
}: {
    isFinalizing: boolean;
    error: string | null;
    onRetry: () => Promise<void>;
}) {
    if (error) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                        Couldn&rsquo;t finish preparing your study
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Your research is saved. Try again in a moment.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { void onRetry(); }}
                    className="shrink-0 rounded-md h-8 px-3 text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }
    return (
        <div className="rounded-xl border border-[#FF8A4C]/30 bg-[#FF8A4C]/5 px-5 py-4 flex items-start gap-3 shadow-[0_0_15px_rgba(255,138,76,0.08)]">
            <Loader2 className="w-4 h-4 text-[#FF8A4C] shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    Preparing your study
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Analyzing cohorts and generating hypotheses…
                </p>
            </div>
        </div>
    );
}

const PHASE_ORDER: Phase[] = [
    "loading_executive_summary",
    "review_executive_summary",
    "loading_title",
    "review_title",
    "loading_welcome",
    "review_welcome",
    "loading_objectives",
    "review_objectives",
    "loading_research_questions",
    "review_research_questions",
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
// Step 0 — Executive Summary
// ════════════════════════════════════════════════════════════

function ExecutiveSummaryStep({
    summary,
    isBusy,
    confirmed = false,
    onSummary,
    onLooksGood,
    onRegenerate,
}: {
    summary: string;
    isBusy: boolean;
    confirmed?: boolean;
    onSummary: (v: string) => void;
    onLooksGood: () => void;
    onRegenerate: () => void;
}) {
    return (
        <div className={CARD_CLASS}>
            <CardHeader
                title={
                    confirmed
                        ? "Executive Summary"
                        : "Here's your executive summary"
                }
                subtitle={
                    confirmed
                        ? "Edit anytime — changes save automatically."
                        : "A strategic restatement of purpose, cohorts, hypotheses, and business impact. Refine as you like."
                }
            />

            <div className="space-y-5">
                <div>
                    <FieldLabel>Executive Summary</FieldLabel>
                    <textarea
                        className={cn(
                            INPUT_CLASS,
                            "min-h-[240px] resize-y leading-relaxed"
                        )}
                        value={summary}
                        onChange={(e) => onSummary(e.target.value)}
                        placeholder="A concise executive summary will appear here..."
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
// Step 3 — Objectives (document-style, review-first)
// ════════════════════════════════════════════════════════════

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
    const { updateObjective, deleteObjective, addObjective } = useDesigner();

    return (
        <div className={cn(CARD_CLASS, "px-10 py-9")}>
            <div className="mb-7 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF8A4C]">
                    Objectives
                </span>
                {confirmed && (
                    <span className="text-[11px] text-muted-foreground/60">
                        Edit anytime — changes save automatically.
                    </span>
                )}
            </div>

            <ol className="space-y-7">
                {objectives.map((obj, i) => (
                    <ObjectiveEditor
                        key={obj.id}
                        objective={obj}
                        index={i}
                        onUpdate={(field, value) => updateObjective(obj.id, field, value)}
                        onDelete={() => deleteObjective(obj.id)}
                    />
                ))}
            </ol>

            <button
                type="button"
                onClick={addObjective}
                className="group mt-7 flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground/50 transition-colors hover:text-[#FF8A4C]"
            >
                <Plus className="h-3.5 w-3.5" />
                Add objective
            </button>

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
}: {
    objective: ResearchObjective;
    index: number;
    onUpdate: (field: "title" | "description", value: string) => void;
    onDelete: () => void;
}) {
    return (
        <li className="group relative grid grid-cols-[28px_1fr_24px] items-start gap-3">
            <span className="pt-[1px] text-[14px] font-semibold tabular-nums text-foreground">
                {index + 1}.
            </span>

            <div className="min-w-0 space-y-1">
                <InlineInput
                    value={objective.title}
                    placeholder="Objective title"
                    onChange={(v) => onUpdate("title", v)}
                    className="text-[15px] font-semibold leading-snug text-foreground"
                />
                <InlineTextarea
                    value={objective.description}
                    placeholder="What this objective is exploring..."
                    onChange={(v) => onUpdate("description", v)}
                    className="text-[13.5px] leading-relaxed text-muted-foreground"
                />
            </div>

            <button
                type="button"
                onClick={onDelete}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                aria-label="Delete objective"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </li>
    );
}

// ── Inline (borderless) editors — underline on focus ──

function InlineInput({
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
                "w-full border-b border-transparent bg-transparent py-0.5 outline-none transition-colors placeholder:text-muted-foreground/25 focus:border-[#FF8A4C]/40",
                className
            )}
        />
    );
}

function InlineTextarea({
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
            rows={2}
            className={cn(
                "w-full resize-none border-b border-transparent bg-transparent py-0.5 outline-none transition-colors placeholder:text-muted-foreground/25 focus:border-[#FF8A4C]/40",
                className
            )}
        />
    );
}

// ════════════════════════════════════════════════════════════
// Step 4 — Key Research Questions (view-only)
// ════════════════════════════════════════════════════════════

function ResearchQuestionsStep({
    items,
    isBusy,
    confirmed = false,
    onLooksGood,
    onRegenerate,
}: {
    items: KeyResearchQuestion[];
    isBusy: boolean;
    confirmed?: boolean;
    onLooksGood: () => void;
    onRegenerate: () => void;
}) {
    return (
        <div className={cn(CARD_CLASS, "px-10 py-9")}>
            <div className="mb-7 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF8A4C]">
                    Key Research Questions
                </span>
                {confirmed && (
                    <span className="text-[11px] text-muted-foreground/60">
                        Locked once accepted.
                    </span>
                )}
            </div>

            <ol className="space-y-6">
                {items.map((item, i) => (
                    <li
                        key={item.id}
                        className="grid grid-cols-[28px_1fr] items-start gap-3"
                    >
                        <span className="pt-[1px] text-[14px] font-semibold tabular-nums text-foreground">
                            {i + 1}.
                        </span>
                        <div className="min-w-0">
                            <p className="text-[15px] font-semibold leading-snug text-foreground">
                                {item.title}
                            </p>
                            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                                {item.question}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>

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
