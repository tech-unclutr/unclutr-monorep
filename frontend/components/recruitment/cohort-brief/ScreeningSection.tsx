"use client";

import React from "react";
import type { CohortBriefData } from "../cohortBriefDummyData";
import { Field, CriteriaList } from "./shared";

export function ScreeningSection({ data }: { data: CohortBriefData["screening"] }) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Number of Interviews">
                    <p className="font-semibold tabular-nums">{data.interviewCount}</p>
                </Field>
                <Field label="Interview Duration">
                    <p className="font-semibold">{data.duration}</p>
                </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CriteriaList label="Include" tone="include" items={data.include} />
                <CriteriaList label="Exclude" tone="exclude" items={data.exclude} />
            </div>
            <Field label="Ideal Respondent Profile">
                <p>{data.idealProfile}</p>
            </Field>
        </>
    );
}
