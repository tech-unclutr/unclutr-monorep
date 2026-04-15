"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    StudyState,
    ResearchObjective,
    Question,
    QuestionType,
    InterviewMode,
    getStudyProgress,
} from "./types";
import { api } from "@/lib/api";

// ── Phase machine ──

export type Phase =
    | "loading_title"
    | "review_title"
    | "loading_welcome"
    | "review_welcome"
    | "loading_objectives"
    | "review_objectives"
    | "done";

type Step = "title" | "welcome" | "objectives";
type Mode = "initial" | "regenerate";

const PHASE_FOR_LOADING: Record<Step, Phase> = {
    title: "loading_title",
    welcome: "loading_welcome",
    objectives: "loading_objectives",
};

const PHASE_FOR_REVIEW: Record<Step, Phase> = {
    title: "review_title",
    welcome: "review_welcome",
    objectives: "review_objectives",
};

const REGENERATE_MESSAGES: Record<Step, string> = {
    title: "Regenerate a different title and research brief for this study.",
    welcome: "Regenerate a different welcome page title and description.",
    objectives:
        "Regenerate different research objectives and questions for this study.",
};

const INITIAL_MESSAGES: Record<Exclude<Step, "title">, string> = {
    welcome: "Generate the welcome page title and description for participants.",
    objectives:
        "Create 2-3 research objectives for this study, each with 3-5 interview questions.",
};

// ── State ──

interface DesignerState {
    phase: Phase;
    study: StudyState;
    initialPrompt: string;
    isBusy: boolean;
    isSaving: boolean;
    error: string | null;
}

const SAVE_DEBOUNCE_MS = 800;

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

// ── Context ──

type QuestionFieldValue = string | number | string[] | QuestionType | InterviewMode;

interface DesignerContextValue {
    phase: Phase;
    study: StudyState;
    initialPrompt: string;
    isBusy: boolean;
    isSaving: boolean;
    error: string | null;
    updateField: (
        path:
            | "title"
            | "briefing"
            | "welcomePage.title"
            | "welcomePage.description",
        value: string
    ) => void;
    updateObjective: (
        objectiveId: string,
        field: "title" | "description",
        value: string
    ) => void;
    deleteObjective: (objectiveId: string) => void;
    addObjective: () => void;
    updateQuestion: (
        objectiveId: string,
        questionId: string,
        field: keyof Question,
        value: QuestionFieldValue
    ) => void;
    deleteQuestion: (objectiveId: string, questionId: string) => void;
    addQuestion: (objectiveId: string) => void;
    looksGood: () => Promise<void>;
    regenerate: () => Promise<void>;
}

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function useDesigner() {
    const ctx = useContext(DesignerContext);
    if (!ctx)
        throw new Error("useDesigner must be used within StudyDesignerProvider");
    return ctx;
}

// ── Provider ──

interface ProviderProps {
    initialPrompt: string;
    savedStudyId?: string;
    children: ReactNode;
    onStudyUpdate?: (study: StudyState) => void;
}

export function StudyDesignerProvider({
    initialPrompt,
    savedStudyId,
    children,
    onStudyUpdate,
}: ProviderProps) {
    const [state, setState] = useState<DesignerState>(() => ({
        phase: "loading_title",
        study: createEmptyStudy(),
        initialPrompt,
        isBusy: false,
        isSaving: false,
        error: null,
    }));

    // Refs that always reflect the latest state — used inside async helpers
    // so we don't capture stale values across awaits.
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const initialMountFired = useRef(false);
    const restoreFired = useRef(false);

    // ── Step machine ──

    const runStep = useCallback(
        async (step: Step, mode: Mode) => {
            setState((s) => ({
                ...s,
                phase: PHASE_FOR_LOADING[step],
                isBusy: true,
                error: null,
            }));

            const userMessage =
                mode === "regenerate"
                    ? REGENERATE_MESSAGES[step]
                    : step === "title"
                    ? stateRef.current.initialPrompt
                    : INITIAL_MESSAGES[step];

            try {
                const res = await api.post("/study-planner/chat", {
                    study_state: stateRef.current.study,
                    messages: [],
                    user_message: userMessage,
                });

                const proposals: Array<{ type: string; value: any }> =
                    res.proposals ?? [];

                setState((s) => {
                    let study = s.study;

                    if (step === "title") {
                        const titleProp = proposals.find(
                            (p) => p.type === "update_title"
                        );
                        const briefProp = proposals.find(
                            (p) => p.type === "update_briefing"
                        );
                        study = {
                            ...study,
                            title:
                                typeof titleProp?.value === "string"
                                    ? titleProp.value
                                    : study.title,
                            briefing:
                                typeof briefProp?.value === "string"
                                    ? briefProp.value
                                    : study.briefing,
                        };
                    } else if (step === "welcome") {
                        const titleProp = proposals.find(
                            (p) => p.type === "update_welcome_title"
                        );
                        const descProp = proposals.find(
                            (p) => p.type === "update_welcome_description"
                        );
                        study = {
                            ...study,
                            welcomePage: {
                                title:
                                    typeof titleProp?.value === "string"
                                        ? titleProp.value
                                        : study.welcomePage.title,
                                description:
                                    typeof descProp?.value === "string"
                                        ? descProp.value
                                        : study.welcomePage.description,
                            },
                        };
                    } else {
                        const objectiveProps = proposals.filter(
                            (p) => p.type === "add_objective"
                        );
                        const objectives: ResearchObjective[] = objectiveProps.map(
                            (p) => {
                                const v = p.value ?? {};
                                const questions: Question[] = (v.questions ?? []).map(
                                    (q: any) => ({
                                        id: crypto.randomUUID(),
                                        text: q.text ?? "",
                                        type: q.type ?? "open-ended",
                                        context: q.context ?? "",
                                        participantCount: q.participantCount ?? 8,
                                        interviewMode:
                                            q.interviewMode ?? "video_call",
                                        options: q.options,
                                        probes: q.probes,
                                        stimulus: q.stimulus,
                                    })
                                );
                                return {
                                    id: crypto.randomUUID(),
                                    title: v.title ?? "",
                                    description: v.description ?? "",
                                    questions,
                                };
                            }
                        );
                        study = {
                            ...study,
                            topicGuide: {
                                ...study.topicGuide,
                                objectives,
                            },
                        };
                    }

                    return {
                        ...s,
                        study,
                        phase: PHASE_FOR_REVIEW[step],
                        isBusy: false,
                    };
                });
            } catch {
                setState((s) => ({
                    ...s,
                    phase: PHASE_FOR_REVIEW[step],
                    isBusy: false,
                    error: "Something went wrong. Please try again.",
                }));
            }
        },
        []
    );

    // ── Save ──

    const saveStudy = useCallback(async (status: "DRAFT" | "READY") => {
        const { study, initialPrompt: prompt } = stateRef.current;
        if (!study.title) return;
        setState((s) => ({ ...s, isSaving: true }));
        try {
            const res = await api.post("/study-planner/save", {
                title: study.title,
                initial_prompt: prompt,
                briefing: study.briefing,
                emotion_detection: study.emotionDetection,
                participant_languages: study.participantLanguages,
                reporting_language: study.reportingLanguage,
                advanced_settings: study.advancedSettings,
                welcome_page: study.welcomePage,
                topic_guide: study.topicGuide,
                conversation_history: [],
                status,
            });
            setState((s) => ({
                ...s,
                study: res?.id ? { ...s.study, id: res.id } : s.study,
                isSaving: false,
            }));
        } catch (e) {
            console.warn("Save failed:", e);
            setState((s) => ({ ...s, isSaving: false }));
        }
    }, []);

    // ── Public actions ──

    const updateField = useCallback<DesignerContextValue["updateField"]>(
        (path, value) => {
            setState((s) => {
                if (path === "title") {
                    return { ...s, study: { ...s.study, title: value } };
                }
                if (path === "briefing") {
                    return { ...s, study: { ...s.study, briefing: value } };
                }
                if (path === "welcomePage.title") {
                    return {
                        ...s,
                        study: {
                            ...s.study,
                            welcomePage: { ...s.study.welcomePage, title: value },
                        },
                    };
                }
                return {
                    ...s,
                    study: {
                        ...s.study,
                        welcomePage: { ...s.study.welcomePage, description: value },
                    },
                };
            });
        },
        []
    );

    const mapObjectives = useCallback(
        (mapper: (objs: ResearchObjective[]) => ResearchObjective[]) => {
            setState((s) => ({
                ...s,
                study: {
                    ...s.study,
                    topicGuide: {
                        ...s.study.topicGuide,
                        objectives: mapper(s.study.topicGuide.objectives),
                    },
                },
            }));
        },
        []
    );

    const updateObjective = useCallback<DesignerContextValue["updateObjective"]>(
        (objectiveId, field, value) => {
            mapObjectives((objs) =>
                objs.map((o) => (o.id === objectiveId ? { ...o, [field]: value } : o))
            );
        },
        [mapObjectives]
    );

    const deleteObjective = useCallback<DesignerContextValue["deleteObjective"]>(
        (objectiveId) => {
            mapObjectives((objs) => objs.filter((o) => o.id !== objectiveId));
        },
        [mapObjectives]
    );

    const addObjective = useCallback<DesignerContextValue["addObjective"]>(() => {
        mapObjectives((objs) => [
            ...objs,
            {
                id: crypto.randomUUID(),
                title: "",
                description: "",
                questions: [],
            },
        ]);
    }, [mapObjectives]);

    const updateQuestion = useCallback<DesignerContextValue["updateQuestion"]>(
        (objectiveId, questionId, field, value) => {
            mapObjectives((objs) =>
                objs.map((o) =>
                    o.id === objectiveId
                        ? {
                              ...o,
                              questions: o.questions.map((q) =>
                                  q.id === questionId ? { ...q, [field]: value } : q
                              ),
                          }
                        : o
                )
            );
        },
        [mapObjectives]
    );

    const deleteQuestion = useCallback<DesignerContextValue["deleteQuestion"]>(
        (objectiveId, questionId) => {
            mapObjectives((objs) =>
                objs.map((o) =>
                    o.id === objectiveId
                        ? {
                              ...o,
                              questions: o.questions.filter((q) => q.id !== questionId),
                          }
                        : o
                )
            );
        },
        [mapObjectives]
    );

    const addQuestion = useCallback<DesignerContextValue["addQuestion"]>(
        (objectiveId) => {
            mapObjectives((objs) =>
                objs.map((o) =>
                    o.id === objectiveId
                        ? {
                              ...o,
                              questions: [
                                  ...o.questions,
                                  {
                                      id: crypto.randomUUID(),
                                      text: "",
                                      type: "open-ended",
                                      context: "",
                                      participantCount: 8,
                                      interviewMode: "video_call",
                                  },
                              ],
                          }
                        : o
                )
            );
        },
        [mapObjectives]
    );

    const looksGood = useCallback(async () => {
        if (stateRef.current.isBusy) return;
        const phase = stateRef.current.phase;

        if (phase === "review_title") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("DRAFT");
            await runStep("welcome", "initial");
        } else if (phase === "review_welcome") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("DRAFT");
            await runStep("objectives", "initial");
        } else if (phase === "review_objectives") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("READY");
            setState((s) => ({ ...s, phase: "done", isBusy: false }));
        }
    }, [saveStudy, runStep]);

    const regenerate = useCallback(async () => {
        if (stateRef.current.isBusy) return;
        const phase = stateRef.current.phase;
        if (phase === "review_title") await runStep("title", "regenerate");
        else if (phase === "review_welcome")
            await runStep("welcome", "regenerate");
        else if (phase === "review_objectives")
            await runStep("objectives", "regenerate");
    }, [runStep]);

    // ── Lifecycle effects ──

    // Initial mount: fire the title step. Skipped when resuming a saved study.
    useEffect(() => {
        if (savedStudyId) return;
        if (initialMountFired.current) return;
        if (!initialPrompt) return;
        initialMountFired.current = true;
        runStep("title", "initial");
    }, [savedStudyId, initialPrompt, runStep]);

    // Resume from saved: hydrate state, then run the first incomplete step.
    useEffect(() => {
        if (!savedStudyId) return;
        if (restoreFired.current) return;
        restoreFired.current = true;
        initialMountFired.current = true;

        (async () => {
            try {
                const data = await api.get(
                    `/study-planner/studies/${savedStudyId}`
                );
                const restored: StudyState = {
                    id: data.id,
                    title: data.title || "",
                    briefing: data.briefing || "",
                    emotionDetection: data.emotion_detection ?? false,
                    participantLanguages: data.participant_languages || [
                        "English",
                    ],
                    reportingLanguage: data.reporting_language || "English",
                    advancedSettings:
                        data.advanced_settings ||
                        createEmptyStudy().advancedSettings,
                    welcomePage:
                        data.welcome_page || { title: "", description: "" },
                    topicGuide:
                        data.topic_guide || { introQuestions: [], objectives: [] },
                };

                setState((s) => ({
                    ...s,
                    study: restored,
                    initialPrompt: data.initial_prompt || s.initialPrompt,
                }));

                const progress = getStudyProgress(restored);
                if (progress.isComplete) {
                    setState((s) => ({ ...s, phase: "done" }));
                    return;
                }

                const next = progress.currentStep;
                if (next === "title" || next === "briefing") {
                    runStep("title", "initial");
                } else if (next === "welcome_page") {
                    runStep("welcome", "initial");
                } else if (next === "objectives" || next === "questions") {
                    runStep("objectives", "initial");
                }
            } catch (e) {
                console.warn("Failed to restore study:", e);
                setState((s) => ({
                    ...s,
                    error: "Couldn't load this study. Please try again.",
                }));
            }
        })();
    }, [savedStudyId, runStep]);

    // Propagate study changes to parent.
    useEffect(() => {
        onStudyUpdate?.(state.study);
    }, [state.study, onStudyUpdate]);

    // Debounced auto-save for free edits to already-confirmed sections.
    // Skipped while an LLM call is running (looksGood saves explicitly), and
    // skipped on the first render so we don't fire a save for the empty study.
    const skipFirstAutoSave = useRef(true);
    useEffect(() => {
        if (skipFirstAutoSave.current) {
            skipFirstAutoSave.current = false;
            return;
        }
        if (state.isBusy) return;
        if (!state.study.title) return;
        const t = setTimeout(() => {
            saveStudy("DRAFT");
        }, SAVE_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [state.study, state.isBusy, saveStudy]);

    return (
        <DesignerContext.Provider
            value={{
                phase: state.phase,
                study: state.study,
                initialPrompt: state.initialPrompt,
                isBusy: state.isBusy,
                isSaving: state.isSaving,
                error: state.error,
                updateField,
                updateObjective,
                deleteObjective,
                addObjective,
                updateQuestion,
                deleteQuestion,
                addQuestion,
                looksGood,
                regenerate,
            }}
        >
            {children}
        </DesignerContext.Provider>
    );
}
