"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

// Bare /dashboard/study/[studyId] → redirect to the Design phase by default.
export default function StudyShellIndex() {
    const params = useParams<{ studyId: string }>();
    const router = useRouter();
    const studyId = params?.studyId;

    useEffect(() => {
        if (studyId) router.replace(`/dashboard/study/${studyId}/design`);
    }, [studyId, router]);

    return null;
}
