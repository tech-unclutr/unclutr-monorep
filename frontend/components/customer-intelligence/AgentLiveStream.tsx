import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Terminal,
    Activity,
    Zap,
    Shield,
    Cpu,
    Radio,
    Clock,
    User,
    Wifi,
    Sparkles,
    Mic,
    MoreHorizontal,
    Cloud,
    MessageSquare,
    Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgentStatus } from "./AgentQueue";

interface AgentLiveStreamProps {
    agent: AgentStatus;
    events: any[];
    index: number;
}

export function AgentLiveStream({ agent, events, index }: AgentLiveStreamProps) {
    // Normalize status and check if active
    const status = (agent.status || 'idle').toLowerCase();
    const isActive = ['speaking', 'connected', 'ringing', 'listening', 'processing', 'initiated', 'in-progress', 'queued'].includes(status);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Top: Active Agent Identity Card - Enhanced "Living" Feel */}
            <motion.div
                layoutId={`agent-card-${agent.lead_id}`}
                className={cn(
                    "relative overflow-hidden rounded-[32px] border p-8 transition-all duration-700",
                    isActive
                        ? "bg-white dark:bg-zinc-950 border-indigo-200 dark:border-indigo-900/50 shadow-2xl shadow-indigo-500/10"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                )}
            >
                {/* Background Ambient Effects */}
                {isActive && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/10 blur-[80px] rounded-full" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar & Status Section */}
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="relative">
                            {/* Living Pulse Rings */}
                            {isActive && (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border border-indigo-500/30"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full border border-indigo-500/20"
                                        animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    />
                                </>
                            )}

                            <Avatar className="w-24 h-24 border-4 border-white dark:border-zinc-950 shadow-xl relative z-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.agent_name}&backgroundColor=e0e7ff`} />
                                <AvatarFallback>{(agent.agent_name || "AI").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            {/* Status Badge Overlap */}
                            <div className={cn(
                                "absolute -bottom-2 -right-2 px-3 py-1 rounded-full border-2 border-white dark:border-zinc-950 flex items-center gap-1.5 shadow-lg relative z-20",
                                isActive ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-600"
                            )}>
                                {isActive ? (
                                    agent.status.toLowerCase() === 'initiated' ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Wifi className="w-3 h-3 animate-pulse" />
                                    )
                                ) : (
                                    <Clock className="w-3 h-3" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-wider">{status}</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1">{agent.agent_name}</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI Voice Agent</p>
                        </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />

                    {/* Target & Metric Info */}
                    <div className="flex-1 w-full space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                    <User className="w-3.5 h-3.5" />
                                    Active Target
                                </span>
                                <div className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">
                                    {isActive ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-lg inline-block"
                                        >
                                            {agent.lead_name}
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-zinc-400 italic flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" /> Finding next lead...
                                        </motion.span>
                                    )}
                                </div>
                            </div>

                            {isActive && (
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Duration</span>
                                    <span className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                        {Math.floor(agent.duration / 60)}:{(agent.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Interactive Waveform / Status Line */}
                        <div className="h-12 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center px-4 relative">
                            {isActive ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-full bg-indigo-500/10 text-indigo-500 animate-pulse">
                                            {agent.status.toLowerCase() === 'initiated' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                                        </div>
                                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                            {status === 'initiated' || status === 'queued' ? `Dialing ${agent.lead_name}...` :
                                                status === 'ringing' ? "Ringing..." :
                                                    (status === 'connected' || status === 'in-progress') ? "Connection Established." :
                                                        status === 'speaking' ? "Agent Speaking..." :
                                                            status === 'listening' ? "Listening to customer..." :
                                                                status === 'processing' ? "Analyzing response..." :
                                                                    status === 'completed' ? "Call Completed." :
                                                                        status === 'failed' ? "Call Failed / No Answer." : "Connectivity established."}
                                        </span>
                                    </div>
                                    {/* Fake Audio Waveform Animation - Only if not initiating */}
                                    {agent.status.toLowerCase() !== 'initiated' && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-center gap-1 opacity-50 px-4 mask-linear-fade">
                                            {[...Array(8)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1 bg-indigo-500 rounded-full"
                                                    animate={{
                                                        height: status === 'speaking' ? [4, 24, 8, 32, 12] : status === 'listening' ? [4, 12, 4, 16, 4] : [4, 8, 4]
                                                    }}
                                                    transition={{
                                                        duration: 0.8,
                                                        repeat: Infinity,
                                                        repeatType: "mirror",
                                                        delay: i * 0.1
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                                    <MoreHorizontal className="w-4 h-4 animate-pulse" />
                                    <span>System in standby...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bottom: Neural Stream - Thought Cloud Style */}
            <div className="flex-1 flex flex-col relative min-h-[300px]">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-tight">Neural Thoughts</h4>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Reasoning Stream</p>
                    </div>
                    {isActive && (
                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Updating</span>
                        </div>
                    )}
                </div>

                {/* Thought Stream Container */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-2 space-y-3 pb-4 scrollbar-none mask-fade-top"
                >
                    <AnimatePresence initial={false} mode='popLayout'>
                        {events.length > 0 ? (
                            events.map((event) => (
                                <ThoughtBubble key={event.id} event={event} />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4 opacity-50">
                                <Cloud className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                                <span className="text-[10px] uppercase font-bold tracking-widest">No thoughts recorded...</span>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Sub-component for individual "Thought Bubble" / Toast Style
const ThoughtBubble = ({ event }: { event: any }) => {
    // Typewriter state
    const [displayedText, setDisplayedText] = useState("");
    const fullText = event.message || "";
    const isSystem = event.type === 'system';

    // Parse time
    const timeStr = new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setDisplayedText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 12); // Slightly faster

        return () => clearInterval(interval);
    }, [fullText]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
                "group relative p-4 rounded-2xl border backdrop-blur-md transition-all",
                isSystem
                    ? "bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border-zinc-200 dark:border-zinc-800"
                    : "bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900/30 shadow-sm"
            )}
        >
            {/* Connector Line (Cloud Stem) */}
            <div className={cn(
                "absolute -left-2 top-6 w-2 h-px mix-blend-multiply dark:mix-blend-screen",
                isSystem ? "bg-zinc-200 dark:bg-zinc-800" : "bg-indigo-200 dark:bg-indigo-800"
            )} />

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                            "text-[9px] px-1.5 py-0 h-4 border-0 font-black uppercase tracking-wider",
                            isSystem ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                        )}>
                            {isSystem ? "SYS" : event.agent_name?.split(' ')[0] || "AI"}
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 font-medium">
                            {timeStr}
                        </span>
                    </div>
                </div>

                <p className={cn(
                    "text-xs font-medium leading-relaxed",
                    isSystem ? "text-zinc-500 dark:text-zinc-400 italic" : "text-zinc-700 dark:text-zinc-200"
                )}>
                    {displayedText}
                    {displayedText.length < fullText.length && (
                        <span className="inline-block w-1 h-3 bg-indigo-500 ml-1 animate-pulse align-middle" />
                    )}
                </p>
            </div>
        </motion.div>
    );
};
