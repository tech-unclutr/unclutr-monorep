"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { StudyContext as StudyContextValue } from "@/components/recruitment/study-context";

type PhaseKey = "design" | "recruitment" | "execution";

const PHASES: { key: PhaseKey; label: string; icon: typeof BookOpen }[] = [
    { key: "design", label: "Study Design", icon: BookOpen },
    { key: "recruitment", label: "Recruitment", icon: Users },
    { key: "execution", label: "Execution", icon: Radio },
];

interface RawStudy {
    id: string;
    title: string;
    briefing?: string | null;
    topic_guide?: {
        objectives?: Array<{ title: string; description?: string | null }>;
    } | null;
}

interface StudyShellContextValue {
    studyId: string;
    raw: RawStudy | null;
    studyContext: StudyContextValue | null;
    loading: boolean;
    error: string | null;
}

const StudyShellContext = createContext<StudyShellContextValue | undefined>(undefined);

export function useStudyShell(): StudyShellContextValue {
    const ctx = useContext(StudyShellContext);
    if (!ctx) {
        throw new Error("useStudyShell must be used inside /dashboard/study/[studyId] layout");
    }
    return ctx;
}

export default function StudyShellLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const params = useParams<{ studyId: string }>();
    const pathname = usePathname() ?? "";
    const studyId = params?.studyId;

    const [raw, setRaw] = useState<RawStudy | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studyId) return;
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const data = (await api.get(
                    `/study-planner/studies/${studyId}`,
                )) as RawStudy;
                if (!cancelled) {
                    setRaw(data);
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
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [studyId]);

    const studyContext: StudyContextValue | null = useMemo(() => {
        if (!raw) return null;
        return {
            studyId: raw.id,
            title: raw.title,
            briefing: raw.briefing ?? undefined,
            objectives: (raw.topic_guide?.objectives ?? []).map((o) => ({
                title: o.title,
                description: o.description ?? undefined,
            })),
        };
    }, [raw]);

    const activePhase: PhaseKey = useMemo(() => {
        if (pathname.endsWith("/recruitment")) return "recruitment";
        if (pathname.endsWith("/execution")) return "execution";
        return "design";
    }, [pathname]);

    if (!studyId) return null;

    return (
        <StudyShellContext.Provider
            value={{
                studyId,
                raw,
                studyContext,
                loading,
                error,
            }}
        >
            <div className="h-full flex flex-col">
                {/* Header: back + study title + phase stepper */}
                <div className="shrink-0 border-b border-gray-100 dark:border-[#27272A] bg-background/80 backdrop-blur-sm">
                    <div className="max-w-5xl mx-auto px-6 pt-4 pb-3">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/study")}
                            className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-3"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            All studies
                        </button>
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">
                                {raw?.title ?? (loading ? "Loading study…" : "Untitled study")}
                            </h1>
                        </div>
                    </div>
                    <div className="max-w-5xl mx-auto px-6 pb-4">
                        <div className="flex items-center gap-3">
                            {PHASES.map((p, i) => {
                                const isActive = activePhase === p.key;
                                const Icon = p.icon;
                                return (
                                    <div key={p.key} className="flex items-center gap-3">
                                        {i > 0 && (
                                            <div
                                                className={cn(
                                                    "h-px w-12 sm:w-20 transition-colors duration-300",
                                                    "bg-gray-200 dark:bg-zinc-800",
                                                )}
                                            />
                                        )}
                                        <Link
                                            href={`/dashboard/study/${studyId}/${p.key}`}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground",
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wide">
                                                {p.label}
                                            </span>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Phase content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {error ? (
                        <div className="max-w-2xl mx-auto px-6 py-12">
                            <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-6 text-sm text-rose-700 dark:text-rose-400">
                                Couldn't load this study: {error}
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </StudyShellContext.Provider>
    );
}
