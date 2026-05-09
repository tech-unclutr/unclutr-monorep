"use client";

import type { InsightFilters, Priority } from "@/lib/types";

const PRIORITY_OPTIONS: { id: Priority; label: string; description: string; color: string }[] = [
  { id: "P0", label: "P0", description: "Active risk / dealbreaker", color: "bg-signal-red" },
  { id: "P1", label: "P1", description: "Strong pain blocking purchase", color: "bg-signal-amber" },
  { id: "P2", label: "P2", description: "Genuine pain, broad frequency", color: "bg-yellow-500" },
  { id: "P3", label: "P3", description: "Backlog / monitor", color: "bg-ink-400" },
];

export function InsightControls({
  filters, onChange, disabled,
}: {
  filters: InsightFilters;
  onChange: (f: InsightFilters) => void;
  disabled: boolean;
}) {
  const togglePriority = (p: Priority) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter(x => x !== p)
      : [...filters.priorities, p];
    onChange({ ...filters, priorities: next });
  };

  return (
    <div className="card p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">
            Top N insights to surface
          </label>
          <span className="text-sm font-mono text-ink-700">{filters.topN}</span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          value={filters.topN}
          onChange={e => onChange({ ...filters, topN: Number(e.target.value) })}
          disabled={disabled}
          className="w-full mt-2 accent-accent-500"
        />
        <div className="flex justify-between text-xs text-ink-400 mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">
            Priority filter
          </label>
          <span className="text-xs text-ink-500">{filters.priorities.length}/4 selected · click to toggle</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITY_OPTIONS.map(p => {
            const active = filters.priorities.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePriority(p.id)}
                disabled={disabled}
                title={p.description}
                aria-pressed={active}
                className={
                  "px-3 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer transition-all " +
                  (active
                    ? "border-accent-500 bg-accent-50 text-accent-700 shadow-sm"
                    : "border-ink-300 bg-white text-ink-700 hover:border-accent-500 hover:bg-accent-50/50 hover:text-accent-700") +
                  (disabled ? " opacity-50 cursor-not-allowed" : "")
                }
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  {p.label}
                  {active && <span className="text-accent-600">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-500 mt-2">
          Click to add/remove. Only checked priorities go through the 3-agent debate.
        </p>
      </div>
    </div>
  );
}
