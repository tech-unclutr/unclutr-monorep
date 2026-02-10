"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StructuredContext {
    intent: string;
    key_needs: string[];
    timeline: string;
    constraints: string[];
    next_action: string;
}

interface StructuredLeadContextProps {
    structuredContext?: StructuredContext | null;
    aiSummary?: string | null;
    className?: string;
}

export const StructuredLeadContext = ({
    structuredContext,
    aiSummary,
    className
}: StructuredLeadContextProps) => {
    // Fallback to plain text if no structured context
    if (!structuredContext) {
        return (
            <div className={cn("space-y-3", className)}>
                {aiSummary ? (
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-[11px] font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {aiSummary}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-400 italic">No summary available.</p>
                )}
            </div>
        );
    }

    const sections = [
        {
            icon: Target,
            label: "Intent",
            value: structuredContext.intent,
            color: "text-orange-500",
            bgColor: "bg-orange-50 dark:bg-orange-500/10",
            borderColor: "border-orange-200 dark:border-orange-500/20"
        },
        {
            icon: CheckCircle2,
            label: "Key Needs",
            value: structuredContext.key_needs,
            color: "text-emerald-500",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
            borderColor: "border-emerald-200 dark:border-emerald-500/20",
            isList: true
        },
        {
            icon: Clock,
            label: "Timeline",
            value: structuredContext.timeline,
            color: "text-blue-500",
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
            borderColor: "border-blue-200 dark:border-blue-500/20"
        },
        {
            icon: AlertCircle,
            label: "Constraints",
            value: structuredContext.constraints,
            color: "text-amber-500",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
            borderColor: "border-amber-200 dark:border-amber-500/20",
            isList: true
        },
        {
            icon: ArrowRight,
            label: "Next Action",
            value: structuredContext.next_action,
            color: "text-purple-500",
            bgColor: "bg-purple-50 dark:bg-purple-500/10",
            borderColor: "border-purple-200 dark:border-purple-500/20",
            highlight: true
        }
    ];

    return (
        <div className={cn("space-y-3", className)}>
            {sections.map((section, index) => {
                const Icon = section.icon;
                const hasValue = section.isList
                    ? Array.isArray(section.value) && section.value.length > 0
                    : section.value && section.value !== "Not specified" && section.value !== "Not mentioned";

                if (!hasValue) return null;

                return (
                    <motion.div
                        key={section.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            "p-3 rounded-xl border transition-all",
                            section.bgColor,
                            section.borderColor,
                            section.highlight && "ring-2 ring-purple-500/20"
                        )}
                    >
                        <div className="flex items-start gap-2">
                            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", section.color)} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                        {section.label}
                                    </span>
                                    {section.highlight && (
                                        <Badge className="h-4 px-1.5 text-[8px] font-black bg-purple-500 text-white border-0">
                                            RECOMMENDED
                                        </Badge>
                                    )}
                                </div>
                                {section.isList ? (
                                    <ul className="space-y-1">
                                        {(section.value as string[]).map((item, i) => (
                                            <li
                                                key={i}
                                                className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5"
                                            >
                                                <span className={cn("mt-1.5 w-1 h-1 rounded-full shrink-0", section.color.replace('text-', 'bg-'))} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        {section.value as string}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            {/* High-Signal Badge */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    AI-Extracted Insights
                </span>
            </div>
        </div>
    );
};
