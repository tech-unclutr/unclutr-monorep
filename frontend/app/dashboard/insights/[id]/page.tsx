"use client";

import { useParams } from "next/navigation";
import { TranscriptDetail } from "@/components/insights/TranscriptDetail";

export default function InsightsTranscriptDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    if (!id) return null;

    return <TranscriptDetail transcriptId={id} />;
}
