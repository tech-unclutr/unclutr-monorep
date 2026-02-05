import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    Mic,
    MoreHorizontal,
    User,
    Clock,
    Zap,
    BrainCircuit,
    Sparkles,
    CheckCircle2,
    XCircle,
    Voicemail,
    PhoneOff,
    Timer,
    Signal,
    Terminal,
    Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, parseAsUTC } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AgentStatus } from "./AgentQueue";

interface AgentLiveStreamProps {
    agent: AgentStatus;
    events: any[];
    index: number;
}

export function AgentLiveStream({ agent, events, index }: AgentLiveStreamProps) {
    const status = (agent.status || 'idle').toLowerCase();
    const isActive = ['speaking', 'connected', 'ringing', 'listening', 'processing', 'initiated', 'in-progress', 'queued'].includes(status);

    // Auto-scroll for thoughts
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    // Format Duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- STATE VISUALS HELPER ---
    const getStateVisuals = (s: string) => {
        switch (s) {
            case 'speaking': return { color: "text-indigo-500", bg: "bg-indigo-500", border: "border-indigo-200", icon: Mic, label: "Speaking" };
            case 'listening': return { color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-200", icon: Signal, label: "Listening" };
            case 'processing': return { color: "text-purple-500", bg: "bg-purple-500", border: "border-purple-200", icon: BrainCircuit, label: "Thinking" };
            case 'ringing': return { color: "text-amber-500", bg: "bg-amber-500", border: "border-amber-200", icon: Phone, label: "Ringing" };
            case 'initiated': return { color: "text-blue-500", bg: "bg-blue-500", border: "border-blue-200", icon: Phone, label: "Dialing" };
            case 'completed': return { color: "text-green-600", bg: "bg-green-600", border: "border-green-200", icon: CheckCircle2, label: "Completed" };
            case 'failed': return { color: "text-red-500", bg: "bg-red-500", border: "border-red-200", icon: XCircle, label: "Failed" };
            case 'voicemail': return { color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-200", icon: Voicemail, label: "Voicemail" };
            case 'voicemail': return { color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-200", icon: Voicemail, label: "Voicemail" };
            default: return { color: "text-zinc-500", bg: "bg-zinc-500", border: "border-zinc-200", icon: MoreHorizontal, label: s };
        }
    };

    // --- CLIENT-SIDE TICKER FOR SMOOTH CLOCK ---
    // Since backend updates might come in bursts, we want the clock to tick smoothly every second.
    // We initialize with the backend's duration and increment locally.
    const [clientDuration, setClientDuration] = useState(agent.duration);

    useEffect(() => {
        // Sync with backend whenever it updates
        setClientDuration(agent.duration);
    }, [agent.duration]);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setClientDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    const visual = getStateVisuals(status);
    const StatusIcon = visual.icon;

    // Filter for just thoughts and latest relevant event
    const thoughts = events.filter(e => e.type === 'thought').slice(-1); // Just the very latest thought for the "Cloud"
    const relevantEvents = events.slice(-3); // Last 3 events for context

    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden rounded-[32px] border transition-all duration-700 flex flex-col",
            isActive
                ? "bg-white dark:bg-zinc-950 border-indigo-100 dark:border-indigo-900/30 shadow-2xl shadow-indigo-500/10"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        )}>
            {/* --- BACKGROUND AMBIANCE --- */}
            {isActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        className={cn("absolute -top-[20%] -right-[20%] w-[70%] h-[70%] rounded-full blur-[100px] opacity-20 transition-colors duration-1000", visual.bg)}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-zinc-950/80 z-10" />
                </div>
            )}

            {/* --- HEADER: CALLER ID --- */}
            <div className="relative z-20 p-6 pb-2 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {/* Agent Avatar */}
                    <div className="relative">
                        <div className={cn(
                            "absolute inset-0 rounded-full blur-md opacity-40 transition-colors duration-500",
                            isActive ? visual.bg : "bg-transparent"
                        )} />
                        <Avatar className="w-14 h-14 border-2 border-white dark:border-zinc-900 shadow-md relative z-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.agent_name || 'agent'}&backgroundColor=e0e7ff`} />
                            <AvatarFallback>{(agent.agent_name || 'AI').slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        {/* Status Badge */}
                        <div className={cn(
                            "absolute -bottom-1 -right-1 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full border border-white dark:border-zinc-900 shadow-sm transition-colors duration-500 bg-white dark:bg-zinc-900",
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", visual.bg)} />
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider", visual.color)}>
                                {visual.label}
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                            {agent.agent_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {agent.lead_name || "Connecting..."}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {formatDuration(clientDuration)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Connection Strength / Meta */}
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                        <Signal className={cn("w-3.5 h-3.5", isActive ? "text-emerald-500" : "text-zinc-400")} />
                    </div>
                </div>
            </div>

            {/* --- BODY: STREAM OF CONSCIOUSNESS --- */}
            <div className="relative flex-1 flex flex-col justify-end p-6 z-10 gap-4">

                {/* 1. THE THOUGHT CLOUD (The "Mind") */}
                <div className="flex-1 flex flex-col justify-center items-center relative min-h-[80px] max-h-[160px] py-2">
                    <AnimatePresence mode="wait">
                        {thoughts.length > 0 ? (
                            <motion.div
                                key={thoughts[0].id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="relative max-w-[90%] text-center"
                            >
                                <div className="inline-flex items-center justify-center p-4 rounded-[24px] bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm">
                                    <Sparkles className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 italic leading-snug">
                                        "{thoughts[0].message}"
                                    </p>
                                </div>
                                <div className="flex justify-center gap-1 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-zinc-700 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-zinc-700 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-zinc-700 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </motion.div>
                        ) : isActive ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 animate-[spin_8s_linear_infinite]" />
                                    <div className="absolute inset-3 rounded-full border-2 border-indigo-100 dark:border-zinc-800 animate-[spin_4s_linear_infinite_reverse]" />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Neural Watchdog Active</span>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* 2. THE NEURAL LOGS (The "Terminal") */}
                <div className="relative h-32 w-full bg-[#0a0a0a] dark:bg-black rounded-2xl overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_8px_24px_-8px_rgba(0,0,0,0.3)] border border-zinc-900/50 dark:border-zinc-950">
                    {/* Realistic terminal texture */}
                    <div className="absolute inset-0 opacity-[0.015]" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                    }} />

                    {/* Scanline effect for realism */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            background: 'linear-gradient(transparent 50%, rgba(255,255,255,0.1) 50%)',
                            backgroundSize: '100% 4px'
                        }}
                        animate={{ y: ['0%', '100%'] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative z-10 h-full flex flex-col p-4 font-mono">
                        {/* Terminal header */}
                        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-800/60">
                            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-zinc-500 uppercase tracking-[0.12em] font-black text-[10px] flex-1">
                                Neural Streams / Live Logs
                            </span>
                            {isActive && (
                                <div className="flex items-center gap-1.5">
                                    <motion.div
                                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
                                </div>
                            )}
                        </div>

                        {/* Terminal content */}
                        <ScrollArea className="flex-1 pr-2">
                            <div className="space-y-1.5">
                                <AnimatePresence initial={false}>
                                    {events.filter(e => e.type !== 'thought').slice(-10).map((event, i) => (
                                        <motion.div
                                            key={event.id + i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-2.5 text-[10px] leading-relaxed"
                                        >
                                            <span className="text-zinc-600 shrink-0 font-semibold tabular-nums cursor-help">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span>[{parseAsUTC(event.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="z-[9999]" side="top">
                                                            <p>{new Date(event.timestamp).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </span>
                                            <span className="text-zinc-300 leading-relaxed">
                                                <span className={cn(
                                                    "font-black mr-1.5",
                                                    event.type === 'agent_action' ? "text-indigo-400" : "text-emerald-400"
                                                )}>
                                                    {event.type === 'agent_action' ? "ACT:" : "SYS:"}
                                                </span>
                                                {event.message.replace(/^.*: "/, '').replace(/"$/, '')}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {(events.length === 0 || !isActive) && (
                                    <div className="h-16 flex flex-col items-center justify-center opacity-20 gap-2">
                                        <motion.div
                                            animate={isActive ? { rotate: 360 } : {}}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Activity className="w-5 h-5 text-zinc-500" strokeWidth={2.5} />
                                        </motion.div>
                                        <span className="uppercase tracking-[0.2em] font-black text-[9px] text-zinc-500">
                                            {isActive ? "Neural Link Initializing..." : "Uplink Standby"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* 3. THE PULSE (The "Voice") */}
                <div className="h-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between px-4 overflow-hidden relative">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider relative z-10 transition-colors", visual.color)}>
                        {visual.label}
                    </span>

                    {/* Organic Waveform */}
                    <div className="flex items-center gap-1 z-10 h-full py-3">
                        {isActive && [...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={cn("w-1 rounded-full", visual.bg)}
                                animate={{
                                    height: status === 'speaking' ? [4, 24, 4] :
                                        status === 'listening' ? [4, 12, 4] : [4, 6, 4],
                                    opacity: [0.4, 1, 0.4]
                                }}
                                transition={{
                                    duration: status === 'speaking' ? 0.4 : 1.5,
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                        {!isActive && <div className="text-[10px] text-zinc-300 font-medium">Channel Closed</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sub-component for individual "Thought Bubble" - Premium Redesign
const ThoughtBubble = ({ event }: { event: any }) => {
    // Typewriter state
    const [displayedText, setDisplayedText] = useState("");
    const fullText = event.message || "";
    const isSystem = event.type === 'system';

    // Parse time
    const timeStr = new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setDisplayedText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 12);

        return () => clearInterval(interval);
    }, [fullText]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: -20, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className={cn(
                "group relative p-6 rounded-[32px] border transition-all duration-700",
                isSystem
                    ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                    : "bg-white dark:bg-zinc-900/80 backdrop-blur-xl border-indigo-100 dark:border-indigo-500/20 shadow-[0_20px_40px_-12px_rgba(99,102,241,0.08)]"
            )}
        >
            {/* Glossy overlay effect for non-system thoughts */}
            {!isSystem && (
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] pointer-events-none" />
            )}

            <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm",
                            isSystem
                                ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/20"
                        )}>
                            {isSystem ? "SYSTEM LINK" : (event.agent_name?.toUpperCase() || "CORE AI")}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 cursor-help">
                            <Clock className="w-3 h-3" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="tracking-tighter">{timeStr}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[9999]" side="top">
                                        <p>{new Date(event.timestamp || Date.now()).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    {!isSystem && <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                </div>

                <div className="relative">
                    <p className={cn(
                        "text-[15px] font-medium leading-relaxed tracking-tight",
                        isSystem ? "text-zinc-500 dark:text-zinc-400 italic font-normal" : "text-zinc-800 dark:text-zinc-100"
                    )}>
                        {displayedText}
                        {displayedText.length < fullText.length && (
                            <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="inline-block w-2 h-4 bg-indigo-500 ml-1.5 align-middle rounded-sm shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                            />
                        )}
                    </p>
                </div>

                {!isSystem && (
                    <div className="flex items-center gap-4 pt-2 border-t border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-white dark:border-zinc-900" />
                                ))}
                            </div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Active Layers</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
