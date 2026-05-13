// Agent system prompts — loaded at module init from the .md files.
// These are the SAME prompts used by the skill (single source of truth).
// Server-side only (uses fs).

import fs from "node:fs";
import path from "node:path";

const PROMPT_DIR = path.join(process.cwd(), "lib", "prompts");

function loadPrompt(name: string): string {
  return fs.readFileSync(path.join(PROMPT_DIR, `${name}.md`), "utf-8");
}

export const PROMPTS = {
  extractor: loadPrompt("extractor"),
  contradiction: loadPrompt("contradiction"),
  severity: loadPrompt("severity"),
  action: loadPrompt("action"),
  framer: loadPrompt("framer"),
  judge: loadPrompt("judge"),
  clusterer: loadPrompt("clusterer"),
} as const;

// Style configs for the framer (substituted into framer.md template)
export const FRAMER_STYLES = {
  conservative: {
    name: "Conservative",
    description: "Evidence-first, cautious, quote-heavy. Treats unverified claims as risk. Prefers under-claiming with strong support over over-claiming with thin support.",
    tactics: [
      "Lead with verbatim quotes; prioritise volume of evidence over rhetorical flourish.",
      "Hedge severity assertions ('signals strongly suggest...', 'evidence indicates...').",
      "Surface ambiguity explicitly when present — don't pretend an insight is crisper than the data warrants.",
      "Keep recommended action narrow: one concrete next step that low-risks the brand.",
    ],
  },
  aggressive: {
    name: "Aggressive",
    description: "Business-impact-first, ROI-focused, decisive. Treats indecision as risk. Frames every insight as a competitive opportunity or threat.",
    tactics: [
      "Lead with stakes — what does this insight unlock or block?",
      "Quantify business consequence wherever evidence supports it (segment expansion, churn risk, price-tier moves).",
      "Recommend ambitious actions with clear ownership and tight timelines.",
      "Frame contradictions as decision-revealing signals, not nuance.",
    ],
  },
  balanced: {
    name: "Balanced",
    description: "Comprehensive, strategic, decision-ready. Holds evidence and impact in equal weight. Default editorial voice for executive briefs.",
    tactics: [
      "Open with one-sentence executive summary that locates the insight strategically.",
      "Pair top evidence quote with the business implication immediately — don't separate them.",
      "Acknowledge the contradictions as strategic signals (what the customer said vs revealed).",
      "Action framing: specific, owned, time-bound, and tied back to the original brief / onboarding plan.",
    ],
  },
} as const;

export function buildFramerPrompt(style: keyof typeof FRAMER_STYLES): string {
  const cfg = FRAMER_STYLES[style];
  return PROMPTS.framer
    .replace("{{STYLE_NAME}}", cfg.name)
    .replace("{{STYLE_DESCRIPTION}}", cfg.description)
    .replace("{{STYLE_TACTICS}}", cfg.tactics.map(t => `- ${t}`).join("\n"));
}

// Onboarding context — prepended to user prompts so insights answer the brand's actual questions
export function buildOnboardingContext(onboardingPlan?: string, brandContext?: string): string {
  if (!onboardingPlan && !brandContext) return "";
  const parts: string[] = ["## CONTEXT FOR THIS RUN"];
  if (brandContext) parts.push(`**Brand:** ${brandContext}`);
  if (onboardingPlan) {
    parts.push("**Onboarding plan / questions the brand wants answered:**");
    parts.push(onboardingPlan.trim());
    parts.push("");
    parts.push("**Critical:** Your output should explicitly answer the onboarding questions above where evidence supports it. If the transcripts don't address a question, say so — don't fabricate.");
  }
  return parts.join("\n") + "\n\n---\n\n";
}

// Metadata about loaded prompts (for trust panel)
export function getPromptMetadata(): Record<string, { bytes: number; lines: number }> {
  const meta: Record<string, { bytes: number; lines: number }> = {};
  for (const [name, content] of Object.entries(PROMPTS)) {
    meta[name] = {
      bytes: Buffer.byteLength(content, "utf-8"),
      lines: content.split("\n").length,
    };
  }
  return meta;
}
