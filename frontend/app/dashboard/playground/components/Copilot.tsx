"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export function Copilot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hey! I'm your SquareUp copilot. Ask me anything about your brand, customers, or data.",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const send = () => {
        const text = input.trim();
        if (!text) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulated reply
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "This is a placeholder response. Wire up your actual AI backend here.",
                },
            ]);
            setIsTyping(false);
        }, 1200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-[440px] rounded-2xl border border-gray-100 dark:border-[#27272A] bg-background overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/30">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#27272A]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF8A4C] to-[#FF6B2C] flex items-center justify-center shadow-sm shadow-orange-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground leading-none">Copilot</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Always learning your brand</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] text-muted-foreground font-medium">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-subtle">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] px-4 py-2.5 text-[13.5px] leading-relaxed",
                                msg.role === "user"
                                    ? "bg-[#FF8A4C] text-white rounded-2xl rounded-br-md"
                                    : "bg-muted/60 dark:bg-[#27272A]/60 text-foreground rounded-2xl rounded-bl-md"
                            )}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-muted/60 dark:bg-[#27272A]/60 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
                <div className="flex items-end gap-2 rounded-xl border border-gray-200 dark:border-[#27272A] bg-muted/30 dark:bg-[#1C1C1E] px-4 py-2.5 focus-within:border-[#FF8A4C]/50 focus-within:shadow-[0_0_0_3px_rgba(255,138,76,0.08)] transition-all">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none max-h-24 leading-relaxed"
                    />
                    <button
                        onClick={send}
                        disabled={!input.trim()}
                        className={cn(
                            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            input.trim()
                                ? "bg-[#FF8A4C] text-white shadow-sm shadow-orange-500/20 hover:bg-[#FF7A3C] active:scale-95"
                                : "bg-muted text-muted-foreground/30 cursor-not-allowed"
                        )}
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
