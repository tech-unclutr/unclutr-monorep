"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { type ExtractedLead, type ColumnMapping } from "./recruitment-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Step = "upload" | "mapping" | "cohorts" | "execution" | "done";

export interface ParsedFileState {
    rows: any[];
    headers: string[];
    mapping: ColumnMapping;
    fileName: string;
}

type CombinationCustomPrompts = Record<string, string>;

interface RecruitmentState {
    step: Step;
    parsedFile: ParsedFileState | null;
    extractedLeads: ExtractedLead[];
    selectedCohorts: string[];
    activeCohort: string | null;
    combinationCustomPrompts: CombinationCustomPrompts;
}

interface RecruitmentContextValue extends RecruitmentState {
    setStep: (step: Step) => void;
    setParsedFile: (data: ParsedFileState | null) => void;
    setExtractedLeads: (leads: ExtractedLead[]) => void;
    setSelectedCohorts: React.Dispatch<React.SetStateAction<string[]>>;
    setActiveCohort: (cohort: string | null) => void;
    getCombinationCustomPrompt: (key: string) => string | undefined;
    setCombinationCustomPrompt: (key: string, prompt: string | null) => void;
    reset: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RecruitmentContext = createContext<RecruitmentContextValue | null>(null);

export function useRecruitment() {
    const ctx = useContext(RecruitmentContext);
    if (!ctx) throw new Error("useRecruitment must be used within RecruitmentProvider");
    return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RecruitmentProvider({ children }: { children: React.ReactNode }) {
    const [step, setStep] = useState<Step>("upload");
    const [parsedFile, setParsedFile] = useState<ParsedFileState | null>(null);
    const [extractedLeads, setExtractedLeads] = useState<ExtractedLead[]>([]);
    const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
    const [activeCohort, setActiveCohort] = useState<string | null>(null);
    const [combinationCustomPrompts, setCombinationCustomPromptsMap] = useState<CombinationCustomPrompts>({});

    const getCombinationCustomPrompt = useCallback((key: string): string | undefined => {
        return combinationCustomPrompts[key];
    }, [combinationCustomPrompts]);

    const setCombinationCustomPrompt = useCallback((key: string, prompt: string | null) => {
        setCombinationCustomPromptsMap((prev) => {
            if (prompt === null) {
                const next = { ...prev };
                delete next[key];
                return next;
            }
            return { ...prev, [key]: prompt };
        });
    }, []);

    const reset = useCallback(() => {
        setStep("upload");
        setParsedFile(null);
        setExtractedLeads([]);
        setSelectedCohorts([]);
        setActiveCohort(null);
        setCombinationCustomPromptsMap({});
    }, []);

    return (
        <RecruitmentContext.Provider value={{
            step, setStep,
            parsedFile, setParsedFile,
            extractedLeads, setExtractedLeads,
            selectedCohorts, setSelectedCohorts,
            activeCohort, setActiveCohort,
            combinationCustomPrompts,
            getCombinationCustomPrompt,
            setCombinationCustomPrompt,
            reset,
        }}>
            {children}
        </RecruitmentContext.Provider>
    );
}
