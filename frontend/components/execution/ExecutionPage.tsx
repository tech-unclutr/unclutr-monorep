"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle2,
    ListChecks,
    Loader2,
    Play,
    Play as PlayIcon,
    Radio,
    Square,
    Users,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { ApiError, api } from "@/lib/api";
import {
    fetchCohortAgentPrompt,
    fetchCohortPrompts,
} from "@/lib/executionPromptTemplate";
import { cn } from "@/lib/utils";
import { AgentCard, type AgentConfiguration } from "./AgentCard";
import { LeadRow, type QueueLead } from "./LeadRow";
import { LeadScriptSheet } from "./LeadScriptSheet";

interface TriggerCallResponse {
    status: "success" | "error";
    call_id?: string | null;
    agent_id?: string | null;
    agent_name?: string | null;
    lead_id?: string | null;
    payload: Record<string, unknown>;
    response?: Record<string, unknown> | null;
    error?: string | null;
    log_persisted?: boolean | null;
}

interface RecentCallEntry {
    call_id: string;
    lead_id: string;
    lead_first_name: string;
    lead_last_name: string | null;
    agent_id: string | null;
    call_status: string;
    call_duration: number;
    recording_url: string | null;
    error_message: string | null;
    summary: string | null;
    created_at: string;
    updated_at: string;
    is_terminal: boolean;
}

const POLL_INTERVAL_MS = 5000;
const MAX_CONCURRENT = 3;
// Synthetic bucket key for leads whose cohort falls back to the hardcoded
// persona (no AgentConfiguration row). Same 3-slot rule applies.
const FALLBACK_AGENT_KEY = "__fallback__";
const SLOT_PROMOTE_DELAY_MS = 600;

function bucketKeyFor(agentId: string | null | undefined): string {
    return agentId ?? FALLBACK_AGENT_KEY;
}

function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
}

function leadFullName(lead: QueueLead): string {
    return (
        [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() ||
        "Unnamed lead"
    );
}

type Status = "loading" | "empty" | "ready" | "error";

interface ExecutionPageProps {
    studyId: string;
}

export function ExecutionPage({ studyId }: ExecutionPageProps) {
    const router = useRouter();
    const firedRef = useRef(false);
    const [status, setStatus] = useState<Status>("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [agents, setAgents] = useState<AgentConfiguration[]>([]);
    const [leads, setLeads] = useState<QueueLead[]>([]);
    const [promptsByCohort, setPromptsByCohort] = useState<Record<string, string>>({});
    const [missingCohortCount, setMissingCohortCount] = useState(0);
    const [activeLead, setActiveLead] = useState<QueueLead | null>(null);
    const [activeCallByAgent, setActiveCallByAgent] = useState<
        Record<string, QueueLead[]>
    >({});
    const [recentCallsByLeadId, setRecentCallsByLeadId] = useState<
        Record<string, RecentCallEntry>
    >({});
    const [isRunning, setIsRunning] = useState(false);
    const lastPromoteAtRef = useRef(0);
    const promotionInFlightRef = useRef(false);

    const activeLeadIds = useMemo(() => {
        const ids = new Set<string>();
        for (const arr of Object.values(activeCallByAgent)) {
            for (const l of arr) ids.add(l.id);
        }
        return ids;
    }, [activeCallByAgent]);

    // Leads whose latest call is terminal → render in Completed section.
    const completedEntries = useMemo(() => {
        const leadsById = new Map(leads.map((l) => [l.id, l]));
        return Object.values(recentCallsByLeadId)
            .filter((c) => c.is_terminal && leadsById.has(c.lead_id))
            .map((c) => ({ call: c, lead: leadsById.get(c.lead_id)! }))
            .sort((a, b) => b.call.updated_at.localeCompare(a.call.updated_at));
    }, [recentCallsByLeadId, leads]);
    const completedLeadIds = useMemo(
        () => new Set(completedEntries.map((e) => e.lead.id)),
        [completedEntries],
    );

    const visibleLeads = useMemo(
        () =>
            leads.filter(
                (l) => !activeLeadIds.has(l.id) && !completedLeadIds.has(l.id),
            ),
        [leads, activeLeadIds, completedLeadIds],
    );

    // Poll recent calls so leads migrate from "Calling…" to "Completed" automatically.
    useEffect(() => {
        if (status !== "ready") return;
        let cancelled = false;

        const poll = async () => {
            try {
                const calls = (await api.get(
                    `/agent-execution/studies/${studyId}/recent-calls`,
                )) as RecentCallEntry[];
                if (cancelled) return;

                const byLeadId: Record<string, RecentCallEntry> = {};
                for (const c of calls) byLeadId[c.lead_id] = c;
                setRecentCallsByLeadId(byLeadId);

                // Reconcile activeCallByAgent slot arrays against server truth:
                // - drop terminal leads (frees a slot)
                // - add non-terminal calls we haven't optimistically slotted
                //   (recovers state across page reloads / new sessions)
                setActiveCallByAgent((prev) => {
                    const next: Record<string, QueueLead[]> = {};
                    for (const [k, v] of Object.entries(prev)) next[k] = [...v];
                    let changed = false;

                    // Drop terminal entries.
                    for (const key of Object.keys(next)) {
                        const filtered = next[key].filter((l) => {
                            const c = byLeadId[l.id];
                            return !(c && c.is_terminal);
                        });
                        if (filtered.length !== next[key].length) {
                            changed = true;
                            if (filtered.length === 0) delete next[key];
                            else next[key] = filtered;
                        }
                    }

                    // Slot non-terminal calls we didn't optimistically place.
                    for (const c of calls) {
                        if (c.is_terminal) continue;
                        const key = bucketKeyFor(c.agent_id);
                        const bucket = next[key] || [];
                        if (bucket.some((l) => l.id === c.lead_id)) continue;
                        if (bucket.length >= MAX_CONCURRENT) continue;
                        const lead = leads.find((l) => l.id === c.lead_id);
                        if (!lead) continue;
                        next[key] = [...bucket, lead];
                        changed = true;
                    }

                    return changed ? next : prev;
                });
            } catch {
                // Best-effort; next tick will retry.
            }
        };

        poll();
        const id = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [status, studyId, leads]);

    const handleCall = async (lead: QueueLead): Promise<boolean> => {
        const bucketKey = bucketKeyFor(lead.agent_id);
        try {
            const res = (await api.post(
                `/agent-execution/leads/${lead.id}/call`,
                {},
            )) as TriggerCallResponse;

            if (res.status === "success") {
                // Optimistically push into the agent's slot bucket. Use the
                // server-returned agent_id when present (authoritative), else
                // fall back to the lead's pre-resolved agent_id.
                const slotKey = bucketKeyFor(
                    res.agent_id ?? lead.agent_id ?? null,
                );
                setActiveCallByAgent((prev) => {
                    const existing = prev[slotKey] || [];
                    if (existing.some((l) => l.id === lead.id)) return prev;
                    return {
                        ...prev,
                        [slotKey]: [...existing, lead],
                    };
                });
                toast.success(`Call placed to ${lead.first_name}`, {
                    description:
                        res.log_persisted === false
                            ? "Call placed, but log row was not saved."
                            : undefined,
                });
                return true;
            }
            toast.error("Call failed", {
                description: res.error ?? "Unknown error",
            });
            return false;
        } catch (e) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : String(e);
            toast.error("Call failed", { description: msg });
            return false;
        }
    };

    // Manually move a lead back from an agent slot into the queue.
    const handleMoveBackFromAgent = (leadId: string) => {
        setActiveCallByAgent((prev) => {
            const next: Record<string, QueueLead[]> = {};
            let changed = false;
            for (const [k, arr] of Object.entries(prev)) {
                const filtered = arr.filter((l) => l.id !== leadId);
                if (filtered.length !== arr.length) changed = true;
                if (filtered.length > 0) next[k] = filtered;
            }
            return changed ? next : prev;
        });
    };

    // Reactive slot runner: when running, fill open slots up to MAX_CONCURRENT
    // per agent by picking the next queued lead whose agent_id matches.
    // Re-fires whenever activeCallByAgent shrinks (terminal events drop leads),
    // visibleLeads changes, or isRunning flips.
    useEffect(() => {
        if (!isRunning) return;
        if (promotionInFlightRef.current) return;

        // Find first agent bucket with an open slot AND a queued lead.
        for (const lead of visibleLeads) {
            const key = bucketKeyFor(lead.agent_id);
            const bucket = activeCallByAgent[key] || [];
            if (bucket.length >= MAX_CONCURRENT) continue;

            // Throttle so back-to-back promotions stay readable visually and
            // don't flood Bolna's /call endpoint.
            const now = Date.now();
            const wait = Math.max(0, SLOT_PROMOTE_DELAY_MS - (now - lastPromoteAtRef.current));

            promotionInFlightRef.current = true;
            const timer = setTimeout(async () => {
                lastPromoteAtRef.current = Date.now();
                try {
                    await handleCall(lead);
                } finally {
                    promotionInFlightRef.current = false;
                }
            }, wait);

            return () => {
                clearTimeout(timer);
                promotionInFlightRef.current = false;
            };
        }

        // No promotable lead AND no in-flight calls anywhere → run complete.
        const totalActive = Object.values(activeCallByAgent).reduce(
            (sum, arr) => sum + arr.length,
            0,
        );
        if (totalActive === 0 && visibleLeads.length === 0) {
            setIsRunning(false);
        }
    }, [isRunning, activeCallByAgent, visibleLeads]);

    const handleStart = () => {
        if (isRunning) {
            // Stop pressed — stop promoting new leads. Active calls drain on
            // their own via the poller.
            setIsRunning(false);
            return;
        }
        if (visibleLeads.length === 0) {
            toast.info("Nothing to call", { description: "No queued leads." });
            return;
        }
        setIsRunning(true);
    };

    useEffect(() => {
        if (firedRef.current) return;
        firedRef.current = true;

        (async () => {
            try {
                const [cohorts, agentsList, leadsList] = await Promise.all([
                    fetchCohortPrompts(studyId),
                    api.get("/agents") as Promise<AgentConfiguration[]>,
                    api.get(`/study-planner/studies/${studyId}/leads`) as Promise<QueueLead[]>,
                ]);

                setAgents(agentsList ?? []);
                setLeads(leadsList ?? []);

                if (cohorts.length === 0) {
                    setStatus("empty");
                    return;
                }

                const settled = await Promise.allSettled(
                    cohorts.map(
                        async (c) =>
                            [
                                c.cohort_id,
                                await fetchCohortAgentPrompt(studyId, c.cohort_id),
                            ] as const,
                    ),
                );
                const ok: Record<string, string> = {};
                let failed = 0;
                for (const r of settled) {
                    if (r.status === "fulfilled") ok[r.value[0]] = r.value[1];
                    else failed += 1;
                }
                setPromptsByCohort(ok);
                setMissingCohortCount(failed);

                setStatus("ready");
            } catch (err) {
                setErrorMessage(
                    err instanceof Error ? err.message : "Failed to prepare voice agents.",
                );
                setStatus("error");
            }
        })();
    }, [studyId]);

    const goBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/dashboard/playground");
        }
    };

    if (status === "ready") {
        return (
            <div className="h-full overflow-y-auto">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                                <Radio className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    Voice agents are ready
                                </h1>
                                <p className="mt-1 text-[12px] text-muted-foreground">
                                    Execution surface coming soon. Per-cohort prompts generated.
                                </p>
                                {missingCohortCount > 0 && (
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {missingCohortCount} of{" "}
                                        {missingCohortCount +
                                            Object.keys(promptsByCohort).length}{" "}
                                        cohort prompts couldn't be prepared.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={goBack}
                                className="inline-flex items-center gap-2"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </Button>
                            <Button
                                onClick={handleStart}
                                disabled={!isRunning && visibleLeads.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl px-5 font-bold uppercase tracking-wide text-xs shadow-sm active:scale-[0.98] transition-all"
                            >
                                {isRunning ? (
                                    <>
                                        <Square className="w-3 h-3 fill-current" />
                                        Stop
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5" />
                                        Start
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <LayoutGroup>
                        <section className="mt-10">
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Your agents
                                </h2>
                                <span className="text-[11px] text-muted-foreground">
                                    {agents.length}
                                </span>
                            </div>

                            {agents.length === 0 ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 px-6 py-10 text-center">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        No agents configured yet
                                    </p>
                                    <p className="mt-1 text-[12px] text-muted-foreground">
                                        Add an agent persona under Agents to assign one to a cohort.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {agents.map((a) => (
                                        <AgentCard
                                            key={a.id}
                                            agent={a}
                                            activeLeads={activeCallByAgent[a.id] ?? []}
                                            maxConcurrent={MAX_CONCURRENT}
                                            onMoveBack={handleMoveBackFromAgent}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="mt-10">
                            <div className="flex items-center gap-2">
                                <ListChecks className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Leads queue
                                </h2>
                                <span className="text-[11px] text-muted-foreground">
                                    {visibleLeads.length}
                                </span>
                            </div>

                            {visibleLeads.length === 0 ? (
                                <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 px-6 py-10 text-center">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        {leads.length === 0
                                            ? "No leads enrolled yet"
                                            : "All leads are on calls"}
                                    </p>
                                    <p className="mt-1 text-[12px] text-muted-foreground">
                                        {leads.length === 0
                                            ? "Upload leads in Recruitment to populate the queue."
                                            : "Each active lead has been routed to its agent card above."}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-4 flex flex-col gap-2">
                                    <AnimatePresence initial={false}>
                                        {visibleLeads.map((lead) => (
                                            <motion.div
                                                key={lead.id}
                                                layoutId={`lead-${lead.id}`}
                                                layout
                                                exit={{ opacity: 0 }}
                                                transition={{
                                                    duration: 0.45,
                                                    ease: [0.175, 0.885, 0.32, 1.05],
                                                }}
                                            >
                                                <LeadRow
                                                    lead={lead}
                                                    onView={() => setActiveLead(lead)}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </section>
                    </LayoutGroup>

                    {completedEntries.length > 0 && (
                        <section className="mt-10">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Completed calls
                                </h2>
                                <span className="text-[11px] text-muted-foreground">
                                    {completedEntries.length}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                                <AnimatePresence initial={false}>
                                    {completedEntries.map(({ lead, call }) => (
                                        <motion.div
                                            key={lead.id}
                                            layout
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <CompletedCallRow lead={lead} call={call} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}
                </div>

                <LeadScriptSheet
                    lead={activeLead}
                    script={
                        activeLead?.cohort_id
                            ? promptsByCohort[activeLead.cohort_id]
                            : undefined
                    }
                    onOpenChange={(open) => {
                        if (!open) setActiveLead(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-12 text-center shadow-sm">
                {status === "loading" && (
                    <>
                        <div className="mx-auto mb-4 flex items-center justify-center">
                            <Loader size="lg" />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                            Preparing the voice agents…
                        </h2>
                        <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                            Generating per-cohort prompts. This can take a moment on the first run.
                        </p>
                    </>
                )}

                {status === "empty" && (
                    <>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                            This study has no cohorts yet
                        </h2>
                        <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                            Add leads and cohorts in Recruitment before launching execution.
                        </p>
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            className="mt-6 inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                            Couldn't prepare the voice agents
                        </h2>
                        <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                            {errorMessage}
                        </p>
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            className="mt-6 inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

function CompletedCallRow({
    lead,
    call,
}: {
    lead: QueueLead;
    call: RecentCallEntry;
}) {
    const name = leadFullName(lead);
    const isSuccess = call.call_status?.toLowerCase() === "completed";
    const statusLabel = call.call_status?.toUpperCase() || "DONE";

    return (
        <div className="group flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
            <div
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                    isSuccess
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
                        : "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
                )}
            >
                {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                ) : (
                    <XCircle className="h-4 w-4" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                    {name}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">{lead.contact_number}</span>
                    {call.call_duration > 0 && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span className="tabular-nums">
                                {formatDuration(call.call_duration)}
                            </span>
                        </>
                    )}
                    {call.error_message && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span className="truncate text-rose-600 dark:text-rose-400">
                                {call.error_message}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <span
                    className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        isSuccess
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
                    )}
                >
                    {statusLabel}
                </span>

                {call.recording_url && (
                    <a
                        href={call.recording_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[11px] font-bold uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                        <PlayIcon className="h-3 w-3" />
                        Recording
                    </a>
                )}
            </div>
        </div>
    );
}
