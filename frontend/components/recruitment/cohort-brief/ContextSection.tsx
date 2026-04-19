"use client";

import React from "react";
import { Field } from "./shared";
import { useCohortBrief } from "./useCohortBrief";

interface ContextSectionProps {
    studyId?: string;
    cohortId?: string;
}

export function ContextSection({ studyId, cohortId }: ContextSectionProps) {
    const { data, loading, error } = useCohortBrief(studyId, cohortId);
    const ctx = data?.context_section;

    return (
        <>
            <Field label="Definition">
                <TextBlock text={ctx?.definition} loading={loading} error={error} emptyFallback="No definition available." />
            </Field>
            <Field label="Hypothesis">
                <TextBlock text={ctx?.hypothesis} loading={loading} error={error} emptyFallback="No hypothesis yet." />
            </Field>
            <Field label="Key Research Objectives">
                <ObjectivesList objectives={ctx?.objectives} loading={loading} error={error} />
            </Field>
        </>
    );
}

function TextBlock({
    text,
    loading,
    error,
    emptyFallback,
}: {
    text: string | undefined;
    loading: boolean;
    error: string | null;
    emptyFallback: string;
}) {
    if (loading) return <SkeletonLine />;
    if (error) return <Muted>Couldn&rsquo;t load this field.</Muted>;
    if (!text) return <Muted>{emptyFallback}</Muted>;
    return <p>{text}</p>;
}

function ObjectivesList({
    objectives,
    loading,
    error,
}: {
    objectives: string[] | undefined;
    loading: boolean;
    error: string | null;
}) {
    if (loading) {
        return (
            <ol className="list-decimal list-outside ml-4 space-y-1.5">
                <li><SkeletonLine /></li>
                <li><SkeletonLine /></li>
                <li><SkeletonLine /></li>
            </ol>
        );
    }
    if (error) return <Muted>Couldn&rsquo;t load objectives.</Muted>;
    if (!objectives || objectives.length === 0) {
        return <Muted>No objectives defined for this study yet.</Muted>;
    }
    return (
        <ol className="list-decimal list-outside ml-4 space-y-1.5">
            {objectives.map((o, i) => (
                <li key={i}>{o}</li>
            ))}
        </ol>
    );
}

function SkeletonLine() {
    return (
        <span className="inline-block h-4 w-3/4 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
    );
}

function Muted({ children }: { children: React.ReactNode }) {
    return <span className="text-muted-foreground italic">{children}</span>;
}
