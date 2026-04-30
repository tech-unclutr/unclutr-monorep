"use client";

import React from "react";
import type { ModeratorSectionData } from "./useCohortBrief";
import { Field, CriteriaList } from "./shared";

interface ModeratorSectionProps {
    moderator?: ModeratorSectionData | null;
    loading?: boolean;
    error?: string | null;
}

export function ModeratorSection({ moderator, loading, error }: ModeratorSectionProps) {
    if (loading) {
        return <p className="text-sm text-muted-foreground italic">Loading moderator instructions…</p>;
    }
    if (error) {
        return <p className="text-sm text-destructive">Failed to load moderator instructions.</p>;
    }
    if (!moderator) {
        return <p className="text-sm text-muted-foreground italic">Moderator instructions unavailable.</p>;
    }

    return (
        <>
            <Field label="Introduction Script">
                <p className="italic">&ldquo;{moderator.intro_script}&rdquo;</p>
            </Field>
            <Field label="Consent & Recording">
                <p className="italic">&ldquo;{moderator.consent}&rdquo;</p>
            </Field>
            <Field label="Tone Guidance">
                <p>{moderator.tone}</p>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CriteriaList label="Do's" tone="include" items={moderator.dos} />
                <CriteriaList label="Don'ts" tone="exclude" items={moderator.donts} />
            </div>
        </>
    );
}
