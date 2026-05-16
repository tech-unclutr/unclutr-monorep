"use client";

import { Loader2 } from "lucide-react";
import { RecruitmentPage } from "@/components/recruitment/RecruitmentPage";
import { RecruitmentProvider } from "@/components/recruitment/RecruitmentContext";
import { useStudyShell } from "../layout";

export default function StudyRecruitmentPage() {
    const { studyContext, loading } = useStudyShell();

    if (loading || !studyContext) {
        return (
            <div className="h-full flex items-center justify-center px-6">
                <div className="text-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                    Loading study…
                </div>
            </div>
        );
    }

    return (
        <RecruitmentProvider>
            <RecruitmentPage studyContext={studyContext} />
        </RecruitmentProvider>
    );
}
