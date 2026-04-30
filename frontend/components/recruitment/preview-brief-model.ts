import type { CohortBriefData } from "./cohort-brief/useCohortBrief";

export interface PreviewBriefStudy {
    title?: string;
    briefing?: string;
    executive_summary?: string;
    topic_guide?: {
        objectives?: Array<{ title?: string; description?: string }>;
    };
    key_research_questions?: Array<{ title?: string; question?: string }>;
}

export interface PreviewBriefCohort {
    name: string;
    cohortId: string;
    brief: CohortBriefData | null;
}

export interface PreviewBrief {
    studyId: string;
    title: string;
    study: PreviewBriefStudy;
    cohorts: PreviewBriefCohort[];
}
