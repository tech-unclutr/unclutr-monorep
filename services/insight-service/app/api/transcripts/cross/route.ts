// GET /api/transcripts/cross — list all cross-transcript synthesis runs.

import { NextResponse } from "next/server";
import { listCrossRuns } from "@/lib/gcs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listCrossRuns();
    // Newest first
    items.sort((a, b) => (b.generated_at ?? "").localeCompare(a.generated_at ?? ""));
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
