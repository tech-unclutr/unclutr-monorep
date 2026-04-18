export interface CohortBriefData {
    context: {
        definition: string;
        hypothesis: string;
        objectives: string[];
    };
    screening: {
        interviewCount: number;
        duration: string;
        include: string[];
        exclude: string[];
        idealProfile: string;
    };
    moderator: {
        introScript: string;
        consent: string;
        tone: string;
        dos: string[];
        donts: string[];
    };
    structure: {
        phases: { name: string; duration: string; description: string }[];
    };
    script: {
        questions: { id: string; question: string; probes: string[] }[];
    };
}

const HEALTH_MOMS: CohortBriefData = {
    context: {
        definition:
            "Mothers aged 28–40 with at least one child under 12, primary household grocery decision-maker, who actively read nutrition labels and prioritize organic or whole-food options.",
        hypothesis:
            "These mothers trade off between convenience and ingredient quality; they will pay a 20–30% premium for verified-clean brands but defect quickly when trust is broken.",
        objectives: [
            "Understand the trust signals that justify premium pricing.",
            "Map the weekday vs weekend purchase decision flow.",
            "Identify break-points where convenience overrides health preference.",
        ],
    },
    screening: {
        interviewCount: 12,
        duration: "10–15 minutes",
        include: [
            "Primary grocery shopper in the household",
            "Has a child under 12",
            "Reads nutrition labels weekly or more",
            "Household income $75k+",
        ],
        exclude: [
            "Works in food, CPG, or nutrition marketing",
            "Participated in a similar study in the last 90 days",
        ],
        idealProfile:
            "A 32-year-old working mom of two who shops Whole Foods weekly, uses Instacart for staples, and follows two nutrition-focused accounts on Instagram.",
    },
    moderator: {
        introScript:
            "Thanks for joining — this is a 15-minute conversation about how you choose food for your family. There are no right answers; we just want to understand your real routines.",
        consent:
            "We'll record audio for note-taking only. Your name won't appear in any report, and you can stop any time.",
        tone: "Warm, curious, non-judgmental. Follow tangents when they surface emotional language around health or guilt.",
        dos: [
            "Use her child's name once she mentions it",
            "Pause for 3 seconds after each answer",
            "Ask 'tell me more about that' when she trails off",
        ],
        donts: [
            "Don't suggest specific brands",
            "Don't validate with 'that's great' — stay neutral",
            "Don't rush past probes to hit the next question",
        ],
    },
    structure: {
        phases: [
            {
                name: "Warm-up",
                duration: "2 min",
                description: "Build rapport. Ask about this week's grocery run in her own words.",
            },
            {
                name: "Core Exploration",
                duration: "10 min",
                description:
                    "Walk through a recent purchase decision, then contrast with a purchase she later regretted.",
            },
            {
                name: "Trade-off Probe",
                duration: "2 min",
                description: "Pressure-test stated vs revealed preference around price, convenience, and ingredients.",
            },
            {
                name: "Wrap-up",
                duration: "1 min",
                description: "One-word association with 'clean eating', then thank and close.",
            },
        ],
    },
    script: {
        questions: [
            {
                id: "q1",
                question: "Walk me through your last grocery trip.",
                probes: [
                    "What was on the list vs what you added in the aisle?",
                    "Was there any item you hesitated on before putting in the cart?",
                ],
            },
            {
                id: "q2",
                question: "Tell me about a food brand you stopped buying.",
                probes: [
                    "What was the trigger that made you stop?",
                    "How did you find the replacement?",
                ],
            },
            {
                id: "q3",
                question: "When you're exhausted on a Tuesday night, what gets dinner on the table?",
                probes: [
                    "Is that different from what you'd ideally serve?",
                    "How do you feel about it afterward?",
                ],
            },
            {
                id: "q4",
                question: "If a new brand claimed 'clean ingredients', what would make you believe them?",
                probes: [
                    "Rank certifications, reviews, and friend recommendations.",
                    "What would immediately disqualify them?",
                ],
            },
        ],
    },
};

function buildFallbackBrief(cohort: string): CohortBriefData {
    const name = cohort && cohort.trim().length > 0 ? cohort.trim() : "Target Cohort";
    return {
        context: {
            definition: `${name} represents a distinct segment of users with shared behaviors, needs, and purchase drivers relevant to this study.`,
            hypothesis: `We believe ${name} decisions are shaped more by trust and lived experience than by price alone — and that small friction points compound into defection.`,
            objectives: [
                `Understand the primary job-to-be-done for ${name}.`,
                "Identify the top 2–3 triggers that drive consideration and purchase.",
                "Map break-points where intent fails to convert.",
            ],
        },
        screening: {
            interviewCount: 10,
            duration: "10–15 minutes",
            include: [
                `Self-identifies within the ${name} segment`,
                "Made a relevant purchase in the last 60 days",
                "Comfortable with a recorded voice interview",
            ],
            exclude: [
                "Works in a directly competitive product or marketing role",
                "Participated in a similar study in the last 90 days",
            ],
            idealProfile: `A representative ${name} participant who can speak in concrete detail about a recent decision, including what almost changed their mind.`,
        },
        moderator: {
            introScript: `Thanks for joining — this is a short conversation about your experience as part of the ${name} segment. There are no right answers; we're here to learn from you.`,
            consent:
                "We'll record audio for note-taking only. Your name won't appear in any report, and you can stop any time.",
            tone: "Warm, curious, non-judgmental. Let silences breathe; probe tangents when emotion surfaces.",
            dos: [
                "Mirror the participant's own language",
                "Pause for 3 seconds after each answer",
                "Ask 'what happened next?' when stories trail off",
            ],
            donts: [
                "Don't lead with brand names",
                "Don't validate answers with 'that's great'",
                "Don't skip probes to stay on time",
            ],
        },
        structure: {
            phases: [
                { name: "Warm-up", duration: "2 min", description: "Build rapport and surface context." },
                {
                    name: "Core Exploration",
                    duration: "9 min",
                    description: "Walk through a recent, concrete decision in detail.",
                },
                {
                    name: "Trade-off Probe",
                    duration: "2 min",
                    description: "Test stated vs revealed preferences.",
                },
                { name: "Wrap-up", duration: "1 min", description: "Capture one-word associations and close." },
            ],
        },
        script: {
            questions: [
                {
                    id: "q1",
                    question: `Walk me through a recent decision you made as part of the ${name} segment.`,
                    probes: [
                        "What triggered it?",
                        "What almost changed your mind?",
                    ],
                },
                {
                    id: "q2",
                    question: "Tell me about a time a product or service let you down.",
                    probes: [
                        "What did you do next?",
                        "Did you go back to them, and why or why not?",
                    ],
                },
                {
                    id: "q3",
                    question: "When you're short on time or energy, how does this decision change?",
                    probes: [
                        "What's the shortcut you rely on?",
                        "How do you feel about it afterward?",
                    ],
                },
                {
                    id: "q4",
                    question: "What would make a brand in this space feel immediately credible to you?",
                    probes: [
                        "What would disqualify them?",
                        "Who do you trust to recommend?",
                    ],
                },
            ],
        },
    };
}

export function getDummyBrief(cohort: string): CohortBriefData {
    const key = (cohort || "").trim().toLowerCase();
    if (
        key.includes("mom") ||
        key.includes("health") ||
        key.includes("millennial")
    ) {
        return HEALTH_MOMS;
    }
    return buildFallbackBrief(cohort);
}
