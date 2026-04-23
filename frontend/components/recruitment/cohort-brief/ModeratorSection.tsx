"use client";

import React from "react";
import type { CohortBriefData } from "../cohortBriefDummyData";
import { Field, CriteriaList } from "./shared";

export function ModeratorSection({ data }: { data: CohortBriefData["moderator"] }) {
    return (
        <>
            <Field label="Introduction Script">
                <p className="italic">&ldquo;{data.introScript}&rdquo;</p>
            </Field>
            <Field label="Consent & Recording">
                <p className="italic">&ldquo;{data.consent}&rdquo;</p>
            </Field>
            <Field label="Tone Guidance">
                <p>{data.tone}</p>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CriteriaList label="Do's" tone="include" items={data.dos} />
                <CriteriaList label="Don'ts" tone="exclude" items={data.donts} />
            </div>
        </>
    );
}
