"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Sparkles,
    Loader2,
    Pencil,
    Trash2,
    Calendar,
    Clock,
    Target,
    Briefcase,
    User,
    BrainCircuit,
    Layers,
    MessageSquare,
    Gift,
    Check,

    ShieldAlert,
    Pause,
    Play,
    AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { formatMinimalTime } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { CsvUploadCard } from "@/components/customer-intelligence/CsvUploadCard";
import { CampaignComposer } from "@/components/customer-intelligence/CampaignComposer";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { ExecutionPanel } from "@/components/customer-intelligence/ExecutionPanel";

import { getUniqueCohortAvatars } from "@/lib/avatar-utils";
import { useAuth } from "@/context/auth-context";
import { useCampaignData } from "@/hooks/use-campaign-data-websocket";

export default function CampaignPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params?.id as string;
    const { loading: isAuthLoading, companyId } = useAuth();

    const [campaign, setCampaign] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isManagingLeads, setIsManagingLeads] = useState(false);
    const [composerKey, setComposerKey] = useState(0);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isPauseConfirmOpen, setIsPauseConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPausing, setIsPausing] = useState(false);
    const [initialComposerStep, setInitialComposerStep] = useState<'IDENTITY' | 'STRATEGY' | 'EXECUTION'>('IDENTITY');

    // Dirty state tracking for leads management
    const [isLeadsDirty, setIsLeadsDirty] = useState(false);
    const [wasLeadsUpdated, setWasLeadsUpdated] = useState(false);
    const [isLeadsExitConfirmOpen, setIsLeadsExitConfirmOpen] = useState(false);
    const [isSecondaryMetricsExpanded, setIsSecondaryMetricsExpanded] = useState(false);

    // Removed isScheduleModalOpen as polling is no longer used

    // NEW: Use WebSocket for campaign data
    const { campaign: wsCampaign, isConnected } = useCampaignData(campaignId);

    // Track the time of the last user action to prevent stale poll data from overwriting optimistic updates
    const lastActionTimeRef = useRef<number>(0);

    const fetchCampaign = async () => {
        // Guard: Wait for auth to be ready
        if (isAuthLoading) return;

        // If auth is ready but we don't have required context, stop loading so we don't hang
        if (!companyId || !campaignId) {
            setIsLoading(false);
            return;
        }

        try {
            // Only show loading state on first fetch
            if (!campaign) setIsLoading(true);

            const requestStartTime = Date.now();
            const data = await api.get(`/intelligence/campaigns/${campaignId}`);

            // Race condition check: If a user action occurred *after* this request started,
            // ignore this stale response to prevent reverting optimistic UI updates.
            if (requestStartTime < lastActionTimeRef.current) {
                console.log("Ignoring stale campaign data from poll");
                return;
            }

            setCampaign((prev: any) => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
        } catch (error: any) {
            console.error("Failed to fetch campaign:", error);
            if (error.status === 404) {
                toast.error("Campaign not found");
                router.push('/dashboard-new/customer-intelligence');
            } else {
                // Don't spam toasts on poll errors
                if (!campaign) {
                    toast.error(error.message || "Failed to load campaign");
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch only (no polling)
    useEffect(() => {
        if (!isAuthLoading && companyId && campaignId) {
            // Only fetch if we don't have data yet
            if (!campaign) fetchCampaign();
        }
    }, [campaignId, isAuthLoading, companyId]);

    // Update campaign state from WebSocket
    useEffect(() => {
        if (wsCampaign) {
            setCampaign((prev: any) => {
                // Merge WebSocket data with existing campaign data
                // Preserve fields not in WebSocket payload
                const newData = {
                    ...prev,
                    ...wsCampaign,
                    // Ensure we keep keys that might be critical
                    id: campaignId,
                    status: prev?.status || wsCampaign.status || 'DRAFT'
                };

                // Deep comparison to prevent unnecessary re-renders
                if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
                return newData;
            });

            // Update last action time to prevent race conditions with any manual fetches
            lastActionTimeRef.current = Date.now();
        }
    }, [wsCampaign, campaignId]);

    // [NEW] Auto-pause campaign on page reload/close
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Only attempt to pause if we know it's active
            if (campaign?.status === 'ACTIVE' || campaign?.status === 'IN_PROGRESS') {
                // Use fetch with keepalive to ensure request survives page unload
                // Payload must be small
                const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/execution/campaign/${campaignId}/pause`;

                // We need to use SendBeacon or fetch with keepalive
                // fetch with keepalive is more reliable for JSON
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add auth token if available in localStorage or cookies
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    keepalive: true
                }).catch(err => console.error("Auto-pause failed", err));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [campaignId, campaign?.status]);

    const handleBack = () => {
        if (campaign?.status === 'IN_PROGRESS' || campaign?.status === 'WARMUP') {
            setIsPauseConfirmOpen(true);
            return;
        }
        router.push('/dashboard-new/customer-intelligence');
    };

    const handlePauseAndExit = async () => {
        setIsPausing(true);
        try {
            await api.patch(`/intelligence/campaigns/${campaignId}`, {
                status: 'PAUSED'
            });
            toast.success("Campaign paused successfully");
            lastActionTimeRef.current = Date.now(); // Prevent race conditions

            // Small delay for toast
            setTimeout(() => {
                router.push('/dashboard-new/customer-intelligence');
            }, 500);
        } catch (error: any) {
            console.error("Failed to pause campaign:", error);
            toast.error(error.message || "Failed to pause campaign");
            setIsPausing(false);
            setIsPauseConfirmOpen(false);
        }
    };

    const handleEdit = () => {
        setInitialComposerStep('IDENTITY');
        setIsEditing(true);
    };

    const handleEditStrategy = () => {
        setInitialComposerStep('STRATEGY');
        setIsEditing(true);
        setComposerKey(prev => prev + 1);
    };

    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/intelligence/campaigns/${campaignId}`);
            toast.success("Campaign deleted successfully");
            setIsDeleteConfirmOpen(false);
            // Small delay to allow toast to show before navigation
            setTimeout(() => {
                router.push('/dashboard-new/customer-intelligence');
            }, 500);
        } catch (error: any) {
            console.error("Failed to delete campaign:", error);
            toast.error(error.message || "Failed to delete campaign");
            setIsDeleting(false);
            // Re-throw to maintain error state visibility
            throw error;
        }
    };

    // Show loading state while auth is initializing or campaign is loading
    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        {isAuthLoading ? "Authenticating..." : "Loading campaign..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
                <div className="text-center">
                    <p className="text-zinc-500 dark:text-zinc-400">Campaign not found</p>
                    <Button onClick={handleBack} className="mt-4">Return to Intelligence Lab</Button>
                </div>
            </div>
        );
    }

    // Destructure campaign data
    const {
        name,
        created_at,
        updated_at,
        status,
        brand_context,
        customer_context,
        team_member_context,
        cohort_config = {},
        selected_cohorts = [],
        cohort_data = {},
        cohort_questions = {},
        cohort_incentives = {},
        preliminary_questions = [],
        incentive,
        execution_windows = [],
        call_duration,
        total_call_target
    } = campaign;

    const isMissionAccomplished = status === 'COMPLETED';

    // Derived metrics
    const totalTargets = Object.values(cohort_config as Record<string, number>).reduce((a, b) => a + b, 0) || total_call_target || 0;
    const activeCohortCount = selected_cohorts?.length || Object.keys(cohort_config).length || 0;
    const maxDurationMins = call_duration ? Math.floor(call_duration / 60) : 10;
    const activeWindows = execution_windows?.length || 0;

    // Status configuration
    const statusConfig: Record<string, { label: string, color: string, bg: string, border: string, icon: any }> = {
        'COMPLETED': { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Check },
        'IN_PROGRESS': { label: 'Active', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
        'ACTIVE': { label: 'Active', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
        'FAILED': { label: 'Attention', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert },
        'DRAFT': { label: 'Draft', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', icon: Pencil },
        'SCHEDULED': { label: 'Scheduled', color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Calendar },
        'PAUSED': { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Pause },
        'READY': { label: 'Ready', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Play },
    };

    const currentStatus = statusConfig[status] || statusConfig['DRAFT'];
    const StatusIcon = currentStatus.icon;

    // Get cohort avatars
    const allCohorts = selected_cohorts.length > 0 ? selected_cohorts : Object.keys(cohort_config);
    const assignedAvatars = getUniqueCohortAvatars(allCohorts);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
            <div className={cn("max-w-7xl mx-auto p-6 md:p-8 transition-all duration-500", isMissionAccomplished && "py-4 md:py-6")}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={cn("mb-8", isMissionAccomplished && "mb-4")}
                >
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className={cn("mb-6 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 -ml-2", isMissionAccomplished && "mb-2 transform scale-90 origin-left")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Intelligence Lab
                    </Button>

                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className={cn("flex items-center gap-3 mb-4", isMissionAccomplished && "mb-2")}>
                                <div className={cn(
                                    "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all duration-300 border backdrop-blur-md",
                                    currentStatus.bg, currentStatus.border
                                )}>
                                    <div className={cn("p-1.5 rounded-full bg-white dark:bg-black/20", currentStatus.color)}>
                                        <StatusIcon className="w-3.5 h-3.5" strokeWidth={3} />
                                    </div>
                                    <span className={cn("text-[11px] font-black uppercase tracking-[0.15em] pr-1", currentStatus.color)}>
                                        {currentStatus.label}
                                    </span>
                                </div>

                                {/* Dates */}
                                <div className="flex items-center gap-2">
                                    {/* Created At */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full cursor-help hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                    <Calendar className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                                                    {created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : 'New'}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Created: {created_at ? format(new Date(created_at), "MMM do, yyyy 'at' h:mm a") : 'N/A'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    {/* Updated At */}
                                    {updated_at && updated_at !== created_at && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full cursor-help hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                        <Clock className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                                                        Updated {formatDistanceToNow(new Date(updated_at), { addSuffix: true })}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Last Updated: {format(new Date(updated_at), "MMM do, yyyy 'at' h:mm a")}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>

                            <h1 className={cn(
                                "text-5xl md:text-6xl font-black text-zinc-900 dark:text-zinc-50 leading-[1.05] tracking-[-0.04em] mb-6 bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-100 dark:to-zinc-400 transition-all duration-500",
                                isMissionAccomplished && "text-3xl md:text-4xl mb-2"
                            )}>
                                {name}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Edit Button - Only if Paused/Draft/Ready/Scheduled */}
                            {['PAUSED', 'DRAFT', 'READY', 'SCHEDULED'].includes(status) && (
                                <Button
                                    onClick={handleEdit}
                                    className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm font-semibold rounded-xl"
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit Campaign
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                onClick={handleDeleteClick}
                                className="rounded-xl h-11 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Performance Metrics (Bolna Style) */}
                <AnimatePresence>
                    {(!isMissionAccomplished || isSecondaryMetricsExpanded) && (
                        <motion.div
                            initial={isMissionAccomplished ? { height: 0, opacity: 0 } : false}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >


                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                                {/* Metric 1: Targets */}
                                <div className="flex items-center gap-4 bg-white/50 dark:bg-zinc-900/30 p-6 rounded-[24px] border border-zinc-100/50 dark:border-zinc-800/30 group/metric transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-100">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-zinc-400 group-hover/metric:text-indigo-500 transition-colors">
                                        <Target className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1">
                                            {totalTargets}
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                            Total Targets
                                        </div>
                                    </div>
                                </div>

                                {/* Metric 2: Call Duration */}
                                <div className="flex items-center gap-4 bg-white/50 dark:bg-zinc-900/30 p-6 rounded-[24px] border border-zinc-100/50 dark:border-zinc-800/30 group/metric transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-100">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-zinc-400 group-hover/metric:text-orange-500 transition-colors">
                                        <Clock className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1">
                                            {maxDurationMins}m
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                            Calls
                                        </div>
                                    </div>
                                </div>

                                {/* Metric 3: Active Slots */}
                                <div className="flex items-center gap-4 bg-white/50 dark:bg-zinc-900/30 p-6 rounded-[24px] border border-zinc-100/50 dark:border-zinc-800/30 group/metric transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-100">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-zinc-400 group-hover/metric:text-emerald-500 transition-colors">
                                        <Calendar className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1">
                                            {activeWindows} Slots
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                            Schedule
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isMissionAccomplished && (
                    <div className="flex justify-center mb-8 -mt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSecondaryMetricsExpanded(!isSecondaryMetricsExpanded)}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-500 transition-colors gap-2"
                        >
                            {isSecondaryMetricsExpanded ? (
                                <>Hide Detailed Stats <Layers className="w-3 h-3 rotate-180" /></>
                            ) : (
                                <>View Detailed Campaign Stats <Layers className="w-3 h-3" /></>
                            )}
                        </Button>
                    </div>
                )}

                {/* EXECUTION PANEL (Guided Flow) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className={cn("mb-8", isMissionAccomplished && "mb-4")}
                >
                    <ExecutionPanel
                        campaignId={campaignId}
                        campaignStatus={status}
                        hasStrategy={!!(selected_cohorts?.length > 0 || (cohort_data && Object.keys(cohort_data).length > 0))}
                        wasLeadsUpdated={wasLeadsUpdated}
                        onStatusChange={async (newStatus) => {
                            if (campaign.status === newStatus) return;

                            // Optimistically update local state
                            setCampaign({ ...campaign, status: newStatus });
                            lastActionTimeRef.current = Date.now();

                            // NOTE: We don't call api.patch here for IN_PROGRESS/ACTIVE/PAUSED
                            // status transitions because the ExecutionPanel's specific 
                            // endpoints (/start, /pause, /reset) already handle DB persistence.
                        }}
                        onEditStrategy={handleEditStrategy}
                    />
                </motion.div>

                {/* Context Matrix */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Brand Identity", icon: Briefcase, text: brand_context, color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100/50", darkBg: "dark:bg-indigo-500/10", darkBorder: "dark:border-indigo-500/20" },
                            { title: "Target Audience", icon: User, text: customer_context, color: "text-purple-600", bg: "bg-purple-50/50", border: "border-purple-100/50", darkBg: "dark:bg-purple-500/10", darkBorder: "dark:border-purple-500/20" },
                            { title: "Purpose", icon: BrainCircuit, text: team_member_context, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100/50", darkBg: "dark:bg-emerald-500/10", darkBorder: "dark:border-emerald-500/20" }
                        ].map((ctx, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1), duration: 0.7 }}
                                className="group/card relative p-8 rounded-[32px] bg-white/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900/50 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-black/40 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/30 dark:to-white/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div className="flex items-center gap-5 mb-6">
                                    <div className={cn("p-4 rounded-2xl shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover/card:scale-110", ctx.bg, ctx.color, ctx.darkBg)}>
                                        <ctx.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">{ctx.title}</span>
                                </div>
                                <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-semibold">
                                    {ctx.text || "Strategic context not defined."}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Cohort Strategy Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between px-4 mb-10">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.3em] flex items-center gap-4">
                                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                    <Layers className="w-4 h-4" />
                                </div>
                                Campaign Strategy Map
                            </h4>
                            <p className="text-sm text-zinc-400 font-medium pl-12">Segmented execution plan and individual goals</p>
                        </div>
                        <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2 text-xs font-bold rounded-full">
                            {activeCohortCount} ACTIVE SEGMENTS
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {allCohorts.map((cohortName: string, i: number) => {
                            const target = cohort_config[cohortName] || 0;
                            const questions = cohort_questions[cohortName] || preliminary_questions;
                            const activeIncentive = cohort_incentives[cohortName] || incentive;
                            const avatarIndex = assignedAvatars[cohortName] || 1;

                            return (
                                <motion.div
                                    key={cohortName}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.6 }}
                                    className="flex flex-col bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-[32px] p-8 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-2xl transition-all duration-500 group/cohort relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

                                    {/* Header */}
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white dark:border-zinc-800 shadow-xl group-hover/cohort:scale-105 transition-transform duration-500 bg-transparent">
                                            <img src={`/images/avatars/notionists/full_body/avatar_${avatarIndex}.png`} alt={cohortName} className="w-full h-full object-contain scale-110 drop-shadow-md" />
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">{cohortName}</h5>
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-0.5 text-[10px] font-bold tracking-wider">
                                                <Target className="w-3 h-3 mr-1.5" /> {target} TARGET CALLS
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-6 flex-1">
                                        {activeIncentive && (
                                            <div className="flex items-center gap-4 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] p-4 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20">
                                                <Gift className="w-5 h-5 text-emerald-600 shrink-0" />
                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                    {activeIncentive}
                                                </span>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">
                                                <MessageSquare className="w-3.5 h-3.5" /> Preliminary Questions
                                            </div>
                                            <ul className="space-y-3">
                                                {questions.slice(0, 3).map((q: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 font-medium group-hover/cohort:border-indigo-500/30 transition-colors">
                                                        {q}
                                                    </li>
                                                ))}
                                                {questions.length > 3 && (
                                                    <li className="text-xs text-indigo-500 font-bold pl-4 pt-1 flex items-center gap-2">
                                                        <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                                                        +{questions.length - 3} more strategic questions
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Edit Modal - Campaign Composer */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => {
                            if (wasLeadsUpdated) {
                                setIsLeadsExitConfirmOpen(true);
                            } else {
                                setIsEditing(false);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-5xl mx-auto max-h-[95vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CampaignComposer
                                key={composerKey}
                                campaignId={campaignId}
                                initialStep={initialComposerStep}
                                onComplete={() => {
                                    setIsEditing(false);
                                    setWasLeadsUpdated(false);
                                    fetchCampaign();
                                    toast.success("Campaign updated successfully");
                                }}
                                onBack={() => {
                                    if (wasLeadsUpdated) {
                                        setIsLeadsExitConfirmOpen(true);
                                    } else {
                                        setIsEditing(false);
                                    }
                                }}
                                onEditLeads={() => setIsManagingLeads(true)}
                                onError={(error) => {
                                    console.error("Campaign update error:", error);
                                    toast.error(error?.message || "Failed to update campaign");
                                }}
                                isMagicUI={FEATURE_FLAGS.IS_MAGIC_AI_ENABLED}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nested Modal - Manage Leads */}
            <AnimatePresence>
                {isManagingLeads && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => {
                            if (isLeadsDirty) {
                                setIsLeadsExitConfirmOpen(true);
                            } else {
                                setIsManagingLeads(false);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-5xl mx-auto max-h-[95vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CsvUploadCard
                                mode="edit"
                                campaignId={campaignId}
                                isMagicUI={FEATURE_FLAGS.IS_MAGIC_AI_ENABLED}
                                onSuccess={() => {
                                    setIsManagingLeads(false);
                                    setIsLeadsDirty(false);
                                    setWasLeadsUpdated(true);
                                    setComposerKey(prev => prev + 1);
                                    fetchCampaign();
                                    toast.success("Leads updated successfully");
                                }}
                                onCancel={() => {
                                    if (isLeadsDirty) {
                                        setIsLeadsExitConfirmOpen(true);
                                    } else {
                                        setIsManagingLeads(false);
                                    }
                                }}
                                onLeadsUpdated={async () => {
                                    // Update local state to DRAFT and clear cohort mappings
                                    setCampaign((prev: any) => ({
                                        ...prev,
                                        status: 'DRAFT',
                                        selected_cohorts: [],
                                        cohort_data: {},
                                        cohort_config: {},
                                        cohort_questions: {},
                                        cohort_incentives: {}
                                    }));

                                    // Persist status change to backend
                                    try {
                                        await api.patch(`/intelligence/campaigns/${campaignId}`, {
                                            status: 'DRAFT'
                                        });
                                        lastActionTimeRef.current = Date.now();
                                        toast.info("Campaign status changed to DRAFT. Please complete the cohort strategy mapping to activate.", {
                                            duration: 5000
                                        });
                                    } catch (error: any) {
                                        console.error("Failed to update campaign status:", error);
                                        toast.error("Failed to update campaign status. Please refresh and try again.");
                                    }

                                    setComposerKey(prev => prev + 1);
                                    fetchCampaign();
                                }}
                                onDirtyChange={(isDirty) => setIsLeadsDirty(isDirty)}
                                className="flex-1 min-h-0"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            Delete Campaign
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-base py-2">
                            Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-zinc-100">"{name}"</span>? This will permanently remove the campaign and archive all related leads. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 h-12 px-6">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-500/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Campaign"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Pause Confirmation Dialog */}
            <AlertDialog open={isPauseConfirmOpen} onOpenChange={setIsPauseConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                <Pause className="w-5 h-5" />
                            </div>
                            Pause Session?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-base py-2">
                            This campaign is currently active. Do you want to pause it before leaving? <br /><br />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Agents will complete their current calls and then stop dialing.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 h-12 px-6">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/dashboard-new/customer-intelligence')}
                            className="rounded-2xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold h-12 px-6"
                        >
                            Exit Without Pausing
                        </Button>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handlePauseAndExit();
                            }}
                            className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 shadow-lg shadow-amber-500/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isPausing}
                        >
                            {isPausing ? "Pausing..." : "Pause & Exit"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unsaved Leads Exit Confirmation */}
            <AlertDialog open={isLeadsExitConfirmOpen} onOpenChange={setIsLeadsExitConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            Unsaved Changes
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-base py-2">
                            You have unsaved changes to your leads list. If you exit now, these changes will be lost.<br /><br />
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Are you sure you want to discard your changes?</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 h-12 px-6">
                            Keep Editing
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setIsLeadsExitConfirmOpen(false);
                                setIsManagingLeads(false);
                                setIsEditing(false);
                                setIsLeadsDirty(false);
                            }}
                            className="rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold h-12 px-8 shadow-lg shadow-red-500/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Exit without Saving
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
