"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditLog {
    id: string;
    action: string;
    resource_type: string;
    actor_id: string;
    created_at: string;
    event_data: any;
}

export function ActivityStream() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const es = new EventSource(`${apiUrl}/dev/events`);
        eventSourceRef.current = es;

        es.addEventListener("audit_log", (event) => {
            try {
                const newLog = JSON.parse(event.data);
                setLogs((prev) => [newLog, ...prev].slice(0, 50));
            } catch (e) {
                console.error("Failed to parse log", e);
            }
        });

        es.onerror = (err) => {
            console.error("SSE Error:", err);
            es.close();
        };

        return () => {
            es.close();
        };
    }, []);

    return (
        <Card className="flex-1 bg-white/[0.02] border-white/5 flex flex-col min-h-[400px] overflow-hidden h-full">
            <CardHeader className="p-6 shrink-0 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-white">Live Activity Stream</CardTitle>
                            <CardDescription className="text-white/30 text-xs">Real-time system events</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1 h-3 bg-orange-500/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                        <span className="text-[10px] text-orange-400 uppercase font-bold tracking-widest leading-none">Live</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 scrollbar-hide">
                <div className="divide-y divide-white/5">
                    <AnimatePresence initial={false}>
                        {logs.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-white/20 text-sm font-medium">Waiting for system events...</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4"
                                >
                                    <div className="mt-1">
                                        <div className={`w-2 h-2 rounded-full ${log.action.includes('created') ? 'bg-orange-500' :
                                            log.action.includes('deleted') ? 'bg-rose-500' :
                                                log.action.includes('updated') ? 'bg-amber-500' : 'bg-white/20'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-white/90 font-mono tracking-tight">{log.action}</span>
                                            <span className="text-[10px] text-white/20 font-mono">
                                                {new Date(log.created_at).toLocaleTimeString([], { hour12: true })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-white/40">
                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-widest text-[9px] font-bold">
                                                {log.resource_type}
                                            </span>
                                            <span className="font-mono text-[10px] truncate max-w-[150px]">
                                                ID: {log.id.split('-')[0]}...
                                            </span>
                                            <span className="text-[10px] truncate max-w-[100px]">
                                                {log.actor_id === 'system' ? 'System' : `User: ${log.actor_id.slice(0, 4)}...`}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
