import { capitalizeCohortName } from "@/lib/utils";
import { type InterviewQuestion, type AudioBucket } from "@/app/dashboard/playground/components/InterviewBuilder";
import { type StudyContext } from "@/components/recruitment/ExecutionPromptView";
import { api } from "@/lib/api";

// ── Combination prompt types ──────────────────────────────────────────────

export type InterviewTypeKey = AudioBucket | "chat";

export interface CombinationPrompt {
    cohort: string;
    interviewType: InterviewTypeKey;
    label: string;
    questionCount: number;
    prompt: string;
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewTypeKey, string> = {
    chat: "Chat Screening",
    audioA: "Quick Call",
    audioB: "Deep Dive",
    audioC: "Extended Session",
};

export function combinationKey(cohort: string, interviewType: InterviewTypeKey): string {
    return `${cohort}::${interviewType}`;
}

// ── Context shape ──────────────────────────────────────────────────────────

export interface PromptBuildContext {
    studyContext?: StudyContext;
    selectedCohorts: string[];
    getCohortCategories: (cohort: string) => {
        chat: InterviewQuestion[];
        audioA: InterviewQuestion[];
        audioB: InterviewQuestion[];
        audioC: InterviewQuestion[];
    };
    getCohortIncentives: (cohort: string) => Record<string, string | undefined>;
}

// ── Template fetcher ───────────────────────────────────────────────────────

export async function fetchPromptTemplate(): Promise<string> {
    const data = await api.request("/study-planner/prompt-template");
    return data.template as string;
}

// ── Variable formatters ────────────────────────────────────────────────────

function formatObjectives(studyContext?: StudyContext): string {
    if (!studyContext?.objectives?.length) return "[not specified]";
    return studyContext.objectives
        .map((obj, i) => {
            const lines: string[] = [`${i + 1}. ${obj.title}`];
            if (obj.description) lines.push(`   ${obj.description}`);
            return lines.join("\n");
        })
        .join("\n");
}

function formatQuestionSet(
    selectedCohorts: string[],
    getCohortCategories: PromptBuildContext["getCohortCategories"],
    getCohortIncentives: PromptBuildContext["getCohortIncentives"],
): string {
    if (!selectedCohorts.length) return "[no cohorts selected]";

    const formatQ = (q: InterviewQuestion, idx: number) =>
        `   ${idx + 1}. ${q.text}${q.objective ? ` (${q.objective})` : ""} [${q.type}]`;

    return selectedCohorts
        .map((cohort) => {
            const cat = getCohortCategories(cohort);
            const incentives = getCohortIncentives(cohort);
            const sections: string[] = [`Cohort: ${capitalizeCohortName(cohort)}`];

            const selectedChat = cat.chat.filter((q) => q.selected);
            if (selectedChat.length) {
                sections.push("  Chat Screening:");
                selectedChat.forEach((q, i) => sections.push(formatQ(q, i)));
            }

            const audioBuckets = [
                { key: "audioA" as const, label: "Quick Call", items: cat.audioA.filter((q) => q.selected) },
                { key: "audioB" as const, label: "Deep Dive", items: cat.audioB.filter((q) => q.selected) },
                { key: "audioC" as const, label: "Extended Session", items: cat.audioC.filter((q) => q.selected) },
            ];

            audioBuckets.forEach((bucket) => {
                if (!bucket.items.length) return;
                const incentive = incentives[bucket.key];
                sections.push(`  ${bucket.label}${incentive ? ` (Incentive: ${incentive})` : ""}:`);
                bucket.items.forEach((q, i) => sections.push(formatQ(q, i)));
            });

            return sections.join("\n");
        })
        .join("\n\n");
}

function formatQualificationCriteria(
    selectedCohorts: string[],
    getCohortCategories: PromptBuildContext["getCohortCategories"],
): string {
    const allScreening: string[] = [];

    selectedCohorts.forEach((cohort) => {
        const cat = getCohortCategories(cohort);
        const selected = cat.chat.filter((q) => q.selected);
        if (selected.length) {
            allScreening.push(`[${capitalizeCohortName(cohort)}]`);
            selected.forEach((q, i) => allScreening.push(`  ${i + 1}. ${q.text} [${q.type}]`));
        }
    });

    return allScreening.length ? allScreening.join("\n") : "[no screening criteria defined]";
}

function formatIncentiveLine(
    selectedCohorts: string[],
    getCohortIncentives: PromptBuildContext["getCohortIncentives"],
): string {
    const parts: string[] = [];

    selectedCohorts.forEach((cohort) => {
        const incentives = getCohortIncentives(cohort);
        const entries = Object.entries(incentives).filter(([, v]) => v);
        if (entries.length) {
            entries.forEach(([key, value]) => {
                const label = key === "audioA" ? "Quick Call" : key === "audioB" ? "Deep Dive" : "Extended Session";
                parts.push(`${capitalizeCohortName(cohort)} / ${label}: ${value}`);
            });
        }
    });

    return parts.length ? parts.join("; ") : "[no incentive configured]";
}

function formatInterviewType(
    selectedCohorts: string[],
    getCohortCategories: PromptBuildContext["getCohortCategories"],
): string {
    const types = new Set<string>();
    selectedCohorts.forEach((cohort) => {
        const cat = getCohortCategories(cohort);
        if (cat.chat.some((q) => q.selected)) types.add("chat screening");
        if (cat.audioA.some((q) => q.selected)) types.add("audio interview");
    });
    return types.size ? Array.from(types).join(" + ") : "[not specified]";
}

// ── Runtime variable base (shared across builders) ────────────────────────

function runtimeVariables(): Record<string, string> {
    return {
        agent_name: "{agent_name}",
        participant_name: "{participant_name}",
        company_name: "{company_name}",
        language_preference: "{language_preference}",
        disclosure_line: "{disclosure_line}",
        consent_line: "{consent_line}",
        recording_line: "{recording_line}",
        calendar_link: "{calendar_link}",
        whatsapp_followup_link: "{whatsapp_followup_link}",
        email_followup_address: "{email_followup_address}",
        support_contact: "{support_contact}",
    };
}

function substituteVariables(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
        (result, [key, value]) => result.replaceAll(`{${key}}`, value),
        template,
    );
}

// ── Main builder (legacy — all cohorts combined) ──────────────────────────

export function buildExecutionPrompt(template: string, ctx: PromptBuildContext): string {
    const { studyContext, selectedCohorts, getCohortCategories, getCohortIncentives } = ctx;

    const variables: Record<string, string> = {
        ...runtimeVariables(),
        study_title: studyContext?.title || "[study title not set]",
        research_brief: studyContext?.briefing || "[research brief not provided]",
        research_objectives: formatObjectives(studyContext),
        cohort_name: selectedCohorts.map(capitalizeCohortName).join(", ") || "[no cohorts selected]",
        interview_type: formatInterviewType(selectedCohorts, getCohortCategories),
        question_set: formatQuestionSet(selectedCohorts, getCohortCategories, getCohortIncentives),
        qualification_criteria: formatQualificationCriteria(selectedCohorts, getCohortCategories),
        incentive_line: formatIncentiveLine(selectedCohorts, getCohortIncentives),
    };

    return substituteVariables(template, variables);
}

// ── Per-combination builder ───────────────────────────────────────────────

function formatSingleBucketQuestions(questions: InterviewQuestion[]): string {
    if (!questions.length) return "[no questions]";
    return questions
        .map((q, i) => `${i + 1}. ${q.text}${q.objective ? ` (${q.objective})` : ""} [${q.type}]`)
        .join("\n");
}

export function buildPerCombinationPrompts(
    template: string,
    ctx: PromptBuildContext,
): CombinationPrompt[] {
    const { studyContext, selectedCohorts, getCohortCategories, getCohortIncentives } = ctx;
    const results: CombinationPrompt[] = [];

    const allInterviewTypes: InterviewTypeKey[] = ["chat", "audioA", "audioB", "audioC"];

    for (const cohort of selectedCohorts) {
        const categories = getCohortCategories(cohort);
        const incentives = getCohortIncentives(cohort);

        for (const type of allInterviewTypes) {
            const questions = categories[type].filter((q) => q.selected);
            if (!questions.length) continue;

            const label = `${capitalizeCohortName(cohort)} — ${INTERVIEW_TYPE_LABELS[type]}`;
            const isChat = type === "chat";
            const interviewTypeLabel = isChat ? "chat screening" : "audio interview";
            const incentive = isChat ? undefined : incentives[type as AudioBucket];

            const variables: Record<string, string> = {
                ...runtimeVariables(),
                study_title: studyContext?.title || "[study title not set]",
                research_brief: studyContext?.briefing || "[research brief not provided]",
                research_objectives: formatObjectives(studyContext),
                cohort_name: capitalizeCohortName(cohort),
                interview_type: interviewTypeLabel,
                question_set: formatSingleBucketQuestions(questions),
                qualification_criteria: isChat
                    ? formatSingleBucketQuestions(questions)
                    : "[see chat screening prompt for qualification]",
                incentive_line: incentive || "[no incentive configured]",
            };

            results.push({
                cohort,
                interviewType: type,
                label,
                questionCount: questions.length,
                prompt: substituteVariables(template, variables),
            });
        }
    }

    return results;
}
