import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Zap, Activity, Trash2, Brain, User, MessageSquare } from 'lucide-react';
import { api } from "@/lib/api";
import { cn, parseAsUTC } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ExecutionEvent {
    id: string;
    timestamp: string;
    type: 'agent_action' | 'system' | 'thought' | 'user_reply';
    agent_name?: string;
    message: string;
    status: string;
}

interface ExecutionFeedProps {
    campaignId: string;
    isActive: boolean;
    events: ExecutionEvent[];
    onClear?: () => void;
    viewMode?: 'live' | 'all';
    onViewModeChange?: (mode: 'live' | 'all') => void;
}

export function ExecutionFeed({ campaignId, isActive, events }: ExecutionFeedProps) {
    const latestEvent = events[0];

    const getIcon = (type: string) => {
        const t = type?.toLowerCase();
        switch (t) {
            case 'thought': return <Brain className="w-3 h-3 text-amber-500" />;
            case 'user_reply': return <User className="w-3 h-3 text-orange-500" />;
            case 'agent_action': return <MessageSquare className="w-3 h-3 text-emerald-500" />;
            case 'system': return <Terminal className="w-3 h-3 text-zinc-400" />;
            default: return <Activity className="w-3 h-3 text-zinc-400" />;
        }
    };

    return (
        <div className="mt-8 relative pb-8">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Terminal className="w-4 h-4 text-orange-500" />
                <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest flex-1">Processing Last Calls</h4>
            </div>

            <div className="relative group/feed">
                {/* Compact Single Line Row */}
                <div className="bg-white/80 dark:bg-zinc-950/50 backdrop-blur-xl rounded-[24px] border border-zinc-200 dark:border-zinc-800/50 p-2 pl-3 shadow-xl overflow-hidden transition-all duration-500 hover:border-orange-500/30">
                    <div className="flex items-center gap-4">
                        {/* Left Side: Dynamic Agent Avatar */}
                        <div className="shrink-0 relative">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/10 relative z-10">
                                <img
                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${latestEvent?.agent_name || 'core'}&backgroundColor=fff7ed`}
                                    alt="Agent"
                                    className="w-full h-full object-contain scale-125 translate-y-1"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center z-20 shadow-sm">
                                {getIcon(latestEvent?.type || 'system')}
                            </div>
                        </div>

                        {/* Right Side: Message Payload */}
                        <div className="flex-1 flex items-center justify-between min-w-0 pr-4">
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest whitespace-nowrap">
                                        {latestEvent?.agent_name || 'CORE'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                    <span className={cn(
                                        "text-[8px] font-bold uppercase tracking-wider",
                                        latestEvent?.type?.toLowerCase() === 'thought' ? "text-amber-500/70" :
                                            latestEvent?.type?.toLowerCase() === 'user_reply' ? "text-orange-500/70" :
                                                latestEvent?.type?.toLowerCase() === 'agent_action' ? "text-emerald-500/70" : "text-zinc-500/70"
                                    )}>
                                        {latestEvent?.type || 'system'}
                                    </span>
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={latestEvent?.id || 'empty'}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className={cn(
                                            "text-[13px] font-medium truncate dark:text-zinc-200",
                                            latestEvent?.type?.toLowerCase() === 'thought' && "italic text-zinc-500"
                                        )}
                                    >
                                        {latestEvent?.message || "Standing by for live telemetry..."}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            {latestEvent && (
                                <div className="shrink-0 ml-4 flex flex-col items-end">
                                    <span className="text-[9px] font-mono text-zinc-400 tabular-nums">
                                        {parseAsUTC(latestEvent.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    {latestEvent.status && (
                                        <Badge variant="outline" className="text-[7px] h-3.5 px-1 py-0 border-zinc-100 dark:border-zinc-800 text-orange-400 uppercase tracking-tighter">
                                            {latestEvent.status}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Footer Overlay (Subtle) */}
                <div className="absolute -bottom-6 inset-x-0 px-4 flex items-center justify-between opacity-40 group-hover/feed:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-3 text-[7px] text-zinc-400 uppercase tracking-[0.2em] font-black">
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                            <span>Sync: Stable</span>
                        </div>
                        <span>Core Relay v3.0</span>
                    </div>
                </div>
            </div>

            {/* Dynamic Glow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-orange-500/10 blur-xl pointer-events-none" />
        </div>
    );
}
