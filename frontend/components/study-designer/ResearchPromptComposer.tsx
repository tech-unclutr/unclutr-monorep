"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Paperclip, Mic, ArrowUp, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResearchPromptComposerProps {
    onSubmit: (prompt: string) => void;
    isLoading?: boolean;
}

const EXAMPLE_PROMPTS = [
    "Why are Indian millennials switching from traditional banks to neobanks?",
    "How do Gen Z consumers discover and evaluate sustainable fashion brands?",
    "What drives repeat purchases in the premium skincare category?",
    "How do working parents decide between meal kits and eating out?",
];

export function ResearchPromptComposer({ onSubmit, isLoading = false }: ResearchPromptComposerProps) {
    const [value, setValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
    const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Typewriter effect for rotating placeholder
    useEffect(() => {
        if (value || isFocused) return; // Stop when user is interacting

        const fullText = EXAMPLE_PROMPTS[placeholderIdx];
        let charIdx = 0;
        setIsTypingPlaceholder(true);
        setDisplayedPlaceholder("");

        const typeInterval = setInterval(() => {
            charIdx++;
            setDisplayedPlaceholder(fullText.slice(0, charIdx));
            if (charIdx >= fullText.length) {
                clearInterval(typeInterval);
                setIsTypingPlaceholder(false);
                // Pause, then move to next
                setTimeout(() => {
                    setPlaceholderIdx((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
                }, 3000);
            }
        }, 35);

        return () => clearInterval(typeInterval);
    }, [placeholderIdx, value, isFocused]);

    const handleSubmit = () => {
        const trimmed = value.trim();
        if (!trimmed || isLoading) return;
        onSubmit(trimmed);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleExampleClick = (example: string) => {
        setValue(example);
        textareaRef.current?.focus();
    };

    const hasValue = value.trim().length > 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="text-center mb-8"
            >
                <div className="flex items-center justify-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Sparkles className="w-4.5 h-4.5 text-white" />
                    </div>
                </div>
                <h2 className="text-[28px] font-bold text-foreground tracking-tight leading-tight font-display">
                    What do you want to research?
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    Describe your research goal and our AI will help you design a complete study.
                </p>
            </motion.div>

            {/* Input card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="w-full max-w-[640px]"
            >
                <div
                    className={cn(
                        "rounded-2xl border overflow-hidden bg-card transition-all duration-300",
                        "shadow-sm",
                        isFocused
                            ? "border-[#FF8A4C]/40 shadow-[0_0_0_3px_rgba(255,138,76,0.08)] dark:shadow-[0_0_0_3px_rgba(255,138,76,0.12)]"
                            : "border-gray-200 dark:border-[#27272A] hover:border-gray-300 dark:hover:border-[#3F3F46]"
                    )}
                >
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            disabled={isLoading}
                            placeholder=""
                            className="w-full px-5 pt-5 pb-12 text-[15px] text-foreground bg-transparent resize-none outline-none disabled:opacity-50 min-h-[120px] leading-relaxed relative z-10"
                            rows={3}
                        />
                        {/* Custom animated placeholder */}
                        {!value && (
                            <div className="absolute top-5 left-5 right-5 pointer-events-none z-0">
                                <span className="text-[15px] text-muted-foreground/40 leading-relaxed">
                                    {displayedPlaceholder}
                                    {isTypingPlaceholder && (
                                        <span className="inline-block w-[2px] h-[18px] bg-muted-foreground/30 ml-0.5 align-middle animate-pulse" />
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-[#27272A]/50">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground text-[12px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-all active:scale-[0.97]"
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                Attach
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground text-[12px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-all active:scale-[0.97]"
                            >
                                <Mic className="w-3.5 h-3.5" />
                                Voice
                            </button>
                        </div>
                        <motion.button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!hasValue || isLoading}
                            whileTap={hasValue && !isLoading ? { scale: 0.92 } : undefined}
                            className={cn(
                                "h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                hasValue && !isLoading
                                    ? "bg-gradient-to-r from-[#FF8A4C] to-[#FF6B2C] text-white shadow-sm shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/30 px-4 gap-1.5"
                                    : "bg-gray-200 dark:bg-[#27272A] text-muted-foreground/40 cursor-not-allowed w-8"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : hasValue ? (
                                <>
                                    <span className="text-[12px] font-semibold">Start</span>
                                    <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </>
                            ) : (
                                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Example prompts */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 w-full max-w-[640px]"
            >
                <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2.5 px-1">
                    Try an example
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {EXAMPLE_PROMPTS.map((example, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.35 + i * 0.06 }}
                            onClick={() => handleExampleClick(example)}
                            className="text-left px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-[#27272A] text-[12px] text-muted-foreground leading-relaxed hover:border-[#FF8A4C]/30 hover:text-foreground hover:bg-[#FF8A4C]/[0.03] transition-all active:scale-[0.98] group"
                        >
                            <span className="text-[#FF8A4C]/50 group-hover:text-[#FF8A4C] mr-1 transition-colors">&rarr;</span>
                            {example}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
