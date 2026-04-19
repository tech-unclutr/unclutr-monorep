"use client";

import React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
                {children}
            </div>
        </div>
    );
}

export function CriteriaList({
    label,
    tone,
    items,
}: {
    label: string;
    tone: "include" | "exclude";
    items: string[];
}) {
    const toneStyles =
        tone === "include"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    const Icon = tone === "include" ? CheckIcon : XIcon;
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                        toneStyles,
                    )}
                >
                    <Icon className="w-3 h-3" />
                    {label}
                </span>
            </div>
            <ul className="space-y-1.5">
                {items.map((item, i) => (
                    <li
                        key={i}
                        className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300 flex gap-2"
                    >
                        <span
                            className={cn(
                                "shrink-0 mt-2 w-1 h-1 rounded-full",
                                tone === "include" ? "bg-emerald-500/60" : "bg-rose-500/60",
                            )}
                        />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}