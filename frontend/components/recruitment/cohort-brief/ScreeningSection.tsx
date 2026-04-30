"use client";

import React, { useEffect, useState } from "react";
import type { ScreeningSectionData } from "./useCohortBrief";
import { useCohortBriefContext } from "./CohortBriefContext";
import { Field, CriteriaList } from "./shared";
import { INCENTIVE_OPTIONS, DEFAULT_INCENTIVE } from "./incentive-options";
import { api } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ScreeningSectionProps {
    /** Live screening data from the brief payload. */
    screening?: ScreeningSectionData | null;
    studyId?: string;
    cohortId?: string;
    /** Seed value from the brief payload. Always present (column default is "No Incentive"). */
    initialIncentive?: string;
}

export function ScreeningSection({
    screening,
    studyId,
    cohortId,
    initialIncentive,
}: ScreeningSectionProps) {
    const { selectedCount, selectedMinutes } = useCohortBriefContext();

    const [incentive, setIncentive] = useState<string>(
        initialIncentive ?? DEFAULT_INCENTIVE,
    );

    useEffect(() => {
        if (initialIncentive !== undefined) setIncentive(initialIncentive);
    }, [initialIncentive]);

    const handleIncentiveChange = (value: string) => {
        setIncentive(value);
        if (!studyId || !cohortId) return;
        api.patch(
            `/study-planner/studies/${studyId}/cohorts/${cohortId}/incentive`,
            { incentive: value },
        ).catch(() => {
            // Best-effort save. Toasts/error handling can be layered later.
        });
    };

    const include = screening?.include_criteria ?? [];
    const exclude = screening?.exclude_criteria ?? [];
    const hasCriteria = include.length > 0 || exclude.length > 0;

    return (
        <>
            <Field label="Incentive">
                <Select value={incentive} onValueChange={handleIncentiveChange}>
                    <SelectTrigger className="h-9 text-sm w-full md:w-72">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {INCENTIVE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Interviews">
                    <p className="font-semibold tabular-nums">{selectedCount}</p>
                </Field>
                <Field label="Interview Duration">
                    <p className="font-semibold tabular-nums">
                        ~{formatMinutes(selectedMinutes)} min
                    </p>
                </Field>
            </div>

            {hasCriteria ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CriteriaList label="Include" tone="include" items={include} />
                    <CriteriaList label="Exclude" tone="exclude" items={exclude} />
                </div>
            ) : (
                <p className="text-sm italic text-muted-foreground">
                    Screening criteria aren&rsquo;t available for this cohort yet.
                    Regenerate the study&rsquo;s cohort definitions to populate them.
                </p>
            )}

            {screening?.ideal_respondent_profile ? (
                <Field label="Ideal Respondent Profile">
                    <p>{screening.ideal_respondent_profile}</p>
                </Field>
            ) : null}
        </>
    );
}

function formatMinutes(n: number): string {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
}
