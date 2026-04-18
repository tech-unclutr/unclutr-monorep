import { StudyState } from "./types";

// ── Phase machine ──

export type Phase =
    | "loading_executive_summary"
    | "review_executive_summary"
    | "loading_title"
    | "review_title"
    | "loading_welcome"
    | "review_welcome"
    | "loading_objectives"
    | "review_objectives"
    | "loading_research_questions"
    | "review_research_questions"
    | "done";

export type Step =
    | "executive_summary"
    | "title"
    | "welcome"
    | "objectives"
    | "research_questions";

export type Mode = "initial" | "regenerate";

export const PHASE_FOR_LOADING: Record<Step, Phase> = {
    executive_summary: "loading_executive_summary",
    title: "loading_title",
    welcome: "loading_welcome",
    objectives: "loading_objectives",
    research_questions: "loading_research_questions",
};

export const PHASE_FOR_REVIEW: Record<Step, Phase> = {
    executive_summary: "review_executive_summary",
    title: "review_title",
    welcome: "review_welcome",
    objectives: "review_objectives",
    research_questions: "review_research_questions",
};

// ── State ──

export interface DesignerState {
    phase: Phase;
    study: StudyState;
    initialPrompt: string;
    isBusy: boolean;
    isSaving: boolean;
    error: string | null;
}

// ── Step request table ──

interface StepRequest {
    endpoint: string;
    buildBody: (state: DesignerState, mode: Mode) => unknown;
}

export const STEP_REQUESTS: Record<Step, StepRequest> = {
    executive_summary: {
        endpoint: "/study-planner/executive-summary",
        buildBody: (s, mode) => ({
            research_brief: s.initialPrompt,
            mode,
        }),
    },
    title: {
        endpoint: "/study-planner/title-brief",
        buildBody: (s, mode) => ({
            research_brief: s.initialPrompt,
            mode,
        }),
    },
    objectives: {
        endpoint: "/study-planner/objectives",
        buildBody: (s, mode) => ({
            research_brief: s.initialPrompt,
            executive_summary: s.study.executiveSummary,
            mode,
        }),
    },
    research_questions: {
        endpoint: "/study-planner/research-questions",
        buildBody: (s, mode) => ({
            research_brief: s.initialPrompt,
            executive_summary: s.study.executiveSummary,
            objectives: s.study.topicGuide.objectives.map((o) => ({
                title: o.title,
                description: o.description,
            })),
            mode,
        }),
    },
    welcome: {
        endpoint: "/study-planner/welcome-page",
        buildBody: (s, mode) => ({
            research_brief: s.study.briefing,
            executive_summary: s.study.executiveSummary,
            mode,
        }),
    },
};

export function createEmptyStudy(): StudyState {
    return {
        id: crypto.randomUUID(),
        title: "",
        briefing: "",
        executiveSummary: "",
        emotionDetection: false,
        participantLanguages: ["English"],
        reportingLanguage: "English",
        advancedSettings: {
            maxDuration: 30,
            recordVideo: true,
            recordAudio: true,
            allowSkipQuestions: false,
        },
        welcomePage: { title: "", description: "" },
        topicGuide: { objectives: [] },
        keyResearchQuestions: [],
    };
}
