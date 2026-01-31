"use strict";
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, ChevronDown, ChevronUp, Calendar, Clock, Target, Users, Sparkles, BrainCircuit, ShieldAlert, AlignLeft, Mic, FileText, Pencil, Trash2, Briefcase, User, MessageSquare, Gift, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

interface CampaignCardProps {
    campaign: any;
    variant?: 'default' | 'summary';
    onClick?: () => void;
    onEdit?: (id: string, updates: any) => Promise<void>;
    onEditClick?: (id: string) => void;
    onDelete?: (id: string) => Promise<void>;
    className?: string;
}

export const CampaignCard = ({
    campaign,
    variant = 'default',
    onClick,
    onEdit,
    onEditClick,
    onDelete,
    className,
    isExpanded: propIsExpanded,
    onToggleExpand
}: CampaignCardProps & { isExpanded?: boolean; onToggleExpand?: () => void }) => {
    const [internalIsExpanded, setInternalIsExpanded] = useState(variant === 'default');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Controlled or Uncontrolled
    const isExpanded = propIsExpanded !== undefined ? propIsExpanded : internalIsExpanded;

    // Form State
    const [primaryGoal, setPrimaryGoal] = useState(campaign?.campaign_overview?.primary_goal || campaign?.name || "Untitled Campaign");
    const [editedData, setEditedData] = useState(campaign?.bolna_extracted_data || {});

    // Destructure Config Data (The "Plan")
    const {
        name,
        created_at,
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
        call_duration_limit,
        total_call_target
    } = campaign;

    // Derived Metrics
    const totalTargets = Object.values(cohort_config as Record<string, number>).reduce((a, b) => a + b, 0) || total_call_target || 0;
    const activeCohortCount = selected_cohorts?.length || Object.keys(cohort_config).length || 0;
    const maxDurationMins = call_duration_limit ? Math.floor(call_duration_limit / 60) : 10;
    const activeWindows = execution_windows?.length || 0;

    // Status Config
    const statusConfig: Record<string, { label: string, color: string, bg: string, border: string }> = {
        'COMPLETED': { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        'IN_PROGRESS': { label: 'Active', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        'FAILED': { label: 'Attention', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        'DRAFT': { label: 'Draft', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
        'SCHEDULED': { label: 'Scheduled', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
    };

    const currentStatus = statusConfig[status] || statusConfig['DRAFT'];

    // Handlers
    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onEdit) return;
        setIsSaving(true);
        try {
            await onEdit(campaign.id, {
                campaign_overview: { ...campaign.campaign_overview, primary_goal: primaryGoal },
                bolna_extracted_data: editedData
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

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl",
                isExpanded
                    ? "rounded-[40px] border border-indigo-500/30 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.2)] z-20 my-6 ring-1 ring-indigo-500/20 scale-[1.01]"
                    : "rounded-[28px] border border-zinc-100 dark:border-zinc-800/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:scale-[1.005] cursor-pointer",
                className
            )}
            onClick={(e) => {
                if (onClick) onClick();
                else if (!isEditing) toggleExpand(e);
            }}
        >
            {/* Ambient Grading Glow - More dramatic in expanded mode */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br from-indigo-500/[0.08] via-fuchsia-500/[0.05] to-purple-500/[0.08] pointer-events-none transition-opacity duration-1000",
                isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )} />

            {/* Mesh Gradient Background (Expanded Only) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none overflow-hidden"
                    >
                        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Indicator Strip */}
            <div className={cn(
                "absolute top-0 left-0 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700",
                isExpanded ? "h-2 opacity-100" : "h-1 opacity-0 group-hover:opacity-100"
            )} />

            <CardContent className={cn("relative transition-all duration-700", isExpanded ? "p-10 md:p-14" : "p-8")}>
                {/* 1. Header Section: Identity & Status */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                    <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-4">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] font-black px-4 py-1.5 uppercase tracking-[0.2em] rounded-full transition-all duration-500",
                                    currentStatus.color, currentStatus.bg, currentStatus.border,
                                    isExpanded && "scale-110 shadow-sm"
                                )}
                            >
                                {currentStatus.label}
                            </Badge>
                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                                {created_at ? format(new Date(created_at), 'MMMM do, yyyy') : 'New Campaign'}
                            </span>
                        </div>
                        {isEditing ? (
                            <Textarea
                                value={primaryGoal}
                                onChange={(e) => setPrimaryGoal(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-4xl font-black bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none rounded-3xl p-6"
                            />
                        ) : (
                            <h3 className={cn(
                                "font-black text-zinc-900 dark:text-zinc-50 leading-[1.1] transition-all duration-700 tracking-[-0.03em]",
                                isExpanded
                                    ? "text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500"
                                    : "text-2xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                            )}>
                                {name || primaryGoal}
                            </h3>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 self-start mt-2">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl"
                                >
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onEditClick) onEditClick(campaign.id);
                                            else setIsEditing(!isEditing);
                                        }}
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </Button>
                                    <Separator orientation="vertical" className="h-5" />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                        onClick={handleDeleteClick}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleExpand}
                            className={cn(
                                "h-12 w-12 rounded-2xl transition-all duration-500 shadow-sm",
                                isExpanded
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
                            )}
                        >
                            {isExpanded ? <ChevronUp className="w-7 h-7" /> : <ChevronDown className="w-6 h-6" />}
                        </Button>
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
                            <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800/50 space-y-16">
                                {/* A. Context Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { title: "Brand Identity", icon: Briefcase, text: brand_context, color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100/50", darkBg: "dark:bg-indigo-500/10", darkBorder: "dark:border-indigo-500/20" },
                                        { title: "Target Audience", icon: User, text: customer_context, color: "text-purple-600", bg: "bg-purple-50/50", border: "border-purple-100/50", darkBg: "dark:bg-purple-500/10", darkBorder: "dark:border-purple-500/20" },
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
                                        <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2 text-xs font-bold rounded-full">
                                            {activeCohortCount} ACTIVE SEGMENTS
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {(selected_cohorts.length > 0 ? selected_cohorts : Object.keys(cohort_config)).map((cohortName: string, i: number) => {
                                            const target = cohort_config[cohortName] || 0;
                                            const questions = cohort_questions[cohortName] || preliminary_questions;
                                            const activeIncentive = cohort_incentives[cohortName] || incentive;
                                            const avatarIndex = (cohortName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 12) + 1;

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
                                                        <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white dark:border-zinc-800 shadow-xl group-hover/cohort:scale-105 transition-transform duration-500">
                                                            <img src={`/images/avatars/avatar_${avatarIndex}.png`} alt={cohortName} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h5 className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight">{cohortName}</h5>
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
                                                                <MessageSquare className="w-3.5 h-3.5" /> Key Questions
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. Footer: Config Summary (Always Visible) */}
                <div className={cn(
                    "flex flex-wrap items-center gap-x-12 gap-y-6 transition-all duration-500",
                    isExpanded ? "mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800/50" : "mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50"
                )}>
                    {/* Metric 1: Targets */}
                    <div className="flex items-center gap-4 group/metric">
                        <div className={cn("p-2.5 rounded-2xl transition-colors shadow-sm", isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-zinc-50 text-zinc-400 group-hover/metric:bg-indigo-50 group-hover/metric:text-indigo-600")}>
                            <Target className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none">{totalTargets}</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mt-1">Total Targets</span>
                        </div>
                    </div>

                    {/* Metric 2: Duration */}
                    <div className="flex items-center gap-4 group/metric">
                        <div className={cn("p-2.5 rounded-2xl transition-colors shadow-sm", isExpanded ? "bg-purple-50 text-purple-600" : "bg-zinc-50 text-zinc-400 group-hover/metric:bg-purple-50 group-hover/metric:text-purple-600")}>
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none">{maxDurationMins}m</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mt-1">Calls</span>
                        </div>
                    </div>

                    {/* Metric 3: Windows */}
                    <div className="flex items-center gap-4 group/metric">
                        <div className={cn("p-2.5 rounded-2xl transition-colors shadow-sm", isExpanded ? "bg-orange-50 text-orange-600" : "bg-zinc-50 text-zinc-400 group-hover/metric:bg-orange-50 group-hover/metric:text-orange-600")}>
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none">{activeWindows} Slots</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mt-1">Schedule</span>
                        </div>
                    </div>

                    {/* Tags (Only collapsed) - Visual Preview of Cohorts */}
                    {!isExpanded && selected_cohorts.length > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                            {selected_cohorts.slice(0, 3).map((c: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-2.5 py-1 bg-zinc-100 text-zinc-500 border-transparent hover:bg-zinc-200">
                                    {c}
                                </Badge>
                            ))}
                            {selected_cohorts.length > 3 && (
                                <span className="text-[10px] font-bold text-zinc-300 ml-1">+{selected_cohorts.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
