import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Bot,
    Terminal,
    Activity,
    Zap,
    Shield,
    Cpu,
    Radio,
    Clock,
    User,
    ChevronRight,
    Search
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, parseAsUTC } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AgentStatus } from "./AgentQueue";

interface AgentLiveUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: AgentStatus | null;
    agentName: string;
    leadName?: string;
    index: number;
    events: any[]; // Specific events for this agent
}

export function AgentLiveUpdateModal({ isOpen, onClose, agent, agentName, leadName, index, events }: AgentLiveUpdateModalProps) {
    const isActive = agent && ['speaking', 'connected', 'ringing'].includes(agent.status);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden rounded-[32px] shadow-2xl shadow-indigo-500/20">
                <VisuallyHidden>
                    <DialogTitle>{agentName} Live Update</DialogTitle>
                    <DialogDescription>
                        Real-time status and neural logs for AI Agent {agentName}.
                    </DialogDescription>
                </VisuallyHidden>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)] pointer-events-none" />

                {/* Header Section */}
                <div className="relative z-10 p-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className={cn(
                                    "absolute inset-0 blur-2xl opacity-40 rounded-full",
                                    isActive ? "bg-indigo-500 animate-pulse" : "bg-zinc-500"
                                )} />
                                <Avatar className="w-20 h-20 border-2 border-zinc-800 relative z-10 shadow-xl">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agentName}&backgroundColor=e0e7ff`} />
                                    <AvatarFallback>{agentName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-zinc-950 flex items-center justify-center relative z-20",
                                    isActive ? "bg-emerald-500" : "bg-zinc-600"
                                )}>
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black tracking-tight leading-none">{agentName}</h2>
                                        <Badge className={cn(
                                            "px-2 py-0 text-[10px] uppercase font-black tracking-widest border-0",
                                            isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                                        )}>
                                            {agent?.status || "Idle"}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">AI Agent</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Neural Model v4.2</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Secure Uplink</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Sub-header: Current Lead Info */}
                <div className="mx-8 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Target</p>
                            <p className="text-sm font-bold">{leadName || agent?.lead_name || "Scanning for leads..."}</p>
                        </div>
                    </div>
                    {isActive && agent && (
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duration</p>
                                <p className="text-sm font-mono text-indigo-400">{Math.floor(agent.duration / 60)}:{(agent.duration % 60).toString().padStart(2, '0')}</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-800 mx-2" />
                            <div className="flex items-center gap-1">
                                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase">Live</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content: Terminal Logs */}
                <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Neural Logs & Thoughts</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Syncing</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        {/* Terminal Background Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(99,102,241,0.03),rgba(16,185,129,0.01),rgba(99,102,241,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50 z-10" />

                        <div className="h-[300px] w-full bg-black rounded-2xl border border-zinc-800 p-6 font-mono text-[11px] overflow-y-auto scrollbar-hide space-y-3 shadow-inner">
                            <AnimatePresence initial={false}>
                                {events.length > 0 ? (
                                    events.map((event, i) => (
                                        <motion.div
                                            key={event.id + i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-4 group/log"
                                        >
                                            <span className="text-zinc-700 shrink-0 group-hover/log:text-zinc-500 transition-colors cursor-help">
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
                                            <div className="flex-1">
                                                <span className={cn(
                                                    "font-bold mr-2 uppercase",
                                                    event.type === 'system' ? "text-indigo-400" : event.type === 'thought' ? "text-amber-500" : "text-emerald-500"
                                                )}>
                                                    {event.type === 'system' ? ">> CORE" : event.type === 'thought' ? ">> THOUGHT" : `>> ${agentName.split(' ')[0]}`}:
                                                </span>
                                                <span className="text-zinc-300 leading-relaxed uppercase tracking-tight">
                                                    {event.message}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                                        <LoaderIcon className="w-8 h-8 animate-spin opacity-20" />
                                        <p className="uppercase tracking-[0.3em] text-[9px] font-black">Establishing Neural Link...</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Bottom Progress Bar */}
                <div className="px-8 pb-8 flex items-center justify-between text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-orange-500" />
                            <span>Performance: 1.2ms latency</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span>Quality: 98.4%</span>
                        </div>
                    </div>
                    <div>
                        Node ID: UNCLN-@{index + 1}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LoaderIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
