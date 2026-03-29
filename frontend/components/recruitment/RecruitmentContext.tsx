"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { type ExtractedLead, type ColumnMapping } from "./recruitment-utils";
import {
    type InterviewCategories,
    type AudioBucket,
    SAMPLE_QUESTIONS,
    initializeCategories,
} from "@/app/dashboard/playground/components/InterviewBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Step = "upload" | "mapping" | "cohorts" | "execution" | "done";

export interface ParsedFileState {
    rows: any[];
    headers: string[];
    mapping: ColumnMapping;
    fileName: string;
}

type CohortInterviewMap = Record<string, InterviewCategories>;
type CohortIncentivesMap = Record<string, Record<AudioBucket, string>>;

const DEFAULT_INCENTIVES: Record<AudioBucket, string> = { audioA: "", audioB: "", audioC: "" };
const UNSELECTED_QUESTIONS = SAMPLE_QUESTIONS.map((q) => ({ ...q, selected: false }));

interface RecruitmentState {
    step: Step;
    parsedFile: ParsedFileState | null;
    extractedLeads: ExtractedLead[];
    selectedCohorts: string[];
    activeCohort: string | null;
    cohortInterviews: CohortInterviewMap;
    cohortIncentives: CohortIncentivesMap;
}

interface RecruitmentContextValue extends RecruitmentState {
    setStep: (step: Step) => void;
    setParsedFile: (data: ParsedFileState | null) => void;
    setExtractedLeads: (leads: ExtractedLead[]) => void;
    setSelectedCohorts: React.Dispatch<React.SetStateAction<string[]>>;
    setActiveCohort: (cohort: string | null) => void;
    getCohortCategories: (cohort: string) => InterviewCategories;
    setCohortCategories: (cohort: string, categories: InterviewCategories) => void;
    getCohortIncentives: (cohort: string) => Record<AudioBucket, string>;
    setCohortIncentives: (cohort: string, incentives: Record<AudioBucket, string>) => void;
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
    const [cohortInterviews, setCohortInterviews] = useState<CohortInterviewMap>({});
    const [cohortIncentives, setCohortIncentivesMap] = useState<CohortIncentivesMap>({});

    const getCohortCategories = useCallback((cohort: string): InterviewCategories => {
        return cohortInterviews[cohort] ?? initializeCategories(UNSELECTED_QUESTIONS);
    }, [cohortInterviews]);

    const setCohortCategories = useCallback((cohort: string, categories: InterviewCategories) => {
        setCohortInterviews((prev) => ({ ...prev, [cohort]: categories }));
    }, []);

    const getCohortIncentives = useCallback((cohort: string): Record<AudioBucket, string> => {
        return cohortIncentives[cohort] ?? { ...DEFAULT_INCENTIVES };
    }, [cohortIncentives]);

    const setCohortIncentivesForCohort = useCallback((cohort: string, incentives: Record<AudioBucket, string>) => {
        setCohortIncentivesMap((prev) => ({ ...prev, [cohort]: incentives }));
    }, []);

    const reset = useCallback(() => {
        setStep("upload");
        setParsedFile(null);
        setExtractedLeads([]);
        setSelectedCohorts([]);
        setActiveCohort(null);
        setCohortInterviews({});
        setCohortIncentivesMap({});
    }, []);

    return (
        <RecruitmentContext.Provider value={{
            step, setStep,
            parsedFile, setParsedFile,
            extractedLeads, setExtractedLeads,
            selectedCohorts, setSelectedCohorts,
            activeCohort, setActiveCohort,
            cohortInterviews,
            cohortIncentives,
            getCohortCategories, setCohortCategories,
            getCohortIncentives,
            setCohortIncentives: setCohortIncentivesForCohort,
            reset,
        }}>
            {children}
        </RecruitmentContext.Provider>
    );
}
