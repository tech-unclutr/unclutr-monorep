"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Loader2, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudySummary {
    id: string;
    title: string;
    status: string;
    briefing?: string | null;
    created_at: string;
    updated_at: string;
}

function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const hr = Math.floor(diffMs / (1000 * 60 * 60));
    if (hr < 1) return "just now";
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

export default function StudyPickerPage() {
    const [studies, setStudies] = useState<StudySummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = (await api.get("/study-planner/studies")) as StudySummary[];
                if (!cancelled) {
                    setStudies(data);
                    setError(null);
                }
            } catch (e) {
                if (cancelled) return;
                setError(
                    e instanceof ApiError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : String(e),
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <header className="flex items-start justify-between gap-6 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                                Studies
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                                Pick a study to design, recruit for, or execute. Each phase has its
                                own URL — refresh-safe, deep-linkable, bookmarkable.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/study/new"
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-medium text-white",
                            "shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:opacity-90 active:scale-[0.98] transition-all shrink-0",
                        )}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New study
                    </Link>
                </header>

                <div className="space-y-2">
                    {studies === null && !error ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                            Loading studies…
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-6 text-sm text-rose-700 dark:text-rose-400">
                            Couldn't load studies: {error}
                        </div>
                    ) : (studies ?? []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center">
                            <p className="text-sm font-medium text-foreground">
                                No studies yet
                            </p>
                            <p className="mt-1 text-[12.5px] text-muted-foreground">
                                Create your first study from the playground to start recruiting.
                            </p>
                        </div>
                    ) : (
                        (studies ?? []).map((s) => (
                            <Link
                                key={s.id}
                                href={`/dashboard/study/${s.id}/design`}
                                className="group flex items-center gap-4 rounded-xl border border-gray-100 dark:border-[#27272A] bg-card px-5 py-4 hover:border-indigo-500/30 hover:shadow-[0_8px_24px_-12px_rgba(99,102,241,0.12)] transition-all"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[13.5px] font-medium text-foreground">
                                        {s.title}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <span className="uppercase tracking-wide">{s.status}</span>
                                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                        <span>Updated {formatRelative(s.updated_at)}</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
