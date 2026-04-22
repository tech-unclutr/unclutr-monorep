"use client";

import React from "react";
import type { CohortBriefData } from "../cohortBriefDummyData";
import type { ScreeningSectionData } from "./useCohortBrief";
import { useCohortBriefContext } from "./CohortBriefContext";
import { Field, CriteriaList } from "./shared";

interface ScreeningSectionProps {
    /** Hardcoded dummy retained only for `idealProfile`. Other fields are unused. */
    data: CohortBriefData["screening"];
    /** Live screening criteria from the brief payload. */
    screening?: ScreeningSectionData | null;
}

export function ScreeningSection({ data, screening }: ScreeningSectionProps) {
    const { selectedCount, selectedMinutes } = useCohortBriefContext();

    const include = screening?.include_criteria ?? [];
    const exclude = screening?.exclude_criteria ?? [];
    const hasCriteria = include.length > 0 || exclude.length > 0;

    return (
        <>
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

            <Field label="Ideal Respondent Profile">
                <p>{data.idealProfile}</p>
            </Field>
        </>
    );
}

function formatMinutes(n: number): string {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
}
