// GET /api/transcripts/cross/[runId] — fetch a previously generated cross-transcript run.

import { NextRequest, NextResponse } from "next/server";
import { getCrossRun } from "@/lib/gcs";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  if (!runId || !/^[A-Za-z0-9_\-:.T]+$/.test(runId)) {
    return NextResponse.json({ error: "invalid runId" }, { status: 400 });
  }
  try {
    const data = await getCrossRun(runId);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
