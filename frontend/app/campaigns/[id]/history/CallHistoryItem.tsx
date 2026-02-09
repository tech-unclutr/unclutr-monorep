"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CallLogEntry {
    lead_id: string;
    name: string;
    phone_number: string;
    status: string;
    outcome?: string;
    duration: number;
    timestamp: string;
    key_insight?: string;
    avatar_seed: string;
    call_log_id?: string;
    next_step?: string;
    sentiment?: {
        emoji: string;
        label: string;
        score: number;
    };
    agreement_status?: {
        agreed: boolean;
        status: string;
        confidence: string;
    };
    intent_priority?: {
        level: 'high' | 'medium' | 'low';
        score: number;
        reason?: string;
    };
    bolna_call_id?: string;
    user_queue_item_id?: string;
}

interface CallHistoryItemProps {
    call: CallLogEntry;
    onClick: (call: CallLogEntry) => void;
    style?: React.CSSProperties;
}

export const CallHistoryItem = memo(({ call, onClick, style }: CallHistoryItemProps) => {
    return (
        <div style={style}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => onClick(call)}
                className="group relative flex items-center gap-6 p-4 mx-2 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-xl dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer h-[calc(100%-16px)] my-2"
            >
                {/* Glass Highlight */}
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-zinc-900/[0.02] dark:from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Avatar */}
                <div className="relative w-14 h-14 shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-200 to-transparent dark:from-white/10 dark:to-transparent p-0.5">
                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                            <img
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${call.avatar_seed}`}
                                alt={call.name}
                                loading="lazy"
                                className="w-full h-full object-contain scale-125 translate-y-1 group-hover:scale-150 transition-transform duration-700"
                            />
                        </div>
                    </div>
                    {/* Activity Dot */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-50 dark:bg-[#050505] p-0.5">
                        <div className={cn(
                            "w-full h-full rounded-full",
                            call.agreement_status?.status === 'yes' ? "bg-emerald-500 shadow-md dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-300 dark:bg-zinc-600"
                        )} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-base font-black text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                            {call.name}
                        </h3>
                        {call.agreement_status?.status === 'yes' && (
                            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Agreed</span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 line-clamp-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                        {call.key_insight || "—"}
                    </p>
                </div>

                {/* Meta Group */}
                <div className="flex items-center gap-6 shrink-0 relative z-10">
                    <div className="text-right hidden sm:block">
                        <div className="text-xs font-black text-zinc-900 dark:text-white mb-0.5">
                            {new Date(call.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                        <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                            Timestamp
                        </div>
                    </div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-white/5 hidden sm:block" />
                    <div className="text-right">
                        <div className="text-xs font-black text-zinc-600 dark:text-zinc-400 mb-0.5">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                            Duration
                        </div>
                    </div>
                </div>

                {/* Link Icon */}
                <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                </div>
            </motion.div>
        </div>
    );
});

CallHistoryItem.displayName = 'CallHistoryItem';
