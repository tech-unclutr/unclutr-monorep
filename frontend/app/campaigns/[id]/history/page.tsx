"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, TrendingUp, TrendingDown, Phone, Clock, CheckCircle2, XCircle, Zap, Activity } from 'lucide-react';
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CampaignActivityModal } from "@/components/campaign-activity/CampaignActivityModal";
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { CallHistoryItem } from './CallHistoryItem';
import { useAuth } from "@/hooks/use-auth";

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
    user_queue_item_id?: string; // [NEW] For fetching complete lead context
}

interface CampaignStats {
    total_calls: number;
    connected_calls: number;
    conversion_rate: number;
    avg_duration: number;
    sentiment_breakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    yes_intent_leads: number; // [NEW] Count
}

interface RowData {
    items: CallLogEntry[];
    onClick: (call: CallLogEntry) => void;
}

// Separate component to prevent re-creation on every render
const RowRenderer = ({ index, style, items, onClick }: RowData & { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    // We can't access filteredHistory here directly, but we pass it as 'items' in rowProps
    return (
        <CallHistoryItem
            style={style}
            key={item.call_log_id || index}
            call={item}
            onClick={onClick}
        />
    );
};

export default function CampaignHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params?.id as string;

    const [history, setHistory] = useState<CallLogEntry[]>([]);
    const [stats, setStats] = useState<CampaignStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    // [NEW] WebSocket connection for real-time stats updates
    useEffect(() => {
        if (!campaignId) return;

        let websocket: WebSocket | null = null;
        let retryCount = 0;
        const MAX_RETRIES = 5;

        const connectWebSocket = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Use the correct port for backend (usually 8000 or from env), here we assume same host or proxy
            // If running strictly separate, might need explicit port 8000
            const wsUrl = `${protocol}//${window.location.hostname}:8000/api/v1/execution/campaign/${campaignId}/ws`;

            websocket = new WebSocket(wsUrl);

            websocket.onopen = () => {
                retryCount = 0;
            };

            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'status_update' || data.type === 'call_completed') {
                        // Refresh stats and history when a call completes or status updates
                        fetchCampaignHistory();
                    }
                } catch (e) {
                    console.error("[History] WebSocket message error:", e);
                }
            };

            websocket.onclose = () => {
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    setTimeout(connectWebSocket, 3000 * retryCount);
                }
            };
        };

        connectWebSocket();

        return () => {
            if (websocket) {
                websocket.close();
            }
        };
    }, [campaignId]);
    const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { loading: authLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!authLoading && isAuthenticated && campaignId) {
            fetchCampaignHistory();
        }
    }, [campaignId, authLoading, isAuthenticated]);

    const fetchCampaignHistory = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/execution/campaign/${campaignId}/history`) as any;
            if (response) {
                setHistory(response.history || []);
                setStats(response.stats || null);
            }
        } catch (error) {
            console.error('Failed to fetch campaign history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredHistory = history.filter(call => {
        // Search filter
        const matchesSearch = searchQuery === '' ||
            call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            call.phone_number.includes(searchQuery) ||
            (call.key_insight?.toLowerCase().includes(searchQuery.toLowerCase()));

        // Active filter
        let matchesFilter = true;
        if (activeFilter === 'hot') {
            matchesFilter = (call as any).agreement_status?.status === 'yes' || call.intent_priority?.level === 'high';
        } else if (activeFilter === 'frustrated') {
            matchesFilter = call.sentiment?.score ? call.sentiment.score < -0.3 : false;
        } else if (activeFilter === 'converted') {
            matchesFilter = ['INTENT_YES', 'INTERESTED', 'SCHEDULED'].includes(call.outcome || '');
        } else if (activeFilter === 'voicemail') {
            matchesFilter = call.outcome === 'VOICEMAIL' || call.outcome === 'NO_ANSWER';
        }

        return matchesSearch && matchesFilter;
    });

    const sentimentColor = stats ?
        stats.sentiment_breakdown.positive > stats.sentiment_breakdown.negative ? 'from-emerald-500/20 to-blue-500/20' :
            stats.sentiment_breakdown.negative > stats.sentiment_breakdown.positive ? 'from-orange-500/20 to-red-500/20' :
                'from-zinc-500/20 to-zinc-500/20' : 'from-zinc-500/20 to-zinc-500/20';

    return (
        <div className="relative min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 selection:bg-orange-500/30 overflow-x-hidden transition-colors duration-500">
            {/* Immersive Background Layer */}
            <div className="fixed inset-0 z-0">
                <div className={cn(
                    "absolute inset-0 transition-opacity duration-1000",
                    sentimentColor === 'from-emerald-500/20 to-blue-500/20' ? "opacity-30 dark:opacity-40" :
                        sentimentColor === 'from-orange-500/20 to-red-500/20' ? "opacity-50 dark:opacity-60" : "opacity-15 dark:opacity-20"
                )}>
                    <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000", sentimentColor)} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0),rgba(250,250,250,1))] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,0),rgba(5,5,5,1))]" />
                </div>
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            {/* Header Section */}
            <div className="relative z-10 border-b border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-8 py-10">
                    <div className="flex items-center justify-between mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="group gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-white/5 transition-all outline-none focus:ring-0"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                            </Button>
                        </motion.div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10 backdrop-blur-md">
                            <Activity className="w-3 h-3 text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Live Ledger</span>
                        </div>
                    </div>

                    <div className="mb-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl font-black tracking-tight bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent mb-3"
                        >
                            Campaign History
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-zinc-500 dark:text-zinc-400 font-medium"
                        >
                            Complete call ledger and mission analytics
                        </motion.p>
                    </div>

                    {/* Stats Belt */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Calls', value: stats.total_calls.toLocaleString(), icon: Phone, color: 'orange', delay: 0 },
                                { label: 'Connected', value: stats.connected_calls.toLocaleString(), icon: CheckCircle2, color: 'emerald', delay: 0.1 },
                                { label: 'Yes Intent Leads', value: (stats.yes_intent_leads || 0).toLocaleString(), icon: TrendingUp, color: 'orange', delay: 0.2 },
                                { label: 'Avg Duration', value: `${Math.floor(stats.avg_duration / 60)}:${(stats.avg_duration % 60).toString().padStart(2, '0')}`, icon: Clock, color: 'amber', delay: 0.3 },
                            ].map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: stat.delay }}
                                    className="group relative overflow-hidden rounded-3xl bg-white/60 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 p-8 hover:bg-white/80 dark:hover:bg-white/[0.05] shadow-sm dark:shadow-none transition-all duration-500 cursor-default"
                                >
                                    <div className={cn(
                                        "absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 dark:opacity-20 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-40",
                                        stat.color === 'orange' ? "bg-orange-500" :
                                            stat.color === 'emerald' ? "bg-emerald-500" : "bg-amber-500"
                                    )} />

                                    <div className="relative z-10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3",
                                            stat.color === 'orange' ? "bg-orange-500/10 text-orange-500" :
                                                stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-500"
                                        )}>
                                            <stat.icon className="w-6 h-6 outline-none" />
                                        </div>
                                        <div className="text-4xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">
                                            {stat.value}
                                        </div>
                                        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                            {stat.label}
                                        </div>
                                    </div>

                                    {/* Hover Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-zinc-900/[0.02] dark:via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Control Bar */}
            <div className="sticky top-0 z-20 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-b border-zinc-200 dark:border-white/5 py-6">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            </div>
                            <Input
                                placeholder="Search mission ledger..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 pr-6 bg-white/60 dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-full focus:bg-white/80 dark:focus:bg-white/[0.05] focus:border-orange-500/30 dark:focus:border-orange-500/30 focus:ring-0 transition-all"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            {[
                                { id: 'all', label: 'All Events', icon: Activity },
                                { id: 'hot', label: 'Hot Leads', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                { id: 'converted', label: 'Converted', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 border",
                                        activeFilter === filter.id
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                            : "bg-white/60 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                                    )}
                                >
                                    <filter.icon className={cn("w-3 h-3", activeFilter === filter.id ? "text-white dark:text-black" : filter.color || "text-zinc-400 dark:text-zinc-500")} />
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Call Stream */}
            <div className="relative z-10 max-w-7xl mx-auto px-8 py-4 h-[calc(100vh-280px)]">
                <AnimatePresence mode="popLayout" initial={false}>
                    {isLoading || authLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32"
                        >
                            <div className="relative w-16 h-16 mb-6">
                                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                                <div className="absolute inset-0 rounded-full border-2 border-t-orange-500 animate-spin" />
                            </div>
                            <div className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">Scanning Transmission...</div>
                        </motion.div>
                    ) : !isAuthenticated ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 bg-white/60 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[40px] shadow-sm dark:shadow-none"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-8">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">Access Restricted</h3>
                            <p className="text-zinc-500 max-w-xs text-center leading-relaxed">Please authenticate to access the mission intelligence ledger.</p>
                        </motion.div>
                    ) : filteredHistory.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-32 bg-white/60 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[40px] shadow-sm dark:shadow-none"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-zinc-500/10 flex items-center justify-center mb-8">
                                <Search className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">No Records Found</h3>
                            <p className="text-zinc-500 text-center">Try adjusting your mission filters.</p>
                        </motion.div>
                    ) : (
                        <div className="w-full h-full">
                            <AutoSizer
                                renderProp={({ height, width }) => {
                                    if (height === undefined || width === undefined) return null;
                                    return (
                                        <List<RowData>
                                            style={{ width, height }}
                                            rowCount={filteredHistory.length}
                                            rowHeight={120}
                                            rowComponent={RowRenderer}
                                            rowProps={{
                                                items: filteredHistory,
                                                onClick: (call: CallLogEntry) => {
                                                    setSelectedCall(call);
                                                    setIsModalOpen(true);
                                                }
                                            }}
                                        />
                                    );
                                }}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal */}
            {selectedCall && (
                <CampaignActivityModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedCall(null);
                    }}
                    call={selectedCall}
                    campaignId={campaignId}
                />
            )}
        </div>
    );
}
