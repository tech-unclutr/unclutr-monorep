// ... imports
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
    Play,
    Pause,
    Bot,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    Trophy,
    FileText,
    Calendar,
    ArrowRight,
    Plus,
    X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// import { ActiveAgentCard } from "./ActiveAgentCard"; // Replaced
import { ExecutionFeed } from "./ExecutionFeed";
import { AgentQueue, AgentStatus, UpcomingLead } from "./AgentQueue";
import { HumanQueue, ReadyLead } from "./HumanQueue";
import { AgentLiveUpdateModal } from "./AgentLiveUpdateModal";
import { AgentQueueModal } from "./AgentQueueModal";
import { AgentIntelligenceDashboard } from "./AgentIntelligenceDashboard";
import CallLogTable from "./CallLogTable";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useCampaignWebSocket } from "@/hooks/use-campaign-websocket";
import { TimeWindowSelector } from "./TimeWindowSelector";

// --- Types ---

type ExecutionState = 'IDLE' | 'WARMUP' | 'ACTIVE_EMPTY' | 'ACTIVE_READY' | 'IN_CALL' | 'OUTCOME' | 'PAUSED' | 'ERROR' | 'COMPLETED' | 'SCHEDULED';

interface ExecutionPanelProps {
    campaignId: string;
    campaignStatus: string; // DRAFT, IN_PROGRESS, etc.
    hasStrategy?: boolean;
    onStatusChange: (newStatus: string) => void;
    onModalStateChange?: (isOpen: boolean) => void; // Notify parent when schedule modal opens/closes
}

// --- Sub-components ---

const AgentActivityBar = ({ status, activeAgents, executionWindows }: { status: ExecutionState, activeAgents: number, executionWindows?: any[] }) => {
    // Determine current window text
    const currentWindowText = useMemo(() => {
        if (!executionWindows || executionWindows.length === 0) return null;

        // Simple logic: find the window that is either active now or in the future
        const sorted = [...executionWindows].sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));

        // For simplicity, just show the last/most recent one added
        const lastWindow = sorted[sorted.length - 1];
        if (lastWindow) {
            try {
                // Parse start and end times
                // Assuming format is HH:MM
                // We'll construct a dummy date to use format() or just parse the strings manually if needed
                // But since we have day (YYYY-MM-DD), we can construct full ISO

                const startDt = parseISO(`${lastWindow.day}T${lastWindow.start}`);
                const endDt = parseISO(`${lastWindow.day}T${lastWindow.end}`);

                let dayStr = format(startDt, 'MMM d');
                if (isToday(startDt)) dayStr = 'Today';
                if (isTomorrow(startDt)) dayStr = 'Tomorrow';

                const timeStr = `${format(startDt, 'h:mm a')} - ${format(endDt, 'h:mm a')}`;

                return `${dayStr}, ${timeStr}`;
            } catch (e) {
                // Fallback
                return `${lastWindow.day} ${lastWindow.start} - ${lastWindow.end}`;
            }
        }
        return null;
    }, [executionWindows]);

    return (
        <div className="flex items-center justify-between bg-zinc-900/5 dark:bg-zinc-50/5 rounded-xl px-4 py-3 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Bot className="w-5 h-5 text-indigo-500" />
                        {(status === 'WARMUP' || (status as string).includes('ACTIVE')) && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-950" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Success Team</span>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                            {status === 'IDLE' ? 'Offline' : (status === 'PAUSED' && activeAgents === 0) ? 'Agents Ready' : `${activeAgents} Agents Active`}
                        </span>
                    </div>
                </div>

                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

                {/* Ticker / Status Text */}
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    {status === 'WARMUP' && (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Warming up connection pool...</span>
                        </>
                    )}
                    {status === 'ACTIVE_EMPTY' && (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">Buffer depleting - Finding fresh leads...</span>
                        </>
                    )}
                    {status === 'ACTIVE_READY' && (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            System Active. Dialing in background.
                        </span>
                    )}
                    {status === 'PAUSED' && (
                        <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Bot className="w-3 h-3" />
                            Standby Mode. Agents primed and ready.
                        </span>
                    )}
                </div>
            </div>

            {/* Window Indicator - Refactored for Clarity */}
            {currentWindowText && (
                <div className="flex flex-col items-end sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                            <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Booking Window</span>
                    </div>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">
                        {currentWindowText}
                    </span>
                </div>
            )}
        </div>
    )
}

// --- Main Component ---

export function ExecutionPanel({ campaignId, campaignStatus, hasStrategy = true, onStatusChange, onModalStateChange }: ExecutionPanelProps) {
    const { user } = useAuth();
    const [state, setState] = useState<ExecutionState>('IDLE');
    const [activeAgentsList, setActiveAgentsList] = useState<AgentStatus[]>([]);
    const [upcomingLeads, setUpcomingLeads] = useState<UpcomingLead[]>([]); // New State
    const [historyItems, setHistoryItems] = useState<any[]>([]); // New State
    const [readyLeads, setReadyLeads] = useState<ReadyLead[]>([]);
    const [allLeadsByCohort, setAllLeadsByCohort] = useState<Record<string, any[]>>({});
    const [maxConcurrency, setMaxConcurrency] = useState(3);
    const [allEvents, setAllEvents] = useState<any[]>([]); // Consolidated events
    const [isCompleted, setIsCompleted] = useState(false);
    const [completionData, setCompletionData] = useState<any>(null);
    const [executionWindows, setExecutionWindows] = useState<any[]>([]);

    // Window Extension State
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [editingWindows, setEditingWindows] = useState<any[]>([]);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    // Google Calendar Sync State
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; provider?: string }>({ connected: false });
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

    // Modal State
    const [selectedAgent, setSelectedAgent] = useState<{ agent: AgentStatus | null, agentName: string, index: number } | null>(null);
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

    // Track the time of the last manual action (Start/Pause/Resume)
    // This prevents stale prop updates from parent polling from immediately overwriting
    // local optimistic states like WARMUP.
    const lastManualActionTime = useRef<number>(0);

    // Initial State Sync
    useEffect(() => {
        // Guard: If we just performed a manual action (like 'Start'), 
        // give the backend 3 seconds to reflect it before accepting parent prop updates.
        if (Date.now() - lastManualActionTime.current < 3000) {
            return;
        }

        if (campaignStatus === 'IN_PROGRESS' || campaignStatus === 'ACTIVE') {
            if (state === 'IDLE' || state === 'PAUSED') {
                setState('ACTIVE_READY');
            }
        } else if (campaignStatus === 'COMPLETED') {
            if (state !== 'COMPLETED') setState('COMPLETED');
        } else if (campaignStatus === 'SCHEDULED') {
            if (state !== 'SCHEDULED') setState('SCHEDULED');
        } else if (campaignStatus === 'PAUSED') {
            if (state !== 'PAUSED') setState('PAUSED');
        } else if (campaignStatus === 'DRAFT') {
            if (state !== 'IDLE') setState('IDLE');
        }
    }, [campaignStatus, state]);

    // Initial Config Fetch (even if IDLE)
    useEffect(() => {
        const fetchInitialConfig = async () => {
            if (!user) return;
            try {
                const statusData = await api.get(`/execution/campaign/${campaignId}/active-status`);
                // Only update config/leads, don't change status logic yet
                if (statusData.max_concurrency) setMaxConcurrency(statusData.max_concurrency);
                if (statusData.upcoming_leads) {
                    setUpcomingLeads(prev => JSON.stringify(prev) === JSON.stringify(statusData.upcoming_leads) ? prev : statusData.upcoming_leads);
                }
                if (statusData.history) {
                    setHistoryItems(prev => JSON.stringify(prev) === JSON.stringify(statusData.history) ? prev : statusData.history);
                }
                if (statusData.all_leads_by_cohort) {
                    setAllLeadsByCohort(prev => JSON.stringify(prev) === JSON.stringify(statusData.all_leads_by_cohort) ? prev : statusData.all_leads_by_cohort);
                }
                if (statusData.execution_windows) {
                    setExecutionWindows(prev => JSON.stringify(prev) === JSON.stringify(statusData.execution_windows) ? prev : statusData.execution_windows);
                }
            } catch (error) {
                console.error("Failed to fetch initial execution config", error);
            }
        };
        fetchInitialConfig();
    }, [campaignId, user]);

    // Notify parent when schedule modal state changes (for polling guard)
    useEffect(() => {
        if (onModalStateChange) {
            onModalStateChange(isExtendModalOpen);
        }
    }, [isExtendModalOpen, onModalStateChange]);

    // Calendar Status Fetch
    const fetchCalendarStatus = async () => {
        if (!user) return;
        try {
            const status = await api.get('/intelligence/calendar/status');
            setCalendarStatus(status);
        } catch (error) {
            console.error("Failed to fetch calendar status", error);
        }
    };

    useEffect(() => {
        fetchCalendarStatus();
    }, [user]);

    const handleConnectCalendar = async () => {
        try {
            const response = await api.get('/intelligence/calendar/google/login');
            if (response.url) {
                window.location.href = response.url;
            }
        } catch (error) {
            toast.error("Failed to initiate calendar connection");
        }
    };


    // --- REAL-TIME UPDATES VIA WEBSOCKET ---
    const { data: wsData, isConnected } = useCampaignWebSocket(campaignId);
    const initialFetchDone = useRef(false);

    // Update WebSocket Effect to handle Events and Next Leads with stability guards
    useEffect(() => {
        if (!wsData) return;

        // 1. Stable Agent Updates (Ignore duration for equality check to prevent layout flickering)
        const normalizeAgents = (agents: any[]) => agents.map(a => ({ ...a, duration: 0 }));
        setActiveAgentsList((prev: AgentStatus[]) => {
            const hasRealChanges = JSON.stringify(normalizeAgents(prev)) !== JSON.stringify(normalizeAgents(wsData.agents || []));
            return JSON.stringify(prev) === JSON.stringify(wsData.agents || []) ? prev : (wsData.agents || []);
        });

        // 2. Upcoming Leads (Buffered) - STRICT equality
        setUpcomingLeads((prev: UpcomingLead[]) => {
            const next = wsData.upcoming_leads || [];
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });

        // 3. Human Queue (Next Leads) - STRICT equality
        if (wsData.next_leads) {
            const leads = wsData.next_leads as ReadyLead[];
            setReadyLeads((prev: ReadyLead[]) => JSON.stringify(prev) === JSON.stringify(leads) ? prev : leads);
        }

        // 4. Mission Control Events - STRICT equality
        if (wsData.events) {
            const events = wsData.events;
            setAllEvents((prev: any[]) => JSON.stringify(prev) === JSON.stringify(events) ? prev : events);
        }

        // 5. History - STRICT equality
        if (wsData.history) {
            setHistoryItems((prev: any[]) => JSON.stringify(prev) === JSON.stringify(wsData.history) ? prev : wsData.history);
        }

        // 6. Cohort Data - STRICT equality
        if (wsData.all_leads_by_cohort) {
            setAllLeadsByCohort((prev: Record<string, any[]>) => JSON.stringify(prev) === JSON.stringify(wsData.all_leads_by_cohort) ? prev : wsData.all_leads_by_cohort);
        }

        // 7. Config/Meta
        setMaxConcurrency(prev => prev === (wsData.max_concurrency || 3) ? prev : (wsData.max_concurrency || 3));

        // 8. Completion Status
        if (wsData.is_completed !== undefined) {
            setIsCompleted((prev: boolean) => prev === wsData.is_completed ? prev : wsData.is_completed);
        }
        if (wsData.completion_data) {
            setCompletionData((prev: any) => JSON.stringify(prev) === JSON.stringify(wsData.completion_data) ? prev : wsData.completion_data);
        }
        if (wsData.execution_windows) {
            const windows = wsData.execution_windows;
            setExecutionWindows((prev: any[]) => JSON.stringify(prev) === JSON.stringify(windows) ? prev : windows);
        }

        // 9. Status Sync
        if (wsData.campaign_status) {
            const isRecentAction = Date.now() - lastManualActionTime.current < 3000;
            if (!isRecentAction) {
                if (wsData.campaign_status === 'PAUSED' && state !== 'PAUSED') {
                    setState('PAUSED');
                    onStatusChange('PAUSED');
                } else if (wsData.campaign_status === 'COMPLETED' && state !== 'COMPLETED') {
                    setState('COMPLETED');
                    onStatusChange('COMPLETED');
                } else if ((wsData.campaign_status === 'ACTIVE' || wsData.campaign_status === 'IN_PROGRESS') && state === 'IDLE') {
                    setState('ACTIVE_READY');
                    onStatusChange(wsData.campaign_status);
                }
            }
        }

        if (state === 'WARMUP' && (wsData.agents || []).length > 0) {
            setState('ACTIVE_READY');
        }
    }, [wsData, state, onStatusChange]);

    // Initial Fetch for Human Queue & Events (Only if not already fetched or connected)
    useEffect(() => {
        const fetchInitialSideData = async () => {
            if (state === 'IDLE' || isConnected || initialFetchDone.current) return;
            if (!user) return;

            try {
                initialFetchDone.current = true;
                const [leadsData, eventsData] = await Promise.all([
                    api.get(`/execution/campaign/${campaignId}/next-leads`),
                    api.get(`/execution/campaign/${campaignId}/events`)
                ]);

                setReadyLeads(prev => JSON.stringify(prev) === JSON.stringify(leadsData || []) ? prev : (leadsData || []));
                setAllEvents(prev => JSON.stringify(prev) === JSON.stringify(eventsData || []) ? prev : (eventsData || []));
            } catch (error) {
                console.error("Failed to fetch initial side data", error);
            }
        };

        if (state !== 'IDLE' && state !== 'COMPLETED' && state !== 'SCHEDULED' && !isConnected) {
            fetchInitialSideData();
        }
    }, [state, campaignId, user, isConnected]);

    // Helper to check if current time is within any execution window (with 2 min grace)
    const checkIsWithinWindow = () => {
        if (!executionWindows || executionWindows.length === 0) return true; // Fail open if no windows (or rely on backend)

        const now = new Date();
        const isValid = executionWindows.some(w => {
            try {
                // Format: { day: "YYYY-MM-DD", start: "HH:mm", end: "HH:mm" }
                const startDt = parseISO(`${w.day}T${w.start}`);
                const endDt = parseISO(`${w.day}T${w.end}`);

                // 2-minute grace period (match backend)
                const effectiveStart = new Date(startDt.getTime() - 2 * 60 * 1000);

                return now >= effectiveStart && now <= endDt;
            } catch (e) {
                console.warn("Invalid window format", w);
                return false;
            }
        });

        console.log("[Execution] Window check:", isValid, "Windows:", executionWindows, "Now:", now);
        return isValid;
    };


    const handleStartSession = async () => {
        if (!user) return;
        lastManualActionTime.current = Date.now();

        // Pre-validate execution window
        // Force a check against the local data first
        if (!checkIsWithinWindow()) {
            console.log("[Execution] Opening extension modal due to expired window");
            setPendingAction(() => handleStartSession);
            // Ensure we pass a clean copy of the windows
            setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
            setIsExtendModalOpen(true);
            return;
        }

        try {
            // Use pause endpoint to initialize the session in standby mode
            // This ensures agents "spin up" (buffer fills) but don't start dialing
            const response = await api.post(`/execution/campaign/${campaignId}/pause`);

            // Immediate State Hydration: Update all atoms with fresh data from response
            if (response && response.data) {
                const statusData = response.data;
                if (statusData.agents) setActiveAgentsList(statusData.agents);
                if (statusData.upcoming_leads) setUpcomingLeads(statusData.upcoming_leads);
                if (statusData.history) setHistoryItems(statusData.history);
                if (statusData.all_leads_by_cohort) setAllLeadsByCohort(statusData.all_leads_by_cohort);
                if (statusData.events) setAllEvents(statusData.events);
                if (statusData.next_leads) setReadyLeads(statusData.next_leads);
            }

            toast.success("AI Agents Initialized", {
                description: "Session is ready. Agents are standing by and lead buffer is being prepared."
            });
            onStatusChange('PAUSED');
            setState('PAUSED');
        } catch (e: any) {
            // Robust error checking for window expiration
            const errorMsg = e.message || "";
            const detailMsg = e.response?.data?.detail;

            const isWindowError =
                errorMsg.toLowerCase().includes("execution window") ||
                (typeof detailMsg === 'string' && detailMsg.toLowerCase().includes("execution window"));

            if (isWindowError) {
                // If it somehow bypassed the frontend check, handle it gracefully
                console.log("[Execution] Backend reported window error. Opening modal.");
                setPendingAction(() => handleStartSession);
                setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
                setIsExtendModalOpen(true);
            } else {
                console.error("Failed to start session", e);
                toast.error("Failed to initialize session");
            }
        }
    };

    const handlePauseSession = async () => {
        if (!user) return;
        lastManualActionTime.current = Date.now();
        try {
            await api.post(`/execution/campaign/${campaignId}/pause`);
            onStatusChange('PAUSED');
            setState('PAUSED');
        } catch (e) {
            console.error("Failed to pause session", e);
        }
    };

    const handleResumeSession = async () => {
        if (!user) return;
        lastManualActionTime.current = Date.now();

        // Pre-validate execution window
        if (!checkIsWithinWindow()) {
            console.log("[Execution] Resume blocked: Opening extension modal due to expired window");
            setPendingAction(() => handleResumeSession);
            setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
            setIsExtendModalOpen(true);
            return;
        }

        try {
            // Re-use start endpoint to resume
            await api.post(`/execution/campaign/${campaignId}/start`);
            onStatusChange('IN_PROGRESS');
            setState('ACTIVE_READY');
        } catch (e: any) {
            const errorMsg = e.message || "";
            const detailMsg = e.response?.data?.detail;

            const isWindowError =
                errorMsg.toLowerCase().includes("execution window") ||
                (typeof detailMsg === 'string' && detailMsg.toLowerCase().includes("execution window"));

            if (isWindowError) {
                console.log("[Execution] Backend blocked resume: Window error");
                setPendingAction(() => handleResumeSession);
                setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
                setIsExtendModalOpen(true);
            } else {
                console.error("Failed to resume session", e);
                toast.error("Failed to resume session");
            }
        }
    };

    const handleResetCampaign = async () => {
        if (!user) return;
        lastManualActionTime.current = Date.now();
        try {
            const response = await api.post(`/execution/campaign/${campaignId}/reset`);

            toast.success("Campaign Reset", {
                description: "All failures have been cleared. Agents are ready to start fresh."
            });

            // Immediate Optimistic Update from Response Data
            // The backend returns full status data in 'data' field
            if (response && response.data) {
                const statusData = response.data;

                // Update all state atoms
                if (statusData.agents) setActiveAgentsList(statusData.agents);
                if (statusData.upcoming_leads) setUpcomingLeads(statusData.upcoming_leads);
                if (statusData.history) setHistoryItems(statusData.history);
                if (statusData.all_leads_by_cohort) setAllLeadsByCohort(statusData.all_leads_by_cohort);

                // Reset completion flags
                setIsCompleted(false);
                setCompletionData(null);
            }

            setState('PAUSED');
            onStatusChange('PAUSED');
        } catch (e) {
            console.error("Failed to reset campaign", e);
            toast.error("Failed to reset campaign");
        }
    };

    const handleSaveSchedule = async () => {
        setIsExtending(true);
        try {
            // Update Campaign Settings with new windows
            await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                execution_windows: editingWindows
            });

            // Trigger calendar sync if connected
            if (calendarStatus.connected) {
                try {
                    const syncRes = await api.post(`/intelligence/campaigns/${campaignId}/calendar-sync`);
                    const count = syncRes.events_created || 0;
                    toast.success("Schedule Updated & Synced", {
                        description: `Saved ${editingWindows.length} windows and created ${count} calendar events.`
                    });
                } catch (syncErr) {
                    console.error("Calendar sync failed", syncErr);
                    toast.warning("Schedule Saved, but Calendar Sync Failed", {
                        description: "Your execution windows are updated, but we couldn't block your calendar."
                    });
                }
            } else {
                toast.success("Schedule Updated", {
                    description: "Campaign execution windows have been saved."
                });
            }

            setIsExtendModalOpen(false);

            // Auto-retry the action that failed
            if (pendingAction) {
                toast.info("Auto-starting session...", { duration: 2000 });
                await pendingAction();
                setPendingAction(null);
            }
        } catch (e) {
            console.error("Failed to update schedule", e);
            toast.error("Failed to update execution schedule");
        } finally {
            setIsExtending(false);
        }
    };

    const handleLeadAction = async (action: 'approve' | 'reschedule', leadId: string) => {
        try {
            if (action === 'approve') {
                await api.patch(`/execution/lead/${leadId}/approve`);
                toast.success("Lead Approved", {
                    description: "Moving to scheduled queue.",
                });
            } else {
                toast.info("Reschedule clicked", {
                    description: "Manual rescheduling interface coming soon.",
                });
            }
        } catch (error) {
            toast.error("Action Failed", {
                description: "Could not update lead status.",
            });
        }
    };

    // Derived active count
    const activeCount = activeAgentsList.length;

    // Helper check for active states to keep return JSX clean
    const isExecutionActive = ['WARMUP', 'ACTIVE_EMPTY', 'ACTIVE_READY', 'IN_CALL', 'OUTCOME', 'PAUSED', 'COMPLETED'].includes(state);

    // Mission Control Feed Filtering
    const [viewMode, setViewMode] = useState<'live' | 'all'>('live');
    const [feedClearedAt, setFeedClearedAt] = useState<number>(0);

    // Initialize from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(`unclutr_feed_cleared_at_${campaignId}`);
        if (stored) {
            setFeedClearedAt(parseInt(stored, 10));
        }
    }, [campaignId]);

    const filteredEvents = useMemo(() => {
        if (viewMode === 'all') return allEvents;
        if (!feedClearedAt) return allEvents;
        return allEvents.filter(e => new Date(e.timestamp).getTime() > feedClearedAt);
    }, [allEvents, feedClearedAt, viewMode]);

    const handleClearFeed = () => {
        const now = Date.now();
        setFeedClearedAt(now);
        localStorage.setItem(`unclutr_feed_cleared_at_${campaignId}`, now.toString());
        toast.success("Feed Cleared", {
            description: "Mission Control Feed has been reset locally."
        });
    };

    return (
        <AnimatePresence>
            {/* IDLE STATE: Hero Card (Ready to Execute) */}
            {state === 'IDLE' && (
                <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative w-full overflow-hidden rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl shadow-indigo-500/10"
                >
                    {/* Background Gradients */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

                    <div className="relative z-10 px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1 space-y-8 max-w-2xl">
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 animate-pulse" />
                                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50 dark:ring-indigo-900/20">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
                                </motion.div>

                                <div>
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight leading-[1.1]"
                                    >
                                        {hasStrategy ? (
                                            <>Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Execute?</span></>
                                        ) : (
                                            <>Strategy <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400">Required</span></>
                                        )}
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-lg"
                                    >
                                        {hasStrategy ? (
                                            <>Initializing this session will spin up <span className="font-bold text-zinc-900 dark:text-zinc-200 border-b-2 border-indigo-500/20">{maxConcurrency} AI Agents</span> to autonomously dial, qualify, and transfer high-intent prospects from your list.</>
                                        ) : (
                                            <>Your campaign leads have changed. You must re-configure your <span className="font-bold text-zinc-900 dark:text-zinc-200 border-b-2 border-amber-500/20">Campaign Strategy</span> (cohorts and targets) before executing.</>
                                        )}
                                    </motion.p>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center gap-6"
                            >
                                <div className="flex -space-x-3">
                                    {Array.from({ length: maxConcurrency }).map((_, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                                            <Bot className="w-5 h-5 text-zinc-400" />
                                            <div className="absolute inset-0 bg-indigo-500/10" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-950 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                        +{maxConcurrency}
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-zinc-400">Agents typically connect in &lt; 2 mins</span>
                            </motion.div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <Button
                                size="lg"
                                onClick={handleStartSession}
                                disabled={!hasStrategy}
                                className={cn(
                                    "relative h-20 px-12 text-xl rounded-full transition-all shadow-2xl font-bold flex items-center gap-4 overflow-hidden",
                                    hasStrategy
                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 hover:scale-[1.02] shadow-indigo-500/20"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed grayscale shadow-none"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                    hasStrategy ? "bg-white/10" : "bg-black/5 dark:bg-white/5"
                                )}>
                                    <Play className={cn("w-6 h-6 fill-current", !hasStrategy && "opacity-20")} />
                                </div>
                                {hasStrategy ? "Start Session" : "Update Strategy"}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* SCHEDULED STATE */}
            {state === 'SCHEDULED' && (
                <motion.div
                    key="scheduled"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full bg-orange-50/50 dark:bg-orange-950/10 rounded-[32px] border border-orange-200/60 dark:border-orange-900/30 p-8 shadow-sm flex items-center justify-between"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1">Scheduled for Execution</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                Campaign is queued to start automatically. Agents will spin up at the designated time.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="h-14 px-8 text-base rounded-full border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-bold"
                    >
                        View Schedule
                    </Button>
                </motion.div>
            )}

            {/* COMPLETED banner removed in favor of AgentIntelligenceDashboard Trophy Screen */}

            {/* BUSY STATES (Warmup, Active, Paused) */}
            {isExecutionActive && (
                <motion.div
                    key="active"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-2xl shadow-indigo-500/5"
                >
                    {/* Header Bar: Controls + Activity */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={state === 'PAUSED' ? handleResumeSession : handlePauseSession}
                            className="h-12 w-12 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 shrink-0"
                        >
                            {state === 'PAUSED' ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                        </Button>

                        <div className="flex-1">
                            <AgentActivityBar status={state} activeAgents={activeCount} executionWindows={executionWindows} />
                        </div>
                    </div>

                    {/* Pipeline View: 2 Queues */}
                    <div className="flex flex-col gap-6 mb-6">

                        {/* 0. INTELLIGENCE DASHBOARD (Added Section) */}
                        <div className="mb-8">
                            <AgentIntelligenceDashboard
                                activeAgents={activeAgentsList}
                                upcomingLeads={upcomingLeads}
                                historyItems={historyItems}
                                allLeadsByCohort={allLeadsByCohort}
                                allEvents={allEvents}
                                isCompleted={isCompleted}
                                isPaused={state === 'PAUSED'}
                                completionData={completionData}
                                onReset={handleResetCampaign}
                                onLeadAction={handleLeadAction}
                                className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200/50 dark:border-zinc-800/50 min-h-[500px]"
                            />
                        </div>

                        {/* 1. AGENT QUEUE */}
                        <AgentQueue
                            activeAgents={activeAgentsList}
                            upcomingLeads={upcomingLeads}
                            historyItems={historyItems}
                            events={allEvents} // Pass real-time events for chat bubbles
                            maxConcurrency={maxConcurrency}
                            onAgentClick={(agent, agentName, index) => {
                                setSelectedAgent({ agent, agentName, index });
                                setIsAgentModalOpen(true);
                            }}
                            onViewFullQueue={() => setIsQueueModalOpen(true)}
                            onLeadAction={handleLeadAction}
                        />

                        {/* Visual Connector / Flow Indicator */}
                        <div className="flex justify-center -my-2 relative z-10 opacity-50">
                            <div className="bg-zinc-200 dark:bg-zinc-800 rounded-full p-1.5 border-4 border-white dark:border-zinc-950">
                                <ArrowRight className="w-4 h-4 text-zinc-400 rotate-90" />
                            </div>
                        </div>

                        {/* 2. HUMAN QUEUE */}
                        <HumanQueue
                            leads={readyLeads}
                            maxCapacity={3}
                            onCallClick={(lead) => {
                                console.log("Call clicked for", lead);
                                // TODO: Trigger call handler
                            }}
                        />
                    </div>

                    {/* Mission Control Feed (BTS) */}
                    <ExecutionFeed
                        campaignId={campaignId}
                        isActive={state !== 'PAUSED' && state !== 'IDLE'}
                        events={filteredEvents} // Pass filtered events
                        onClear={handleClearFeed}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    {/* Agent Live Update Modal */}
                    <AgentLiveUpdateModal
                        isOpen={isAgentModalOpen}
                        onClose={() => setIsAgentModalOpen(false)}
                        agent={selectedAgent?.agent || null}
                        agentName={selectedAgent?.agentName || ""}
                        index={selectedAgent?.index ?? 0}
                        events={allEvents.filter(e => e.agent_name === (selectedAgent?.agent?.agent_name || selectedAgent?.agentName))} // Filtering real events
                    />

                    {/* Full Queue Intelligence Modal */}
                    <AgentQueueModal
                        isOpen={isQueueModalOpen}
                        onClose={() => setIsQueueModalOpen(false)}
                        activeAgents={activeAgentsList}
                        upcomingLeads={upcomingLeads}
                        historyItems={historyItems}
                        allLeadsByCohort={allLeadsByCohort}
                        allEvents={allEvents}
                        isPaused={state === 'PAUSED'}
                        onReset={handleResetCampaign}
                        onLeadAction={handleLeadAction}
                    />

                    {/* Persistent Call Logs */}
                    <div className="mt-8">
                        <CallLogTable campaignId={campaignId} />
                    </div>
                </motion.div>
            )}

            <AnimatePresence>
                {isExtendModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isExtending && setIsExtendModalOpen(false)}
                            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
                            className="relative w-full max-w-2xl overflow-hidden rounded-[40px] border border-white/20 dark:border-white/5 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl shadow-[0_30px_100px_-10px_rgba(0,0,0,0.3)] p-1"
                        >
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent opacity-50" />

                            <div className="p-8 md:p-10 space-y-8">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-500/20 dark:to-violet-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm">
                                            <Clock className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Update Schedule</h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                                                Your campaign is currently outside its execution window.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isExtending}
                                        onClick={() => setIsExtendModalOpen(false)}
                                        className="w-12 h-12 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                                    >
                                        <X className="w-6 h-6 text-zinc-400" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Windows</label>
                                            {calendarStatus.connected ? (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Google Calendar Synced</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Calendar Not Connected</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!calendarStatus.connected && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleConnectCalendar}
                                                    className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full px-4 h-8 gap-2 border border-indigo-100 dark:border-indigo-900/40"
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    Connect to Block
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => {
                                                    const now = new Date();
                                                    const day = format(now, 'yyyy-MM-dd');
                                                    const start = format(now, 'HH:00');
                                                    const endDt = new Date(now);
                                                    endDt.setHours(endDt.getHours() + 1);
                                                    const end = format(endDt, 'HH:00');

                                                    setEditingWindows([...editingWindows, { day, start, end }]);
                                                }}
                                                className="text-[10px] font-black uppercase tracking-wider text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full px-4 h-8 gap-2 shadow-lg shadow-indigo-500/20"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Window
                                            </Button>
                                        </div>
                                    </div>

                                    {!calendarStatus.connected && editingWindows.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20"
                                        >
                                            <div className="flex gap-3">
                                                <div className="shrink-0 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-black text-amber-900 dark:text-amber-100 uppercase tracking-wider">Warning</span>
                                                    <p className="text-[11px] font-bold text-amber-800/80 dark:text-amber-200/60 leading-relaxed">
                                                        Google Calendar is not connected. These windows will NOT be automatically blocked in your calendar.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                        {editingWindows.length === 0 ? (
                                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem] bg-zinc-50/50 dark:bg-black/20">
                                                <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                                                <p className="text-sm font-bold text-zinc-400">No windows scheduled</p>
                                            </div>
                                        ) : (
                                            <AnimatePresence>
                                                {editingWindows.map((window, i) => (
                                                    <TimeWindowSelector
                                                        key={i}
                                                        day={window.day}
                                                        start={window.start}
                                                        end={window.end}
                                                        allWindows={editingWindows}
                                                        currentIndex={i}
                                                        onChange={(updates) => {
                                                            const newW = [...editingWindows];
                                                            newW[i] = { ...newW[i], ...updates };
                                                            setEditingWindows(newW);
                                                        }}
                                                        onDelete={() => {
                                                            setEditingWindows(editingWindows.filter((_, idx) => idx !== i));
                                                        }}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-4">
                                    <Button
                                        onClick={handleSaveSchedule}
                                        disabled={isExtending || editingWindows.length === 0}
                                        className="h-16 rounded-[1.5rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-lg hover:scale-[1.02] shadow-2xl shadow-indigo-500/20 active:scale-[0.98] transition-all gap-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                        {isExtending ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Save Schedule & Start Session
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                                        Agents will begin dialing immediately after save
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
}
