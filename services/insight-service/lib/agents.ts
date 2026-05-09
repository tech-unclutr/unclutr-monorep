// Agent caller — wraps Anthropic SDK with structured output parsing.

import Anthropic from "@anthropic-ai/sdk";
import { PROMPTS, buildFramerPrompt, buildOnboardingContext, FRAMER_STYLES } from "./prompts";
import type {
  ExtractorOutput, ContradictionOutput, SeverityOutput, ActionsOutput,
  AggregatedOutput, AggregatedInsight, DebateAgent, DebateProposal,
  DebateResult, JudgeScores,
} from "./types";

// Models
export const ORCHESTRATOR_MODEL = "claude-opus-4-5";
export const WORKER_MODEL = "claude-sonnet-4-5-20250929";

/** Repair common LLM JSON glitches (numeric-field garbage, trailing commas). */
function repairJson(s: string): string {
  // 1. Numeric-field garbage: "start_char": 2aborrar  →  "start_char": 2
  //    Strip alphanumeric tail when a numeric value is followed by letters.
  s = s.replace(/(:\s*)(-?\d+)([a-zA-Z_][^,}\]\n]*)/g, "$1$2");
  // 2. Trailing commas inside objects/arrays.
  s = s.replace(/,(\s*[}\]])/g, "$1");
  // 3. Strip stray BOM / smart quotes that occasionally appear in long outputs.
  s = s.replace(/^﻿/, "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  return s;
}

function tryParse(candidate: string): unknown | null {
  try { return JSON.parse(candidate); } catch { /* fall through */ }
  try { return JSON.parse(repairJson(candidate)); } catch { /* fall through */ }
  return null;
}

function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const got = tryParse(fenced[1].trim());
    if (got !== null) return got as T;
  }
  const bare = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (bare) {
    const got = tryParse(bare[0]);
    if (got !== null) return got as T;
  }
  throw new Error(`No parseable JSON in response:\n${text.slice(0, 500)}`);
}

export type AgentUsage = {
  input_tokens: number;
  output_tokens: number;
  model: string;
};

const RETRY_NUDGE = "\n\n⚠️ STRICT JSON REQUIREMENT: A previous attempt produced invalid JSON. Output ONLY valid, parseable JSON. All numeric fields (start_char, end_char, severity, etc.) MUST be valid integers with no extra characters. No trailing commas. No comments.";

export async function callAgent<T>(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens = 4096,
  maxRetries = 2,
): Promise<{ data: T; usage: AgentUsage }> {
  let lastErr: Error | null = null;
  let inputAccum = 0;
  let outputAccum = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const sys = attempt === 0 ? systemPrompt : systemPrompt + RETRY_NUDGE;
      const msg = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: sys,
        messages: [{ role: "user", content: userPrompt }],
      });
      inputAccum += msg.usage.input_tokens;
      outputAccum += msg.usage.output_tokens;

      const text = msg.content
        .filter(b => b.type === "text")
        .map(b => (b as { text: string }).text)
        .join("\n");

      const data = extractJson<T>(text);
      return {
        data,
        usage: { input_tokens: inputAccum, output_tokens: outputAccum, model },
      };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        console.warn(`[agent] parse failed on attempt ${attempt + 1}, retrying with strict-JSON nudge:`, lastErr.message.slice(0, 200));
        continue;
      }
    }
  }
  throw lastErr ?? new Error("callAgent failed for unknown reasons");
}

// ---- Per-agent invocations ----

type RunContext = {
  onboardingPlan?: string;
  brandContext?: string;
};

export async function runExtractor(
  client: Anthropic,
  transcriptId: string,
  transcript: string,
  ctx: RunContext = {},
): Promise<{ data: ExtractorOutput; usage: AgentUsage }> {
  const onboarding = buildOnboardingContext(ctx.onboardingPlan, ctx.brandContext);
  const userPrompt = `${onboarding}TRANSCRIPT (transcript_id: ${transcriptId}):\n\n${transcript}`;
  // Cost-cut: switched from Opus → Sonnet. Quality delta is small for span-anchored extraction.
  const result = await callAgent<ExtractorOutput>(
    client, PROMPTS.extractor, userPrompt, WORKER_MODEL, 6000,
  );
  result.data.transcript_id = transcriptId;
  return result;
}

export async function runContradiction(
  client: Anthropic,
  transcriptId: string,
  transcript: string,
  extractorOutput: ExtractorOutput,
  ctx: RunContext = {},
): Promise<{ data: ContradictionOutput; usage: AgentUsage }> {
  const onboarding = buildOnboardingContext(ctx.onboardingPlan, ctx.brandContext);
  const userPrompt = (
    `${onboarding}TRANSCRIPT (transcript_id: ${transcriptId}):\n\n${transcript}\n\n` +
    `EXTRACTOR OUTPUT (themes already identified):\n${JSON.stringify(extractorOutput, null, 2)}`
  );
  // Cost-cut: Opus → Sonnet. Contradiction detection is structured pattern-matching; Sonnet handles it.
  const result = await callAgent<ContradictionOutput>(
    client, PROMPTS.contradiction, userPrompt, WORKER_MODEL, 4000,
  );
  result.data.transcript_id = transcriptId;
  if (!Array.isArray(result.data.contradictions)) result.data.contradictions = [];
  return result;
}

export async function runSeverity(
  client: Anthropic,
  transcriptId: string,
  transcript: string,
  extractorOutput: ExtractorOutput,
  ctx: RunContext = {},
): Promise<{ data: SeverityOutput; usage: AgentUsage }> {
  const onboarding = buildOnboardingContext(ctx.onboardingPlan, ctx.brandContext);
  const userPrompt = (
    `${onboarding}TRANSCRIPT (transcript_id: ${transcriptId}):\n\n${transcript}\n\n` +
    `EXTRACTOR OUTPUT (themes to score):\n${JSON.stringify(extractorOutput, null, 2)}`
  );
  const result = await callAgent<SeverityOutput>(
    client, PROMPTS.severity, userPrompt, WORKER_MODEL, 4000,
  );
  result.data.transcript_id = transcriptId;
  return result;
}

export async function runActionComposer(
  client: Anthropic,
  aggregated: AggregatedOutput,
  ctx: RunContext = {},
  filteredInsightIds?: string[],
): Promise<{ data: ActionsOutput; usage: AgentUsage }> {
  // If filtering: only pass selected insights to the composer, sharper output
  const insightsPayload = filteredInsightIds
    ? {
      ...aggregated,
      aggregated_insights: aggregated.aggregated_insights.filter(i => filteredInsightIds.includes(i.insight_id)),
    }
    : aggregated;

  const onboarding = buildOnboardingContext(ctx.onboardingPlan, ctx.brandContext);
  const userPrompt = (
    `${onboarding}AGGREGATED INSIGHTS (input from cross-transcript clustering` +
    `${filteredInsightIds ? ` — already filtered to top-priority ${filteredInsightIds.length}` : ""}):\n` +
    `${JSON.stringify(insightsPayload, null, 2)}`
  );
  // Cost-cut: Opus → Sonnet. Action composition is template-driven; Sonnet matches Opus quality here.
  const result = await callAgent<ActionsOutput>(
    client, PROMPTS.action, userPrompt, WORKER_MODEL, 4000,
  );
  if (!Array.isArray(result.data.actions)) result.data.actions = [];
  return result;
}

// ---- Multi-agent debate ----

export async function runFramer(
  client: Anthropic,
  insight: AggregatedInsight,
  style: DebateAgent,
  ctx: RunContext = {},
): Promise<{ data: DebateProposal; usage: AgentUsage }> {
  const systemPrompt = buildFramerPrompt(style);
  const onboarding = buildOnboardingContext(ctx.onboardingPlan, ctx.brandContext);
  const userPrompt = (
    `${onboarding}AGGREGATED INSIGHT TO FRAME:\n${JSON.stringify(insight, null, 2)}`
  );
  const result = await callAgent<DebateProposal>(
    client, systemPrompt, userPrompt, WORKER_MODEL, 1500,
  );
  // Force agent label
  result.data.agent = style;
  return result;
}

export async function runJudge(
  client: Anthropic,
  insightId: string,
  proposals: DebateProposal[],
  ctx: RunContext = {},
): Promise<{ data: { insight_id: string; scores: { conservative: JudgeScores; aggressive: JudgeScores; balanced: JudgeScores }; winner: DebateAgent; judge_reasoning: string }; usage: AgentUsage }> {
  const onboarding = buildOnboardingContext(ctx.onboardingPlan, ctx.brandContext);
  const userPrompt = (
    `${onboarding}INSIGHT_ID: ${insightId}\n\n` +
    `PROPOSALS (3 framings of the same insight):\n${JSON.stringify(proposals, null, 2)}`
  );
  const result = await callAgent<{ insight_id: string; scores: { conservative: JudgeScores; aggressive: JudgeScores; balanced: JudgeScores }; winner: DebateAgent; judge_reasoning: string }>(
    client, PROMPTS.judge, userPrompt, ORCHESTRATOR_MODEL, 1500,
  );
  result.data.insight_id = insightId;
  return result;
}

/**
 * Full debate for a single insight: 3 framers run in parallel, then judge picks winner.
 */
export async function debateOneInsight(
  client: Anthropic,
  insight: AggregatedInsight,
  ctx: RunContext = {},
): Promise<{ result: DebateResult; usage: AgentUsage }> {
  const styles: DebateAgent[] = ["conservative", "aggressive", "balanced"];
  const framerResults = await Promise.all(
    styles.map(style => runFramer(client, insight, style, ctx))
  );
  const proposals = framerResults.map(r => r.data);

  const judgeResult = await runJudge(client, insight.insight_id, proposals, ctx);
  const totalUsage: AgentUsage = {
    input_tokens: framerResults.reduce((s, r) => s + r.usage.input_tokens, 0) + judgeResult.usage.input_tokens,
    output_tokens: framerResults.reduce((s, r) => s + r.usage.output_tokens, 0) + judgeResult.usage.output_tokens,
    model: WORKER_MODEL,
  };

  return {
    result: {
      insight_id: insight.insight_id,
      proposals,
      scores: judgeResult.data.scores,
      winner: judgeResult.data.winner,
      judge_reasoning: judgeResult.data.judge_reasoning,
    },
    usage: totalUsage,
  };
}

/**
 * Helper: regenerate a single insight using user feedback as additional context.
 * Used by the "Regenerate with my feedback" button in the InsightCard.
 */
export async function regenerateInsightWithFeedback(
  client: Anthropic,
  insight: AggregatedInsight,
  feedbackNote: string,
  ctx: RunContext = {},
): Promise<{ result: DebateResult; usage: AgentUsage }> {
  // Add feedback to onboarding context for this single regeneration
  const augmentedCtx: RunContext = {
    ...ctx,
    onboardingPlan: (
      (ctx.onboardingPlan ?? "") +
      `\n\n## USER FEEDBACK ON THIS INSIGHT (apply to your framing)\n${feedbackNote}`
    ),
  };
  return debateOneInsight(client, insight, augmentedCtx);
}
