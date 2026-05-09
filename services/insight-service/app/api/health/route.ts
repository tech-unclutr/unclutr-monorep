import { NextResponse } from "next/server";
import { getPromptMetadata } from "@/lib/prompts";
import { ORCHESTRATOR_MODEL, WORKER_MODEL } from "@/lib/agents";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasServerKey: !!process.env.ANTHROPIC_API_KEY,
    promptMetadata: getPromptMetadata(),
    models: { orchestrator: ORCHESTRATOR_MODEL, worker: WORKER_MODEL },
    pipelineVersion: "v2",
  });
}
