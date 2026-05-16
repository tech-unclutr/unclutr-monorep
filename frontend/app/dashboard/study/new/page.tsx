"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { StudyHomePage } from "@/components/study-designer/StudyHomePage";
import type { StudyState } from "@/components/study-designer/types";

// Creation surface for a brand-new study. As soon as StudyHomePage emits a
// study with a real id (i.e. the user has triggered the create flow), we
// hop into the canonical /dashboard/study/<id>/design URL so the layout
// shell takes over and the URL is bookmarkable.
export default function NewStudyPage() {
    const router = useRouter();
    const redirectedRef = useRef(false);

    const handleStudyUpdate = (study: StudyState) => {
        if (redirectedRef.current) return;
        if (study?.id) {
            redirectedRef.current = true;
            router.replace(`/dashboard/study/${study.id}/design`);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="shrink-0 border-b border-gray-100 dark:border-[#27272A] bg-background/80 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-6 pt-4 pb-3">
                    <Link
                        href="/dashboard/study"
                        className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-3"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        All studies
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
                            New study
                        </h1>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
                <StudyHomePage onStudyUpdate={handleStudyUpdate} />
            </div>
        </div>
    );
}
