"use client";

import { useParams } from "next/navigation";
import { CrossRunDetail } from "@/components/insights/CrossRunDetail";

export default function CrossRunPage() {
    const params = useParams<{ runId: string }>();
    const runId = params?.runId;
    if (!runId) return null;
    return <CrossRunDetail runId={runId} />;
}
