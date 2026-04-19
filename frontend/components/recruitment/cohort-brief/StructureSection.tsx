"use client";

import React from "react";
import type { CohortBriefData } from "../cohortBriefDummyData";

export function StructureSection({ data }: { data: CohortBriefData["structure"] }) {
    return (
        <div className="space-y-2">
            {data.phases.map((phase, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-[#27272A] bg-gray-50/60 dark:bg-white/[0.02] px-3.5 py-3"
                >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-bold tabular-nums shrink-0 mt-0.5">
                        {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                {phase.name}
                            </span>
                            <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full tabular-nums">
                                {phase.duration}
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
                            {phase.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
