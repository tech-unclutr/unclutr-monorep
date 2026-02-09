"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { CallDetailsModal } from './CallDetailsModal';
import { Download, Filter, CheckCircle2, XCircle, Phone, Clock, PhoneCall, ChevronRight, ThumbsUp, ThumbsDown, CalendarCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCampaignWebSocket } from "@/hooks/use-campaign-websocket";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface CallLog {
    id: string;
    bolna_call_id: string;
    status: string;
    outcome: string | null;
    duration: number;
    total_cost: number;
    currency: string;
    created_at: string;
    termination_reason: string | null;
    lead: {
        id: string;
        name: string;
        number: string;
        cohort: string | null;
    };
    // Add missing fields for modal
    transcript_summary?: string;
    full_transcript?: string;
    extracted_data?: any;
    raw_data?: any;
    recording_url?: string;
    usage_metadata?: any;
    telephony_provider?: string;
    // [NEW] Context-aware fields
    sentiment?: {
        emoji: string;
        label: string;
        score: number;
    };
    agreement_status?: {
        agreed: boolean;
        status: "yes" | "no" | "unclear";
        confidence: "high" | "medium" | "low";
    };
    preferred_slot?: {
        requested: boolean;
        start_time?: string;
        end_time?: string;
        day?: string;
        is_outside_window: boolean;
    };
    should_copy_to_queue?: boolean;
    copied_to_queue_at?: string;
    call_log_id?: string;
}

interface CallLogTableProps {
    campaignId: string;
}

export default function CallLogTable({ campaignId }: CallLogTableProps) {
    const { companyId } = useAuth();
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'live' | 'history'>('live');
    const [clearedAt, setClearedAt] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [outcomeFilter, setOutcomeFilter] = useState("all");

    // Export CSV
    const handleExport = () => {
        if (!logs.length) return;

        const headers = ["ID", "Time", "Lead Name", "Number", "Status", "Duration", "Cost", "Outcome", "Termination Reason"];
        const rows = logs.map(log => [
            log.bolna_call_id,
            new Date(log.created_at).toISOString(),
            log.lead.name,
            log.lead.number,
            log.status,
            log.duration,
            (log.total_cost * 0.9).toFixed(4),
            log.outcome || "",
            log.termination_reason || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `campaign_logs_${campaignId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRowClick = (log: CallLog) => {
        setSelectedCall(log);
        setIsModalOpen(true);
    };

    const fetchLogs = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res: any = await api.get(`/execution/campaign/${campaignId}/logs?page=${page}&page_size=20`, { "X-Company-ID": companyId });
            console.log("CallLogTable: logs response", res);

            // Handle different possible response structures
            // 1. { data: [...] } (Standard)
            // 2. [...] (Direct array)
            // 3. undefined/null (Fallback)
            let newLogs: CallLog[] = [];

            if (res && Array.isArray(res.data)) {
                newLogs = res.data;
            } else if (Array.isArray(res)) {
                newLogs = res;
            }

            if (newLogs.length < 20) {
                setHasMore(false);
            } else {
                setHasMore(true); // Pagination fix: re-enable Next button if full page returned
            }
            setLogs(newLogs);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            setLogs([]); // Default to empty array on error
        } finally {
            setLoading(false);
        }
    };

    // [NEW] Real-time updates via WebSocket
    const { data: wsData } = useCampaignWebSocket(campaignId);

    useEffect(() => {
        // If we receive a broadcast for this campaign, we should refresh the logs
        // ideally the broadcast contains the specific log, but for now we just trigger a refetch
        // to ensure we get the latest persistent data from the DB.
        if (wsData) {
            fetchLogs();
        }
    }, [wsData]);

    // Initialize from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(`unclutr_call_log_cleared_at_${campaignId}`);
        if (stored) {
            setClearedAt(parseInt(stored, 10));
        }
    }, [campaignId]);

    const handleClearLog = () => {
        const now = Date.now();
        setClearedAt(now);
        localStorage.setItem(`unclutr_call_log_cleared_at_${campaignId}`, now.toString());
    };

    // Filter logs based on clear state and filters
    const displayedLogs = (viewMode === 'live' && clearedAt
        ? logs.filter(log => new Date(log.created_at).getTime() > clearedAt)
        : logs).filter(log => {
            if (outcomeFilter === 'all') return true;
            if (!log.outcome && outcomeFilter === 'unknown') return true;
            return log.outcome?.toLowerCase() === outcomeFilter.toLowerCase();
        });

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Polling for updates
        return () => clearInterval(interval);
    }, [campaignId, page, companyId]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return { color: 'text-green-400 bg-green-400/10 border-green-400/20', Icon: CheckCircle2 };
            case 'failed': return { color: 'text-red-400 bg-red-400/10 border-red-400/20', Icon: XCircle };
            case 'connected': return { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', Icon: PhoneCall };
            case 'initiated': return { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', Icon: Phone };
            default: return { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', Icon: Clock };
        }
    };

    const formatCallTime = (dateString: string) => {
        if (!dateString) return '-';
        // Ensure UTC interpretation if missing 'Z'
        const utcString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        const date = new Date(utcString);
        return (
            <div className="flex flex-col">
                <span className="text-sm text-gray-400">{format(date, 'MMM d, h:mm a')}</span>
                <span className="text-xs text-gray-600">{format(date, 'yyyy')}</span>
            </div>
        );
    };

    // [NEW] Helper function to handle copy to queue
    const handleCopyToQueue = async (log: CallLog) => {
        if (!companyId) return;

        try {
            await api.post(
                `/execution/campaign/${campaignId}/lead/${log.lead.id}/copy-to-queue`,
                {
                    call_log_id: log.call_log_id || log.id,
                    preferred_slot: log.preferred_slot
                },
                { "X-Company-ID": companyId }
            );

            toast.success("Lead copied to queue", {
                description: `${log.lead.name} has been added to your call queue`
            });

            // Refresh logs to update UI
            fetchLogs();
        } catch (error: any) {
            console.error("Failed to copy to queue:", error);
            toast.error("Failed to copy lead", {
                description: error.response?.data?.detail || "Please try again"
            });
        }
    };

    // [NEW] Helper function to handle calendar booking
    const handleBookCall = async (log: CallLog) => {
        if (!log.preferred_slot || !log.preferred_slot.start_time) return;
        if (!companyId) return;

        try {
            const response = await api.post(
                `/execution/campaign/${campaignId}/lead/${log.lead.id}/book-call`,
                {
                    preferred_start_time: log.preferred_slot.start_time,
                    preferred_end_time: log.preferred_slot.end_time,
                },
                { "X-Company-ID": companyId }
            );

            if (response.calendar_link) {
                // Open calendar link in new tab
                window.open(response.calendar_link, '_blank');
                toast.success("Calendar event created", {
                    description: "Click to add to your calendar"
                });
            }
        } catch (error: any) {
            console.error("Failed to create calendar booking:", error);
            toast.error("Failed to create booking", {
                description: error.response?.data?.detail || "Please try again"
            });
        }
    };

    return (
        <div className="w-full bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium text-white">Call History</h3>
                    <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
                        <button
                            type="button"
                            onClick={() => setViewMode('live')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'live'
                                ? 'bg-orange-500/20 text-orange-300 shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Live View
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('history')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'history'
                                ? 'bg-orange-500/20 text-orange-300 shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Full History
                        </button>
                    </div>
                </div>



                <div className="flex items-center gap-2">
                    <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs bg-white/5 border-white/10 text-gray-400">
                            <SelectValue placeholder="Filter Outcome" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-gray-300">
                            <SelectItem value="all">All Outcomes</SelectItem>
                            <SelectItem value="interested">Interested</SelectItem>
                            <SelectItem value="not interested">Not Interested</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>

                    {viewMode === 'live' && (
                        <button
                            type="button"
                            onClick={handleClearLog}
                            className="p-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-white/5"
                            title="Clear Current View"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={fetchLogs}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Export to CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-xs uppercase text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 tracking-wider">Time</th>
                            <th className="px-6 py-3 tracking-wider">Lead</th>
                            <th className="px-6 py-3 tracking-wider">Status</th>
                            <th className="px-6 py-3 tracking-wider">Duration</th>
                            <th className="px-6 py-3 tracking-wider">Reason</th>
                            <th className="px-6 py-3 tracking-wider">Outcome</th>
                            <th className="px-6 py-3 tracking-wider">Context</th>
                            <th className="px-6 py-3 tracking-wider text-right">Cost (INR)</th>
                            <th className="px-6 py-3 tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayedLogs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                    No calls recorded yet.
                                </td>
                            </tr>
                        )}

                        {displayedLogs.map((log) => (
                            <tr
                                key={log.id}
                                className="hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => handleRowClick(log)}
                            >
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                                    {formatCallTime(log.created_at)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {/* Sentiment Emoji */}
                                        {log.sentiment && (
                                            <span className="text-lg" title={log.sentiment.label}>
                                                {log.sentiment.emoji}
                                            </span>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-medium">{log.lead.name}</span>
                                            <span className="text-xs text-gray-500">{log.lead.cohort === 'Default' ? 'General Audience' : (log.lead.cohort || 'General Audience')}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    {(() => {
                                        // Priority Logic
                                        if (log.agreement_status?.status === 'yes') {
                                            return (
                                                <span className="px-2 py-0.5 rounded text-xs border flex items-center gap-1 w-fit text-green-400 bg-green-400/10 border-green-400/20">
                                                    <ThumbsUp className="w-3 h-3" />
                                                    Agreed
                                                </span>
                                            );
                                        }
                                        if (log.agreement_status?.status === 'no') {
                                            return (
                                                <span className="px-2 py-0.5 rounded text-xs border flex items-center gap-1 w-fit text-red-400 bg-red-400/10 border-red-400/20">
                                                    <ThumbsDown className="w-3 h-3" />
                                                    Declined
                                                </span>
                                            );
                                        }
                                        if (log.outcome === 'Scheduled') {
                                            return (
                                                <span className="px-2 py-0.5 rounded text-xs border flex items-center gap-1 w-fit text-orange-400 bg-orange-400/10 border-orange-400/20">
                                                    <CalendarCheck className="w-3 h-3" />
                                                    Scheduled
                                                </span>
                                            );
                                        }
                                        if (log.outcome === 'Interested') {
                                            return (
                                                <span className="px-2 py-0.5 rounded text-xs border flex items-center gap-1 w-fit text-green-400 bg-green-400/10 border-green-400/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Interested
                                                </span>
                                            );
                                        }

                                        // Fallback to Technical Status if no high-priority outcome
                                        const { color, Icon } = getStatusInfo(log.status);
                                        return (
                                            <span className={`px-2 py-0.5 rounded text-xs border flex items-center gap-1 w-fit ${color}`}>
                                                <Icon className="w-3 h-3" />
                                                {log.status}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                                    {formatDuration(log.duration)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                                    {log.termination_reason || '-'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                                    <span className={`px-2 py-0.5 rounded text-xs border ${log.outcome === 'Interested' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                        log.outcome === 'Not Interested' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                                            log.outcome === 'Scheduled' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
                                                'text-gray-400 bg-gray-400/10 border-gray-400/20'
                                        }`}>
                                        {log.outcome || '-'}
                                    </span>
                                </td>
                                {/* NEW: Context Column */}
                                <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                                        {/* Agreement Badge */}
                                        {log.agreement_status?.status === 'yes' && (
                                            <span className={`px-2 py-0.5 rounded text-xs border inline-flex items-center gap-1 w-fit ${log.agreement_status.confidence === 'high'
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}>
                                                ✓ Agreed ({log.agreement_status.confidence})
                                            </span>
                                        )}
                                        {log.agreement_status?.status === 'no' && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center gap-1 w-fit">
                                                ✗ Declined
                                            </span>
                                        )}

                                        {/* Preferred Slot */}
                                        {log.preferred_slot?.requested && log.preferred_slot.start_time && (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-gray-400">
                                                    📅 {format(new Date(log.preferred_slot.start_time), 'MMM d, h:mm a')}
                                                </span>
                                                {log.preferred_slot.is_outside_window && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 inline-flex items-center gap-1 w-fit">
                                                        ⚠️ Out of Window
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Copy to Queue Button */}
                                        {log.should_copy_to_queue && !log.copied_to_queue_at && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCopyToQueue(log); }}
                                                className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors border border-orange-500/30 w-fit"
                                            >
                                                📋 Copy to Queue
                                            </button>
                                        )}

                                        {/* Already in Queue Badge */}
                                        {log.copied_to_queue_at && (
                                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                                                ✓ In Queue
                                            </span>
                                        )}

                                        {/* Book Call Button */}
                                        {log.preferred_slot?.is_outside_window && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBookCall(log); }}
                                                className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors border border-blue-500/30 w-fit"
                                            >
                                                📅 Book Call
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-400 font-mono">
                                    ₹{(log.total_cost * 0.9).toFixed(2)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right">
                                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-3 border-t border-white/5 flex justify-end gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                >
                    Previous
                </button>
                <div className="px-3 py-1 text-xs text-gray-500 bg-transparent flex items-center">
                    Page {page}
                </div>
                <button
                    disabled={!hasMore}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-xs bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                >
                    Next
                </button>
            </div>

            <CallDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                call={selectedCall}
            />
        </div >
    );
}
