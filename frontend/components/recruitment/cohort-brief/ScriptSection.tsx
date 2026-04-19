"use client";

import React from "react";
import type { CohortBriefData } from "../cohortBriefDummyData";

export function ScriptSection({ data }: { data: CohortBriefData["script"] }) {
    return (
        <ol className="space-y-4">
            {data.questions.map((q, i) => (
                <li key={q.id} className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold tabular-nums shrink-0 mt-0.5">
                        {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-relaxed">
                            {q.question}
                        </p>
                        {q.probes.length > 0 && (
                            <ul className="space-y-1 pl-3 border-l-2 border-rose-500/20">
                                {q.probes.map((p, pi) => (
                                    <li
                                        key={pi}
                                        className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed"
                                    >
                                        <span className="text-rose-500/70 dark:text-rose-400/70 mr-1.5">
                                            ↳
                                        </span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    );
}
