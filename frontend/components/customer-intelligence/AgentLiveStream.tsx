import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Signal,
    BrainCircuit,
    Sparkles,
    CheckCircle2,
    XCircle,
    Voicemail,
    Phone,
    MoreHorizontal,
    Clock,
    Terminal,
    ChevronDown,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
            case 'speaking': return { color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-200", ring: "ring-orange-500", icon: Mic, label: "Speaking", gradient: "from-orange-500/20" };
            case 'listening': return { color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-200", ring: "ring-emerald-500", icon: Signal, label: "Listening", gradient: "from-emerald-500/20" };
            case 'processing': return { color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-200", ring: "ring-orange-500", icon: BrainCircuit, label: "Thinking", gradient: "from-orange-500/20" };
            case 'ringing': return { color: "text-amber-500", bg: "bg-amber-500", border: "border-amber-200", ring: "ring-amber-500", icon: Phone, label: "Ringing", gradient: "from-amber-500/20" };
            case 'initiated': return { color: "text-blue-500", bg: "bg-blue-500", border: "border-blue-200", ring: "ring-blue-500", icon: Phone, label: "Dialing", gradient: "from-blue-500/20" };
            case 'completed': return { color: "text-green-600", bg: "bg-green-600", border: "border-green-200", ring: "ring-green-500", icon: CheckCircle2, label: "Completed", gradient: "from-green-500/20" };
            case 'failed': return { color: "text-red-500", bg: "bg-red-500", border: "border-red-200", ring: "ring-red-500", icon: XCircle, label: "Failed", gradient: "from-red-500/20" };
            case 'voicemail': return { color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-200", ring: "ring-orange-500", icon: Voicemail, label: "Voicemail", gradient: "from-orange-500/20" };
            default: return { color: "text-zinc-500", bg: "bg-zinc-500", border: "border-zinc-200", ring: "ring-zinc-400", icon: MoreHorizontal, label: s, gradient: "from-zinc-500/10" };
        }
    };

    // --- CLIENT-SIDE TICKER FOR SMOOTH CLOCK ---
    const [clientDuration, setClientDuration] = useState(agent.duration);

    useEffect(() => {
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

    // Filter for just thoughts
    const thoughts = events.filter(e => e.type === 'thought').slice(-1);

    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden rounded-[24px] border transition-all duration-700 flex flex-col justify-between",
            isActive
                ? "bg-white dark:bg-zinc-950 border-white/50 dark:border-zinc-800 shadow-xl"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        )}>
            {/* --- BACKGROUND AMBIANCE (PRESERVED & SUBTLE) --- */}
            {isActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden transition-colors duration-1000">
                    <motion.div
                        className={cn("absolute -top-[50%] -right-[50%] w-[150%] h-[150%] rounded-full blur-[120px] opacity-15 transition-colors duration-1000", visual.bg)}
                        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className={cn("absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t opacity-10 transition-colors duration-1000", visual.gradient, "to-transparent")}
                    />
                </div>
            )}

            {/* --- HEADER: AGENT INFO (MINIMALIST) --- */}
            <div className="relative z-20 px-6 py-5 flex items-center justify-between border-b border-zinc-50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="w-10 h-10 border border-white dark:border-zinc-800 shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.agent_name || 'agent'}&backgroundColor=e0e7ff`} />
                            <AvatarFallback className="bg-orange-50 text-orange-600 text-[10px] font-bold">AI</AvatarFallback>
                        </Avatar>
                        {isActive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-zinc-950" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                                {agent.agent_name}
                            </h3>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">
                            Screening Specialist
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn(
                        "text-[10px] h-6 pl-1.5 pr-2.5 gap-1.5 border transition-colors duration-500",
                        isActive ? "bg-white/50 dark:bg-zinc-900/50" : "bg-transparent",
                        visual.color, visual.border
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", visual.bg)} />
                        <span className="uppercase tracking-wider font-bold">{visual.label}</span>
                    </Badge>
                    <div className="text-[11px] font-mono font-medium text-zinc-400 tabular-nums">
                        {formatDuration(clientDuration)}
                    </div>
                </div>
            </div>


            {/* --- MAIN CONTENT: CUSTOMER FOCUS --- */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 gap-6">

                {/* STATUS RING & ICON */}
                <div className="relative">
                    <div className={cn(
                        "absolute inset-0 rounded-full blur-xl opacity-30 transition-colors duration-500",
                        isActive ? visual.bg : "bg-transparent"
                    )} />

                    <div className="relative z-10 p-1 rounded-full bg-white dark:bg-zinc-900 shadow-2xl">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-zinc-50 dark:border-zinc-800">
                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.lead_id || 'customer'}&backgroundColor=f0fdf4`} />
                                <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-2xl">{(agent.lead_name || '??').slice(0, 2)}</AvatarFallback>
                            </Avatar>

                            {/* LIVE Status Badge attached to Avatar */}
                            {isActive && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-emerald-500 text-white border-2 border-white dark:border-zinc-950 text-[9px] px-2 h-5 font-black uppercase tracking-wider shadow-sm hover:bg-emerald-600">
                                        Live
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {agent.lead_name || "Unknown Lead"}
                    </h2>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                        {agent.cohort || "Campaign Target"}
                    </p>
                </div>
            </div>


            {/* --- FOOTER: ACTION & LOGS --- */}
            <div className="relative z-30 p-4 pt-0">
                <div className={cn(
                    "rounded-2xl border p-1 pr-2 flex items-center gap-2 transition-all duration-500",
                    isActive ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm border-zinc-100 dark:border-zinc-800" : "bg-transparent border-transparent"
                )}>
                    {/* VISUALIZER */}
                    <div className="h-10 w-24 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center gap-0.5 px-3 overflow-hidden">
                        {isActive ? (
                            [...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={cn("w-1 rounded-full", visual.bg)}
                                    animate={{
                                        height: status === 'speaking' ? [4, 20, 4] :
                                            status === 'listening' ? [4, 12, 4] : [4, 6, 4],
                                        opacity: [0.4, 0.8, 0.4]
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatType: "mirror",
                                        delay: i * 0.05
                                    }}
                                />
                            ))
                        ) : (
                            <div className="w-full h-[1px] bg-zinc-200 dark:bg-zinc-700" />
                        )}
                    </div>

                    {/* LAST LOG LINE */}
                    <div className="flex-1 min-w-0">
                        {events.length > 0 ? (
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate font-medium">
                                <span className={cn("mr-2 font-bold", events[events.length - 1].type === 'agent_action' ? "text-orange-500" : "text-emerald-500")}>
                                    {events[events.length - 1].type === 'agent_action' ? "AI:" : "User:"}
                                </span>
                                {events[events.length - 1].message?.replace(/^.*: "/, '').replace(/"$/, '')}
                            </div>
                        ) : (
                            <div className="text-[10px] text-zinc-400 italic">Connecting...</div>
                        )}
                    </div>

                    {/* EXPAND LOGS BUTTON */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors">
                                <Terminal className="w-4 h-4 text-zinc-500" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="center" className="w-[400px] p-0 rounded-[20px] shadow-2xl border-orange-100 dark:border-zinc-800">
                            <div className="flex flex-col max-h-[500px] bg-white dark:bg-zinc-950 rounded-[20px] overflow-hidden">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Transcript</span>
                                    {thoughts.length > 0 && (
                                        <Badge variant="secondary" className="text-[9px] bg-orange-50 text-orange-600 border-orange-100 h-5">Thinking</Badge>
                                    )}
                                </div>

                                {/* Content */}
                                <ScrollArea className="flex-1 min-h-[200px] max-h-[400px]">
                                    <div className="p-4 space-y-3">
                                        {/* Thought Bubble if active */}
                                        {thoughts[0] && (
                                            <div className="p-3 rounded-xl bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 text-xs text-orange-700 dark:text-orange-300 italic mb-4">
                                                <Sparkles className="w-3 h-3 inline mr-1.5 align-text-top" />
                                                "{thoughts[0].message}"
                                            </div>
                                        )}

                                        {events.filter(e => e.type !== 'thought').slice(-15).map((event, i) => (
                                            <div key={i} className="flex gap-3 text-xs group">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-opacity opacity-40 group-hover:opacity-100",
                                                    event.type === 'agent_action' ? "bg-orange-500" : "bg-emerald-500"
                                                )} />
                                                <div>
                                                    <span className={cn("font-bold text-[10px] uppercase tracking-wider block mb-0.5",
                                                        event.type === 'agent_action' ? "text-orange-500" : "text-emerald-500"
                                                    )}>
                                                        {event.type === 'agent_action' ? "AI Agent" : "Lead"}
                                                    </span>
                                                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                        {event.message.replace(/^.*: "/, '').replace(/"$/, '')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
