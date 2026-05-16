"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StudyHomePage } from "@/components/study-designer/StudyHomePage";
import { useStudyShell } from "../layout";

export default function StudyDesignPage() {
    const { studyId } = useStudyShell();
    const router = useRouter();
    const [designComplete, setDesignComplete] = useState(false);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <StudyHomePage
                    activeStudyId={studyId}
                    onDesignComplete={() => setDesignComplete(true)}
                />
            </div>
            {designComplete && (
                <div className="shrink-0 border-t border-gray-100 dark:border-[#27272A] px-6 py-4 flex justify-end bg-background/80 backdrop-blur-sm">
                    <button
                        onClick={() =>
                            router.push(`/dashboard/study/${studyId}/recruitment`)
                        }
                        className="rounded-xl h-10 px-6 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Continue to Recruitment
                    </button>
                </div>
            )}
        </div>
    );
}
