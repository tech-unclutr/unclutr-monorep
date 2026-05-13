"use client";

import { useParams } from "next/navigation";
import { ExecutionPage } from "@/components/execution/ExecutionPage";

export default function StudyExecutionRoute() {
    const params = useParams<{ studyId: string }>();
    const studyId = params?.studyId;

    if (!studyId) return null;

    return <ExecutionPage studyId={studyId} />;
}
