"use client";

import { FileText, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QueueLead {
    id: string;
    first_name: string;
    last_name: string | null;
    contact_number: string;
    language: string | null;
    cohort_id: string | null;
    cohort_name: string | null;
    participant_status: string | null;
    // Resolved server-side from cohort.agent_configuration_id. Null when the
    // cohort falls back to the hardcoded persona — bucketed under a synthetic
    // slot key by the runner.
    agent_id: string | null;
}

const STATUS_TINT: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    READY: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
    PROCESSING: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    FAILED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
};

function fullName(lead: QueueLead): string {
    const f = (lead.first_name || "").trim();
    const l = (lead.last_name || "").trim();
    return [f, l].filter(Boolean).join(" ") || "Unnamed lead";
}

function initial(name: string): string {
    return (name.trim().charAt(0) || "?").toUpperCase();
}

export function LeadRow({
    lead,
    onView,
}: {
    lead: QueueLead;
    onView: () => void;
}) {
    const name = fullName(lead);
    const status = lead.participant_status?.toUpperCase() ?? null;

    return (
        <div className="group flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold tracking-tight text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                {initial(name)}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                    {name}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">{lead.contact_number}</span>
                    {lead.cohort_name && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span className="truncate">{lead.cohort_name}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    {lead.language ? (
                        <>
                            <Globe className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                            {lead.language}
                        </>
                    ) : (
                        <>
                            <User className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                            <span className="text-muted-foreground">No language</span>
                        </>
                    )}
                </span>

                {status && (
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            STATUS_TINT[status] ??
                                "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
                        )}
                    >
                        {status}
                    </span>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View script"
                    onClick={onView}
                    className="h-8 w-8 opacity-70 transition-opacity group-hover:opacity-100"
                >
                    <FileText className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
