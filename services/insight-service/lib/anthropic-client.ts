// Anthropic client factory — picks key from header (live mode) or env (production mode).

import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient(opts: { apiKeyHeader?: string | null; mode: "live" | "production" }): Anthropic {
  let apiKey: string | undefined;
  if (opts.mode === "live") {
    apiKey = opts.apiKeyHeader || undefined;
    if (!apiKey) throw new Error("Live mode requires X-Anthropic-Api-Key header");
  } else {
    apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Production mode requires ANTHROPIC_API_KEY env var");
  }
  return new Anthropic({ apiKey });
}
