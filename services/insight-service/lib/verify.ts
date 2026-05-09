// Span verifier (TypeScript port of skill/scripts/verify_spans.py).
// Auto-corrects offsets via substring search if the LLM produced right text but
// wrong offsets (a known weakness). Rejects if verbatim is truly absent from
// the transcript (real hallucination).

import type {
  ExtractorOutput, ContradictionOutput, SeverityOutput, Span,
} from "./types";

export type SpanVerifyResult =
  | { ok: true; mode: "exact" | "offset-corrected" | "normalized-match"; fixed?: { start_char: number; end_char: number; verbatim: string } }
  | { ok: false; reason: string };

export function verifyOneSpan(transcript: string, span: Partial<Span>): SpanVerifyResult {
  const { start_char: start, end_char: end, verbatim } = span;
  if (!verbatim || typeof verbatim !== "string" || verbatim.length < 3) {
    return { ok: false, reason: "missing or empty verbatim" };
  }

  // Tier 1 — exact match at claimed offsets
  if (typeof start === "number" && typeof end === "number"
      && start >= 0 && end <= transcript.length && end > start
      && transcript.slice(start, end) === verbatim) {
    return { ok: true, mode: "exact" };
  }

  // Tier 2 — verbatim is exact substring of transcript (LLM produced right text, wrong offsets)
  const idx = transcript.indexOf(verbatim);
  if (idx >= 0) {
    return {
      ok: true, mode: "offset-corrected",
      fixed: { start_char: idx, end_char: idx + verbatim.length, verbatim },
    };
  }

  // Tier 3 — whitespace-normalized substring (handles minor newline/space drift)
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const normT = norm(transcript);
  const normV = norm(verbatim);
  if (normV.length > 0) {
    const target = normT.indexOf(normV);
    if (target >= 0) {
      // Walk transcript while normalizing to find original offsets
      let i = 0, ni = 0;
      let inWs = false;
      let startOrig: number | null = null;
      let endOrig: number | null = null;
      while (i < transcript.length && ni <= target + normV.length) {
        const ch = transcript[i];
        if (/\s/.test(ch)) {
          if (!inWs) {
            if (ni === target && startOrig === null) startOrig = i;
            ni += 1;
            inWs = true;
          }
        } else {
          if (ni === target && startOrig === null) startOrig = i;
          ni += 1;
          inWs = false;
        }
        if (ni === target + normV.length && endOrig === null) {
          endOrig = i + 1;
          break;
        }
        i += 1;
      }
      if (startOrig !== null && endOrig !== null) {
        return {
          ok: true, mode: "normalized-match",
          fixed: { start_char: startOrig, end_char: endOrig, verbatim: transcript.slice(startOrig, endOrig) },
        };
      }
    }
  }

  // Tier 4 — true hallucination
  return { ok: false, reason: `verbatim NOT in transcript (true hallucination): ${JSON.stringify(verbatim.slice(0, 80))}` };
}

export type VerifyReport = {
  type: "extractor" | "contradiction" | "severity";
  total: number;
  passed: number;
  corrected: number;
  failures: Array<{ path: string; reason: string }>;
};

/**
 * Verifies all spans in an output document. Mutates the document in-place
 * to apply auto-corrections. Returns a report.
 */
export function verifyAndCorrect(
  transcript: string,
  output: ExtractorOutput | ContradictionOutput | SeverityOutput,
  type: "extractor" | "contradiction" | "severity",
): VerifyReport {
  const failures: Array<{ path: string; reason: string }> = [];
  let total = 0;
  let corrected = 0;

  const handleSpan = (path: string, span: Partial<Span>): boolean => {
    total += 1;
    const result = verifyOneSpan(transcript, span);
    if (!result.ok) {
      failures.push({ path, reason: result.reason });
      return false;
    }
    if (result.mode !== "exact" && result.fixed) {
      span.start_char = result.fixed.start_char;
      span.end_char = result.fixed.end_char;
      span.verbatim = result.fixed.verbatim;
      corrected += 1;
    }
    return true;
  };

  if (type === "extractor") {
    const doc = output as ExtractorOutput;
    doc.themes.forEach((theme, ti) => {
      theme.evidence_spans.forEach((span, si) => {
        handleSpan(`themes[${ti}].evidence_spans[${si}]`, span as Partial<Span>);
      });
    });
  } else if (type === "contradiction") {
    const doc = output as ContradictionOutput;
    doc.contradictions.forEach((c, ci) => {
      handleSpan(`contradictions[${ci}].claim_a`, c.claim_a as Partial<Span>);
      handleSpan(`contradictions[${ci}].claim_b`, c.claim_b as Partial<Span>);
    });
  } else if (type === "severity") {
    const doc = output as SeverityOutput;
    doc.scores.forEach((score, si) => {
      handleSpan(`scores[${si}].justification_span`, score.justification_span as Partial<Span>);
    });
  }

  // Strip themes/contradictions whose spans all failed (defense-in-depth)
  if (type === "extractor") {
    const doc = output as ExtractorOutput;
    doc.themes = doc.themes.filter(theme => {
      theme.evidence_spans = theme.evidence_spans.filter(span => {
        const result = verifyOneSpan(transcript, span as Partial<Span>);
        return result.ok;
      });
      return theme.evidence_spans.length > 0;
    });
  } else if (type === "contradiction") {
    const doc = output as ContradictionOutput;
    doc.contradictions = doc.contradictions.filter(c => {
      const a = verifyOneSpan(transcript, c.claim_a as Partial<Span>);
      const b = verifyOneSpan(transcript, c.claim_b as Partial<Span>);
      return a.ok && b.ok;
    });
  }

  return { type, total, passed: total - failures.length, corrected, failures };
}
