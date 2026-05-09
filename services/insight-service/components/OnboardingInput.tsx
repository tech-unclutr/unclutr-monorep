"use client";

const PLACEHOLDER = `Paste the brand's onboarding plan / questions here.

Example:
- Should we launch a premium variant?
- What's blocking conversions in 18-25 segment?
- Why are returning customers churning at 90 days?
- Which messaging resonates most with our urban-professional segment?

Insights will be calibrated to answer these specifically. If transcripts don't address a question, the system says so explicitly — no fabricated answers.`;

export function OnboardingInput({
  value, onChange, disabled,
}: {
  value: string;
  onChange: (s: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Onboarding plan</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            What did the brand ask at the start of the engagement? Insights answer these.
          </p>
        </div>
        <span className="text-xs text-ink-400">{value.length} chars</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={PLACEHOLDER}
        className="w-full h-44 p-3 text-sm border border-ink-200 rounded-lg
                   focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500
                   resize-none disabled:opacity-60 leading-relaxed"
      />
    </div>
  );
}
