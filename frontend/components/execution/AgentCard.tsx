"use client";

import { motion } from "framer-motion";
import { Globe, Mic, PhoneCall, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QueueLead } from "./LeadRow";

export type Gender = "female" | "male" | "neutral";

export interface AgentConfiguration {
    id: string;
    name: string;
    display_name: string | null;
    description: string | null;
    voice_id: string;
    voice_provider: string;
    gender: Gender;
    language: string;
    is_default: boolean;
}

const GENDER_TINT: Record<Gender, { avatar: string; pip: string; label: string }> = {
    female: {
        avatar: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
        pip: "bg-rose-400 dark:bg-rose-300",
        label: "Female",
    },
    male: {
        avatar: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20",
        pip: "bg-indigo-400 dark:bg-indigo-300",
        label: "Male",
    },
    neutral: {
        avatar: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
        pip: "bg-zinc-400 dark:bg-zinc-500",
        label: "Neutral",
    },
};

function initial(name: string): string {
    const trimmed = (name || "?").trim();
    return trimmed.charAt(0).toUpperCase() || "?";
}

interface AgentCardProps {
    agent: AgentConfiguration;
    activeLeads?: QueueLead[];
    maxConcurrent?: number;
    onMoveBack?: (leadId: string) => void;
}

export function AgentCard({
    agent,
    activeLeads = [],
    maxConcurrent,
    onMoveBack,
}: AgentCardProps) {
    const tint = GENDER_TINT[agent.gender] ?? GENDER_TINT.neutral;
    const title = agent.display_name?.trim() || agent.name;
    const subtitle = agent.display_name?.trim() ? agent.name : null;
    const isActive = activeLeads.length > 0;

    return (
        <motion.div
            layout
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-zinc-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(24,24,27,0.18)] dark:hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]",
                isActive
                    ? "border-[#FF8A4C]/40 shadow-[0_0_0_1px_rgba(255,138,76,0.18),0_8px_24px_-12px_rgba(255,138,76,0.25)] dark:border-[#FF8A4C]/30"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
            )}
        >
            <div className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tracking-tight ring-1",
                            tint.avatar,
                        )}
                    >
                        {initial(title)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                            {title}
                        </div>
                        {subtitle && (
                            <div className="truncate font-mono text-[11px] text-muted-foreground mt-0.5">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>

                {agent.description && (
                    <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                        {agent.description}
                    </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <Chip>
                        <span className={cn("h-1.5 w-1.5 rounded-full", tint.pip)} />
                        {tint.label}
                    </Chip>
                    <Chip>
                        <Mic className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        <span className="font-mono">{agent.voice_id}</span>
                    </Chip>
                    <Chip>
                        <Globe className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        {agent.language}
                    </Chip>
                    {maxConcurrent !== undefined && (
                        <Chip>
                            <PhoneCall className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                            <span className="tabular-nums">
                                {activeLeads.length}/{maxConcurrent}
                            </span>
                        </Chip>
                    )}
                </div>
            </div>

            {activeLeads.length > 0 && (
                <div className="flex flex-col divide-y divide-[#FF8A4C]/15 border-t border-[#FF8A4C]/20 bg-gradient-to-br from-[#FF8A4C]/[0.06] to-[#FF8A4C]/[0.02] dark:divide-[#FF8A4C]/10 dark:border-[#FF8A4C]/15 dark:from-[#FF8A4C]/[0.08] dark:to-transparent">
                    {activeLeads.map((lead) => (
                        <motion.div
                            key={lead.id}
                            layoutId={`lead-${lead.id}`}
                            layout
                            className="flex items-center gap-3 px-5 py-3"
                        >
                            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold tracking-tight text-[#7A3A12] ring-1 ring-[#FF8A4C]/30 dark:bg-zinc-900 dark:text-[#FFB283]">
                                {(lead.first_name?.[0] ?? "?").toUpperCase()}
                                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF8A4C] opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF8A4C]" />
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[12px] font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {[lead.first_name, lead.last_name]
                                        .filter(Boolean)
                                        .join(" ") || "Unnamed lead"}
                                </div>
                                <div className="truncate font-mono text-[10px] text-muted-foreground">
                                    {lead.contact_number}
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF8A4C]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A04A1F] dark:bg-[#FF8A4C]/20 dark:text-[#FFB283]">
                                <PhoneCall className="h-3 w-3" />
                                Calling
                            </span>

                            {onMoveBack && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Move lead back to queue"
                                    onClick={() => onMoveBack(lead.id)}
                                    className="h-7 w-7 text-muted-foreground hover:bg-[#FF8A4C]/10 hover:text-[#A04A1F] dark:hover:text-[#FFB283]"
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            {children}
        </span>
    );
}
