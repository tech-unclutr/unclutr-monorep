"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Loader2,
    Sparkles,
    Target,
    Users,
    FlaskConical,
    Clock,
    FileText,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// ── Types ──

interface Study {
    id: string;
    name: string;
    family: string;
    description: string;
    departments: string[];
    industries: string[];
    urgency: "P0" | "P1" | "P2" | "P3";
    method: string;
}

interface PlanAnswers {
    decisionType: string;
    decisionDetail: string;
    audience: string;
    signalSources: string[];
    signalDetail: string;
    method: string;
    timeline: string;
    sampleSize: string;
}

// ── Steps ──

const STEPS = [
    { key: "decision", label: "What's This For?", icon: Target },
    { key: "audience", label: "Your Customers", icon: Users },
    { key: "signals", label: "What You've Noticed", icon: Layers },
    { key: "method", label: "Study Approach", icon: FlaskConical },
    { key: "timeline", label: "Timeline & Scale", icon: Clock },
    { key: "review", label: "Review", icon: FileText },
] as const;

// ── Decision Types ──

const DECISION_CHIPS = [
    "Launch or kill a product",
    "Adjust pricing",
    "Enter a new market",
    "Reduce churn",
    "Reposition the brand",
    "Prioritize the roadmap",
    "Improve a key funnel",
    "Understand a new segment",
];

// ── Signal Sources ──

const SIGNAL_CHIPS = [
    { id: "support", label: "Support tickets" },
    { id: "sales", label: "Sales conversations" },
    { id: "analytics", label: "Analytics / drop-off data" },
    { id: "social", label: "Social media mentions" },
    { id: "nps", label: "NPS / survey feedback" },
    { id: "complaints", label: "Customer complaints" },
    { id: "competitors", label: "Competitor activity" },
    { id: "team", label: "Team gut feeling" },
    { id: "churn", label: "Churn / cancellation reasons" },
    { id: "reviews", label: "App store / product reviews" },
];

// ── Method Options ──

const METHOD_OPTIONS = [
    { value: "Interviews", label: "1-on-1 Interviews", desc: "Deep conversations with real customers about their actual experience" },
    { value: "Survey", label: "Survey", desc: "Quantify patterns across a larger customer base" },
    { value: "Usability Test", label: "Usability Test", desc: "Watch how customers actually use the product" },
    { value: "Market Research", label: "Market Research", desc: "Competitive landscape, category trends, and existing data" },
    { value: "Mixed-method", label: "Mixed Method", desc: "Conversations + data for the full picture" },
    { value: "Other", label: "Other", desc: "Custom approach for this specific study" },
];

// ── Timeline Options ──

const TIMELINE_OPTIONS = [
    { value: "1-2 weeks", label: "1–2 Weeks", desc: "Sprint — fast answers, tight scope" },
    { value: "1 month", label: "1 Month", desc: "Standard — proper recruitment and analysis" },
    { value: "2-3 months", label: "2–3 Months", desc: "Deep dive — multiple rounds, segmented" },
    { value: "No rush", label: "No Rush", desc: "Ongoing — collect insights over time" },
];

// ── Sample Size Options ──

const SAMPLE_OPTIONS = [
    { value: "5-10", label: "5–10", desc: "Qualitative depth" },
    { value: "15-30", label: "15–30", desc: "Focused study" },
    { value: "50-100", label: "50–100", desc: "Robust sample" },
    { value: "200+", label: "200+", desc: "Quantitative scale" },
    { value: "500+", label: "500+", desc: "Large-scale" },
];

// ── Chip toggle helper ──

function ToggleChip({
    label,
    selected,
    onClick,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3.5 py-2 rounded-full text-[12.5px] font-medium border transition-all duration-200",
                "hover:scale-[1.03] active:scale-[0.97]",
                selected
                    ? "bg-[#FF8A4C]/10 dark:bg-[#FF8A4C]/15 border-[#FF8A4C]/30 text-[#FF8A4C] shadow-[0_0_8px_rgba(255,138,76,0.1)]"
                    : "bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-[#27272A] text-muted-foreground hover:border-gray-300 dark:hover:border-[#3F3F46] hover:text-foreground"
            )}
        >
            {label}
        </button>
    );
}

// ── Step 1: What's This For? ──

function StepDecision({
    decisionType,
    onTypeChange,
    detail,
    onDetailChange,
}: {
    decisionType: string;
    onTypeChange: (v: string) => void;
    detail: string;
    onDetailChange: (v: string) => void;
}) {
    return (
        <div className="space-y-5">
            <p className="text-muted-foreground text-sm leading-relaxed">
                What decision will this study help you make?
            </p>

            <div className="flex flex-wrap gap-2">
                {DECISION_CHIPS.map((chip) => (
                    <ToggleChip
                        key={chip}
                        label={chip}
                        selected={decisionType === chip}
                        onClick={() => onTypeChange(decisionType === chip ? "" : chip)}
                    />
                ))}
            </div>

            <Textarea
                value={detail}
                onChange={(e) => onDetailChange(e.target.value)}
                placeholder="Give us a bit more context — what specifically are you trying to figure out?"
                className="min-h-[100px] bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-[#27272A] rounded-xl text-sm resize-none focus:border-[#FF8A4C] focus:ring-[#FF8A4C]/20 transition-colors"
            />
        </div>
    );
}

// ── Step 2: Your Customers ──

function StepAudience({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
                Tell us about the customers you want us to reach. The more specific you are about who they are
                and what they&apos;re doing today, the sharper your insights will be.
            </p>

            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., Repeat buyers (3+ orders) in Tier 1 cities who haven't purchased in the last 60 days. They used to buy monthly but dropped off after we changed our packaging..."
                className="min-h-[140px] bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-[#27272A] rounded-xl text-sm resize-none focus:border-[#FF8A4C] focus:ring-[#FF8A4C]/20 transition-colors"
                autoFocus
            />
        </div>
    );
}

// ── Step 3: What You've Noticed ──

function StepSignals({
    selectedSources,
    onToggleSource,
    detail,
    onDetailChange,
}: {
    selectedSources: string[];
    onToggleSource: (id: string) => void;
    detail: string;
    onDetailChange: (v: string) => void;
}) {
    return (
        <div className="space-y-5">
            <p className="text-muted-foreground text-sm leading-relaxed">
                What patterns or signals have you already picked up? This helps us build on what you know instead of starting from scratch.
            </p>

            <div>
                <p className="text-[12px] font-medium text-foreground mb-2.5">
                    Where are these signals coming from?
                </p>
                <div className="flex flex-wrap gap-2">
                    {SIGNAL_CHIPS.map((chip) => (
                        <ToggleChip
                            key={chip.id}
                            label={chip.label}
                            selected={selectedSources.includes(chip.id)}
                            onClick={() => onToggleSource(chip.id)}
                        />
                    ))}
                </div>
            </div>

            <Textarea
                value={detail}
                onChange={(e) => onDetailChange(e.target.value)}
                placeholder="Share any specifics — what are customers saying, what does the data show, what's your team's read on the situation?"
                className="min-h-[100px] bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-[#27272A] rounded-xl text-sm resize-none focus:border-[#FF8A4C] focus:ring-[#FF8A4C]/20 transition-colors"
            />
        </div>
    );
}

// ── Step 4: Study Approach ──

function StepMethod({
    value,
    onChange,
    suggested,
}: {
    value: string;
    onChange: (v: string) => void;
    suggested: string;
}) {
    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
                How should we run this study?
                {suggested && (
                    <span className="ml-1 text-[#FF8A4C] font-medium">
                        We recommend: {suggested}
                    </span>
                )}
            </p>
            <div className="grid grid-cols-2 gap-3">
                {METHOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "relative text-left p-4 rounded-xl border transition-all duration-200",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            value === opt.value
                                ? "border-[#FF8A4C] bg-[#FF8A4C]/5 dark:bg-[#FF8A4C]/10 shadow-[0_0_12px_rgba(255,138,76,0.15)]"
                                : "border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#1a1a1f] hover:border-gray-300 dark:hover:border-[#3F3F46]"
                        )}
                    >
                        <div className="text-sm font-medium text-foreground">{opt.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                        {value === opt.value && (
                            <div className="absolute top-3 right-3">
                                <Check className="w-3.5 h-3.5 text-[#FF8A4C]" />
                            </div>
                        )}
                        {opt.value === suggested && value !== opt.value && (
                            <Badge className="absolute top-2 right-2 bg-[#FF8A4C]/10 text-[#FF8A4C] border-0 text-[9px] font-bold uppercase px-1.5 py-0">
                                Suggested
                            </Badge>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Step 5: Timeline & Scale ──

function StepTimelineScale({
    timeline,
    onTimelineChange,
    sampleSize,
    onSampleChange,
}: {
    timeline: string;
    onTimelineChange: (v: string) => void;
    sampleSize: string;
    onSampleChange: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Timeline */}
            <div>
                <p className="text-sm font-medium text-foreground mb-3">When do you need results?</p>
                <div className="grid grid-cols-2 gap-3">
                    {TIMELINE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onTimelineChange(opt.value)}
                            className={cn(
                                "relative text-left p-4 rounded-xl border transition-all duration-200",
                                "hover:scale-[1.02] active:scale-[0.98]",
                                timeline === opt.value
                                    ? "border-[#FF8A4C] bg-[#FF8A4C]/5 dark:bg-[#FF8A4C]/10 shadow-[0_0_12px_rgba(255,138,76,0.15)]"
                                    : "border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#1a1a1f] hover:border-gray-300 dark:hover:border-[#3F3F46]"
                            )}
                        >
                            <div className="text-sm font-medium text-foreground">{opt.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                            {timeline === opt.value && (
                                <div className="absolute top-3 right-3">
                                    <Check className="w-3.5 h-3.5 text-[#FF8A4C]" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sample Size */}
            <div>
                <p className="text-sm font-medium text-foreground mb-3">How many people should we talk to?</p>
                <div className="flex flex-wrap gap-3">
                    {SAMPLE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onSampleChange(opt.value)}
                            className={cn(
                                "relative px-5 py-3 rounded-xl border transition-all duration-200",
                                "hover:scale-[1.02] active:scale-[0.98]",
                                sampleSize === opt.value
                                    ? "border-[#FF8A4C] bg-[#FF8A4C]/5 dark:bg-[#FF8A4C]/10 shadow-[0_0_12px_rgba(255,138,76,0.15)]"
                                    : "border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#1a1a1f] hover:border-gray-300 dark:hover:border-[#3F3F46]"
                            )}
                        >
                            <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                            {sampleSize === opt.value && (
                                <div className="absolute top-2 right-2">
                                    <Check className="w-3.5 h-3.5 text-[#FF8A4C]" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Step 6: Review ──

function StepReview({
    study,
    answers,
}: {
    study: Study;
    answers: PlanAnswers;
}) {
    const signalLabels = SIGNAL_CHIPS
        .filter((c) => answers.signalSources.includes(c.id))
        .map((c) => c.label);

    const rows = [
        { label: "Study", value: study.name },
        { label: "Decision", value: [answers.decisionType, answers.decisionDetail].filter(Boolean).join(" — ") },
        { label: "Audience", value: answers.audience },
        { label: "Signals", value: signalLabels.length > 0 ? signalLabels.join(", ") : "" },
        { label: "Context", value: answers.signalDetail },
        { label: "Method", value: answers.method },
        { label: "Timeline", value: answers.timeline },
        { label: "Sample", value: answers.sampleSize ? `${answers.sampleSize} participants` : "" },
    ];

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
                Here&apos;s what we&apos;ll work with. Review and launch when ready.
            </p>
            <div className="rounded-xl border border-gray-200 dark:border-[#27272A] bg-white dark:bg-[#1a1a1f] overflow-hidden divide-y divide-gray-100 dark:divide-[#27272A]">
                {rows.map((row) => (
                    <div key={row.label} className="flex gap-4 px-5 py-3.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 shrink-0 pt-0.5">
                            {row.label}
                        </span>
                        <span className="text-sm text-foreground leading-relaxed">
                            {row.value || <span className="text-muted-foreground/50 italic">—</span>}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ──

export function StudyPlanner({ studyId }: { studyId: string }) {
    const router = useRouter();
    const [study, setStudy] = useState<Study | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<PlanAnswers>({
        decisionType: "",
        decisionDetail: "",
        audience: "",
        signalSources: [],
        signalDetail: "",
        method: "",
        timeline: "",
        sampleSize: "",
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchStudy() {
            try {
                setIsLoading(true);
                const allStudies: Study[] = await api.get("/studies");
                if (cancelled) return;

                const found = allStudies.find((s) => s.id === studyId);
                if (found) {
                    setStudy(found);
                    if (found.method) {
                        setAnswers((prev) => ({ ...prev, method: found.method }));
                    }
                }
            } catch {
                console.error("Failed to load study");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchStudy();
        return () => { cancelled = true; };
    }, [studyId]);

    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    const totalSteps = STEPS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const step = STEPS[currentStep];
    const StepIcon = step.icon;

    const canProceed = () => {
        switch (step.key) {
            case "decision":
                return !!answers.decisionType || !!answers.decisionDetail.trim();
            case "audience":
                return !!answers.audience.trim();
            case "signals":
                return true; // optional
            case "method":
                return !!answers.method;
            case "timeline":
                return !!answers.timeline && !!answers.sampleSize;
            case "review":
                return true;
            default:
                return false;
        }
    };

    const toggleSignalSource = (id: string) => {
        setAnswers((prev) => ({
            ...prev,
            signalSources: prev.signalSources.includes(id)
                ? prev.signalSources.filter((s) => s !== id)
                : [...prev.signalSources, id],
        }));
    };

    const goNext = () => {
        if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
    };

    const goBack = () => {
        if (currentStep > 0) setCurrentStep((s) => s - 1);
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        // Placeholder — would call API here
        setTimeout(() => setIsGenerating(false), 2000);
    };

    // ── Loading State ──
    if (isLoading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF8A4C]" />
                    <p className="text-muted-foreground text-sm">Loading study planner...</p>
                </div>
            </div>
        );
    }

    // ── Error State ──
    if (!study) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <h3 className="text-xl font-bold mb-2">Study Not Found</h3>
                <p className="text-muted-foreground text-sm mb-6">
                    We couldn&apos;t find the study you&apos;re looking for.
                </p>
                <Button onClick={() => router.push("/dashboard/studies")} variant="outline">
                    Back to Study Explorer
                </Button>
            </div>
        );
    }

    // ── Main Planner ──
    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            {/* Top Bar */}
            <div className="shrink-0 bg-background/80 backdrop-blur-md border-b border-gray-100 dark:border-[#27272A] px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/studies")}
                        className="hover:bg-gray-100 dark:hover:bg-[#27272A] rounded-full shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-gray-100 dark:bg-[#27272A] text-foreground border-0 text-[10px] font-bold uppercase tracking-wider">
                                {study.family}
                            </Badge>
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-foreground font-display truncate">
                            {study.name}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="shrink-0 px-6 pt-5 pb-0">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <Progress
                        value={progress}
                        className="h-1.5 bg-gray-100 dark:bg-[#27272A] rounded-full"
                        indicatorClassName="bg-[#FF8A4C] rounded-full transition-all duration-500"
                    />
                </div>
            </div>

            {/* Step Content */}
            <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <div
                        key={currentStep}
                        className="animate-[fadeSlideIn_0.3s_ease-out]"
                        style={{ animationFillMode: "both" }}
                    >
                        {/* Step Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#FF8A4C]/10 dark:bg-[#FF8A4C]/15 flex items-center justify-center">
                                <StepIcon className="w-5 h-5 text-[#FF8A4C]" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight font-display">
                                {step.label}
                            </h2>
                        </div>

                        {/* Step Body */}
                        {step.key === "decision" && (
                            <StepDecision
                                decisionType={answers.decisionType}
                                onTypeChange={(v) => setAnswers((p) => ({ ...p, decisionType: v }))}
                                detail={answers.decisionDetail}
                                onDetailChange={(v) => setAnswers((p) => ({ ...p, decisionDetail: v }))}
                            />
                        )}
                        {step.key === "audience" && (
                            <StepAudience
                                value={answers.audience}
                                onChange={(v) => setAnswers((p) => ({ ...p, audience: v }))}
                            />
                        )}
                        {step.key === "signals" && (
                            <StepSignals
                                selectedSources={answers.signalSources}
                                onToggleSource={toggleSignalSource}
                                detail={answers.signalDetail}
                                onDetailChange={(v) => setAnswers((p) => ({ ...p, signalDetail: v }))}
                            />
                        )}
                        {step.key === "method" && (
                            <StepMethod
                                value={answers.method}
                                onChange={(v) => setAnswers((p) => ({ ...p, method: v }))}
                                suggested={study.method}
                            />
                        )}
                        {step.key === "timeline" && (
                            <StepTimelineScale
                                timeline={answers.timeline}
                                onTimelineChange={(v) => setAnswers((p) => ({ ...p, timeline: v }))}
                                sampleSize={answers.sampleSize}
                                onSampleChange={(v) => setAnswers((p) => ({ ...p, sampleSize: v }))}
                            />
                        )}
                        {step.key === "review" && (
                            <StepReview study={study} answers={answers} />
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="shrink-0 border-t border-gray-100 dark:border-[#27272A] bg-background/80 backdrop-blur-md px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        disabled={currentStep === 0}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step.key === "review" ? (
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white shadow-[0_0_15px_rgba(255,138,76,0.25)] px-6"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Study Plan
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={goNext}
                            disabled={!canProceed()}
                            className={cn(
                                "px-6 transition-all duration-200",
                                canProceed()
                                    ? "bg-foreground text-background hover:bg-foreground/90"
                                    : "bg-gray-200 dark:bg-[#27272A] text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            Continue
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Step Dots */}
            <div className="shrink-0 flex items-center justify-center gap-1.5 pb-4">
                {STEPS.map((s, i) => (
                    <button
                        key={s.key}
                        onClick={() => {
                            if (i <= currentStep) setCurrentStep(i);
                        }}
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            i === currentStep
                                ? "w-6 bg-[#FF8A4C]"
                                : i < currentStep
                                    ? "bg-[#FF8A4C]/40 hover:bg-[#FF8A4C]/60 cursor-pointer"
                                    : "bg-gray-200 dark:bg-[#3F3F46]"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
