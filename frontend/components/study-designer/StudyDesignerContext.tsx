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
    getStudyProgress,
} from "./types";
import {
    Phase,
    Step,
    Mode,
    PHASE_FOR_LOADING,
    PHASE_FOR_REVIEW,
    STEP_REQUESTS,
    DesignerState,
    createEmptyStudy,
} from "./study-designer-helpers";
import { api } from "@/lib/api";

export type { Phase } from "./study-designer-helpers";

// ── Context ──

interface DesignerContextValue {
    phase: Phase;
    study: StudyState;
    initialPrompt: string;
    isBusy: boolean;
    isSaving: boolean;
    error: string | null;
    isFinalizingCohorts: boolean;
    finalizeError: string | null;
    updateField: (
        path:
            | "title"
            | "briefing"
            | "executiveSummary"
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
    looksGood: () => Promise<void>;
    regenerate: () => Promise<void>;
    retryFinalize: () => Promise<void>;
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
    onDesignComplete?: () => void;
}

export function StudyDesignerProvider({
    initialPrompt,
    savedStudyId,
    children,
    onStudyUpdate,
    onDesignComplete,
}: ProviderProps) {
    const [state, setState] = useState<DesignerState>(() => ({
        phase: "loading_executive_summary",
        study: createEmptyStudy(),
        initialPrompt,
        isBusy: false,
        isSaving: false,
        error: null,
        isFinalizingCohorts: false,
        finalizeError: null,
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

            try {
                const { endpoint, buildBody } = STEP_REQUESTS[step];
                const res = await api.post(
                    endpoint,
                    buildBody(stateRef.current, mode)
                );

                const proposals: Array<{ type: string; value: any }> =
                    res.proposals ?? [];

                setState((s) => {
                    let study = s.study;

                    if (step === "executive_summary") {
                        const summaryProp = proposals.find(
                            (p) => p.type === "update_executive_summary"
                        );
                        study = {
                            ...study,
                            executiveSummary:
                                typeof summaryProp?.value === "string"
                                    ? summaryProp.value
                                    : study.executiveSummary,
                        };
                    } else if (step === "title") {
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
                    } else if (step === "objectives") {
                        const objectiveProps = proposals.filter(
                            (p) => p.type === "add_objective"
                        );
                        const objectives: ResearchObjective[] = objectiveProps.map(
                            (p) => {
                                const v = p.value ?? {};
                                return {
                                    id: crypto.randomUUID(),
                                    title: v.title ?? "",
                                    description: v.description ?? "",
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
                    } else {
                        // research_questions
                        const setProp = proposals.find(
                            (p) => p.type === "set_research_questions"
                        );
                        const items = Array.isArray(setProp?.value)
                            ? setProp.value
                            : [];
                        const keyResearchQuestions = items.map((q: any) => ({
                            id: crypto.randomUUID(),
                            title: typeof q?.title === "string" ? q.title : "",
                            question:
                                typeof q?.question === "string"
                                    ? q.question
                                    : "",
                        }));
                        study = {
                            ...study,
                            keyResearchQuestions,
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
        // READY must have a title (completed studies must be nameable);
        // DRAFT saves are allowed from the first approved step (e.g. exec-summary).
        if (status === "READY" && !study.title) return;
        setState((s) => ({ ...s, isSaving: true }));
        try {
            const res = await api.post("/study-planner/save", {
                id: study.id,
                title: study.title,
                initial_prompt: prompt,
                briefing: study.briefing,
                executive_summary: study.executiveSummary,
                emotion_detection: study.emotionDetection,
                participant_languages: study.participantLanguages,
                reporting_language: study.reportingLanguage,
                advanced_settings: study.advancedSettings,
                welcome_page: study.welcomePage,
                topic_guide: study.topicGuide,
                key_research_questions: study.keyResearchQuestions,
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
                if (path === "executiveSummary") {
                    return {
                        ...s,
                        study: { ...s.study, executiveSummary: value },
                    };
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
            },
        ]);
    }, [mapObjectives]);

    const runFinalize = useCallback(async () => {
        const studyId = stateRef.current.study.id;
        if (!studyId) return;
        setState((s) => ({ ...s, isFinalizingCohorts: true, finalizeError: null }));
        try {
            await api.post(
                `/study-planner/studies/${studyId}/cohorts/generate`,
                {}
            );
            setState((s) => ({ ...s, isFinalizingCohorts: false }));
            onDesignComplete?.();
        } catch (e: any) {
            setState((s) => ({
                ...s,
                isFinalizingCohorts: false,
                finalizeError: "Couldn't finish preparing your study.",
            }));
        }
    }, [onDesignComplete]);

    const looksGood = useCallback(async () => {
        if (stateRef.current.isBusy) return;
        const phase = stateRef.current.phase;

        if (phase === "review_executive_summary") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("DRAFT");
            await runStep("title", "initial");
        } else if (phase === "review_title") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("DRAFT");
            await runStep("welcome", "initial");
        } else if (phase === "review_welcome") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("DRAFT");
            await runStep("objectives", "initial");
        } else if (phase === "review_objectives") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("DRAFT");
            await runStep("research_questions", "initial");
        } else if (phase === "review_research_questions") {
            setState((s) => ({ ...s, isBusy: true }));
            await saveStudy("READY");
            // Transition to done immediately — banner inside the done screen
            // surfaces finalize progress. onDesignComplete fires only after
            // cohort generation resolves (inside runFinalize), so the
            // "Continue to Recruitment" button appears only when the study
            // is truly ready.
            setState((s) => ({ ...s, phase: "done", isBusy: false }));
            await runFinalize();
        }
    }, [saveStudy, runStep, runFinalize]);

    const retryFinalize = useCallback(async () => {
        if (stateRef.current.isFinalizingCohorts) return;
        await runFinalize();
    }, [runFinalize]);

    const regenerate = useCallback(async () => {
        if (stateRef.current.isBusy) return;
        const phase = stateRef.current.phase;
        if (phase === "review_executive_summary")
            await runStep("executive_summary", "regenerate");
        else if (phase === "review_title")
            await runStep("title", "regenerate");
        else if (phase === "review_welcome")
            await runStep("welcome", "regenerate");
        else if (phase === "review_objectives")
            await runStep("objectives", "regenerate");
        else if (phase === "review_research_questions")
            await runStep("research_questions", "regenerate");
    }, [runStep]);

    // ── Lifecycle effects ──

    // Initial mount: fire the executive summary step. Skipped when resuming a saved study.
    useEffect(() => {
        if (savedStudyId) return;
        if (initialMountFired.current) return;
        if (!initialPrompt) return;
        initialMountFired.current = true;
        runStep("executive_summary", "initial");
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
                    executiveSummary: data.executive_summary || "",
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
                        data.topic_guide || { objectives: [] },
                    keyResearchQuestions: data.key_research_questions || [],
                };

                setState((s) => ({
                    ...s,
                    study: restored,
                    initialPrompt: data.initial_prompt || s.initialPrompt,
                }));

                const progress = getStudyProgress(restored);
                if (progress.isComplete) {
                    setState((s) => ({ ...s, phase: "done" }));
                    onDesignComplete?.();
                    return;
                }

                const next = progress.currentStep;
                if (next === "executive_summary") {
                    runStep("executive_summary", "initial");
                } else if (next === "title" || next === "briefing") {
                    runStep("title", "initial");
                } else if (next === "welcome_page") {
                    runStep("welcome", "initial");
                } else if (next === "objectives") {
                    runStep("objectives", "initial");
                } else if (next === "research_questions") {
                    runStep("research_questions", "initial");
                }
            } catch (e) {
                console.warn("Failed to restore study:", e);
                setState((s) => ({
                    ...s,
                    error: "Couldn't load this study. Please try again.",
                }));
            }
        })();
    }, [savedStudyId, runStep, onDesignComplete]);

    // Propagate study changes to parent.
    useEffect(() => {
        onStudyUpdate?.(state.study);
    }, [state.study, onStudyUpdate]);

    return (
        <DesignerContext.Provider
            value={{
                phase: state.phase,
                study: state.study,
                initialPrompt: state.initialPrompt,
                isBusy: state.isBusy,
                isSaving: state.isSaving,
                error: state.error,
                isFinalizingCohorts: state.isFinalizingCohorts,
                finalizeError: state.finalizeError,
                updateField,
                updateObjective,
                deleteObjective,
                addObjective,
                looksGood,
                regenerate,
                retryFinalize,
            }}
        >
            {children}
        </DesignerContext.Provider>
    );
}
