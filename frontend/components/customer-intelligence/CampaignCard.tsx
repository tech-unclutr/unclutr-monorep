"use strict";
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, ChevronDown, ChevronUp, Calendar, Clock, Target, Users, Sparkles, BrainCircuit, ShieldAlert, AlignLeft, Mic, FileText, Pencil, Trash2, Briefcase, User, MessageSquare, Gift, Layers, ArrowUpRight, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatToIST, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { getUniqueCohortAvatars } from "@/lib/avatar-utils";


interface CampaignCardProps {
    campaign: any;
    variant?: 'default' | 'summary';
    onClick?: () => void;
    onEdit?: (id: string, updates: any) => Promise<void>;
    onEditClick?: (id: string) => void;
    onDelete?: (id: string) => Promise<void>;
    onArchive?: (id: string) => Promise<void>; // [NEW]
    isArchived?: boolean; // [NEW]
    isMagicUI?: boolean; // [NEW] - adding this too as seen in usage
    className?: string;
}

const CampaignCardBase = ({
    campaign,
    variant = 'default',
    onClick,
    onEdit,
    onEditClick,
    onDelete,
    onArchive, // [NEW]
    isArchived = false, // [NEW]
    className,
    isExpanded: propIsExpanded,
    onToggleExpand,
    onStartCampaign,
    isMagicUI
}: CampaignCardProps & { isExpanded?: boolean; onToggleExpand?: () => void; onStartCampaign?: () => void }) => {
    const [internalIsExpanded, setInternalIsExpanded] = useState(variant === 'default');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false); // [NEW]
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false); // [NEW]

    // Controlled or Uncontrolled
    const isExpanded = propIsExpanded !== undefined ? propIsExpanded : internalIsExpanded;

    // Form State
    const [primaryGoal, setPrimaryGoal] = useState(campaign?.campaign_overview?.primary_goal || campaign?.name || "Untitled Campaign");
    const [editedData, setEditedData] = useState({}); // campaign?.bolna_extracted_data || {});

    // Destructure Config Data (The "Plan")
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
        cohort_questions = {},
        cohort_incentives = {},
        preliminary_questions = [], // Fallback for cohorts without specific questions
        incentive, // Fallback incentive
        execution_windows = [],
        call_duration,
        total_call_target
    } = campaign;

    // Derived Metrics
    const totalTargets = Object.values(cohort_config as Record<string, number>).reduce((a, b) => a + b, 0) || total_call_target || 0;
    const activeCohortCount = selected_cohorts?.length || Object.keys(cohort_config).length || 0;
    const maxDurationMins = call_duration ? Math.floor(call_duration / 60) : 10;
    const activeWindows = execution_windows?.length || 0;

    // Status Config
    const statusConfig: Record<string, { label: string, color: string, bg: string, border: string, icon: any }> = {
        'COMPLETED': { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Check },
        'IN_PROGRESS': { label: 'Active', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
        'ACTIVE': { label: 'Active', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
        'FAILED': { label: 'Attention', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert },
        'DRAFT': { label: 'Draft', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', icon: Pencil },
        'SCHEDULED': { label: 'Scheduled', color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Calendar },
        'PAUSED': { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Pause },
        'READY': { label: 'Ready', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Play }
    };

    const currentStatus = statusConfig[status] || statusConfig['DRAFT'];
    const StatusIcon = currentStatus.icon;


    // Handlers
    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onEdit) return;
        setIsSaving(true);
        try {
            await onEdit(campaign.id, {
                campaign_overview: { ...campaign.campaign_overview, primary_goal: primaryGoal },
                extracted_data: editedData
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(campaign.id);
            setIsDeleteConfirmOpen(false);
        } catch (error) {
            setIsDeleting(false);
        }
    };

    // [NEW] Archive Handler
    const handleArchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsArchiveConfirmOpen(true);
    };

    const confirmArchive = async () => {
        if (!onArchive) return;
        console.log("[CampaignCard] Archive requested for campaign:", campaign.id);
        setIsArchiving(true);
        try {
            await onArchive(campaign.id);
            console.log("[CampaignCard] Archive callback successful");
            setIsArchiveConfirmOpen(false);
            // reset archiving state in case the card doesn't unmount
            setIsArchiving(false);
        } catch (error) {
            console.error("[CampaignCard] Archive callback failed:", error);
            setIsArchiving(false);
        }
    };

    const handleStartCampaign = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onStartCampaign) {
            onStartCampaign();
        }
    };


    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditing) {
            if (onToggleExpand) {
                onToggleExpand();
            } else {
                setInternalIsExpanded(!internalIsExpanded);
            }
        }
    };



    const allCohorts = selected_cohorts.length > 0 ? selected_cohorts : Object.keys(cohort_config);
    const assignedAvatars = React.useMemo(() => getUniqueCohortAvatars(allCohorts), [allCohorts]);

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-500 ease-out bg-white dark:bg-zinc-950",
                isExpanded
                    ? "rounded-[40px] border border-indigo-500/30 shadow-[0_32px_64px_-12px_rgba(79,70,229,0.15)] z-20 my-6 ring-4 ring-indigo-500/5"
                    : "rounded-[32px] border border-zinc-100 dark:border-zinc-800/60 hover:border-indigo-200 dark:hover:border-indigo-500/30 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.1)] hover:-translate-y-1 cursor-pointer",
                className
            )}
            onClick={(e) => {
                if (onClick) onClick();
                else if (!isEditing) toggleExpand(e);
            }}
        >
            {/* 1. Header Section: Identity & Status */}
            <CardContent className={cn("relative transition-all duration-500", isExpanded ? "p-10 md:p-14" : "p-8")}>

                {/* Header Row: Status Badge & Date */}
                <div className="flex items-center justify-between mb-8">
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

                    <div className="flex items-center gap-3">
                        {/* Dates */}
                        {/* Dates */}
                        <div className="flex items-center gap-3 ml-2">
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 cursor-help opacity-80 hover:opacity-100 transition-opacity">
                                            <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                                {updated_at ? (
                                                    <>Last Updated: {formatToIST(updated_at)} <span className="text-zinc-400 dark:text-zinc-600 font-normal">({formatRelativeTime(updated_at)})</span></>
                                                ) : (
                                                    <>Created: {created_at ? formatToIST(created_at) : 'New'}</>
                                                )}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs bg-zinc-900 text-zinc-50 border-zinc-800 dark:bg-zinc-50 dark:text-black px-4 py-2 rounded-xl shadow-xl space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-zinc-400" />
                                            <p className="font-medium">Created: <span className="text-zinc-400 font-normal">{created_at ? formatToIST(created_at) : 'N/A'}</span></p>
                                        </div>
                                        {updated_at && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-zinc-400" />
                                                <p className="font-medium">Updated: <span className="text-zinc-400 font-normal">{formatToIST(updated_at)}</span></p>
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Expand Toggle Button (Visible on Hover/Expanded) */}
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                                isExpanded ? "bg-zinc-100 dark:bg-zinc-800 rotate-180" : "bg-transparent group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900 opacity-0 group-hover:opacity-100"
                            )}
                            onClick={toggleExpand}
                        >
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </div>
                    </div>
                </div>

                {/* Title Section */}
                <div className="mb-10 pr-12">
                    {isEditing ? (
                        <Textarea
                            value={primaryGoal}
                            onChange={(e) => setPrimaryGoal(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-4xl font-black bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none rounded-3xl p-6"
                        />
                    ) : (
                        <h3 className={cn(
                            "font-black text-zinc-900 dark:text-zinc-50 leading-[1.05] transition-all duration-500 tracking-[-0.04em]",
                            isExpanded
                                ? "text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-500"
                                : "text-3xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                        )}>
                            {name || primaryGoal}
                        </h3>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                    {/* Metric 1: Targets */}
                    <div className="flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-[24px] border border-zinc-100/50 dark:border-zinc-800/30 group/metric transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-100">
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

                    {/* Metric 2: Calls Duration */}
                    <div className="flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-[24px] border border-zinc-100/50 dark:border-zinc-800/30 group/metric transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-100">
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
                    <div className="flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-[24px] border border-zinc-100/50 dark:border-zinc-800/30 group/metric transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-100">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-zinc-400 group-hover/metric:text-emerald-500 transition-colors">
                            <Calendar className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1">
                                {activeWindows}
                            </div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Campaign Slots
                            </div>
                        </div>
                    </div>

                    {/* New Button: Start Campaign (Only visible when collapsed and not expanded) - Taking 4th slot */}
                    {!isExpanded && (
                        isArchived ? (
                            <div
                                className="flex items-center justify-center p-4 rounded-[24px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                            >
                                <span className="text-sm font-bold tracking-wide text-zinc-400 dark:text-zinc-500">
                                    Archived
                                </span>
                                <Layers className="w-4 h-4 ml-2 text-zinc-400 dark:text-zinc-500" />
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "flex items-center justify-center p-4 rounded-[24px] text-white shadow-lg transition-all duration-300 cursor-pointer group/btn",
                                    status === 'DRAFT'
                                        ? "bg-zinc-600 hover:bg-zinc-700 active:bg-zinc-800 shadow-zinc-500/30 hover:shadow-zinc-500/50"
                                        : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-500/30 hover:shadow-indigo-500/50"
                                )}
                                onClick={handleStartCampaign}
                            >
                                <span className="text-sm font-bold tracking-wide mr-2">
                                    {status === 'DRAFT' ? 'Resume Setup' :
                                        status === 'PAUSED' ? 'Resume' :
                                            status === 'READY' ? 'Start' :
                                                'Open'}
                                </span>
                                {status === 'DRAFT' ? (
                                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                ) : (
                                    <Play className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                )}
                            </div>
                        )
                    )}

                </div>

                {/* Tags (Bottom Row): Cohort Avatars */}
                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center pl-3">
                        {allCohorts.slice(0, 5).map((cohortName: string, i: number) => {
                            const avatarIndex = assignedAvatars[cohortName] || 1;
                            return (
                                <div
                                    key={cohortName}
                                    className="w-10 h-10 rounded-full border-[3px] border-white/40 dark:border-white/10 -ml-4 first:ml-0 relative z-0 hover:z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-sm bg-transparent cursor-help group/avatar overflow-hidden"
                                    title={cohortName === 'Default' ? 'General Audience' : cohortName}
                                >
                                    <img
                                        src={`/images/avatars/notionists/full_body/avatar_${avatarIndex}.png`}
                                        alt={cohortName === 'Default' ? 'General Audience' : cohortName}
                                        className="w-full h-full object-cover scale-150 translate-y-2 drop-shadow-md"
                                    />
                                </div>
                            );
                        })}
                        {allCohorts.length > 5 && (
                            <div className="w-10 h-10 rounded-full border-[3px] border-white dark:border-zinc-950 -ml-4 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 z-0 shadow-sm">
                                +{allCohorts.length - 5}
                            </div>
                        )}
                        <div className="ml-4 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                            Active Cohorts
                        </div>
                    </div>
                </div>


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
                                Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-zinc-100">&quot;{name || primaryGoal}&quot;</span>? This will permanently remove the campaign and archive all related leads. This action cannot be undone.
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

                {/* ARCHIVE Confirmation Dialog */}
                <AlertDialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
                    <AlertDialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                    <Layers className="w-5 h-5" />
                                </div>
                                Archive Campaign
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-base py-2">
                                Are you sure you want to archive <span className="font-bold text-zinc-900 dark:text-zinc-100">&quot;{name || primaryGoal}&quot;</span>? This will move it to the Archived Campaigns section. You can still access its data, but it will no longer be active.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3 sm:gap-0">
                            <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 h-12 px-6">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    confirmArchive();
                                }}
                                className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 px-8 shadow-lg shadow-amber-500/20 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isArchiving}
                            >
                                {isArchiving ? "Archiving..." : "Archive Campaign"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* 2. Expanded Content: The Strategic Plan */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800/50 space-y-16 mt-8">
                                {/* A. Context Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { title: "Brand Identity", icon: Briefcase, text: brand_context, color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100/50", darkBg: "dark:bg-indigo-500/10", darkBorder: "dark:border-indigo-500/20" },
                                        { title: "Target Audience", icon: User, text: customer_context, color: "text-orange-600", bg: "bg-orange-50/50", border: "border-orange-100/50", darkBg: "dark:bg-orange-500/10", darkBorder: "dark:border-orange-500/20" },
                                        { title: "Agent Persona", icon: BrainCircuit, text: team_member_context, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100/50", darkBg: "dark:bg-emerald-500/10", darkBorder: "dark:border-emerald-500/20" }
                                    ].map((ctx, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.7 }}
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

                                {/* B. Cohort Strategy Deck */}
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.3em] flex items-center gap-4">
                                                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                Campaign Strategy Map
                                            </h4>
                                            <p className="text-sm text-zinc-400 font-medium pl-12">Segmented execution plan and individual goals</p>
                                        </div>
                                        <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-black px-5 py-2 text-xs font-bold rounded-full">
                                            {activeCohortCount} ACTIVE SEGMENTS
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {(selected_cohorts.length > 0 ? selected_cohorts : Object.keys(cohort_config)).map((cohortName: string, i: number) => {
                                            const target = cohort_config[cohortName] || 0;
                                            const questions = cohort_questions[cohortName] || preliminary_questions;
                                            const activeIncentive = cohort_incentives[cohortName] || incentive;
                                            const avatarIndex = assignedAvatars[cohortName] || 1;

                                            return (
                                                <motion.div
                                                    key={cohortName}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 + (i * 0.1), duration: 0.6 }}
                                                    className="flex flex-col bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-[32px] p-8 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-2xl transition-all duration-500 group/cohort relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

                                                    {/* Header */}
                                                    <div className="flex items-center gap-5 mb-8">
                                                        <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white dark:border-zinc-800 shadow-xl group-hover/cohort:scale-105 transition-transform duration-500 bg-transparent">
                                                            <img src={`/images/avatars/notionists/full_body/avatar_${avatarIndex}.png`} alt={cohortName === 'Default' ? 'General Audience' : cohortName} className="w-full h-full object-contain scale-110 drop-shadow-md" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h5 className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">{cohortName === 'Default' ? 'General Audience' : cohortName}</h5>
                                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-0.5 text-[10px] font-bold tracking-wider">
                                                                <Target className="w-3 h-3 mr-1.5" /> {target} TARGETS
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
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Action Footer for Expanded Mode */}
                                {(!isArchived) && <div className="flex items-center justify-between gap-3 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
                                    <Button
                                        className={cn(
                                            "rounded-xl h-11 text-white shadow-lg transition-all font-bold",
                                            status === 'DRAFT'
                                                ? "bg-zinc-600 hover:bg-zinc-700 shadow-zinc-500/30 hover:shadow-zinc-500/50"
                                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:shadow-indigo-500/50"
                                        )}
                                        onClick={handleStartCampaign}
                                    >
                                        {status === 'DRAFT' ? (
                                            <>
                                                <ArrowUpRight className="w-4 h-4 mr-2" />
                                                Resume Setup
                                            </>
                                        ) : status === 'PAUSED' ? (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume Campaign
                                            </>
                                        ) : status === 'READY' ? (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Open
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Start Campaign
                                            </>
                                        )}
                                    </Button>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "rounded-xl h-11 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-50 transition-all duration-300"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onEditClick) onEditClick(campaign.id);
                                                else setIsEditing(!isEditing);
                                            }}
                                            title="Edit campaign"
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit Campaign
                                        </Button>

                                        {/* [NEW] Delete Policy: Only DRAFT or campaigns with 0 calls */}
                                        {(status === 'DRAFT' || (campaign.stats?.execution_count === 0)) ? (
                                            <Button
                                                variant="ghost"
                                                className="rounded-xl h-11 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 transition-all duration-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(e);
                                                }}
                                                title="Delete campaign"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        ) : (
                                            // Show Archive Option if calls exist
                                            <Button
                                                variant="ghost"
                                                className="rounded-xl h-11 text-amber-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10 transition-all duration-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchiveClick(e);
                                                }}
                                                title="Archive campaign"
                                            >
                                                <Layers className="w-4 h-4 mr-2" />
                                                Archive
                                            </Button>
                                        )}
                                    </div>
                                </div>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export const CampaignCard = React.memo(CampaignCardBase, (prev, next) => {
    return prev.campaign.id === next.campaign.id && prev.isExpanded === next.isExpanded && prev.campaign === next.campaign && prev.isArchived === next.isArchived;
});
