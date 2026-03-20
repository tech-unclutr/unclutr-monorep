// ── Study State ──

export type InterviewMode = "video_call" | "audio_call" | "chat";

export interface StudyState {
    id: string;
    title: string;
    briefing: string;
    emotionDetection: boolean;
    participantLanguages: string[];
    reportingLanguage: string;
    advancedSettings: {
        maxDuration: number;
        recordVideo: boolean;
        recordAudio: boolean;
        allowSkipQuestions: boolean;
    };
    welcomePage: {
        title: string;
        description: string;
    };
    topicGuide: {
        introQuestions: Question[];
        objectives: ResearchObjective[];
    };
}

export interface ResearchObjective {
    id: string;
    title: string;
    description: string;
    questions: Question[];
}

export type QuestionType = "open-ended" | "single-select" | "multiselect";

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    context: string;
    participantCount: number;
    interviewMode: InterviewMode;
    options?: string[];
    probes?: string[];
    stimulus?: string[];
}

// ── AI Proposals ──

export type ChangeType =
    | "update_title"
    | "update_briefing"
    | "update_welcome_title"
    | "update_welcome_description"
    | "add_objective"
    | "update_objective"
    | "add_question"
    | "update_question"
    | "toggle_emotion_detection"
    | "set_languages"
    | "update_advanced_settings";

export interface PendingChange {
    id: string;
    type: ChangeType;
    targetId?: string;
    parentId?: string;
    label: string;
    value: any;
    status: "pending" | "accepted" | "rejected";
}

// ── Conversation ──

export interface ConversationMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    proposals?: PendingChange[];
    followUpChips?: string[];
    timestamp: number;
}

// ── AI Actions (auto-executed, no accept/reject) ──

export type ActionType =
    | "delete_question"
    | "delete_objective"
    | "reorder_question"
    | "reorder_objective";

export interface AIAction {
    type: ActionType;
    objectiveIndex?: number;
    questionIndex?: number;
    toIndex?: number;
}

// ── Backend Response ──

export interface AssistantResponse {
    reply: string;
    proposals: Omit<PendingChange, "id" | "status">[];
    actions: AIAction[];
    followUpChips: string[];
}
