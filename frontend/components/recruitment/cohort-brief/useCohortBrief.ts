"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export interface ContextSectionData {
    definition: string;
    hypothesis: string;
    objectives: string[];
}

export interface ScriptQuestion {
    id: string;
    question_number: number;
    text: string;
    uncovers: string;
    objective_link: string;
    tag: string;
    depth: number;
    type_descriptor: string;
    probes: string[];
    estimated_minutes: number;
    priority: "must_ask" | "if_time_permits" | string;
}

export interface ScriptKrqGroup {
    krq_index: number;
    krq_section_text: string;
    questions: ScriptQuestion[];
    total_estimated_minutes: number;
}

export interface ScriptSectionData {
    krq_groups: ScriptKrqGroup[];
    total_estimated_minutes: number;
}

export interface ScreeningSectionData {
    include_criteria: string[];
    exclude_criteria: string[];
    ideal_respondent_profile: string;
}

export interface ModeratorSectionData {
    intro_script: string;
    consent: string;
    tone: string;
    dos: string[];
    donts: string[];
}

export interface StructurePhaseData {
    name: string;
    duration: string;
    description: string;
}

export interface StructureSectionData {
    phases: StructurePhaseData[];
}

export interface CohortBriefData {
    context_section: ContextSectionData;
    script_section?: ScriptSectionData | null;
    screening_section?: ScreeningSectionData | null;
    moderator_section: ModeratorSectionData;
    structure_section: StructureSectionData;
    incentive: string;
    selected_question_ids: string[];
}

interface UseCohortBriefResult {
    data: CohortBriefData | null;
    loading: boolean;
    error: string | null;
}

/**
 * Fetches the Cohort Brief payload for one (study, cohort) pair.
 *
 * Caches per `studyId:cohortId` for the component's lifetime, so re-clicking a
 * previously-loaded tab renders instantly.
 */
export function useCohortBrief(
    studyId: string | undefined,
    cohortId: string | undefined,
): UseCohortBriefResult {
    const cacheRef = useRef<Map<string, CohortBriefData>>(new Map());
    const [data, setData] = useState<CohortBriefData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studyId || !cohortId) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        const key = `${studyId}:${cohortId}`;
        const cached = cacheRef.current.get(key);
        if (cached) {
            setData(cached);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);
        api.get(`/study-planner/studies/${studyId}/cohorts/${cohortId}/brief`)
            .then((res: CohortBriefData) => {
                if (cancelled) return;
                cacheRef.current.set(key, res);
                setData(res);
            })
            .catch((e: any) => {
                if (cancelled) return;
                setError(e?.message || "Failed to load cohort brief");
                setData(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [studyId, cohortId]);

    return { data, loading, error };
}
