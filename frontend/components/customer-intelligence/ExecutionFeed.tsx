import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Zap, Activity, Trash2 } from 'lucide-react';
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExecutionEvent {
    id: string;
    timestamp: string;
    type: 'agent_action' | 'system';
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

export function ExecutionFeed({ campaignId, isActive, events, onClear, viewMode = 'live', onViewModeChange }: ExecutionFeedProps) {
    // Events are now passed from parent

    return (
        <div className="mt-8 relative">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest flex-1">Mission Control Feed</h4>

                {onViewModeChange && (
                    <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 mr-2">
                        <button
                            onClick={() => onViewModeChange('live')}
                            className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
                                viewMode === 'live'
                                    ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                                    : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                            )}
                        >
                            Live
                        </button>
                        <button
                            onClick={() => onViewModeChange('all')}
                            className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
                                viewMode === 'all'
                                    ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                                    : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                            )}
                        >
                            All
                        </button>
                    </div>
                )}

                {onClear && viewMode === 'live' && (
                    <button
                        onClick={onClear}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors group/btn"
                        title="Clear Feed"
                    >
                        <Trash2 className="w-3 h-3 text-zinc-400 group-hover/btn:text-red-500 transition-colors" />
                    </button>
                )}
                <div className="h-px w-4 bg-zinc-100 dark:bg-zinc-800" />
            </div>

            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 font-mono text-[11px] overflow-hidden group shadow-2xl">
                {/* Background Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

                <div className="space-y-2 max-h-[240px] overflow-y-auto scrollbar-hide flex flex-col-reverse">
                    <AnimatePresence initial={false}>
                        {events.length > 0 ? (
                            events.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-3 py-1 border-b border-zinc-900 last:border-0"
                                >
                                    <span className="text-zinc-600 shrink-0">
                                        [{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                    </span>

                                    <div className="flex-1">
                                        <span className={cn(
                                            "font-bold mr-2",
                                            event.type === 'system' ? "text-indigo-400" : "text-emerald-500"
                                        )}>
                                            {event.type === 'system' ? "CORE" : event.agent_name}:
                                        </span>
                                        <span className="text-zinc-300 leading-relaxed uppercase tracking-tight">
                                            {event.message}
                                        </span>
                                    </div>

                                    {event.status === 'connected' && (
                                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse mt-0.5" />
                                    )}
                                    {event.type === 'system' && (
                                        <Cpu className="w-3 h-3 text-indigo-500 animate-spin [animation-duration:3s] mt-0.5" />
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-zinc-600 italic py-4 text-center">
                                Initializing secure buffer...
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Status Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Uplink Active
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-orange-500" />
                            Neural Sync: 98%
                        </span>
                    </div>
                    <div>
                        SquareUp Core v2.4.0
                    </div>
                </div>
            </div>

            {/* Dynamic Glow */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-indigo-500/5 blur-2xl pointer-events-none" />
        </div>
    );
}
