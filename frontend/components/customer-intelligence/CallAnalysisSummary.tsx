import React from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Target,
    Users,
    ShieldAlert,
    Clock,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    FileText,
    BrainCircuit
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CallAnalysisSummaryProps {
    campaign: any;
    onClose: () => void;
    onViewCampaign: () => void;
}

export function CallAnalysisSummary({ campaign, onClose, onViewCampaign }: CallAnalysisSummaryProps) {
    if (!campaign) return null;

    const {
        name,
        bolna_extracted_data,
        bolna_conversation_time,
        quality_score
    } = campaign;

    // Fallback to decision_context if bolna_extracted_data is missing (for legacy/simulation compatibility)
    const data = bolna_extracted_data || campaign.decision_context || {};

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="w-full flex justify-center items-center min-h-[550px] p-6 lg:p-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl"
            >
                {/* 1. Header with Success Animation */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-20" />
                        <Sparkles className="w-10 h-10 text-emerald-500" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight font-display"
                    >
                        Intelligence Captured
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-gray-500 dark:text-gray-400 text-lg"
                    >
                        We've extracted a strategic campaign from your conversation.
                    </motion.p>
                </div>

                {/* 2. Key Insights Card (Hero) */}
                <Card className="border-none shadow-2xl shadow-emerald-500/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden rounded-[2rem] mb-8 relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />

                    <CardContent className="p-8 md:p-10 relative z-10">
                        {/* Primary Goal / Hypothesis */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 pl-2 pr-3 py-1 text-xs uppercase tracking-wider font-bold rounded-full">
                                    <Target className="w-3 h-3 mr-1.5" />
                                    Primary Objective
                                </Badge>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
                                {data.primary_goal || data.decision_1 || "Goal extraction pending review..."}
                            </h3>
                        </div>

                        {/* Three Column Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-gray-100 dark:border-white/5">
                            {/* Metric 1: Target Audience */}
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    Target Cohorts
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {data.target_cohorts && data.target_cohorts.length > 0 ? (
                                        data.target_cohorts.slice(0, 2).map((cohort: string, i: number) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                                {cohort}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 italic text-sm">Not specified</span>
                                    )}
                                    {data.target_cohorts && data.target_cohorts.length > 2 && (
                                        <span className="text-xs text-gray-400 self-center">+{data.target_cohorts.length - 2} more</span>
                                    )}
                                </div>
                            </div>

                            {/* Metric 2: Success Metric */}
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Success Metric
                                </div>
                                <div className="text-gray-900 dark:text-white font-medium text-sm md:text-base leading-relaxed">
                                    {data.success_metric_1 || "To be defined"}
                                </div>
                            </div>

                            {/* Metric 3: Quality Score */}
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                    AI Quality Score
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {quality_score}<span className="text-base text-gray-400 font-normal">/5</span>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200 dark:bg-white/10 mx-2" />
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <p>{formatDuration(bolna_conversation_time || 0)}</p>
                                        <p>Duration</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Constraints / Insights Footer */}
                        {(data.constraints || data.evidence_needed) && (
                            <div className="mt-4 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-4">
                                {data.constraints && data.constraints.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-500/20">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span className="font-bold">Constraint:</span>
                                        {data.constraints[0]}
                                    </div>
                                )}
                                {data.decision_1_deadline && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="font-bold">Deadline:</span>
                                        {data.decision_1_deadline}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="lg"
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl"
                    >
                        Run Another Interview
                    </Button>
                    <Button
                        onClick={onViewCampaign}
                        size="lg"
                        className="rounded-xl px-8 h-14 bg-gray-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-base hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl shadow-gray-900/10 dark:shadow-white/5 transition-all group"
                    >
                        <FileText className="w-5 h-5 mr-2" />
                        View Full Campaign Strategy
                        <ArrowRight className="w-5 h-5 ml-2 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
