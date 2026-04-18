"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    Users,
    MessageSquare,
    Mic,
    Copy,
    CheckIcon,
    ArrowLeft,
    Sparkles,
    Send,
    RotateCcw,
    CheckCircle2,
    X,
    ChevronRight,
    FileText,
} from "lucide-react";
import { cn, capitalizeCohortName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecruitment } from "./RecruitmentContext";
import {
    buildPerCombinationPrompts,
    fetchPromptTemplate,
    combinationKey,
    INTERVIEW_TYPE_LABELS,
    type CombinationPrompt,
    type InterviewTypeKey,
} from "@/lib/executionPromptTemplate";
import { api } from "@/lib/api";

export interface StudyContext {
    studyId?: string;
    title: string;
    briefing?: string;
    objectives?: Array<{
        title: string;
        description?: string;
    }>;
}

interface ExecutionPromptViewProps {
    onBack: () => void;
    onExecute: () => void;
    className?: string;
    studyContext?: StudyContext;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface PromptSuggestion {
    section: string;
    description: string;
    modified_prompt: string;
}

const STARTER_CHIPS = [
    "Make the tone warmer",
    "Shorten the opening script",
    "Allow more probing questions",
    "Add edge case handling",
];

const INTERVIEW_TYPE_ICONS: Record<InterviewTypeKey, React.ReactNode> = {
    chat: <MessageSquare className="w-3 h-3" />,
    audioA: <Mic className="w-3 h-3" />,
    audioB: <Mic className="w-3 h-3" />,
    audioC: <Mic className="w-3 h-3" />,
};

export function ExecutionPromptView({
    onBack,
    onExecute,
    className,
    studyContext,
}: ExecutionPromptViewProps) {
    const {
        extractedLeads: leads,
        selectedCohorts,
        getCohortCategories,
        getCohortIncentives,
        cohortInterviews,
        cohortIncentives,
        getCombinationCustomPrompt,
        setCombinationCustomPrompt,
    } = useRecruitment();

    const [copied, setCopied] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [activeComboKey, setActiveComboKey] = useState<string>("");

    // Chat state — per combination
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [pendingSuggestion, setPendingSuggestion] = useState<PromptSuggestion | null>(null);
    const [followUpChips, setFollowUpChips] = useState<string[]>(STARTER_CHIPS);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPromptTemplate().then(setPromptTemplate).catch(console.error);
    }, []);

    // ── Build all combination prompts ───────────────────────────────────

    const combinations = useMemo(() =>
        promptTemplate
            ? buildPerCombinationPrompts(promptTemplate, {
                studyContext,
                selectedCohorts,
                getCohortCategories,
                getCohortIncentives,
            })
            : [],
    [promptTemplate, studyContext, selectedCohorts, cohortInterviews, cohortIncentives, getCohortCategories, getCohortIncentives]);

    // Auto-select the first combination
    useEffect(() => {
        if (combinations.length > 0 && !combinations.find((c) => combinationKey(c.cohort, c.interviewType) === activeComboKey)) {
            setActiveComboKey(combinationKey(combinations[0].cohort, combinations[0].interviewType));
        }
    }, [combinations, activeComboKey]);

    const activeCombo = combinations.find(
        (c) => combinationKey(c.cohort, c.interviewType) === activeComboKey,
    );

    const displayPrompt = activeCombo
        ? getCombinationCustomPrompt(activeComboKey) ?? activeCombo.prompt
        : "";

    const hasCustomPrompt = activeCombo
        ? !!getCombinationCustomPrompt(activeComboKey)
        : false;

    // ── Group combinations by cohort for navigator ──────────────────────

    const cohortGroups = useMemo(() => {
        const groups: Record<string, CombinationPrompt[]> = {};
        combinations.forEach((c) => {
            if (!groups[c.cohort]) groups[c.cohort] = [];
            groups[c.cohort].push(c);
        });
        return groups;
    }, [combinations]);

    // ── Stats ───────────────────────────────────────────────────────────

    const totalSelectedLeads = useMemo(() => {
        let count = 0;
        leads.forEach((lead) => {
            const c = lead.cohort || "Default";
            if (selectedCohorts.includes(c)) count++;
        });
        return count;
    }, [leads, selectedCohorts]);

    // ── Scroll chat on new messages ─────────────────────────────────────

    const currentChatMessages = chatMessages[activeComboKey] ?? [];

    useEffect(() => {
        if (chatOpen) {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
    }, [currentChatMessages, chatOpen]);

    // ── Handlers ────────────────────────────────────────────────────────

    const handleCopy = async () => {
        await navigator.clipboard.writeText(displayPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetPrompt = () => {
        setCombinationCustomPrompt(activeComboKey, null);
        setPendingSuggestion(null);
    };

    const handleSelectCombo = (key: string) => {
        setActiveComboKey(key);
        setPendingSuggestion(null);
    };

    // ── Chat ────────────────────────────────────────────────────────────

    const sendMessage = async (message: string) => {
        if (!message.trim() || isChatLoading) return;

        const userMsg: ChatMessage = { role: "user", content: message.trim() };
        const prev = chatMessages[activeComboKey] ?? [];
        const newMessages = [...prev, userMsg];
        setChatMessages((m) => ({ ...m, [activeComboKey]: newMessages }));
        setChatInput("");
        setFollowUpChips([]);
        setIsChatLoading(true);

        try {
            const data = await api.request("/study-planner/prompt-chat", {
                method: "POST",
                body: JSON.stringify({
                    prompt: displayPrompt,
                    messages: prev.slice(-6),
                    user_message: message.trim(),
                }),
            });

            const assistantMsg: ChatMessage = { role: "assistant", content: data.reply };
            setChatMessages((m) => ({ ...m, [activeComboKey]: [...newMessages, assistantMsg] }));

            if (data.suggestion) {
                setPendingSuggestion(data.suggestion);
            }
            if (data.follow_up_chips?.length) {
                setFollowUpChips(data.follow_up_chips);
            }
        } catch {
            const errorMsg: ChatMessage = {
                role: "assistant",
                content: "Sorry, I couldn't process that. Please try again.",
            };
            setChatMessages((m) => ({ ...m, [activeComboKey]: [...newMessages, errorMsg] }));
            setFollowUpChips(STARTER_CHIPS);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleApplySuggestion = () => {
        if (!pendingSuggestion) return;
        setCombinationCustomPrompt(activeComboKey, pendingSuggestion.modified_prompt);
        setPendingSuggestion(null);
    };

    const handleDismissSuggestion = () => {
        setPendingSuggestion(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatInput);
        }
    };

    // ── Empty state ─────────────────────────────────────────────────────

    if (combinations.length === 0 && promptTemplate) {
        return (
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
                className,
            )}>
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No prompts to generate</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                                Select at least one question in a cohort to generate execution prompts for each combination.
                            </p>
                        </div>
                        <Button variant="ghost" onClick={onBack} className="mt-2 text-xs font-semibold uppercase tracking-wide">
                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                            Back to Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────

    const activeIndex = combinations.findIndex(
        (c) => combinationKey(c.cohort, c.interviewType) === activeComboKey,
    );

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
        )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(245,158,11,0.04),transparent_50%)]" />
            </div>

            <CardContent className="p-6 md:p-8 flex flex-col relative z-10 min-h-0 flex-1">
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Execution Prompts</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {combinations.length} prompt{combinations.length !== 1 ? "s" : ""} generated
                                    <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                                    {totalSelectedLeads} leads
                                    <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                                    {selectedCohorts.length} cohort{selectedCohorts.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasCustomPrompt && (
                                <button
                                    onClick={handleResetPrompt}
                                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                </button>
                            )}
                            <Button
                                variant="ghost"
                                onClick={handleCopy}
                                className={cn(
                                    "rounded-xl px-4 h-9 text-xs font-bold uppercase tracking-wide transition-all",
                                    copied
                                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-white/5",
                                )}
                            >
                                {copied ? (
                                    <><CheckIcon className="w-3.5 h-3.5 mr-1.5" /> Copied</>
                                ) : (
                                    <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</>
                                )}
                            </Button>
                            <button
                                onClick={() => setChatOpen((v) => !v)}
                                className={cn(
                                    "flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all",
                                    chatOpen
                                        ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/25"
                                        : "text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20",
                                )}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {chatOpen ? "Close AI" : "AI Assistant"}
                            </button>
                        </div>
                    </div>

                    {/* Main layout: sidebar + prompt + chat */}
                    <div className="flex gap-4 flex-1 min-h-0">

                        {/* Left sidebar — Combination navigator */}
                        <div className="w-[220px] shrink-0 flex flex-col rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50">
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                    Prompts
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-subtle p-2 space-y-3">
                                {Object.entries(cohortGroups).map(([cohort, combos]) => (
                                    <div key={cohort}>
                                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 truncate">
                                                {capitalizeCohortName(cohort)}
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {combos.map((combo) => {
                                                const key = combinationKey(combo.cohort, combo.interviewType);
                                                const isActive = key === activeComboKey;
                                                const hasCustom = !!getCombinationCustomPrompt(key);
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleSelectCombo(key)}
                                                        className={cn(
                                                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all",
                                                            isActive
                                                                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-200/60 dark:border-amber-500/20 shadow-sm shadow-amber-500/10"
                                                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent",
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                                                            isActive
                                                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                                                : "bg-zinc-200/60 dark:bg-zinc-700/40 text-zinc-400 dark:text-zinc-500",
                                                        )}>
                                                            {INTERVIEW_TYPE_ICONS[combo.interviewType]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-[11px] font-semibold truncate",
                                                                isActive
                                                                    ? "text-amber-700 dark:text-amber-300"
                                                                    : "text-zinc-600 dark:text-zinc-400",
                                                            )}>
                                                                {INTERVIEW_TYPE_LABELS[combo.interviewType]}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {hasCustom && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" title="AI-modified" />
                                                            )}
                                                            <span className={cn(
                                                                "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md",
                                                                isActive
                                                                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                                                    : "bg-zinc-200/60 dark:bg-zinc-700/40 text-zinc-500 dark:text-zinc-500",
                                                            )}>
                                                                {combo.questionCount}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center — Prompt viewer */}
                        <div className={cn("flex flex-col min-h-0 min-w-0", chatOpen ? "flex-[3]" : "flex-1")}>
                            <div className="flex-1 min-h-0 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                                            hasCustomPrompt
                                                ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)] animate-pulse"
                                                : "bg-amber-500 animate-pulse",
                                        )} />
                                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                            {hasCustomPrompt ? "AI-Modified" : "Generated"}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mx-1">·</span>
                                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                                            {activeCombo?.label ?? "Select a prompt"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
                                            {activeIndex + 1}/{combinations.length}
                                        </span>
                                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                        <span className="text-[10px] font-medium text-zinc-400">
                                            {displayPrompt.split("\n").length} lines
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 p-5 overflow-y-auto scrollbar-subtle">
                                    <pre className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                                        {displayPrompt || "Select a prompt from the sidebar."}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Right column — Chat panel */}
                        <AnimatePresence>
                            {chatOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20, width: 0 }}
                                    animate={{ opacity: 1, x: 0, width: "auto" }}
                                    exit={{ opacity: 0, x: 20, width: 0 }}
                                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                    className="flex-[2] min-w-0 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden"
                                >
                                    {/* Chat header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                                <Sparkles className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Prompt Assistant</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-medium">Powered by Gemini</span>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-subtle">
                                        {currentChatMessages.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
                                                    <Sparkles className="w-4 h-4 text-violet-500" />
                                                </div>
                                                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 max-w-[180px] leading-relaxed">
                                                    Refine the selected prompt — changes apply only to this combination
                                                </p>
                                            </div>
                                        )}

                                        {currentChatMessages.map((msg, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={cn(
                                                    "flex",
                                                    msg.role === "user" ? "justify-end" : "justify-start",
                                                )}
                                            >
                                                <div className={cn(
                                                    "max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
                                                    msg.role === "user"
                                                        ? "bg-violet-600 text-white rounded-br-sm"
                                                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 rounded-bl-sm shadow-sm",
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Pending suggestion banner */}
                                        <AnimatePresence>
                                            {pendingSuggestion && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                            <ChevronRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                                                                {pendingSuggestion.section}
                                                            </p>
                                                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                                                                {pendingSuggestion.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={handleApplySuggestion}
                                                            className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-bold transition-all active:scale-[0.97]"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Apply
                                                        </button>
                                                        <button
                                                            onClick={handleDismissSuggestion}
                                                            className="h-7 px-3 rounded-lg text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* AI loading */}
                                        {isChatLoading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex justify-start"
                                            >
                                                <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                                                    <div className="flex gap-1 items-center h-4">
                                                        {[0, 1, 2].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                                                animate={{ y: [0, -4, 0] }}
                                                                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Follow-up chips */}
                                    {followUpChips.length > 0 && !isChatLoading && (
                                        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                                            {followUpChips.map((chip) => (
                                                <button
                                                    key={chip}
                                                    onClick={() => sendMessage(chip)}
                                                    className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-500/50 hover:text-violet-700 dark:hover:text-violet-400 transition-all active:scale-[0.97]"
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input */}
                                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm shrink-0">
                                        <div className="flex gap-2 items-end">
                                            <textarea
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Ask me to modify this prompt…"
                                                disabled={isChatLoading}
                                                rows={1}
                                                className={cn(
                                                    "flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700",
                                                    "bg-white dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300",
                                                    "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                                                    "px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400",
                                                    "transition-all scrollbar-subtle max-h-24 overflow-y-auto",
                                                    isChatLoading && "opacity-50 cursor-not-allowed",
                                                )}
                                                style={{ fieldSizing: "content" } as React.CSSProperties}
                                            />
                                            <button
                                                onClick={() => sendMessage(chatInput)}
                                                disabled={!chatInput.trim() || isChatLoading}
                                                className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-[0.94] shrink-0",
                                                    chatInput.trim() && !isChatLoading
                                                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/25"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed",
                                                )}
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
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
                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                            Back
                        </Button>

                        <Button
                            type="button"
                            onClick={onExecute}
                            className="rounded-xl h-11 px-8 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/25 ring-4 ring-amber-500/10"
                        >
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                <span>Launch Execution</span>
                            </span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
