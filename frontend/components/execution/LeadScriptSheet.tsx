"use client";

import { Globe } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import type { QueueLead } from "./LeadRow";

interface LeadScriptSheetProps {
    lead: QueueLead | null;
    script: string | undefined;
    onOpenChange: (open: boolean) => void;
}

function fullName(lead: QueueLead): string {
    const f = (lead.first_name || "").trim();
    const l = (lead.last_name || "").trim();
    return [f, l].filter(Boolean).join(" ") || "Unnamed lead";
}

export function LeadScriptSheet({
    lead,
    script,
    onOpenChange,
}: LeadScriptSheetProps) {
    return (
        <Sheet open={lead !== null} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl lg:max-w-3xl flex flex-col gap-4"
            >
                {lead && (
                    <>
                        <SheetHeader className="space-y-1 pr-8">
                            <SheetTitle className="tracking-tight">
                                {fullName(lead)}
                            </SheetTitle>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {lead.cohort_name && (
                                    <>
                                        <span className="truncate">
                                            {lead.cohort_name}
                                        </span>
                                        <span className="text-zinc-300 dark:text-zinc-700">
                                            ·
                                        </span>
                                    </>
                                )}
                                <span className="font-mono">
                                    {lead.contact_number}
                                </span>
                                {lead.language && (
                                    <>
                                        <span className="text-zinc-300 dark:text-zinc-700">
                                            ·
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Globe className="h-3 w-3" />
                                            {lead.language}
                                        </span>
                                    </>
                                )}
                            </div>
                        </SheetHeader>

                        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                            {script != null ? (
                                <pre className="h-full w-full overflow-auto scrollbar-subtle whitespace-pre-wrap break-words px-4 py-3 font-mono text-[12.5px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                                    {script}
                                </pre>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Script unavailable for this cohort.
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        This cohort's prompt failed to generate. Try refreshing the page.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
