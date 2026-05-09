"use client";

import type { Mode } from "@/lib/types";

const MODES: { id: Mode; label: string; description: string }[] = [
  { id: "playback", label: "Playback", description: "Pre-recorded sample. No API key. Instant." },
  { id: "live", label: "Live (your key)", description: "Real Anthropic API calls. Your key, browser-stored." },
  { id: "production", label: "Production", description: "Server-side key. For deployed brand dashboards." },
];

export function ModeSelector({ mode, onChange, hasServerKey }: {
  mode: Mode;
  onChange: (m: Mode) => void;
  hasServerKey: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">Mode</label>
      <div className="flex gap-1 p-1 bg-ink-100 rounded-lg">
        {MODES.map(m => {
          const disabled = m.id === "production" && !hasServerKey;
          return (
            <button
              key={m.id}
              onClick={() => !disabled && onChange(m.id)}
              disabled={disabled}
              title={disabled ? "ANTHROPIC_API_KEY env var not set" : m.description}
              className={
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all " +
                (mode === m.id
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-600 hover:text-ink-900") +
                (disabled ? " opacity-40 cursor-not-allowed" : "")
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-500">{MODES.find(m => m.id === mode)?.description}</p>
    </div>
  );
}
