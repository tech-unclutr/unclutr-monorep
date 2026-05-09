"use client";

import { useEffect, useState } from "react";
import type { InsightFeedback, FeedbackRating } from "@/lib/types";

const STORAGE_KEY = "squareup_synthesis_feedback";

export function loadAllFeedback(): Record<string, InsightFeedback> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
export function saveFeedback(fb: InsightFeedback) {
  if (typeof window === "undefined") return;
  const all = loadAllFeedback();
  all[fb.insight_id] = fb;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
export function clearAllFeedback() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
export function exportFeedbackJsonl(): string {
  return Object.values(loadAllFeedback())
    .map(fb => JSON.stringify(fb))
    .join("\n");
}

export function FeedbackWidget({
  insightId,
  onRegenerate,
  regenerating,
}: {
  insightId: string;
  onRegenerate?: (note: string) => void;
  regenerating?: boolean;
}) {
  const [rating, setRating] = useState<FeedbackRating>(null);
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Load existing feedback for this insight
  useEffect(() => {
    const existing = loadAllFeedback()[insightId];
    if (existing) {
      setRating(existing.rating);
      setNote(existing.note ?? "");
    }
  }, [insightId]);

  const persist = (newRating: FeedbackRating, newNote: string) => {
    saveFeedback({
      insight_id: insightId,
      rating: newRating,
      note: newNote || undefined,
      timestamp: new Date().toISOString(),
    });
  };

  const onRate = (r: FeedbackRating) => {
    const next = rating === r ? null : r;
    setRating(next);
    persist(next, note);
    if (next === "down") setExpanded(true);
  };

  const onNoteBlur = () => persist(rating, note);

  return (
    <div className="border-t border-ink-100 pt-3 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRate("up")}
            className={
              "p-1.5 rounded-lg border transition-all " +
              (rating === "up"
                ? "border-signal-green bg-signal-green/10 text-signal-green"
                : "border-ink-200 text-ink-500 hover:border-signal-green hover:text-signal-green")
            }
            title="Useful insight"
            aria-label="Mark useful"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M6.95 1.5a1 1 0 00-.95.69L4.42 7H2.5A1.5 1.5 0 001 8.5v5A1.5 1.5 0 002.5 15h9.05a2 2 0 001.99-1.78l.85-7.5A2 2 0 0012.4 3.5h-3l.45-1.36a1 1 0 00-.95-1.31l-1.95-.33z"/></svg>
          </button>
          <button
            onClick={() => onRate("down")}
            className={
              "p-1.5 rounded-lg border transition-all " +
              (rating === "down"
                ? "border-signal-red bg-signal-red/10 text-signal-red"
                : "border-ink-200 text-ink-500 hover:border-signal-red hover:text-signal-red")
            }
            title="Not useful / wrong"
            aria-label="Mark not useful"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.05 14.5a1 1 0 00.95-.69L11.58 9h1.92A1.5 1.5 0 0015 7.5v-5A1.5 1.5 0 0013.5 1H4.45a2 2 0 00-1.99 1.78l-.85 7.5A2 2 0 003.6 12.5h3l-.45 1.36a1 1 0 00.95 1.31l1.95.33z"/></svg>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-ink-500 hover:text-ink-900 px-2"
          >
            {expanded ? "Hide note" : "Add note"}
          </button>
        </div>
        {rating && note && onRegenerate && (
          <button
            onClick={() => onRegenerate(note)}
            disabled={regenerating}
            className="btn-secondary text-xs"
          >
            {regenerating ? "Regenerating…" : "Regenerate with my feedback"}
          </button>
        )}
      </div>
      {expanded && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={onNoteBlur}
            placeholder={rating === "down"
              ? "What's wrong about this insight? Be specific so the regen can fix it."
              : "Additional notes for this insight (optional)"}
            className="w-full h-20 p-2 text-sm border border-ink-200 rounded-lg
                       focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500
                       resize-none"
          />
        </div>
      )}
    </div>
  );
}
