"use client";

import {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from "react";
import {
    StudyState,
    PendingChange,
    ConversationMessage,
    AssistantResponse,
    AIAction,
    ResearchObjective,
    Question,
} from "./types";
import { api } from "@/lib/api";

// ── State ──

interface DesignerState {
    study: StudyState;
    pendingChanges: PendingChange[];
    conversation: ConversationMessage[];
    isLoading: boolean;
    initialPrompt: string;
}

function createEmptyStudy(): StudyState {
    return {
        id: crypto.randomUUID(),
        title: "",
        briefing: "",
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
        topicGuide: { introQuestions: [], objectives: [] },
    };
}

const initialState: DesignerState = {
    study: createEmptyStudy(),
    pendingChanges: [],
    conversation: [],
    isLoading: false,
    initialPrompt: "",
};

// ── Actions ──

type Action =
    | { type: "FIELD_UPDATE"; field: string; value: any }
    | { type: "ADD_OBJECTIVE"; objective: ResearchObjective }
    | { type: "UPDATE_OBJECTIVE"; id: string; field: "title" | "description"; value: string }
    | { type: "DELETE_OBJECTIVE"; id: string }
    | { type: "REORDER_OBJECTIVES"; fromIndex: number; toIndex: number }
    | { type: "ADD_QUESTION"; objectiveId: string; question: Question }
    | { type: "UPDATE_QUESTION"; objectiveId: string; questionId: string; field: string; value: any }
    | { type: "DELETE_QUESTION"; objectiveId: string; questionId: string }
    | { type: "REORDER_QUESTIONS"; objectiveId: string; fromIndex: number; toIndex: number }
    | { type: "ADD_USER_MESSAGE"; message: ConversationMessage }
    | { type: "ADD_ASSISTANT_MESSAGE"; message: ConversationMessage; changes: PendingChange[] }
    | { type: "SET_LOADING"; loading: boolean }
    | { type: "ACCEPT_CHANGE"; changeId: string }
    | { type: "REJECT_CHANGE"; changeId: string }
    | { type: "EXECUTE_ACTION"; action: AIAction };

// ── Reducer ──

function applyChange(study: StudyState, change: PendingChange): StudyState {
    const s = { ...study };

    switch (change.type) {
        case "update_title":
            return { ...s, title: change.value };

        case "update_briefing":
            return { ...s, briefing: change.value };

        case "update_welcome_title":
            return { ...s, welcomePage: { ...s.welcomePage, title: change.value } };

        case "update_welcome_description":
            return { ...s, welcomePage: { ...s.welcomePage, description: change.value } };

        case "toggle_emotion_detection":
            return { ...s, emotionDetection: change.value };

        case "set_languages":
            return {
                ...s,
                participantLanguages: change.value.participantLanguages ?? s.participantLanguages,
                reportingLanguage: change.value.reportingLanguage ?? s.reportingLanguage,
            };

        case "update_advanced_settings":
            return { ...s, advancedSettings: { ...s.advancedSettings, ...change.value } };

        case "add_objective": {
            const obj: ResearchObjective = {
                id: crypto.randomUUID(),
                title: change.value.title,
                description: change.value.description,
                questions: (change.value.questions ?? []).map((q: any) => ({
                    id: crypto.randomUUID(),
                    text: q.text,
                    type: q.type ?? "open-ended",
                    context: q.context ?? "",
                    participantCount: q.participantCount ?? 8,
                    interviewMode: q.interviewMode ?? "video_call",
                    probes: q.probes,
                })),
            };
            return {
                ...s,
                topicGuide: {
                    ...s.topicGuide,
                    objectives: [...s.topicGuide.objectives, obj],
                },
            };
        }

        case "update_objective": {
            return {
                ...s,
                topicGuide: {
                    ...s.topicGuide,
                    objectives: s.topicGuide.objectives.map((o) =>
                        o.id === change.targetId ? { ...o, ...change.value } : o
                    ),
                },
            };
        }

        case "add_question": {
            const q: Question = {
                id: crypto.randomUUID(),
                text: change.value.text,
                type: change.value.type ?? "open-ended",
                context: change.value.context ?? "",
                participantCount: change.value.participantCount ?? 8,
                interviewMode: change.value.interviewMode ?? "video_call",
                probes: change.value.probes,
            };
            return {
                ...s,
                topicGuide: {
                    ...s.topicGuide,
                    objectives: s.topicGuide.objectives.map((o) =>
                        o.id === change.parentId
                            ? { ...o, questions: [...o.questions, q] }
                            : o
                    ),
                },
            };
        }

        case "update_question": {
            return {
                ...s,
                topicGuide: {
                    ...s.topicGuide,
                    objectives: s.topicGuide.objectives.map((o) =>
                        o.id === change.parentId
                            ? {
                                  ...o,
                                  questions: o.questions.map((q) =>
                                      q.id === change.targetId ? { ...q, ...change.value } : q
                                  ),
                              }
                            : o
                    ),
                },
            };
        }

        default:
            return s;
    }
}

function setNestedField(study: StudyState, field: string, value: any): StudyState {
    const keys = field.split(".");
    if (keys.length === 1) {
        return { ...study, [field]: value };
    }
    if (keys.length === 2) {
        const [parent, child] = keys;
        const nested = (study as any)[parent];
        return { ...study, [parent]: { ...nested, [child]: value } } as StudyState;
    }
    return study;
}

function reducer(state: DesignerState, action: Action): DesignerState {
    switch (action.type) {
        case "FIELD_UPDATE":
            return { ...state, study: setNestedField(state.study, action.field, action.value) };

        case "ADD_OBJECTIVE":
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: [...state.study.topicGuide.objectives, action.objective],
                    },
                },
            };

        case "UPDATE_OBJECTIVE":
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: state.study.topicGuide.objectives.map((o) =>
                            o.id === action.id ? { ...o, [action.field]: action.value } : o
                        ),
                    },
                },
            };

        case "DELETE_OBJECTIVE":
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: state.study.topicGuide.objectives.filter(
                            (o) => o.id !== action.id
                        ),
                    },
                },
            };

        case "REORDER_OBJECTIVES": {
            const objectives = [...state.study.topicGuide.objectives];
            const [moved] = objectives.splice(action.fromIndex, 1);
            objectives.splice(action.toIndex, 0, moved);
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: { ...state.study.topicGuide, objectives },
                },
            };
        }

        case "ADD_QUESTION":
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: state.study.topicGuide.objectives.map((o) =>
                            o.id === action.objectiveId
                                ? { ...o, questions: [...o.questions, action.question] }
                                : o
                        ),
                    },
                },
            };

        case "UPDATE_QUESTION":
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: state.study.topicGuide.objectives.map((o) =>
                            o.id === action.objectiveId
                                ? {
                                      ...o,
                                      questions: o.questions.map((q) =>
                                          q.id === action.questionId ? { ...q, [action.field]: action.value } : q
                                      ),
                                  }
                                : o
                        ),
                    },
                },
            };

        case "DELETE_QUESTION":
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: state.study.topicGuide.objectives.map((o) =>
                            o.id === action.objectiveId
                                ? { ...o, questions: o.questions.filter((q) => q.id !== action.questionId) }
                                : o
                        ),
                    },
                },
            };

        case "REORDER_QUESTIONS": {
            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: {
                        ...state.study.topicGuide,
                        objectives: state.study.topicGuide.objectives.map((o) => {
                            if (o.id !== action.objectiveId) return o;
                            const questions = [...o.questions];
                            const [moved] = questions.splice(action.fromIndex, 1);
                            questions.splice(action.toIndex, 0, moved);
                            return { ...o, questions };
                        }),
                    },
                },
            };
        }

        case "ADD_USER_MESSAGE":
            return { ...state, conversation: [...state.conversation, action.message] };

        case "ADD_ASSISTANT_MESSAGE":
            return {
                ...state,
                conversation: [...state.conversation, action.message],
                pendingChanges: [...state.pendingChanges, ...action.changes],
            };

        case "SET_LOADING":
            return { ...state, isLoading: action.loading };

        case "ACCEPT_CHANGE": {
            const change = state.pendingChanges.find((c) => c.id === action.changeId);
            if (!change || change.status !== "pending") return state;
            return {
                ...state,
                study: applyChange(state.study, change),
                pendingChanges: state.pendingChanges.map((c) =>
                    c.id === action.changeId ? { ...c, status: "accepted" as const } : c
                ),
            };
        }

        case "REJECT_CHANGE": {
            const rejected = state.pendingChanges.find((c) => c.id === action.changeId);
            let study = state.study;

            // If rejecting a pre-filled title/briefing, clear the field
            if (rejected?.status === "pending") {
                if (rejected.type === "update_title") {
                    study = { ...study, title: "" };
                } else if (rejected.type === "update_briefing") {
                    study = { ...study, briefing: "" };
                } else if (rejected.type === "update_welcome_title") {
                    study = { ...study, welcomePage: { ...study.welcomePage, title: "" } };
                } else if (rejected.type === "update_welcome_description") {
                    study = { ...study, welcomePage: { ...study.welcomePage, description: "" } };
                }
            }

            return {
                ...state,
                study,
                pendingChanges: state.pendingChanges.map((c) =>
                    c.id === action.changeId ? { ...c, status: "rejected" as const } : c
                ),
            };
        }

        case "EXECUTE_ACTION": {
            const a = action.action;
            const objectives = [...state.study.topicGuide.objectives];

            switch (a.type) {
                case "delete_question": {
                    const objIdx = a.objectiveIndex ?? -1;
                    const qIdx = a.questionIndex ?? -1;
                    if (objIdx < 0 || objIdx >= objectives.length) return state;
                    const obj = objectives[objIdx];
                    if (qIdx < 0 || qIdx >= obj.questions.length) return state;
                    objectives[objIdx] = {
                        ...obj,
                        questions: obj.questions.filter((_, i) => i !== qIdx),
                    };
                    break;
                }
                case "delete_objective": {
                    const objIdx = a.objectiveIndex ?? -1;
                    if (objIdx < 0 || objIdx >= objectives.length) return state;
                    objectives.splice(objIdx, 1);
                    break;
                }
                case "reorder_question": {
                    const objIdx = a.objectiveIndex ?? -1;
                    const fromIdx = a.questionIndex ?? -1;
                    const toIdx = a.toIndex ?? -1;
                    if (objIdx < 0 || objIdx >= objectives.length) return state;
                    const obj = objectives[objIdx];
                    if (fromIdx < 0 || fromIdx >= obj.questions.length) return state;
                    if (toIdx < 0 || toIdx >= obj.questions.length) return state;
                    const questions = [...obj.questions];
                    const [moved] = questions.splice(fromIdx, 1);
                    questions.splice(toIdx, 0, moved);
                    objectives[objIdx] = { ...obj, questions };
                    break;
                }
                case "reorder_objective": {
                    const fromIdx = a.objectiveIndex ?? -1;
                    const toIdx = a.toIndex ?? -1;
                    if (fromIdx < 0 || fromIdx >= objectives.length) return state;
                    if (toIdx < 0 || toIdx >= objectives.length) return state;
                    const [moved] = objectives.splice(fromIdx, 1);
                    objectives.splice(toIdx, 0, moved);
                    break;
                }
                default:
                    return state;
            }

            return {
                ...state,
                study: {
                    ...state.study,
                    topicGuide: { ...state.study.topicGuide, objectives },
                },
            };
        }

        default:
            return state;
    }
}

// ── Context ──

interface DesignerContextValue {
    state: DesignerState;
    dispatch: React.Dispatch<Action>;
    sendMessage: (text: string) => void;
    acceptChange: (changeId: string) => void;
    rejectChange: (changeId: string) => void;
    generateNextSection: () => void;
}

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function useDesigner() {
    const ctx = useContext(DesignerContext);
    if (!ctx) throw new Error("useDesigner must be used within StudyDesignerProvider");
    return ctx;
}

// ── Provider ──

interface ProviderProps {
    initialPrompt: string;
    children: ReactNode;
}

export function StudyDesignerProvider({ initialPrompt, children }: ProviderProps) {
    const [state, dispatch] = useReducer(reducer, { ...initialState, initialPrompt });
    const initialPromptSent = useRef(false);

    const callAssistant = useCallback(
        async (userText: string, currentState: DesignerState) => {
            dispatch({ type: "SET_LOADING", loading: true });

            try {
                const backendRes = await api.post("/study-designer/chat", {
                    study_state: currentState.study,
                    messages: currentState.conversation.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    user_message: userText,
                });

                const response: AssistantResponse = {
                    reply: backendRes.reply,
                    proposals: backendRes.proposals ?? [],
                    actions: backendRes.actions ?? [],
                    followUpChips: backendRes.follow_up_chips ?? [],
                };

                // Execute actions immediately (delete, reorder — no accept/reject)
                for (const action of response.actions) {
                    dispatch({ type: "EXECUTE_ACTION", action });
                }

                // Pre-fill scalar field proposals so the user sees content immediately
                // in the input fields. They stay as pending proposals for accept/reject.
                const PREFILL_MAP: Record<string, string> = {
                    update_title: "title",
                    update_briefing: "briefing",
                    update_welcome_title: "welcomePage.title",
                    update_welcome_description: "welcomePage.description",
                };

                // On first response, inject fallback title/briefing if AI didn't provide them
                const isFirstResponse = !currentState.study.title && !currentState.study.briefing;
                if (isFirstResponse) {
                    const hasTitle = response.proposals.some((p) => p.type === "update_title" && typeof p.value === "string" && p.value);
                    const hasBriefing = response.proposals.some((p) => p.type === "update_briefing" && typeof p.value === "string" && p.value);

                    if (!hasTitle) {
                        const prompt = userText.trim();
                        const short = prompt.length > 50 ? prompt.slice(0, 47).replace(/\s+\S*$/, "") + "..." : prompt;
                        response.proposals.unshift({
                            type: "update_title",
                            label: "Set study title",
                            value: `Consumer Research: ${short.charAt(0).toUpperCase()}${short.slice(1)}`,
                        });
                    }
                    if (!hasBriefing) {
                        response.proposals.splice(hasTitle ? 1 : 0, 0, {
                            type: "update_briefing",
                            label: "Set research brief",
                            value: `This qualitative study aims to explore ${userText.trim().toLowerCase()}. Through in-depth interviews with target consumers, we will uncover underlying motivations, attitudes, and behavioral patterns that inform strategic decisions.`,
                        });
                    }
                }

                // Pre-fill all scalar fields into the editor
                for (const p of response.proposals) {
                    const field = PREFILL_MAP[p.type];
                    if (field && typeof p.value === "string") {
                        dispatch({ type: "FIELD_UPDATE", field, value: p.value });
                    }
                }

                // All proposals go through as pending (including title/brief for accept/reject)
                const changes: PendingChange[] = response.proposals.map((p) => ({
                    ...p,
                    id: crypto.randomUUID(),
                    status: "pending" as const,
                }));

                const assistantMsg: ConversationMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: response.reply,
                    proposals: changes,
                    followUpChips: response.followUpChips,
                    timestamp: Date.now(),
                };

                dispatch({ type: "ADD_ASSISTANT_MESSAGE", message: assistantMsg, changes });
            } catch {
                const errorMsg: ConversationMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again.",
                    timestamp: Date.now(),
                };
                dispatch({ type: "ADD_ASSISTANT_MESSAGE", message: errorMsg, changes: [] });
            } finally {
                dispatch({ type: "SET_LOADING", loading: false });
            }
        },
        []
    );

    // Send initial prompt on mount — AI will generate the title + brief
    useEffect(() => {
        if (initialPromptSent.current || !initialPrompt) return;
        initialPromptSent.current = true;

        const userMsg: ConversationMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: initialPrompt,
            timestamp: Date.now(),
        };
        dispatch({ type: "ADD_USER_MESSAGE", message: userMsg });

        const stateWithUserMsg: DesignerState = {
            ...initialState,
            conversation: [userMsg],
        };
        callAssistant(initialPrompt, stateWithUserMsg);
    }, [initialPrompt, callAssistant]);

    const sendMessage = useCallback(
        (text: string) => {
            const userMsg: ConversationMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: text,
                timestamp: Date.now(),
            };
            dispatch({ type: "ADD_USER_MESSAGE", message: userMsg });

            // Build the state snapshot that includes this new message
            const snapshotState: DesignerState = {
                ...state,
                conversation: [...state.conversation, userMsg],
            };
            callAssistant(text, snapshotState);
        },
        [state, callAssistant]
    );

    const generateNextSection = useCallback(() => {
        if (state.isLoading) return;

        // Determine what to ask for based on what's empty
        const { study } = state;
        let prompt: string;

        if (!study.welcomePage.title || !study.welcomePage.description) {
            prompt = "Generate the welcome page title and message for participants.";
        } else if (study.topicGuide.objectives.length === 0) {
            prompt = "Create 2-3 research objectives with questions for this study.";
        } else if (study.topicGuide.objectives.some((o) => o.questions.length === 0)) {
            const obj = study.topicGuide.objectives.find((o) => o.questions.length === 0);
            prompt = `Generate interview questions for the objective "${obj?.title}".`;
        } else if (study.topicGuide.objectives.length < 2) {
            prompt = "Add one more research objective with questions to round out the study.";
        } else {
            return; // Study is complete
        }

        // Send as a system-initiated message (not shown as user bubble)
        const stateSnapshot: DesignerState = { ...state };
        callAssistant(prompt, stateSnapshot);
    }, [state, callAssistant]);

    const acceptChange = useCallback(
        (changeId: string) => dispatch({ type: "ACCEPT_CHANGE", changeId }),
        []
    );

    const rejectChange = useCallback(
        (changeId: string) => dispatch({ type: "REJECT_CHANGE", changeId }),
        []
    );

    // Auto-generate next section when all pending proposals are resolved
    const prevPendingCount = useRef(0);
    useEffect(() => {
        const pendingCount = state.pendingChanges.filter((c) => c.status === "pending").length;
        const wasPending = prevPendingCount.current > 0;
        const nowClear = pendingCount === 0;
        prevPendingCount.current = pendingCount;

        // Trigger next section only when pending goes from >0 to 0 (user resolved all proposals)
        if (wasPending && nowClear && !state.isLoading) {
            // Small delay so the UI settles before next batch appears
            const timer = setTimeout(() => generateNextSection(), 600);
            return () => clearTimeout(timer);
        }
    }, [state.pendingChanges, state.isLoading, generateNextSection]);

    return (
        <DesignerContext.Provider value={{ state, dispatch, sendMessage, acceptChange, rejectChange, generateNextSection }}>
            {children}
        </DesignerContext.Provider>
    );
}
