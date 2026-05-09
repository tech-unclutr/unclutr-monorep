// GET /api/transcripts — list everything in inbox/ with their result status.

import { NextResponse } from "next/server";
import { listTranscripts } from "@/lib/gcs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listTranscripts();
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
