"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GripVertical,
    Mic,
    MessageSquare,
    CheckIcon,
    ChevronDown,
    Sparkles,
    Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

// ── Types ──

export interface InterviewQuestion {
    id: string;
    text: string;
    type: "open-ended" | "single-select" | "multiselect";
    interviewMode: "chat" | "audio_call" | "video_call";
    objective?: string;
    selected: boolean;
    participantCount?: number;
    context?: string;
}

export interface InterviewCategories {
    chat: InterviewQuestion[];
    audioA: InterviewQuestion[];
    audioB: InterviewQuestion[];
    audioC: InterviewQuestion[];
}

export type AudioBucket = "audioA" | "audioB" | "audioC";

// ── Sample Data ──

export const INCENTIVE_OPTIONS = [
    "₹500 Amazon Voucher",
    "₹200 UPI Transfer",
    "₹300 Swiggy Coupon",
    "₹250 Zomato Gold",
    "$10 Amazon Gift Card",
    "$25 Amazon Gift Card",
    "$50 Amazon Gift Card",
    "No Incentive",
];

export const SAMPLE_QUESTIONS: InterviewQuestion[] = [
    { id: "sq-1", text: "What was the main reason you chose our product over alternatives?", type: "open-ended", interviewMode: "chat", objective: "Purchase Drivers", selected: true },
    { id: "sq-2", text: "How would you describe your overall experience with our brand?", type: "open-ended", interviewMode: "chat", objective: "Brand Perception", selected: true },
    { id: "sq-3", text: "What features do you use most frequently?", type: "multiselect", interviewMode: "chat", objective: "Usage Patterns", selected: true },
    { id: "sq-4", text: "Walk me through your typical ordering journey from start to finish.", type: "open-ended", interviewMode: "audio_call", objective: "Customer Journey", selected: true },
    { id: "sq-5", text: "What frustrations or pain points have you experienced?", type: "open-ended", interviewMode: "audio_call", objective: "Pain Points", selected: true },
    { id: "sq-6", text: "How does our pricing compare to what you'd expect to pay?", type: "open-ended", interviewMode: "audio_call", objective: "Price Sensitivity", selected: true },
    { id: "sq-7", text: "If you could change one thing about our product, what would it be?", type: "open-ended", interviewMode: "audio_call", objective: "Product Feedback", selected: true },
    { id: "sq-8", text: "How likely are you to recommend us to a friend or colleague?", type: "single-select", interviewMode: "audio_call", objective: "NPS / Loyalty", selected: true },
    { id: "sq-9", text: "What would make you increase your order frequency?", type: "open-ended", interviewMode: "audio_call", objective: "Growth Levers", selected: true },
];

// ── Helpers ──

export function initializeCategories(questions: InterviewQuestion[]): InterviewCategories {
    const chat = questions.filter(q => q.interviewMode === "chat");
    const audio = questions.filter(q => q.interviewMode !== "chat");

    const audioA: InterviewQuestion[] = [];
    const audioB: InterviewQuestion[] = [];
    const audioC: InterviewQuestion[] = [];
    audio.forEach((q, i) => {
        if (i % 3 === 0) audioA.push(q);
        else if (i % 3 === 1) audioB.push(q);
        else audioC.push(q);
    });

    return { chat, audioA, audioB, audioC };
}

const TYPE_LABELS: Record<string, string> = {
    "open-ended": "Open",
    "single-select": "Single",
    "multiselect": "Multi",
};

const BUCKET_LABELS: Record<AudioBucket, string> = {
    audioA: "Quick Call",
    audioB: "Deep Dive",
    audioC: "Extended Session",
};

const BUCKET_COLORS: Record<AudioBucket, { ring: string; bg: string; text: string }> = {
    audioA: { ring: "ring-indigo-500/20", bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
    audioB: { ring: "ring-violet-500/20", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
    audioC: { ring: "ring-orange-500/20", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
};

// ── Sortable Question Card ──

function SortableQuestionCard({ question, onToggle, color }: {
    question: InterviewQuestion;
    onToggle: (id: string) => void;
    color: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 group/card",
                isDragging
                    ? "opacity-30 scale-[0.98] border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-none"
                    : question.selected
                        ? "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm hover:shadow-md"
                        : "border-zinc-100/60 dark:border-zinc-800/40 bg-zinc-50/40 dark:bg-zinc-900/20 opacity-45 hover:opacity-60"
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors touch-none opacity-0 group-hover/card:opacity-100"
            >
                <GripVertical className="w-4 h-4" />
            </button>
            <button
                onClick={() => onToggle(question.id)}
                className={cn(
                    "shrink-0 mt-0.5 w-[18px] h-[18px] rounded-md border-[1.5px] flex items-center justify-center transition-all duration-200",
                    question.selected
                        ? `${color} border-transparent text-white shadow-sm`
                        : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
                )}
            >
                {question.selected && <CheckIcon className="w-2.5 h-2.5" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-[13px] font-medium leading-[1.45] transition-colors",
                    question.selected ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"
                )}>
                    {question.text}
                </p>
                {question.objective && (
                    <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                        {question.objective}
                    </span>
                )}
            </div>
            <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                {TYPE_LABELS[question.type] || question.type}
            </span>
        </motion.div>
    );
}

// ── Audio Column (Droppable) ──

function AudioColumn({ bucket, items, onToggle, incentive, onIncentiveChange }: {
    bucket: AudioBucket;
    items: InterviewQuestion[];
    onToggle: (id: string) => void;
    incentive: string;
    onIncentiveChange: (value: string) => void;
}) {
    const colors = BUCKET_COLORS[bucket];
    const selectedCount = items.filter(q => q.selected).length;

    return (
        <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between px-1 mb-2.5">
                <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", colors.bg)}>
                        <Mic className={cn("w-3 h-3", colors.text)} />
                    </div>
                    <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.15em]">
                        {BUCKET_LABELS[bucket]}
                    </span>
                </div>
                <span className={cn("text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                    {selectedCount}/{items.length}
                </span>
            </div>

            <SortableContext id={bucket} items={items.map(q => q.id)} strategy={verticalListSortingStrategy}>
                <div className={cn(
                    "flex-1 min-h-[120px] p-2 rounded-2xl border transition-all duration-300 space-y-2",
                    items.length === 0
                        ? "border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20"
                        : "border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-zinc-950/30"
                )}>
                    <AnimatePresence mode="popLayout">
                        {items.map(q => (
                            <SortableQuestionCard
                                key={q.id}
                                question={q}
                                onToggle={onToggle}
                                color={colors.text.includes("indigo") ? "bg-indigo-500" : colors.text.includes("violet") ? "bg-violet-500" : "bg-orange-500"}
                            />
                        ))}
                    </AnimatePresence>
                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[100px] text-zinc-400 dark:text-zinc-700">
                            <GripVertical className="w-5 h-5 mb-1.5 opacity-30" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Drop here</span>
                        </div>
                    )}
                </div>
            </SortableContext>

            {/* Incentive */}
            <div className="mt-3 space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <Gift className={cn("w-3 h-3", colors.text)} />
                    Incentive
                </label>
                <Select value={incentive || undefined} onValueChange={onIncentiveChange}>
                    <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20">
                        <SelectValue placeholder="Select incentive..." />
                    </SelectTrigger>
                    <SelectContent>
                        {INCENTIVE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs font-medium">
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// ── Main Component ──

export interface InterviewBuilderProps {
    questions?: InterviewQuestion[];
    categories?: InterviewCategories;
    onCategoriesChange?: (categories: InterviewCategories) => void;
    bucketIncentives?: Record<AudioBucket, string>;
    onBucketIncentivesChange?: (incentives: Record<AudioBucket, string>) => void;
}

export function InterviewBuilder({
    questions = SAMPLE_QUESTIONS,
    categories: controlledCategories,
    onCategoriesChange,
    bucketIncentives: controlledIncentives,
    onBucketIncentivesChange,
}: InterviewBuilderProps) {
    const [internalCategories, setInternalCategories] = useState<InterviewCategories>(() => initializeCategories(questions));
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [chatExpanded, setChatExpanded] = useState(true);
    const [internalIncentives, setInternalIncentives] = useState<Record<AudioBucket, string>>({
        audioA: "", audioB: "", audioC: "",
    });

    const categories = controlledCategories ?? internalCategories;
    const setCategories: React.Dispatch<React.SetStateAction<InterviewCategories>> = (action) => {
        const next = typeof action === "function" ? action(categories) : action;
        if (onCategoriesChange) onCategoriesChange(next);
        else setInternalCategories(next);
    };
    const bucketIncentives = controlledIncentives ?? internalIncentives;
    const setBucketIncentives: React.Dispatch<React.SetStateAction<Record<AudioBucket, string>>> = (action) => {
        const next = typeof action === "function" ? action(bucketIncentives) : action;
        if (onBucketIncentivesChange) onBucketIncentivesChange(next);
        else setInternalIncentives(next);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ── DnD Handlers ──

    const findContainer = (id: string): AudioBucket | null => {
        if (categories.audioA.some(q => q.id === id)) return "audioA";
        if (categories.audioB.some(q => q.id === id)) return "audioB";
        if (categories.audioC.some(q => q.id === id)) return "audioC";
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId) || (["audioA", "audioB", "audioC"].includes(overId) ? overId as AudioBucket : null);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setCategories(prev => {
            const activeItems = [...prev[activeContainer]];
            const overItems = [...prev[overContainer]];

            const activeIndex = activeItems.findIndex(q => q.id === activeId);
            if (activeIndex === -1) return prev;

            const [movedItem] = activeItems.splice(activeIndex, 1);
            const overIndex = overItems.findIndex(q => q.id === overId);
            const insertIndex = overIndex >= 0 ? overIndex : overItems.length;
            overItems.splice(insertIndex, 0, movedItem);

            return { ...prev, [activeContainer]: activeItems, [overContainer]: overItems };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;

        const container = findContainer(activeId);
        if (!container) return;

        if (findContainer(overId) === container) {
            setCategories(prev => {
                const items = [...prev[container]];
                const oldIdx = items.findIndex(q => q.id === activeId);
                const newIdx = items.findIndex(q => q.id === overId);
                if (oldIdx === -1 || newIdx === -1) return prev;
                return { ...prev, [container]: arrayMove(items, oldIdx, newIdx) };
            });
        }
    };

    const toggleQuestion = (id: string) => {
        setCategories(prev => {
            const toggle = (list: InterviewQuestion[]) =>
                list.map(q => q.id === id ? { ...q, selected: !q.selected } : q);
            return {
                chat: toggle(prev.chat),
                audioA: toggle(prev.audioA),
                audioB: toggle(prev.audioB),
                audioC: toggle(prev.audioC),
            };
        });
    };

    const activeDragQuestion = activeDragId
        ? [...categories.audioA, ...categories.audioB, ...categories.audioC].find(q => q.id === activeDragId)
        : null;

    const totalSelected = [
        ...categories.chat,
        ...categories.audioA,
        ...categories.audioB,
        ...categories.audioC,
    ].filter(q => q.selected).length;

    const totalQuestions = categories.chat.length + categories.audioA.length + categories.audioB.length + categories.audioC.length;

    // ── Render ──

    return (
        <div className="h-full overflow-y-auto scrollbar-subtle">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                {/* Header */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Interview Builder</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                                Select and organize questions across interview categories. Drag audio questions between buckets.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">{totalSelected}</span>/{totalQuestions} selected
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chat-Based Questions */}
                <div className="space-y-3">
                    <button
                        onClick={() => setChatExpanded(v => !v)}
                        className="w-full flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                Chat-Based Questions
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full tabular-nums">
                                {categories.chat.filter(q => q.selected).length}/{categories.chat.length}
                            </span>
                            <ChevronDown className={cn(
                                "w-4 h-4 text-zinc-400 transition-transform duration-300",
                                chatExpanded ? "" : "-rotate-90"
                            )} />
                        </div>
                    </button>

                    <AnimatePresence initial={false}>
                        {chatExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2 pb-2">
                                    {categories.chat.map(q => (
                                        <motion.div
                                            key={q.id}
                                            layout
                                            className={cn(
                                                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200",
                                                q.selected
                                                    ? "border-emerald-100/80 dark:border-emerald-500/10 bg-emerald-50/20 dark:bg-emerald-500/[0.03] hover:border-emerald-200 dark:hover:border-emerald-500/20 shadow-sm"
                                                    : "border-zinc-100/50 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-900/20 opacity-45"
                                            )}
                                        >
                                            <div className="shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <button
                                                onClick={() => toggleQuestion(q.id)}
                                                className={cn(
                                                    "shrink-0 mt-0.5 w-[18px] h-[18px] rounded-md border-[1.5px] flex items-center justify-center transition-all duration-200",
                                                    q.selected
                                                        ? "bg-emerald-500 border-transparent text-white shadow-sm"
                                                        : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-400"
                                                )}
                                            >
                                                {q.selected && <CheckIcon className="w-2.5 h-2.5" strokeWidth={3} />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-[13px] font-medium leading-[1.45]",
                                                    q.selected ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"
                                                )}>
                                                    {q.text}
                                                </p>
                                                {q.objective && (
                                                    <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                                                        {q.objective}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                                                {TYPE_LABELS[q.type] || q.type}
                                            </span>
                                        </motion.div>
                                    ))}
                                    {categories.chat.length === 0 && (
                                        <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                                            <p className="text-xs text-zinc-400 font-medium">No chat-based questions in study</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Audio Interviews */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em]">
                                Audio Interviews
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full tabular-nums">
                            {[...categories.audioA, ...categories.audioB, ...categories.audioC].filter(q => q.selected).length} selected
                        </span>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        modifiers={[restrictToWindowEdges]}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-6">
                            {(["audioA", "audioB", "audioC"] as const).map(bucket => (
                                <AudioColumn
                                    key={bucket}
                                    bucket={bucket}
                                    items={categories[bucket]}
                                    onToggle={toggleQuestion}
                                    incentive={bucketIncentives[bucket]}
                                    onIncentiveChange={(val) => setBucketIncentives(prev => ({ ...prev, [bucket]: val }))}
                                />
                            ))}
                        </div>
                        <DragOverlay dropAnimation={null}>
                            {activeDragQuestion && (
                                <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-zinc-900 shadow-2xl shadow-indigo-500/15 max-w-[340px]">
                                    <GripVertical className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-[1.45]">{activeDragQuestion.text}</p>
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}
