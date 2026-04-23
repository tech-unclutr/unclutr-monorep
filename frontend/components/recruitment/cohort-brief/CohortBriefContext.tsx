"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
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
    children: React.ReactNode;
}

export function CohortBriefProvider({ script, children }: ProviderProps) {
    const [excluded, setExcluded] = useState<Set<string>>(new Set());

    const toggleExcluded = useCallback((id: string) => {
        setExcluded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

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
