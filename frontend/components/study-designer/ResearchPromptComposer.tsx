"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ResearchPromptComposerProps {
    onSubmit: (prompt: string) => void;
    isLoading?: boolean;
    templatePrompt?: string;
    onValueChange?: (value: string) => void;
}

const EXAMPLE_PROMPTS = [
    "Why are Indian millennials switching from traditional banks to neobanks?",
    "What makes Gen Z trust a new skincare brand enough to buy?",
    "How do working parents choose between cooking at home and ordering in?",
    "What drives repeat purchases in the premium coffee subscription space?",
];

export function ResearchPromptComposer({
    onSubmit,
    isLoading = false,
    templatePrompt,
    onValueChange,
}: ResearchPromptComposerProps) {
    const [value, setValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
    const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true);
    const [shiftEnterUsed, setShiftEnterUsed] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const templateAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Typewriter effect for rotating placeholder
    useEffect(() => {
        if (value || isFocused) return;

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
                setTimeout(() => {
                    setPlaceholderIdx((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
                }, 4000);
            }
        }, 42);

        return () => clearInterval(typeInterval);
    }, [placeholderIdx, value, isFocused]);

    // Animate template prompt fill at 15ms/char
    useEffect(() => {
        if (!templatePrompt) return;

        if (templateAnimRef.current) clearInterval(templateAnimRef.current);
        setValue("");
        let charIdx = 0;

        templateAnimRef.current = setInterval(() => {
            charIdx++;
            const next = templatePrompt.slice(0, charIdx);
            setValue(next);
            onValueChange?.(next);
            if (charIdx >= templatePrompt.length) {
                clearInterval(templateAnimRef.current!);
                templateAnimRef.current = null;
                // Focus and move cursor to first bracket
                setTimeout(() => {
                    const el = textareaRef.current;
                    if (!el) return;
                    el.focus();
                    const bracketIdx = templatePrompt.indexOf("[");
                    if (bracketIdx !== -1) {
                        const closeBracket = templatePrompt.indexOf("]", bracketIdx);
                        el.setSelectionRange(bracketIdx, closeBracket + 1);
                    }
                }, 50);
            }
        }, 15);

        return () => {
            if (templateAnimRef.current) clearInterval(templateAnimRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templatePrompt]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        onValueChange?.(e.target.value);
    };

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
        if (e.key === "Enter" && e.shiftKey) {
            setShiftEnterUsed(true);
        }
    };

    const hasValue = value.trim().length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="text-center mb-8"
            >
                <div className="flex items-center justify-center gap-2.5 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                </div>
                <h2 className="text-[28px] font-bold text-foreground tracking-tight leading-tight font-display">
                    Design your next study
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    Describe what you want to learn — our AI builds the complete study for you.
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
                            onChange={handleChange}
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
                        <motion.span
                            animate={{ opacity: shiftEnterUsed ? 0 : 1 }}
                            transition={{ duration: 0.4 }}
                            className="text-[10px] text-muted-foreground/30 font-medium select-none"
                        >
                            Shift+Enter for new line
                        </motion.span>
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
                                    <span className="text-[12px] font-semibold">Start Research</span>
                                    <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </>
                            ) : (
                                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Guidance tip */}
                <motion.p
                    animate={{ opacity: hasValue ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] text-muted-foreground/50 text-center font-medium mt-3"
                >
                    Tip: Include your target audience, product category, and what you want to learn
                </motion.p>
            </motion.div>
        </div>
    );
}
