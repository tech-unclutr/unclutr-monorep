"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    Database,
    FileText,
    User,
    ShieldCheck,
    Server
} from 'lucide-react';
import { cn, formatPhoneNumber } from "@/lib/utils";

interface ProcessingLogProps {
    data: any[];
    mapping: {
        customer_name: string;
        contact_number: string;
        cohort: string;
    };
    className?: string;
}

interface LogEntry {
    id: string;
    text: string;
    type: 'info' | 'success' | 'system' | 'record';
    icon: React.ElementType;
}

export function ProcessingLog({ data, mapping, className }: ProcessingLogProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const processingIdx = useRef(0);

    // Initial system checks
    useEffect(() => {
        const initialLogs: LogEntry[] = [
            { id: 'init-1', text: 'Alex: Success Team is ready. Getting your leads onboarded...', type: 'system', icon: Server },
            { id: 'init-2', text: 'Sarah: Checking the list for any missing details...', type: 'info', icon: FileText },
            { id: 'init-3', text: 'Rohan: Making sure every record is unique...', type: 'info', icon: Database },
        ];
        setLogs(initialLogs);
    }, []);

    // Simulated processing loop
    useEffect(() => {
        const interval = setInterval(() => {
            const currentIdx = processingIdx.current;

            // Generate a new log entry
            let newLog: LogEntry | null = null;

            // Mix of system messages and record processing
            if (Math.random() > 0.7 || currentIdx >= data.length) {
                // System message
                const sysMsgs = [
                    "Maya: Syncing the latest context for your campaign...",
                    "Alex: Securing these contact details in the vault...",
                    "Sarah: Quick check on the phone formats for global reach...",
                    "Rohan: Mapping out the best paths for outreach...",
                    "Maya: Our intelligence engine is now processing the batch...",
                    `Alex: Formatted ${formatPhoneNumber("919876543210")} for display...`
                ];
                newLog = {
                    id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    text: sysMsgs[Math.floor(Math.random() * sysMsgs.length)],
                    type: 'system',
                    icon: ShieldCheck
                };
            } else {
                // Record processing
                const row = data[currentIdx];
                const name = row[mapping.customer_name];
                if (name) {
                    newLog = {
                        id: `rec-${currentIdx}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        text: `Success Team: Welcoming ${name} to the campaign`,
                        type: 'record',
                        icon: User
                    };
                }
                processingIdx.current = (currentIdx + 1) % data.length; // Loop over data if needed
            }

            if (newLog) {
                setLogs(prev => {
                    const next = [...prev, newLog!];
                    if (next.length > 7) next.shift(); // Keep only last 7 items
                    return next;
                });
            }

        }, 400); // Speed of logs

        return () => clearInterval(interval);
    }, [data, mapping]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [logs]);

    return (
        <div className={cn("w-full max-w-md mx-auto", className)}>
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl h-[300px] flex flex-col transition-colors duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10" />
                            <div className="absolute inset-0 w-full h-full bg-emerald-500 rounded-full animate-ping opacity-20" />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 font-mono">
                            Intelligence_Stream
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-medium tabular-nums">
                            {(data.length * 0.85).toFixed(0)}
                        </span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium uppercase">
                            rec/s
                        </span>
                    </div>
                </div>

                {/* Log Feed */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto overflow-x-hidden font-mono text-xs relative custom-scrollbar scroll-smooth">
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

                    <AnimatePresence initial={false} mode='popLayout'>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, x: -10, filter: 'blur(2px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors border",
                                    log.type === 'record'
                                        ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-100 dark:border-orange-500/20"
                                        : log.type === 'system'
                                            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20"
                                            : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"
                                )}>
                                    <log.icon className="w-3 h-3" />
                                </div>
                                <span className={cn(
                                    "truncate transition-colors",
                                    log.type === 'record'
                                        ? "text-zinc-700 dark:text-zinc-200 font-medium"
                                        : log.type === 'system'
                                            ? "text-zinc-600 dark:text-zinc-300"
                                            : "text-zinc-400 dark:text-zinc-500"
                                )}>
                                    {log.text}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={bottomRef} className="h-2" />
                </div>

                {/* Progress Bar */}
                <div className="h-0.5 bg-zinc-100 dark:bg-zinc-900 w-full overflow-hidden">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                        className="h-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-500 w-full opacity-80"
                    />
                </div>
            </div>

            <div className="text-center mt-6 space-y-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                    <div className="relative">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <div className="absolute inset-0 bg-orange-500/20 blur-md animate-pulse" />
                    </div>
                    <span>Success Team is on it</span>
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                    Securely organizing and preparing <span className="text-zinc-950 dark:text-white font-semibold">{data.length} customer profiles</span> for your upcoming campaign...
                </p>
            </div>
        </div>
    );
}
