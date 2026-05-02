"use client";

import React, { useEffect, useState } from "react";
import type { ModeratorSectionData } from "./useCohortBrief";
import { Field, CriteriaList } from "./shared";
import {
    CONVERSATION_LANGUAGE_OPTIONS,
    DEFAULT_CONVERSATION_LANGUAGE,
    type ConversationLanguage,
} from "./conversation-language-options";
import { api } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ModeratorSectionProps {
    moderator?: ModeratorSectionData | null;
    loading?: boolean;
    error?: string | null;
    studyId?: string;
    cohortId?: string;
}

export function ModeratorSection({
    moderator,
    loading,
    error,
    studyId,
    cohortId,
}: ModeratorSectionProps) {
    const [language, setLanguage] = useState<ConversationLanguage>(
        moderator?.conversation_language ?? DEFAULT_CONVERSATION_LANGUAGE,
    );

    useEffect(() => {
        if (moderator?.conversation_language) {
            setLanguage(moderator.conversation_language);
        }
    }, [moderator?.conversation_language]);

    if (loading) {
        return <p className="text-sm text-muted-foreground italic">Loading moderator instructions…</p>;
    }
    if (error) {
        return <p className="text-sm text-destructive">Failed to load moderator instructions.</p>;
    }
    if (!moderator) {
        return <p className="text-sm text-muted-foreground italic">Moderator instructions unavailable.</p>;
    }

    const handleLanguageChange = (value: string) => {
        const next = value as ConversationLanguage;
        setLanguage(next);
        if (!studyId || !cohortId) return;
        api.patch(
            `/study-planner/studies/${studyId}/cohorts/${cohortId}/moderator-language`,
            { conversation_language: next },
        ).catch(() => {
            // Best-effort save. Toasts/error handling can be layered later.
        });
    };

    return (
        <>
            <Field label="Language">
                <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="h-9 text-sm w-full md:w-72">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CONVERSATION_LANGUAGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
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
