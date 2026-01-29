import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    Calendar,
    Clock,
    ArrowRight,
    BrainCircuit,
    Target,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    Edit3,
    Save,
    X,
    TrendingUp,
    Users,
    ShieldAlert,
    Pencil,
    Mic,
    FileText,
    AlignLeft,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CampaignCardProps {
    campaign: any;
    variant?: 'default' | 'summary';
    index?: number;
    onClick?: () => void;
    onUpdate?: (updatedCampaign: any) => void;
}

export function CampaignCard({ campaign, variant = 'default', index = 0, onClick, onUpdate }: CampaignCardProps) {
    // ------------------------------------------------------------------
    // State & Helpers
    // ------------------------------------------------------------------
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(variant === 'default'); // Default expands, summary starts collapsed
    const [isExtractedDataExpanded, setIsExtractedDataExpanded] = useState(false);

    // Helper: Format keys to Title Case
    const formatKey = (key: string) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Helper Component: Recursively render data
    const DataRenderer = ({ data, level = 0 }: { data: any, level?: number }) => {
        if (!data || typeof data !== 'object') return null;

        return (
            <div className={cn("grid gap-4", level > 0 && "border-l-2 border-gray-100 dark:border-white/10 pl-4 ml-1")}>
                {Object.entries(data).map(([key, value]: [string, any]) => {
                    // Skip internal fields if any
                    if (key.startsWith('_')) return null;

                    const isArray = Array.isArray(value);
                    const isObject = typeof value === 'object' && value !== null && !isArray;

                    return (
                        <div key={key} className="space-y-1.5">
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                {formatKey(key)}
                            </div>

                            {/* Render Object */}
                            {isObject && (
                                <div className="mt-2">
                                    <DataRenderer data={value} level={level + 1} />
                                </div>
                            )}

                            {/* Render Array */}
                            {isArray && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {value.length > 0 ? value.map((item: any, i: number) => (
                                        typeof item === 'object' ? (
                                            <div key={i} className="w-full">
                                                <DataRenderer data={item} level={level + 1} />
                                            </div>
                                        ) : (
                                            <Badge key={i} variant="secondary" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 font-normal">
                                                {item}
                                            </Badge>
                                        )
                                    )) : <span className="text-sm text-gray-400 italic">None</span>}
                                </div>
                            )}

                            {/* Render Primitive */}
                            {!isObject && !isArray && (
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {String(value)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // We maintain a local copy of the extracted data for editing
    const [editedData, setEditedData] = useState<any>({});

    // Initialize/Reset local data when campaign changes
    useEffect(() => {
        if (campaign?.bolna_extracted_data) {
            // Deep copy to avoid mutating props
            setEditedData(JSON.parse(JSON.stringify(campaign.bolna_extracted_data)));
        } else if (campaign?.decision_context) {
            setEditedData(JSON.parse(JSON.stringify(campaign.decision_context)));
        } else {
            setEditedData({});
        }
    }, [campaign]);

    if (!campaign) return null;

    const {
        name,
        status,
        created_at,
        bolna_conversation_time,
        quality_score,
        bolna_raw_data
    } = campaign;

    const recordingUrl = bolna_raw_data?.telephony_data?.recording_url;
    const transcript = bolna_raw_data?.transcript || "No transcript available.";
    const summary = bolna_raw_data?.summary || "No summary available.";
    const conversationDuration = bolna_raw_data?.conversation_duration || 0;


    // Helper to safely get nested values (safe read)
    const getNested = (obj: any, path: string, fallback = "") => {
        if (!obj) return fallback;
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined) return fallback;
            current = current[key];
        }
        return current === undefined || current === null ? fallback : current;
    };

    // Helper to update nested values (safe write)
    const setNested = (obj: any, path: string, value: any) => {
        const newObj = JSON.parse(JSON.stringify(obj)); // Deep clone
        const parts = path.split('.');
        let current = newObj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newObj;
    };

    const handleInputChange = (path: string, value: any) => {
        const newData = setNested(editedData, path, value);
        setEditedData(newData);
    };

    // Special handler for array inputs (comma separated)
    const handleArrayChange = (path: string, value: string) => {
        const array = value.split(',').map(item => item.trim()).filter(Boolean);
        handleInputChange(path, array);
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        e.preventDefault(); // Prevent any default behavior

        console.log("[CampaignCard] handleSave called", { campaignId: campaign.id, editedData });

        try {
            setIsSaving(true);
            console.log("[CampaignCard] Sending PATCH request...");

            const response = await api.patch(`/intelligence/campaigns/${campaign.id}/extracted-data`, {
                extracted_data: editedData
            });

            console.log("[CampaignCard] Save successful", response);
            toast.success("Campaign strategy updated");
            setIsEditing(false);

            if (onUpdate) {
                onUpdate(response); // Pass updated campaign back to parent
            }
        } catch (error) {
            console.error("[CampaignCard] Failed to update campaign:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        // Reset to original
        if (campaign?.bolna_extracted_data) {
            setEditedData(JSON.parse(JSON.stringify(campaign.bolna_extracted_data)));
        }
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        if (!seconds) return "0s";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    // Status Config
    const statusConfig = {
        COMPLETED: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Completed" },
        FAILED: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", label: "Failed" },
        IN_PROGRESS: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "In Progress" },
        draft: { icon: Clock, color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20", label: "Draft" },
    };

    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    // Derived values for display
    const primaryGoal = getNested(editedData, "campaign_overview.primary_goal", name);
    const successMetric = getNested(editedData, "execution_details.success_criteria", "Not defined");
    // Handle both old and new structure or varying extraction
    // Try explicit path first, then fallback
    const targetCohorts = editedData?.target_cohorts ||
        getNested(editedData, "target_customers.customer_segments") ||
        getNested(editedData, "target_customers.primary_segments") ||
        getNested(editedData, "target_customers") ||
        [];
    const timeline = getNested(editedData, "campaign_constraints.timeline", "Not specified");
    const dependency = getNested(editedData, "execution_details.decision_dependency", "");


    // ------------------------------------------------------------------
    // RENDER CONTENT BLOCK
    // ------------------------------------------------------------------
    const CardContentBlock = () => (
        <div className="space-y-10 pt-8 border-t border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* 2. Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Audience */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Users className="w-4 h-4 text-blue-500" />
                        Target Cohorts
                    </div>
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input
                                value={Array.isArray(targetCohorts) ? targetCohorts.join(", ") : String(targetCohorts)}
                                onChange={(e) => handleArrayChange("target_customers.customer_segments", e.target.value)}
                                placeholder="e.g. Churned Users, New Signups (comma separated)"
                                className="bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                            <p className="text-[10px] text-gray-400">Separate multiple cohorts with commas</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(targetCohorts) && targetCohorts.length > 0 ? (
                                targetCohorts.map((cohort: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                        {cohort}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-gray-400 italic text-sm">{typeof targetCohorts === 'string' ? targetCohorts : "Not specified"}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-purple-500" />
                        Timeline & Constraints
                    </div>
                    {isEditing ? (
                        <Input
                            value={timeline}
                            onChange={(e) => handleInputChange("campaign_constraints.timeline", e.target.value)}
                            className="bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                    ) : (
                        <div className="text-gray-900 dark:text-white font-medium">
                            {timeline}
                        </div>
                    )}
                </div>

                {/* Success Metric */}
                <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Success Criteria
                    </div>
                    {isEditing ? (
                        <Textarea
                            value={successMetric}
                            onChange={(e) => handleInputChange("execution_details.success_criteria", e.target.value)}
                            className="bg-white dark:bg-zinc-900 min-h-[80px] focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                    ) : (
                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                            {successMetric}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Evidence Section (Audio & Transcript) */}
            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-white/5">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Evidence & Analysis
                </h4>

                {/* Summary */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <AlignLeft className="w-3 h-3 text-purple-500" /> Conversation Summary
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        {summary}
                    </p>
                </div>

                {/* Audio Player */}
                {recordingUrl && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Mic className="w-3 h-3 text-red-500" /> Recording
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 border border-gray-100 dark:border-zinc-800">
                            <audio controls className="w-full h-8 outline-none">
                                <source src={recordingUrl} type="audio/wav" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                )}

                {/* Transcript - Scrollable */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <FileText className="w-3 h-3 text-orange-500" /> Full Transcript
                    </div>
                    <ScrollArea className="h-[200px] w-full rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                        <div className="text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                            {transcript}
                        </div>
                    </ScrollArea>
                </div>
            </div>


            {/* Footer / Meta */}
            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-900 dark:text-white">{formatDuration(conversationDuration)}</span>
                        <span className="text-xs">Call Duration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                            <BrainCircuit className="w-4 h-4 text-orange-500" />
                            {quality_score}/5
                        </div>
                        <span className="text-xs">AI Clarity Score</span>
                    </div>
                </div>

                {dependency && !isEditing && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-500/20">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span className="font-bold">Dependency:</span>
                        {dependency}
                    </div>
                )}
            </div>
        </div>
    );

    // ------------------------------------------------------------------
    // RENDER: UNIFIED CARD
    // ------------------------------------------------------------------
    return (
        <Card
            className={cn(
                "overflow-hidden border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02] transition-all duration-700 ease-out relative group rounded-[2rem]",
                isExpanded ? "lg:col-span-2 ring-2 ring-orange-500/30 shadow-2xl shadow-orange-500/10 scale-[1.02] z-10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer hover:shadow-lg hover:scale-[1.01] hover:border-orange-200 dark:hover:border-orange-500/20"
            )}
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
            tabIndex={0}
            role="button"
            aria-expanded={isExpanded}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    !isEditing && setIsExpanded(!isExpanded);
                }
            }}
        >
            <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 transition-all duration-500", isExpanded ? "opacity-100 h-1.5" : "opacity-0 group-hover:opacity-60 group-hover:h-0.5")} />

            {/* Edit Controls (Only show when expanded) */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="absolute top-6 md:top-8 right-44 z-20 flex items-center gap-4 h-5"
                >
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="h-8 w-8 rounded-full hover:bg-orange-500/10 text-gray-400 hover:text-orange-500 transition-all hover:scale-110"
                            aria-label="Edit campaign"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                    )}
                </motion.div>
            )}

            {/* Toggle Button for Expand/Collapse (Visible always) */}
            <div className="absolute top-6 right-4 z-20">
                {!isExpanded && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-gray-400 group-hover:text-orange-500 transition-all group-hover:scale-110"
                        aria-label="Expand campaign details"
                    >
                        <ChevronDown className="w-5 h-5 group-hover:animate-bounce" />
                    </Button>
                )}
                {isExpanded && !isEditing && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        className="h-8 w-8 rounded-full text-gray-400 hover:text-orange-500 transition-all hover:scale-110"
                        aria-label="Collapse campaign details"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </Button>
                )}
            </div>

            <CardContent className="p-6 md:p-8">
                {/* Header Section (Always Visible) */}
                <div className="space-y-4">
                    {/* Meta Top */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {created_at ? format(new Date(created_at), 'MMM d, yyyy') : 'Just now'}
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 h-5 uppercase tracking-wider mr-8", currentStatus.color, currentStatus.bg, currentStatus.border)}>
                            {currentStatus.label}
                        </Badge>
                    </div>

                    {/* Title / Primary Goal */}
                    <div className="pr-12 mt-6">
                        {isEditing && isExpanded ? (
                            <Textarea
                                value={primaryGoal}
                                onChange={(e) => handleInputChange("campaign_overview.primary_goal", e.target.value)}
                                className="text-xl md:text-2xl font-bold bg-white dark:bg-zinc-900 min-h-[80px] border-orange-200 focus:ring-orange-500 mb-2"
                            />
                        ) : (
                            <h3 className={cn("font-bold text-gray-900 dark:text-white leading-tight transition-all duration-300", isExpanded ? "text-2xl md:text-3xl mb-6 leading-snug" : "text-lg md:text-xl line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400")}>
                                {primaryGoal}
                            </h3>
                        )}
                    </div>

                    {/* Tags (Only visible when collapsed or slightly modified when expanded) */}
                    {!isExpanded && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {Array.isArray(targetCohorts) && targetCohorts.slice(0, 3).map((cohort: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-medium border-none">
                                    {cohort}
                                </Badge>
                            ))}
                            {Array.isArray(targetCohorts) && targetCohorts.length > 3 && (
                                <span className='text-[10px] text-gray-400 self-center'>+{targetCohorts.length - 3} more</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CardContentBlock />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Extracted Data (Collapsible) */}
                <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExtractedDataExpanded(!isExtractedDataExpanded);
                        }}
                        className="w-full flex items-center justify-between group"
                    >
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                            <BrainCircuit className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                            Extracted Data Analysis
                        </h4>
                        <div className={cn("p-1 rounded-full transition-colors", isExtractedDataExpanded ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500")}>
                            {isExtractedDataExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>

                    <AnimatePresence>
                        {isExtractedDataExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-6 border border-gray-100 dark:border-white/5 space-y-6">
                                    <DataRenderer data={editedData} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Preview (Only visible when collapsed) */}
                {!isExpanded && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" title="Call Duration">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(conversationDuration)}
                        </div>
                        {quality_score !== undefined && (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" title="AI Quality Score">
                                <BrainCircuit className="w-3.5 h-3.5 text-orange-500" />
                                {quality_score}/5
                            </div>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
