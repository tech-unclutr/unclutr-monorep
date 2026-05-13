import { api } from "@/lib/api";

export interface CohortPromptEntry {
    cohort_id: string;
    cohort_name: string;
    prompt: string | null;
    generated_at: string | null;
}

export async function fetchCohortPrompts(
    studyId: string,
): Promise<CohortPromptEntry[]> {
    const data = await api.request(
        `/agent-execution/studies/${studyId}/cohort-prompts`,
    );
    return data.cohorts as CohortPromptEntry[];
}

export async function fetchCohortAgentPrompt(
    studyId: string,
    cohortId: string,
): Promise<string> {
    const data = await api.request(
        `/agent-execution/studies/${studyId}/cohorts/${cohortId}/agent-prompt`,
    );
    return data.prompt as string;
}
