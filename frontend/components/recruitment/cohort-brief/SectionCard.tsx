"use client";

import React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type SectionId = "context" | "screening" | "moderator" | "structure" | "script";
export type Accent = "indigo" | "emerald" | "amber" | "violet" | "rose";

export const ACCENT_STYLES: Record<Accent, { chip: string; number: string }> = {
    indigo: {
        chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        number: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
        chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        number: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        number: "text-amber-600 dark:text-amber-400",
    },
    violet: {
        chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        number: "text-violet-600 dark:text-violet-400",
    },
    rose: {
        chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        number: "text-rose-600 dark:text-rose-400",
    },
};

interface SectionCardProps {
    number: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accent: Accent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function SectionCard({
    number,
    title,
    subtitle,
    icon,
    accent,
    open,
    onOpenChange,
    children,
}: SectionCardProps) {
    const styles = ACCENT_STYLES[accent];
    return (
        <Collapsible
            open={open}
            onOpenChange={onOpenChange}
            className={cn(
                "rounded-xl border border-gray-100 dark:border-[#27272A] bg-white dark:bg-zinc-950 shadow-sm transition-colors",
                open && "shadow-md",
            )}
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.02] rounded-xl transition-colors"
                >
                    <div className={cn("p-2 rounded-lg shrink-0", styles.chip)}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "text-[11px] font-bold tabular-nums uppercase tracking-wide",
                                    styles.number,
                                )}
                            >
                                Section {number}
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                            {title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {subtitle}
                        </p>
                    </div>
                    <ChevronDownIcon
                        className={cn(
                            "w-4 h-4 text-gray-400 dark:text-zinc-500 transition-transform duration-200 shrink-0",
                            open && "rotate-180",
                        )}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                <div className="px-5 pb-5 pt-4 space-y-4 border-t border-gray-100 dark:border-[#27272A]">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}