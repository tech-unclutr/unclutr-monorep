"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { api } from "@/lib/api";
import type { ScriptSectionData } from "./useCohortBrief";

interface CohortBriefContextValue {
    excluded: Set<string>;
    toggleExcluded: (id: string) => void;
    selectedCount: number;
    selectedMinutes: number;
}

const CohortBriefContext = createContext<CohortBriefContextValue | null>(null);

interface ProviderProps {
    script: ScriptSectionData | null | undefined;
    studyId?: string;
    cohortId?: string;
    initialSelectedQuestionIds?: string[];
    children: React.ReactNode;
}

const SAVE_DEBOUNCE_MS = 400;

export function CohortBriefProvider({
    script,
    studyId,
    cohortId,
    initialSelectedQuestionIds,
    children,
}: ProviderProps) {
    const [excluded, setExcluded] = useState<Set<string>>(new Set());
    // Re-init when the script identity changes (cohort switch) OR when the
    // initial saved-selection list changes for the same cohort.
    const initKey = useRef<string | null>(null);

    useEffect(() => {
        if (!script) return;
        const key = `${cohortId ?? ""}:${(initialSelectedQuestionIds ?? []).join(",")}:${script.krq_groups.length}`;
        if (initKey.current === key) return;

        const allIds = new Set<string>();
        for (const g of script.krq_groups) {
            for (const q of g.questions) allIds.add(q.id);
        }
        const savedSelected = new Set(initialSelectedQuestionIds ?? []);
        const nextExcluded = new Set<string>();
        for (const id of allIds) {
            if (!savedSelected.has(id)) nextExcluded.add(id);
        }
        setExcluded(nextExcluded);
        initKey.current = key;
    }, [script, cohortId, initialSelectedQuestionIds]);

    // Debounced persist of the current selection. Skipped while the cohort
    // is still hydrating (no studyId/cohortId/script yet) or before the first
    // hydration completes (initKey.current is null).
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const persistSelection = useCallback(
        (nextExcluded: Set<string>) => {
            if (!studyId || !cohortId || !script || initKey.current === null) return;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                const selected: string[] = [];
                for (const g of script.krq_groups) {
                    for (const q of g.questions) {
                        if (!nextExcluded.has(q.id)) selected.push(q.id);
                    }
                }
                api.patch(
                    `/study-planner/studies/${studyId}/cohorts/${cohortId}/selected-questions`,
                    { selected_question_ids: selected },
                ).catch(() => {
                    // Best-effort. UI state is the source of truth in-session.
                });
            }, SAVE_DEBOUNCE_MS);
        },
        [studyId, cohortId, script],
    );

    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    const toggleExcluded = useCallback(
        (id: string) => {
            setExcluded((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                persistSelection(next);
                return next;
            });
        },
        [persistSelection],
    );

    const { selectedCount, selectedMinutes } = useMemo(() => {
        let count = 0;
        let minutes = 0;
        if (script) {
            for (const g of script.krq_groups) {
                for (const q of g.questions) {
                    if (!excluded.has(q.id)) {
                        count += 1;
                        minutes += q.estimated_minutes || 0;
                    }
                }
            }
        }
        return { selectedCount: count, selectedMinutes: minutes };
    }, [script, excluded]);

    const value = useMemo<CohortBriefContextValue>(
        () => ({ excluded, toggleExcluded, selectedCount, selectedMinutes }),
        [excluded, toggleExcluded, selectedCount, selectedMinutes],
    );

    return (
        <CohortBriefContext.Provider value={value}>
            {children}
        </CohortBriefContext.Provider>
    );
}

export function useCohortBriefContext(): CohortBriefContextValue {
    const ctx = useContext(CohortBriefContext);
    if (!ctx) {
        throw new Error(
            "useCohortBriefContext must be used inside <CohortBriefProvider>",
        );
    }
    return ctx;
}
