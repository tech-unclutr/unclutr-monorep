// ... imports
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, parseISO, isWithinInterval, parse } from 'date-fns';
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
    X,
    AlertTriangle,
    Target
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn, parseAsUTC } from "@/lib/utils";
// import { ActiveAgentCard } from "./ActiveAgentCard"; // Replaced
// import { ExecutionFeed } from "./ExecutionFeed";
import { AgentQueue, AgentStatus, UpcomingLead } from "./AgentQueue";
import { AgentLiveUpdateModal } from "./AgentLiveUpdateModal";
import { AgentQueueModal } from "./AgentQueueModal";
import AgentIntelligenceDashboard from "./AgentIntelligenceDashboard";
import CallLogTable from "./CallLogTable";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useCampaignWebSocket } from "@/hooks/use-campaign-websocket";
import { TimeWindowSelector } from "./TimeWindowSelector";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { UserActionPanel } from "./UserActionPanel";
import { CallStatusDialog } from "./CallStatusDialog";
import { CallContextModal } from "./CallContextModal";

// --- Types ---

type ExecutionState = 'IDLE' | 'WARMUP' | 'ACTIVE_EMPTY' | 'ACTIVE_READY' | 'IN_CALL' | 'OUTCOME' | 'PAUSED' | 'ERROR' | 'COMPLETED' | 'SCHEDULED';

interface ExecutionPanelProps {
    campaignId: string;
    campaignStatus: string; // DRAFT, IN_PROGRESS, etc.
    hasStrategy?: boolean;
    wasLeadsUpdated?: boolean;
    onStatusChange: (newStatus: string) => void;
    onModalStateChange?: (isOpen: boolean) => void; // Notify parent when schedule modal opens/closes
    onEditStrategy?: () => void;
    onScheduleUpdate?: (windows: any[]) => void;
}

// --- Sub-components ---

const AgentActivityBar = ({ status, activeAgents, executionWindows }: { status: ExecutionState, activeAgents: number, executionWindows?: any[] }) => {
    // Determine current window text
    const currentWindowText = useMemo(() => {
        if (!executionWindows || executionWindows.length === 0) return "No Upcoming Windows";

        const now = new Date();
        let currentWindow: any = null;
        let upcomingWindows: any[] = [];

        // 1. Parse and Categorize
        executionWindows.forEach(w => {
            try {
                // Construct Date objects for valid comparison
                // Assuming w.day is YYYY-MM-DD
                const startDt = parseISO(`${w.day}T${w.start}`);
                const endDt = parseISO(`${w.day}T${w.end}`);

                // Check for Current (Active)
                // We add a small grace period if needed, but strict interval is safer for "Next" logic
                if (isWithinInterval(now, { start: startDt, end: endDt })) {
                    currentWindow = w;
                }
                // Check for Upcoming
                else if (startDt > now) {
                    upcomingWindows.push({ ...w, _startDt: startDt });
                }
            } catch (e) {
                console.warn("Invalid window processing", w);
            }
        });

        // 2. Selection Logic
        let targetWindow: any = currentWindow;

        if (!targetWindow) {
            // Find earliest upcoming
            if (upcomingWindows.length > 0) {
                // Sort by start date ascending
                upcomingWindows.sort((a, b) => a._startDt.getTime() - b._startDt.getTime());
                targetWindow = upcomingWindows[0];
            }
        }

        // 3. Formatting
        if (targetWindow) {
            try {
                const startDt = parseISO(`${targetWindow.day}T${targetWindow.start}`);
                const endDt = parseISO(`${targetWindow.day}T${targetWindow.end}`);

                let dayStr = format(startDt, 'MMM d');
                if (isToday(startDt)) dayStr = 'Today';
                else if (isTomorrow(startDt)) dayStr = 'Tomorrow';

                const timeStr = `${format(startDt, 'h:mm a')} - ${format(endDt, 'h:mm a')}`;
                return `${dayStr}, ${timeStr}`;
            } catch (e) {
                return `${targetWindow.day} ${targetWindow.start}`;
            }
        }

        return "No Upcoming Windows";
    }, [executionWindows]);

    return (
        <div className="flex items-center justify-between bg-zinc-900/5 dark:bg-zinc-50/5 rounded-xl px-4 py-3 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Bot className="w-5 h-5 text-orange-500" />
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
                        <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
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
                        <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
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

export function ExecutionPanel({ campaignId, campaignStatus, hasStrategy = true, wasLeadsUpdated = false, onStatusChange, onModalStateChange, onEditStrategy, onScheduleUpdate }: ExecutionPanelProps) {
    const { user, companyId: authCompanyId, loading: authLoading } = useAuth();
    console.log("DEBUG: ExecutionPanel Render", { campaignId, campaignStatus, hasStrategy, wasLeadsUpdated });
    const [state, setState] = useState<ExecutionState>('IDLE');
    const [activeAgentsList, setActiveAgentsList] = useState<AgentStatus[]>([]);
    const [upcomingLeads, setUpcomingLeads] = useState<UpcomingLead[]>([]); // New State
    const [historyItems, setHistoryItems] = useState<any[]>([]); // New State
    const [readyLeads, setReadyLeads] = useState<any[]>([]);
    const [allLeadsByCohort, setAllLeadsByCohort] = useState<Record<string, any[]>>({});
    const [maxConcurrency, setMaxConcurrency] = useState(2);
    const [allEvents, setAllEvents] = useState<any[]>([]); // Consolidated events
    const [isCompleted, setIsCompleted] = useState(false);
    const [isExhausted, setIsExhausted] = useState(false); // [NEW] Track exhausted state
    const [isInitializationRequiredAlertOpen, setIsInitializationRequiredAlertOpen] = useState(false);
    const [completionData, setCompletionData] = useState<any>(null);
    const [executionWindows, setExecutionWindows] = useState<any[]>([]);

    // Window Extension State
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [editingWindows, setEditingWindows] = useState<any[]>([]);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    // Google Calendar Sync State
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; provider?: string }>({ connected: false });
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);


    // Modal State
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [selectedAgentFallback, setSelectedAgentFallback] = useState<{ name: string, index: number, leadId?: string, leadName?: string } | null>(null); // For when agent disconnects
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [isOutsideWindowAlertOpen, setIsOutsideWindowAlertOpen] = useState(false);
    const [showWarningView, setShowWarningView] = useState(false);
    const [isStrategyMissingAlertOpen, setIsStrategyMissingAlertOpen] = useState(false); // New Alert State

    // User Queue Modal State
    const [selectedUserQueueItem, setSelectedUserQueueItem] = useState<any>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [userQueueRefreshTrigger, setUserQueueRefreshTrigger] = useState<number>(0);
    const [contextLead, setContextLead] = useState<{ id: string, item_id: string, name: string } | null>(null);
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [activeTriggerContactId, setActiveTriggerContactId] = useState<string | null>(null);
    const [hasStartedSession, setHasStartedSession] = useState(false); // New: Track if user clicked Play in this session

    // Track the time of the last manual action (Start/Pause/Resume)
    // This prevents stale prop updates from parent polling from immediately overwriting
    // local optimistic states like WARMUP.
    const lastManualActionTime = useRef<number>(0);
    const bypassNextWindowCheck = useRef<boolean>(false);

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
    const refreshCampaignData = React.useCallback(async () => {
        if (!user || !authCompanyId) return;
        try {
            const statusData = await api.get(`/execution/campaign/${campaignId}/active-status`, { "X-Company-ID": authCompanyId });
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
    }, [campaignId, user, authCompanyId]);

    useEffect(() => {
        refreshCampaignData();
    }, [refreshCampaignData]);

    // Notify parent when schedule modal state changes (for polling guard)
    useEffect(() => {
        if (onModalStateChange) {
            onModalStateChange(isExtendModalOpen);
        }
    }, [isExtendModalOpen, onModalStateChange]);

    // Calendar Status Fetch
    const fetchCalendarStatus = async () => {
        if (!user || !authCompanyId) return;
        try {
            const status = await api.get('/intelligence/calendar/status', { "X-Company-ID": authCompanyId });
            setCalendarStatus(status);
        } catch (error) {
            console.error("Failed to fetch calendar status", error);
        }
    };

    useEffect(() => {
        fetchCalendarStatus();
    }, [user, authCompanyId]);

    const handleConnectCalendar = async () => {
        try {
            const response = await api.get('/intelligence/calendar/google/login', { "X-Company-ID": authCompanyId });
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

    // [STABILITY] Lane Mapping Logic
    // We map agent_id (or synthetic pending-id) to a fixed lane index [0...maxConcurrency-1]
    const laneMap = useRef<Map<string, number>>(new Map());

    // Update WebSocket Effect to handle Events and Next Leads with stability guards
    useEffect(() => {
        if (!wsData) return;

        // 1. Stable Agent Updates with Lane Mapping
        const newAgents = wsData.agents || [];
        const currentLaneMap = laneMap.current;

        // A. Remove stale agents from laneMap
        const activeIds = new Set(newAgents.map((a: AgentStatus) => a.agent_id));
        for (const id of currentLaneMap.keys()) {
            if (!activeIds.has(id)) {
                currentLaneMap.delete(id);
            }
        }

        // B. Assign new agents to empty lanes
        const occupiedLanes = new Set(currentLaneMap.values());
        newAgents.forEach((agent: AgentStatus) => {
            if (!currentLaneMap.has(agent.agent_id)) {
                // Find first free lane
                for (let i = 0; i < maxConcurrency; i++) {
                    if (!occupiedLanes.has(i)) {
                        currentLaneMap.set(agent.agent_id, i);
                        occupiedLanes.add(i);
                        break;
                    }
                }
            }
        });

        // C. Construct Padded Array (length maxConcurrency)
        const paddedAgents: (AgentStatus | null)[] = new Array(maxConcurrency).fill(null);
        newAgents.forEach((agent: AgentStatus) => {
            const lane = currentLaneMap.get(agent.agent_id);
            if (lane !== undefined && lane < maxConcurrency) {
                paddedAgents[lane] = agent;
            }
        });

        // D. Final Update (Filter out nulls for now if legacy components expect clean array, 
        // but we'll update them to handle nulls for true stability)
        // Actually, we WANT the nulls so the indices are stable in the map() call.
        setActiveAgentsList(paddedAgents as AgentStatus[]);

        // 2. Upcoming Leads (Buffered) - STRICT equality
        setUpcomingLeads((prev: UpcomingLead[]) => {
            const next = wsData.upcoming_leads || [];
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });

        // 3. Human Queue (Next Leads) - STRICT equality
        if (wsData.next_leads) {
            const leads = wsData.next_leads;
            setReadyLeads((prev: any[]) => JSON.stringify(prev) === JSON.stringify(leads) ? prev : leads);
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
        setMaxConcurrency(prev => prev === (wsData.max_concurrency || 2) ? prev : (wsData.max_concurrency || 2));

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

        // 10. User Queue & History Sync
    }, [wsData, state, onStatusChange]);

    // 10. User Queue & History Sync - Separated to stabilize dependencies
    useEffect(() => {
        if (wsData?.event === 'user_queue_update') {
            refreshCampaignData();
            setUserQueueRefreshTrigger(Date.now());
        }
    }, [wsData?.event, refreshCampaignData]);

    // [NEW] Fallback: Fetch completion data via REST API if WebSocket fails
    useEffect(() => {
        const fetchCompletionDataFallback = async () => {
            if (!user || !authCompanyId) return;

            // Only fetch if campaign is completed but we don't have completion data
            if ((isCompleted || campaignStatus === 'COMPLETED') && !completionData) {
                try {
                    const data = await api.get(`/execution/campaign/${campaignId}/completion-data`, { "X-Company-ID": authCompanyId });
                    if (data && Object.keys(data).length > 0) {
                        setCompletionData(data);
                    }
                } catch (error) {
                    console.error('[ExecutionPanel] Failed to fetch completion data:', error);
                }
            }
        };

        fetchCompletionDataFallback();
    }, [isCompleted, campaignStatus, completionData, campaignId, user, authCompanyId]);

    // Auto-Pause Logic: Automatically pause campaign when completed or targets achieved to preserve credits
    useEffect(() => {
        const autoPauseOnCompletion = async () => {
            const isTargetAchieved = completionData ? completionData.total_completed >= completionData.total_targets : false;

            if ((isCompleted || isTargetAchieved) && (state === 'ACTIVE_READY' || state === 'IN_CALL' || state === 'WARMUP')) {
                try {
                    await handlePauseSession();
                } catch (e) {
                    console.error("Failed to auto-pause on completion/target hit", e);
                }
            }
        };
        autoPauseOnCompletion();
    }, [isCompleted, completionData, state]);

    // Initial Fetch for Human Queue & Events (Only if not already fetched or connected)
    useEffect(() => {
        const fetchInitialSideData = async () => {
            if (state === 'IDLE' || isConnected || initialFetchDone.current) return;
            if (!user || !authCompanyId) return;

            try {
                initialFetchDone.current = true;
                const [leadsData, eventsData] = await Promise.all([
                    api.get(`/execution/campaign/${campaignId}/next-leads`, { "X-Company-ID": authCompanyId }),
                    api.get(`/execution/campaign/${campaignId}/events`, { "X-Company-ID": authCompanyId })
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
    }, [state, campaignId, user, authCompanyId, isConnected]);

    // Fix Stale Closure for pending actions
    const executionWindowsRef = useRef(executionWindows);
    useEffect(() => {
        executionWindowsRef.current = executionWindows;
    }, [executionWindows]);

    // Helper to check if current time is within any execution window (with 2 min grace)
    const getActiveWindowStatus = (windows: any[]) => {
        if (!windows || windows.length === 0) return { isInWindow: true, nextWindow: null }; // Fail open if no windows defined

        const now = new Date();
        const graceMins = 2;

        let isInWindow = false;
        let upcomingWindows: any[] = [];

        windows.forEach(w => {
            try {
                const startDt = parseISO(`${w.day}T${w.start}`);
                const endDt = parseISO(`${w.day}T${w.end}`);

                // 2-minute grace period (match backend)
                const effectiveStart = new Date(startDt.getTime() - graceMins * 60 * 1000);

                // 30-minute buffer: If the window ends in less than 30 mins, it's effectively "not active" for new starts
                const minBufferMins = 30;
                const bufferEnd = new Date(endDt.getTime() - minBufferMins * 60 * 1000);

                if (now >= effectiveStart && now <= endDt) {
                    // Only count as "in window" if there's >30 mins remaining
                    if (now < bufferEnd) {
                        isInWindow = true;
                    }
                } else if (effectiveStart > now) {
                    upcomingWindows.push({ ...w, _startDt: effectiveStart });
                }
            } catch (e) {
                console.warn("Invalid window format", w);
            }
        });

        const nextWindow = upcomingWindows.length > 0
            ? upcomingWindows.sort((a, b) => a._startDt.getTime() - b._startDt.getTime())[0]
            : null;

        return { isInWindow, nextWindow };
    };

    const checkIsWithinWindow = () => {
        const { isInWindow } = getActiveWindowStatus(executionWindowsRef.current);
        return isInWindow;
    };


    const handleStartSession = async () => {
        if (!user) return;
        lastManualActionTime.current = Date.now();

        // 1. Block if leads were updated but not finalized
        if (wasLeadsUpdated) {
            setIsInitializationRequiredAlertOpen(true);
            return;
        }

        // 2. Block if campaign is still in DRAFT
        if (campaignStatus === 'DRAFT') {
            setIsInitializationRequiredAlertOpen(true);
            return;
        }

        // 3. Pre-validate execution window
        // Force a check against the local data first
        if (!bypassNextWindowCheck.current && !checkIsWithinWindow()) {
            setPendingAction(() => handleStartSession);
            // Ensure we pass a clean copy of the windows
            setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
            setIsExtendModalOpen(true);
            return;
        }

        // Reset bypass if it was used
        bypassNextWindowCheck.current = false;

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
            setHasStartedSession(true);
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
                setPendingAction(() => handleStartSession);
                setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
                setIsExtendModalOpen(true);
            } else if (detailMsg?.toLowerCase().includes("strategy") || errorMsg?.toLowerCase().includes("strategy")) {
                setIsStrategyMissingAlertOpen(true);
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

        // 1. Block if leads were updated but not finalized
        if (wasLeadsUpdated) {
            setIsInitializationRequiredAlertOpen(true);
            return;
        }

        // 2. Block if campaign is still in DRAFT
        if (campaignStatus === 'DRAFT') {
            setIsInitializationRequiredAlertOpen(true);
            return;
        }

        // 3. Pre-validate execution window
        if (!bypassNextWindowCheck.current && !checkIsWithinWindow()) {
            setPendingAction(() => handleResumeSession);
            setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
            setIsExtendModalOpen(true);
            return;
        }

        // Reset bypass if it was used
        bypassNextWindowCheck.current = false;

        try {
            // Re-use start endpoint to resume
            await api.post(`/execution/campaign/${campaignId}/start`);
            setHasStartedSession(true);
            onStatusChange('IN_PROGRESS');
            setState('ACTIVE_READY');
        } catch (e: any) {
            const errorMsg = e.message || "";
            const detailMsg = e.response?.data?.detail;

            const isWindowError =
                errorMsg.toLowerCase().includes("execution window") ||
                (typeof detailMsg === 'string' && detailMsg.toLowerCase().includes("execution window"));

            if (isWindowError) {
                setPendingAction(() => handleResumeSession);
                setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
                setIsExtendModalOpen(true);
            } else if (detailMsg?.toLowerCase().includes("strategy") || errorMsg?.toLowerCase().includes("strategy")) {
                setIsStrategyMissingAlertOpen(true);
            } else {
                console.error("Failed to resume session", e);
                toast.error("Failed to resume session");
            }
        }
    };

    const handleResetCampaign = async () => {
        if (!user) return;
        setIsResetting(true);
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

                // Explicitly update exhausted state if provided
                if (statusData.is_exhausted !== undefined) {
                    setIsExhausted(statusData.is_exhausted);
                }

                // Reset completion flags
                setIsCompleted(false);
                setCompletionData(null);
            }

            setState('PAUSED');
            onStatusChange('PAUSED');
        } catch (e) {
            console.error("Failed to reset campaign", e);
            toast.error("Failed to reset campaign");
        } finally {
            setIsResetting(false);
        }
    };

    // Removed redundant checkIsNowInWindow in favor of getActiveWindowStatus

    const commitSchedule = async (shouldAutoStart: boolean) => {
        setIsExtending(true);
        try {
            // Update Campaign Settings with new windows
            await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                execution_windows: editingWindows
            });

            // OPTIMISTIC UPDATE: Implement immediate UI refresh
            setExecutionWindows(editingWindows);
            executionWindowsRef.current = editingWindows; // Immediate Ref Update

            // Trigger calendar sync if connected
            if (calendarStatus.connected) {
                try {
                    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    await api.post(`/intelligence/campaigns/${campaignId}/calendar-sync`, {
                        timezone: userTimezone
                    });
                    const actuallyStarting = shouldAutoStart && !!pendingAction;
                    toast.success(actuallyStarting ? "Schedule Saved & Starting..." : "Schedule Updated", {
                        description: actuallyStarting ? 'Agents are starting now.' : 'Campaign is queued for the next window.'
                    });
                } catch (syncErr) {
                    console.error("Calendar sync failed", syncErr);
                    toast.warning("Schedule Updated", {
                        description: "Windows saved, but calendar sync failed."
                    });
                }
            } else {
                const actuallyStarting = shouldAutoStart && !!pendingAction;
                toast.success(actuallyStarting ? "Schedule Saved & Starting..." : "Schedule Updated", {
                    description: actuallyStarting ? 'Agents are starting now.' : 'Campaign is queued for the next window.'
                });
            }

            setIsExtendModalOpen(false);
            setIsOutsideWindowAlertOpen(false); // Close alert if open
            setShowWarningView(false); // Reset warning view

            // Notify parent
            if (onScheduleUpdate) {
                onScheduleUpdate(editingWindows);
            }

            // Auto-Start Logic
            if (shouldAutoStart && pendingAction) {
                toast.info("Auto-starting session...", { duration: 2000 });
                bypassNextWindowCheck.current = true;
                await pendingAction();
            }

            // Always clear pending action after commit
            setPendingAction(null);

        } catch (e) {
            console.error("Failed to update schedule", e);
            toast.error("Failed to update execution schedule");
        } finally {
            setIsExtending(false);
        }
    };

    const handleSaveSchedule = () => {
        // 1. Enforce 30-minute minimum duration
        let invalidDuration = 0;
        const invalidSlot = editingWindows.find(w => {
            try {
                const startDt = parseISO(`${w.day}T${w.start}`);
                const endDt = parseISO(`${w.day}T${w.end}`);
                const diffMins = (endDt.getTime() - startDt.getTime()) / (1000 * 60);
                if (diffMins < 30) {
                    invalidDuration = diffMins;
                    return true;
                }
                return false;
            } catch { return true; }
        });

        if (invalidSlot) {
            toast.error("Invalid Slot Duration", {
                description: `Slot is only ${invalidDuration} min. Execution windows must be at least 30 minutes.`
            });
            return;
        }

        const { isInWindow } = getActiveWindowStatus(editingWindows);
        const hasChanges = JSON.stringify(editingWindows) !== JSON.stringify(executionWindows);

        if (isInWindow) {
            // Scene A: Inside window -> Commit & Start immediately
            commitSchedule(true);
        } else {
            // Scene B: Outside window -> Transition to warning view
            setShowWarningView(true);
        }
    };

    const handleLeadAction = async (action: 'approve' | 'reschedule' | 'retry', leadId: string) => {
        try {
            if (action === 'approve') {
                await api.patch(`/execution/lead/${leadId}/approve`);
                toast.success("Lead Approved", {
                    description: "Moving to scheduled queue.",
                });
            } else if (action === 'retry') {
                await api.post(`/execution/campaign/${campaignId}/retry/${leadId}`);
                toast.success("Retry Initiated", {
                    description: "Lead has been re-queued for dialing."
                });
            } else {
                toast.info("Reschedule clicked", {
                    description: "Manual rescheduling interface coming soon.",
                });
            }
        } catch (error) {
            toast.error("Action Failed", {
                description: `Could not ${action === 'retry' ? 'retry' : 'update'} lead status.`,
            });
        }
    };

    // Derived active count (Filter out nulls from stable padded list)
    const activeCount = activeAgentsList.filter(a => a !== null).length;

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
        return allEvents.filter(e => parseAsUTC(e.timestamp).getTime() > feedClearedAt);
    }, [allEvents, feedClearedAt, viewMode]);

    const handleClearFeed = () => {
        const now = Date.now();
        setFeedClearedAt(now);
        localStorage.setItem(`unclutr_feed_cleared_at_${campaignId}`, now.toString());
        toast.success("Feed Cleared", {
            description: "Mission Control Feed has been reset locally."
        });
    };

    const handleReplenishCalls = async () => {
        setIsResetting(true);
        try {
            await api.post(`/execution/campaign/${campaignId}/replenish`);
            toast.success("Replenishing Queue", {
                description: "Short calls (<10s) have been reset and added back.",
            });
        } catch (error) {
            toast.error("Replenish Failed", {
                description: "Could not replenish leads. Please try again.",
            });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {/* IDLE STATE: Hero Card (Ready to Execute) */}
                {state === 'IDLE' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative w-full overflow-hidden rounded-[32px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl shadow-orange-500/10"
                    >
                        {/* Background Gradients */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white dark:from-orange-950/20 dark:via-zinc-950 dark:to-zinc-950 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

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
                                            <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 animate-pulse" />
                                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 ring-4 ring-orange-50 dark:ring-orange-900/20">
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
                                                <>Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-violet-600 dark:from-orange-400 dark:to-violet-400">Execute?</span></>
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
                                                <>Initializing this session will spin up <span className="font-bold text-zinc-900 dark:text-zinc-200 border-b-2 border-orange-500/20">{maxConcurrency} AI Agents</span> to autonomously dial, qualify, and transfer high-intent prospects from your list.</>
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
                                                <div className="absolute inset-0 bg-orange-500/10" />
                                            </div>
                                        ))}
                                        <div className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-950 bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-xs font-bold">
                                            +{maxConcurrency}
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-400">Agents typically connect in &lt; 2 mins</span>
                                </motion.div>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-violet-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                                <Button
                                    size="lg"
                                    onClick={(!hasStrategy || campaignStatus === 'DRAFT') ? onEditStrategy : handleStartSession}
                                    className={cn(
                                        "relative h-20 px-12 text-xl rounded-full transition-all shadow-2xl font-bold flex items-center gap-4 overflow-hidden",
                                        "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 hover:scale-[1.02] shadow-orange-500/20"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-white/10 to-orange-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center bg-white/10"
                                    )}>
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                    {/* Allow Start if READY or PAUSED (anything not DRAFT basically, confirmed by status check logic) */}
                                    {(hasStrategy && campaignStatus !== 'DRAFT') ? "Start Session" : "Finalize Strategy"}
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
                            onClick={() => {
                                setEditingWindows(JSON.parse(JSON.stringify(executionWindows)));
                                setIsExtendModalOpen(true);
                            }}
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
                        className="w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-2xl shadow-orange-500/5"
                    >
                        {/* Header Bar: Controls + Activity */}
                        <div className="flex items-center gap-4 mb-6">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={(state === 'PAUSED' || state === 'COMPLETED') ? handleResumeSession : handlePauseSession}
                                className="h-12 w-12 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 shrink-0"
                            >
                                {(state === 'PAUSED' || state === 'COMPLETED') ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                            </Button>

                            <div className="flex-1">
                                <AgentActivityBar status={state} activeAgents={activeCount} executionWindows={executionWindows} />
                            </div>
                        </div>

                        {/* Pipeline View: 2 Queues */}
                        <div className="flex flex-col gap-6 mb-6">

                            {/* 1. INTELLIGENCE DASHBOARD (Added Section) */}
                            <div className="mb-8">
                                <AgentIntelligenceDashboard
                                    activeAgents={activeAgentsList}
                                    upcomingLeads={upcomingLeads}
                                    historyItems={historyItems}
                                    allLeadsByCohort={allLeadsByCohort}
                                    allEvents={allEvents}
                                    maxConcurrency={maxConcurrency}
                                    isCompleted={state === 'COMPLETED' || isCompleted}
                                    isPaused={state === 'PAUSED'}
                                    isResetting={isResetting}
                                    completionData={completionData}
                                    onReset={handleResetCampaign}
                                    isExhausted={wsData?.is_exhausted}
                                    onReplenish={handleReplenishCalls}
                                    onLeadAction={handleLeadAction}
                                    onUserQueueRefresh={() => setUserQueueRefreshTrigger(Date.now())}
                                    feedEvents={filteredEvents}
                                    onClearFeed={handleClearFeed}
                                    feedViewMode={viewMode}
                                    onFeedViewModeChange={setViewMode}
                                    className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200/50 dark:border-zinc-800/50 min-h-[500px]"
                                />
                            </div>

                            {/* 0. USER ACTION PIPELINE (Replaces HumanQueue) */}
                            <div className="mb-6">
                                <UserActionPanel
                                    campaignId={campaignId}
                                    campaignStatus={state === 'ACTIVE_READY' || state === 'WARMUP' || state === 'IN_CALL' ? 'ACTIVE' : 'PAUSED'}
                                    isStarted={state !== 'PAUSED'}
                                    refreshTrigger={userQueueRefreshTrigger}
                                    historyItems={historyItems}
                                    maxConcurrency={maxConcurrency}
                                    onStart={handleResumeSession}
                                    triggerContactId={activeTriggerContactId}
                                    onCallClick={(item) => {
                                        setSelectedUserQueueItem(item);
                                        setIsStatusDialogOpen(true);
                                    }}
                                    onContextClick={(item) => {
                                        setContextLead({
                                            id: item.lead_id,
                                            item_id: item.id,
                                            name: item.lead_name
                                        });
                                        setIsContextModalOpen(true);
                                    }}
                                />
                            </div>

                            {/* Visual Connector / Flow Indicator HIDDEN */}
                            {/* <div className="flex justify-center -my-2 relative z-10 opacity-50">
                                <div className="bg-zinc-200 dark:bg-zinc-800 rounded-full p-1.5 border-4 border-white dark:border-zinc-950">
                                    <ArrowRight className="w-4 h-4 text-zinc-400 rotate-90" />
                                </div>
                            </div> */}

                            {/* 2. AGENT QUEUE HIDDEN */}
                            {/* <AgentQueue
                                activeAgents={activeAgentsList}
                                upcomingLeads={upcomingLeads}
                                historyItems={historyItems}
                                events={allEvents} // Pass real-time events for chat bubbles
                                maxConcurrency={maxConcurrency}
                                onAgentClick={(agent, agentName, index) => {
                                    if (agent) {
                                        setSelectedAgentId(agent.agent_id);
                                    }
                                    setSelectedAgentFallback({
                                        name: agentName,
                                        index,
                                        leadId: agent?.lead_id,
                                        leadName: agent?.lead_name
                                    });
                                    setIsAgentModalOpen(true);
                                }}
                                onViewFullQueue={() => setIsQueueModalOpen(true)}
                                onLeadAction={handleLeadAction}
                            /> */}
                        </div>

                        {/* Agent Live Update Modal */}
                        <AgentLiveUpdateModal
                            isOpen={isAgentModalOpen}
                            onClose={() => setIsAgentModalOpen(false)}
                            agent={activeAgentsList.find(a => a?.agent_id === selectedAgentId) || null}
                            agentName={activeAgentsList.find(a => a?.agent_id === selectedAgentId)?.agent_name || selectedAgentFallback?.name || ""}
                            leadName={activeAgentsList.find(a => a?.agent_id === selectedAgentId)?.lead_name || selectedAgentFallback?.leadName}
                            index={selectedAgentFallback?.index ?? 0}
                            events={allEvents.filter(e => {
                                const currentAgent = activeAgentsList.find(a => a?.agent_id === selectedAgentId);
                                const leadId = currentAgent?.lead_id || selectedAgentFallback?.leadId;
                                const agentName = currentAgent?.agent_name || selectedAgentFallback?.name;

                                // Primary Match: Lead ID (Robust)
                                if (e.lead_id && leadId) {
                                    return String(e.lead_id) === String(leadId);
                                }

                                // Secondary Match: Agent Name (Fallback)
                                return agentName && e.agent_name === agentName;
                            })}
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
                            maxConcurrency={maxConcurrency}
                            isPaused={state === 'PAUSED'}
                            isResetting={isResetting}
                            onReset={handleResetCampaign}
                            onLeadAction={(action, leadId) => {
                                // Handle actions from modal
                                console.log("Queue Action", action, leadId);
                            }}
                            onRefreshQueue={refreshCampaignData}
                        />

                        {/* Persistent Call Logs HIDDEN */}
                        {/* <div className="mt-8">
                            {authCompanyId && <CallLogTable campaignId={campaignId} />}
                        </div> */}
                    </motion.div>
                )}

            </AnimatePresence>

            <AnimatePresence>
                {isExtendModalOpen && (
                    <div key="extend-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                if (!isExtending) {
                                    setIsExtendModalOpen(false);
                                    setPendingAction(null);
                                }
                            }}
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
                                <AnimatePresence mode="wait">
                                    {!showWarningView ? (
                                        <motion.div
                                            key="editor"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-orange-500/10 to-violet-500/5 dark:from-orange-500/20 dark:to-violet-500/10 flex items-center justify-center text-orange-500 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20 shadow-sm">
                                                        <Clock className="w-8 h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Update Schedule</h3>
                                                        <p className={cn(
                                                            "font-medium transition-colors duration-300",
                                                            getActiveWindowStatus(editingWindows).isInWindow
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-zinc-500 dark:text-zinc-400"
                                                        )}>
                                                            {getActiveWindowStatus(editingWindows).isInWindow
                                                                ? "Current time is now covered. Ready to start."
                                                                : "Your campaign is currently outside its execution window."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isExtending}
                                                    onClick={() => {
                                                        setIsExtendModalOpen(false);
                                                        setPendingAction(null);
                                                        setShowWarningView(false);
                                                    }}
                                                    className="w-12 h-12 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                                                >
                                                    <X className="w-6 h-6 text-zinc-400" />
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
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
                                                    {!calendarStatus.connected && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleConnectCalendar}
                                                            className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full px-4 h-8 gap-2 border border-orange-100 dark:border-orange-900/40"
                                                        >
                                                            <Calendar className="w-3 h-3" />
                                                            Connect to Block
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                                    {(() => {
                                                        const now = new Date();
                                                        const indexedWindows = editingWindows.map((w, i) => ({ ...w, _originalIndex: i }));

                                                        const current: any[] = [];
                                                        const upcoming: any[] = [];
                                                        const past: any[] = [];

                                                        indexedWindows.forEach(w => {
                                                            try {
                                                                const startDt = parseISO(`${w.day}T${w.start}`);
                                                                const endDt = parseISO(`${w.day}T${w.end}`);
                                                                const bufferMins = 30;

                                                                if (now > endDt) {
                                                                    past.push(w);
                                                                } else if (now >= startDt && now <= endDt) {
                                                                    // Any window that includes "now" is Current
                                                                    const remainingMins = Math.max(0, Math.round((endDt.getTime() - now.getTime()) / (60 * 1000)));
                                                                    const isInvalid = remainingMins < bufferMins;
                                                                    current.push({
                                                                        ...w,
                                                                        _durationLabel: `${remainingMins} MINS LEFT`,
                                                                        _isInvalid: isInvalid
                                                                    });
                                                                } else {
                                                                    // Future window
                                                                    upcoming.push(w);
                                                                }
                                                            } catch {
                                                                upcoming.push(w);
                                                            }
                                                        });

                                                        // Sort
                                                        upcoming.sort((a, b) => parseISO(`${a.day}T${a.start}`).getTime() - parseISO(`${b.day}T${b.start}`).getTime());
                                                        past.sort((a, b) => parseISO(`${b.day}T${b.start}`).getTime() - parseISO(`${a.day}T${a.start}`).getTime());

                                                        return (
                                                            <>
                                                                {current.length > 0 && (
                                                                    <div className="mb-6">
                                                                        <h4 className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5">
                                                                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                                            Current Window
                                                                        </h4>
                                                                        <div className="space-y-4">
                                                                            {current.map((window) => (
                                                                                <TimeWindowSelector
                                                                                    key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                                    day={window.day}
                                                                                    start={window.start}
                                                                                    end={window.end}
                                                                                    allWindows={editingWindows}
                                                                                    currentIndex={window._originalIndex}
                                                                                    customDurationLabel={window._durationLabel}
                                                                                    isInvalid={window._isInvalid}
                                                                                    onChange={(updates) => {
                                                                                        const newW = [...editingWindows];
                                                                                        newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                        setEditingWindows(newW);
                                                                                    }}
                                                                                    onDelete={() => {
                                                                                        setEditingWindows(editingWindows.filter((_, idx) => idx !== window._originalIndex));
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {upcoming.length > 0 && (
                                                                    <div className="mb-6">
                                                                        <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">Upcoming Windows</h4>
                                                                        <div className="space-y-3">
                                                                            <AnimatePresence>
                                                                                {upcoming.map((window) => (
                                                                                    <TimeWindowSelector
                                                                                        key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                                        day={window.day}
                                                                                        start={window.start}
                                                                                        end={window.end}
                                                                                        allWindows={editingWindows}
                                                                                        currentIndex={window._originalIndex}
                                                                                        onChange={(updates) => {
                                                                                            const newW = [...editingWindows];
                                                                                            newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                            setEditingWindows(newW);
                                                                                        }}
                                                                                        onDelete={() => {
                                                                                            setEditingWindows(editingWindows.filter((_, idx) => idx !== window._originalIndex));
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {past.length > 0 && (
                                                                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Past Windows</h4>
                                                                        <div className="opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 space-y-3">
                                                                            <AnimatePresence>
                                                                                {past.map((window) => (
                                                                                    <TimeWindowSelector
                                                                                        key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                                        day={window.day}
                                                                                        start={window.start}
                                                                                        end={window.end}
                                                                                        allWindows={editingWindows}
                                                                                        currentIndex={window._originalIndex}
                                                                                        onChange={(updates) => {
                                                                                            const newW = [...editingWindows];
                                                                                            newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                            setEditingWindows(newW);
                                                                                        }}
                                                                                        onDelete={() => {
                                                                                            setEditingWindows(editingWindows.filter((_, idx) => idx !== window._originalIndex));
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    <motion.button
                                                        whileHover={{ scale: 1.01, borderColor: 'rgb(99, 102, 241, 0.5)' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            const now = new Date();
                                                            const day = format(now, 'yyyy-MM-dd');
                                                            const start = format(now, 'HH:00');
                                                            const endDt = new Date(now);
                                                            endDt.setHours(endDt.getHours() + 1);
                                                            const end = format(endDt, 'HH:00');
                                                            setEditingWindows([...editingWindows, { day, start, end }]);
                                                        }}
                                                        className="w-full h-16 rounded-[1.5rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800/60 flex items-center justify-center gap-3 text-zinc-400 hover:text-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 transition-all font-black text-sm uppercase tracking-widest"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </div>
                                                        Add Slot
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4 pt-4">
                                                <Button
                                                    onClick={handleSaveSchedule}
                                                    disabled={isExtending || editingWindows.length === 0}
                                                    className="h-16 rounded-[1.5rem] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all gap-3 relative overflow-hidden group shadow-2xl shadow-orange-500/20"
                                                >
                                                    {isExtending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-5 h-5" />{pendingAction ? "Save & Start Session" : "Save Schedule"}</>}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="warning"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex flex-col items-center text-center space-y-6">
                                                <div className="w-20 h-20 rounded-[2rem] bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-900/30 shadow-xl shadow-amber-500/10">
                                                    <AlertTriangle className="w-10 h-10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Outside Window</h3>
                                                    <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-sm leading-relaxed">
                                                        The current time is outside of your scheduled windows.
                                                        If you continue, the campaign will remain <span className="text-zinc-900 dark:text-white font-bold">Paused</span> until the next slot.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowWarningView(false)}
                                                    className="h-16 rounded-[1.5rem] border-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-black text-zinc-600 dark:text-zinc-400 transition-all active:scale-[0.98]"
                                                >
                                                    Go Back & Edit
                                                </Button>
                                                <Button
                                                    onClick={() => commitSchedule(false)}
                                                    disabled={isExtending}
                                                    className="h-16 rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white font-black shadow-xl shadow-orange-600/20 transition-all active:scale-[0.98]"
                                                >
                                                    Schedule for Later
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                    </div>
                )}
            </AnimatePresence>
            {/* Strategy Missing Alert */}
            <AlertDialog open={isStrategyMissingAlertOpen} onOpenChange={setIsStrategyMissingAlertOpen}>
                <AlertDialogContent className="rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                                <Target className="w-5 h-5" />
                            </div>
                            Strategy Required
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium leading-relaxed py-2">
                            A campaign strategy must be defined before execution can begin. You need to configure targets and protocols for each cohort segment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900/50 h-12 px-6">
                            Not Now
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setIsStrategyMissingAlertOpen(false);
                                if (onEditStrategy) onEditStrategy();
                            }}
                            className="rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold h-12 px-8 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Configure Strategy
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Initialization Required Alert (Lead Updates Pending) */}
            <AlertDialog open={isInitializationRequiredAlertOpen} onOpenChange={setIsInitializationRequiredAlertOpen}>
                <AlertDialogContent className="rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            Initialization Required
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium leading-relaxed py-2">
                            New leads have been added to this campaign. To ensure Alex behaves correctly with the new data, you must finalize the campaign strategy before starting the session.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900/50 h-12 px-6">
                            Not Now
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setIsInitializationRequiredAlertOpen(false);
                                if (onEditStrategy) onEditStrategy();
                            }}
                            className="rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold h-12 px-8 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Finalize Strategy
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* User Queue Modals */}
            {selectedUserQueueItem && (
                <CallStatusDialog
                    isOpen={isStatusDialogOpen}
                    onClose={() => setIsStatusDialogOpen(false)}
                    lead={{
                        id: selectedUserQueueItem.lead_id,
                        name: selectedUserQueueItem.lead_name,
                        item_id: selectedUserQueueItem.id,
                        campaign_id: campaignId
                    }}
                    onSuccess={() => {
                        refreshCampaignData();
                        setUserQueueRefreshTrigger(Date.now());
                    }}
                />
            )}

            {contextLead && (
                <CallContextModal
                    isOpen={isContextModalOpen}
                    onClose={() => setIsContextModalOpen(false)}
                    leadId={contextLead.id}
                    itemId={contextLead.item_id}
                    leadName={contextLead.name}
                    onResumeCall={(itemId) => {
                        setActiveTriggerContactId(itemId);
                        setIsContextModalOpen(false);
                    }}
                />
            )}
        </>
    );
}
