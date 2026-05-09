// GET /api/transcripts/[id] — transcript text + processing result if any.

import { NextRequest, NextResponse } from "next/server";
import {
  getTranscriptText, getResult, getErrorResult, resultExists,
} from "@/lib/gcs";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id || !/^[A-Za-z0-9_\-./]+$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  let transcriptText: string;
  try {
    transcriptText = await getTranscriptText(id);
  } catch (e) {
    return NextResponse.json({ error: `transcript not found: ${e instanceof Error ? e.message : e}` }, { status: 404 });
  }

  const [done, result, errorResult] = await Promise.all([
    resultExists(id),
    getResult(id),
    getErrorResult(id),
  ]);

  return NextResponse.json({
    transcript_id: id,
    transcript_text: transcriptText,
    status: errorResult ? "failed" : (done ? "done" : "pending"),
    result,
    error: errorResult,
  });
}
