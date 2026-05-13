export interface StudyContext {
    studyId?: string;
    title: string;
    briefing?: string;
    objectives?: Array<{
        title: string;
        description?: string;
    }>;
}
