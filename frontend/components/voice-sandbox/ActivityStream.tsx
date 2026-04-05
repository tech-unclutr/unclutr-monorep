"use client";

import React from "react";
import { ActivityRow } from "./ActivityRow";
import type { ActivityEntry } from "./types";

interface ActivityStreamProps {
    entries: ActivityEntry[];
}

export function ActivityStream({ entries }: ActivityStreamProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                Activity Stream
            </h2>

            {entries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 py-10 flex flex-col items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        No activity yet
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Completed interviews will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <ActivityRow key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}
