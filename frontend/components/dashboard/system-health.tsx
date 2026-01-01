"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Database, Key, Zap } from "lucide-react";
import { api } from "@/lib/api";

interface HealthStatus {
    api: string;
    database: string;
    firebase: string;
    vertex_ai: string;
}

export function SystemHealth() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchHealth();
        // Poll every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: string) => {
        const isOnline = status === "online" || status === "connected";
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"}`} />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isOnline ? "text-emerald-500" : "text-red-500"}`}>
                    {isOnline ? "Operational" : "Offline"}
                </span>
            </div>
        );
    };

    const items = [
        { title: "Backend API", icon: Activity, status: health?.api },
        { title: "Primary DB", icon: Database, status: health?.database },
        { title: "Auth Layer", icon: Key, status: health?.firebase },
        { title: "Intelligence", icon: Zap, status: health?.vertex_ai },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <Card key={idx} className="bg-white/[0.02] border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-white/80 transition-colors">
                                <item.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-white/80">{item.title}</span>
                        </div>
                        {health || !loading ? getStatusBadge(item.status || "offline") : <div className="h-4 w-12 bg-white/5 animate-pulse rounded" />}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
