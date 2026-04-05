"use client";

import { useState } from "react";
import { FlaskConical, BookOpen, X, Mic, Users, ClipboardList, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyHomePage } from "@/components/study-designer/StudyHomePage";
import { InterviewBuilder } from "./components/InterviewBuilder";
import { RecruitmentPage } from "@/components/recruitment/RecruitmentPage";
import { StudyPlanner } from "./components/StudyPlanner";
import { VoiceSandbox } from "@/components/voice-sandbox/VoiceSandbox";

interface ComponentEntry {
    name: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    shadowColor: string;
    fullWidth?: boolean;
    render: () => React.ReactNode;
}

const COMPONENTS: ComponentEntry[] = [
    {
        name: "Study Designer",
        description: "AI-powered research study creation",
        icon: <BookOpen className="w-5 h-5 text-white" />,
        gradient: "from-indigo-600 to-violet-500",
        shadowColor: "shadow-indigo-500/20",
        fullWidth: true,
        render: () => <StudyHomePage />,
    },
    {
        name: "Interview Builder",
        description: "Organize questions across interview categories",
        icon: <Mic className="w-5 h-5 text-white" />,
        gradient: "from-indigo-500 to-blue-600",
        shadowColor: "shadow-indigo-500/20",
        fullWidth: true,
        render: () => <InterviewBuilder />,
    },
    {
        name: "Recruitment",
        description: "AI-powered participant recruitment pipeline",
        icon: <Users className="w-5 h-5 text-white" />,
        gradient: "from-emerald-500 to-teal-600",
        shadowColor: "shadow-emerald-500/20",
        fullWidth: true,
        render: () => <RecruitmentPage />,
    },
    {
        name: "Study Planner",
        description: "End-to-end study design & recruitment flow",
        icon: <ClipboardList className="w-5 h-5 text-white" />,
        gradient: "from-violet-600 to-indigo-500",
        shadowColor: "shadow-violet-500/20",
        fullWidth: true,
        render: () => <StudyPlanner />,
    },
    {
        name: "Voice Sandbox",
        description: "Live execution command center with AI agents",
        icon: <Radio className="w-5 h-5 text-white" />,
        gradient: "from-emerald-600 to-teal-500",
        shadowColor: "shadow-emerald-500/20",
        fullWidth: true,
        render: () => <VoiceSandbox />,
    },
];

export default function PlaygroundPage() {
    const [active, setActive] = useState<string | null>(null);
    const activeEntry = COMPONENTS.find((c) => c.name === active);

    if (activeEntry) {
        return (
            <div className="h-screen flex flex-col">
                <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-[#27272A] bg-background/80 backdrop-blur-sm">
                    <button
                        onClick={() => setActive(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-foreground">{activeEntry.name}</span>
                </div>
                <div className={cn(
                    "flex-1 min-h-0",
                    activeEntry.fullWidth ? "" : "flex items-center justify-center"
                )}>
                    {activeEntry.render()}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <FlaskConical className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-display">
                            Playground
                        </h1>
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.15em] font-medium">
                            Component sandbox
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {COMPONENTS.map((comp) => (
                    <button
                        key={comp.name}
                        onClick={() => setActive(comp.name)}
                        className="group text-left rounded-xl border border-gray-100 dark:border-[#27272A] bg-card p-5 hover:border-gray-200 dark:hover:border-[#3F3F46] transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-tr flex items-center justify-center shadow-md mb-4",
                            comp.gradient,
                            comp.shadowColor,
                        )}>
                            {comp.icon}
                        </div>
                        <p className="font-semibold text-sm text-foreground">{comp.name}</p>
                        <p className="text-muted-foreground text-xs mt-1">{comp.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
