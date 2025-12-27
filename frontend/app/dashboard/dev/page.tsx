"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, LogOut, ShieldAlert, Activity, Database, Key, Zap, Trash2, RotateCcw } from "lucide-react";
import { logout } from "@/lib/auth-helpers";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface HealthStatus {
    api: string;
    database: string;
    firebase: string;
    vertex_ai: string;
}

interface AuditLog {
    id: string;
    action: string;
    resource_type: string;
    actor_id: string;
    created_at: string;
    event_data: any;
}

export default function DeveloperDashboard() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isResetting, setIsResetting] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const router = useRouter();
    const eventSourceRef = useRef<EventSource | null>(null);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoggingOut(false);
        }
    };

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const data = await api.get("/health/full");
            setHealth(data);
        } catch (error) {
            console.error("Failed to fetch health status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetOnboarding = async () => {
        if (!confirm("Reset your onboarding progress?")) return;
        setIsResetting(true);
        try {
            await api.post("/dev/reset-onboarding", {});
            alert("Onboarding reset. Redirecting...");
            router.push("/onboarding");
        } catch (err) {
            console.error(err);
        } finally {
            setIsResetting(false);
        }
    };

    const handlePurgeData = async () => {
        if (!confirm("DANGER: This will delete all your companies, brands, and workspaces. Proceed?")) return;
        setIsPurging(true);
        try {
            await api.post("/dev/purge-data", {});
            alert("Data purged. You are now a clean slate.");
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsPurging(false);
        }
    };

    useEffect(() => {
        fetchHealth();

        // Setup SSE for real-time audit logs
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const es = new EventSource(`${apiUrl}/dev/events`);
        eventSourceRef.current = es;

        es.addEventListener("audit_log", (event) => {
            const newLog = JSON.parse(event.data);
            setLogs((prev) => [newLog, ...prev].slice(0, 50));
        });

        es.onerror = (err) => {
            console.error("SSE Error:", err);
            es.close();
        };

        return () => {
            es.close();
        };
    }, []);

    const getStatusBadge = (status: string) => {
        const isOnline = status === "online" || status === "connected";
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${isOnline ? "text-emerald-500" : "text-red-500"}`}>
                    {isOnline ? "Operational" : "Offline"}
                </span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <header className="max-w-7xl mx-auto w-full flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Control Tower</h1>
                        <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">Unclutr System Operations</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={fetchHealth} disabled={loading} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <Button onClick={handleLogout} disabled={loggingOut} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Column: Health & Config */}
                <div className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
                    {/* Health Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { title: "Backend API", icon: Activity, status: health?.api },
                            { title: "Primary DB", icon: Database, status: health?.database },
                            { title: "Auth Layer", icon: Key, status: health?.firebase },
                            { title: "Intelligence", icon: Zap, status: health?.vertex_ai },
                        ].map((item, idx) => (
                            <Card key={idx} className="bg-white/[0.02] border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-white/80 transition-colors">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-white/80">{item.title}</span>
                                    </div>
                                    {health ? getStatusBadge(item.status || "offline") : <div className="h-4 w-12 bg-white/5 animate-pulse rounded" />}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Maintenance Actions */}
                    <Card className="bg-red-500/[0.02] border-red-500/10">
                        <CardHeader className="p-5">
                            <div className="flex items-center gap-2 text-red-400">
                                <ShieldAlert className="w-4 h-4" />
                                <CardTitle className="text-sm font-bold uppercase tracking-widest">Danger Zone</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 space-y-3">
                            <Button
                                onClick={handleResetOnboarding}
                                disabled={isResetting}
                                variant="outline"
                                className="w-full justify-start border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all group"
                            >
                                <RotateCcw className={`w-4 h-4 mr-2 transition-transform ${isResetting ? "animate-spin" : "group-hover:-rotate-45"}`} />
                                Reset Onboarding Flow
                            </Button>
                            <Button
                                onClick={handlePurgeData}
                                disabled={isPurging}
                                variant="outline"
                                className="w-full justify-start border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/20 transition-all group"
                            >
                                <Trash2 className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                                Hard Purge My Data
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Environment Info */}
                    <Card className="bg-white/[0.02] border-white/5">
                        <CardHeader className="p-5">
                            <CardTitle className="text-sm font-semibold tracking-tight text-white/90">Environment Context</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/40 uppercase tracking-wider font-bold">Node Env</span>
                                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/60">development</Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/40 uppercase tracking-wider font-bold">Deployment</span>
                                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/60 text-[10px]">LOCAL:PORT_3000</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activity Stream */}
                <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
                    <Card className="flex-1 bg-white/[0.02] border-white/5 flex flex-col min-h-0 overflow-hidden">
                        <CardHeader className="p-6 shrink-0 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Live Activity Stream</CardTitle>
                                        <CardDescription className="text-white/30 text-xs">Real-time system events via SSE</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-1 h-3 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">Listening</span>
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
                                                    <div className={`w-2 h-2 rounded-full ${log.action.includes('created') ? 'bg-indigo-500' : 'bg-white/20'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-white/90 font-mono tracking-tight">{log.action}</span>
                                                        <span className="text-[10px] text-white/20 font-mono">
                                                            {new Date(log.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-widest text-[9px] font-bold">
                                                            {log.resource_type}
                                                        </span>
                                                        <span className="font-mono text-[10px] truncate max-w-[150px]">
                                                            ID: {log.id.split('-')[0]}...
                                                        </span>
                                                        <span className="text-[10px]">
                                                            Actor: {log.actor_id.slice(0, 8)}...
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
                </div>
            </main>
        </div>
    );
}
