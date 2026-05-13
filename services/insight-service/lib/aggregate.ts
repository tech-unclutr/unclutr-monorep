// Cross-transcript aggregator (TS port of skill/scripts/aggregate.py).
// Clusters similar themes via Jaccard token similarity within same category,
// computes cross-transcript stats, builds evidence pool with defensive
// re-verification of spans.

import type {
  ExtractorOutput, ContradictionOutput, SeverityOutput, Theme,
  AggregatedInsight, AggregatedOutput, EvidenceQuote,
} from "./types";
import { verifyOneSpan } from "./verify";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "is", "are", "was", "were", "be", "been", "being", "i", "you", "we", "they",
  "this", "that", "these", "those", "with", "by", "from", "about", "as",
]);

function tokenize(text: string): Set<string> {
  if (!text) return new Set();
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return new Set(tokens.filter(t => t.length > 2 && !STOPWORDS.has(t)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach(t => { if (b.has(t)) inter += 1; });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

type ThemeEntry = {
  transcript_id: string;
  theme: Theme;
  tokens: Set<string>;
};

function clusterThemes(
  extractorDocs: Record<string, ExtractorOutput>,
  threshold: number,
): ThemeEntry[][] {
  const all: ThemeEntry[] = [];
  for (const [tid, doc] of Object.entries(extractorDocs)) {
    for (const theme of doc.themes) {
      const tokens = new Set([...tokenize(theme.theme_name), ...tokenize(theme.theme_id)]);
      all.push({ transcript_id: tid, theme, tokens });
    }
  }

  const clusters: ThemeEntry[][] = [];
  for (const entry of all) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let ci = 0; ci < clusters.length; ci++) {
      const c = clusters[ci];
      const cats = new Set(c.map(t => t.theme.category));
      if (!cats.has(entry.theme.category)) continue;
      const sims = c.map(t => jaccard(entry.tokens, t.tokens));
      const avg = sims.reduce((a, b) => a + b, 0) / sims.length;
      if (avg > bestScore) {
        bestScore = avg;
        bestIdx = ci;
      }
    }
    if (bestIdx >= 0 && bestScore >= threshold) {
      clusters[bestIdx].push(entry);
    } else {
      clusters.push([entry]);
    }
  }
  return clusters;
}

function buildInsightId(cluster: ThemeEntry[]): string {
  const cats: Record<string, number> = {};
  cluster.forEach(e => { cats[e.theme.category] = (cats[e.theme.category] ?? 0) + 1; });
  const cat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0];

  const tokenCounts: Record<string, number> = {};
  for (const e of cluster) {
    for (const t of tokenize(e.theme.theme_name)) {
      tokenCounts[t] = (tokenCounts[t] ?? 0) + 1;
    }
  }
  const distinctive = Object.entries(tokenCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([t]) => t !== cat)
    .slice(0, 3)
    .map(([t]) => t);
  const slug = distinctive.length ? distinctive.join("_") : "unknown";
  return `ins_${cat}_${slug}`.slice(0, 80);
}

function bestThemeName(cluster: ThemeEntry[]): string {
  const sorted = [...cluster].sort((a, b) => {
    const cb = b.theme.confidence ?? 0;
    const ca = a.theme.confidence ?? 0;
    if (cb !== ca) return cb - ca;
    return (b.theme.theme_name?.length ?? 0) - (a.theme.theme_name?.length ?? 0);
  });
  return sorted[0].theme.theme_name || "Unnamed insight";
}

function selectEvidencePool(
  cluster: ThemeEntry[],
  transcripts: Record<string, string>,
  maxQuotes = 5,
): EvidenceQuote[] {
  const candidates: { tid: string; theme: Theme; span: Theme["evidence_spans"][number] }[] = [];
  const haveTranscripts = Object.keys(transcripts).length > 0;

  for (const { transcript_id, theme } of cluster) {
    const text = transcripts[transcript_id];
    for (const span of theme.evidence_spans ?? []) {
      // Defense in depth: re-verify span before including
      if (haveTranscripts) {
        if (!text) continue;
        const result = verifyOneSpan(text, span);
        if (!result.ok) continue;
      }
      candidates.push({ tid: transcript_id, theme, span });
    }
  }

  // Score: prefer user spans, decent length, high theme confidence
  candidates.sort((a, b) => {
    const score = (c: typeof a) => {
      const speakerBonus = c.span.speaker === "user" ? 1.0 : 0.4;
      const len = c.span.verbatim?.length ?? 0;
      const lengthBonus = len >= 40 && len <= 250 ? 1.0 : 0.5;
      const conf = c.theme.confidence ?? 0.5;
      return speakerBonus * lengthBonus * conf;
    };
    return score(b) - score(a);
  });

  // Diversify: max 2 per transcript
  const result: EvidenceQuote[] = [];
  const perTid: Record<string, number> = {};
  for (const c of candidates) {
    if (result.length >= maxQuotes) break;
    if ((perTid[c.tid] ?? 0) >= 2) continue;
    result.push({
      transcript_id: c.tid,
      speaker: c.span.speaker,
      start_char: c.span.start_char,
      end_char: c.span.end_char,
      verbatim: c.span.verbatim,
      source_theme_id: c.theme.theme_id,
      source_theme_confidence: c.theme.confidence,
    });
    perTid[c.tid] = (perTid[c.tid] ?? 0) + 1;
  }
  return result;
}

function aggregateSeverity(cluster: ThemeEntry[], severityDocs: Record<string, SeverityOutput>) {
  const distribution: number[] = [];
  const urgencyCounts: Record<string, number> = {};
  for (const { transcript_id, theme } of cluster) {
    const sev = severityDocs[transcript_id];
    if (!sev) continue;
    const score = sev.scores.find(s => s.theme_id === theme.theme_id);
    if (!score) continue;
    if (typeof score.severity === "number") distribution.push(score.severity);
    if (score.urgency) urgencyCounts[score.urgency] = (urgencyCounts[score.urgency] ?? 0) + 1;
  }
  const modal = Object.entries(urgencyCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    severity_distribution: distribution,
    avg_severity: distribution.length ? Number((distribution.reduce((a, b) => a + b, 0) / distribution.length).toFixed(2)) : null,
    max_severity: distribution.length ? Math.max(...distribution) : null,
    min_severity: distribution.length ? Math.min(...distribution) : null,
    modal_urgency: modal ? modal[0] : null,
  };
}

function gatherContradictions(cluster: ThemeEntry[], contradictionDocs: Record<string, ContradictionOutput>) {
  const tids = new Set(cluster.map(c => c.transcript_id));
  const themeTokens = new Set<string>();
  for (const { theme } of cluster) {
    for (const t of tokenize(theme.theme_name)) themeTokens.add(t);
  }
  const out: AggregatedInsight["contradictions_referenced"] = [];
  for (const tid of tids) {
    const doc = contradictionDocs[tid];
    if (!doc) continue;
    for (const c of doc.contradictions) {
      const ctok = tokenize(c.summary);
      if (jaccard(ctok, themeTokens) >= 0.15) {
        out.push({ ...c, transcript_id: tid });
      }
    }
  }
  return out;
}

/**
 * Build the same shape clusterThemes returns, from an external list of
 * cluster groups expressed as `{tid}:{theme_id}` keys. Defensive: any theme not
 * covered by the override becomes its own singleton cluster, so downstream
 * stages can't silently lose insights from a buggy clusterer.
 */
function clustersFromOverride(
  extractorDocs: Record<string, ExtractorOutput>,
  clusterKeysets: string[][],
): ThemeEntry[][] {
  const entriesByKey = new Map<string, ThemeEntry>();
  for (const [tid, doc] of Object.entries(extractorDocs)) {
    for (const theme of doc.themes ?? []) {
      const themeId = theme.theme_id ?? "";
      const key = `${tid}:${themeId}`;
      const tokens = new Set([...tokenize(theme.theme_name), ...tokenize(themeId)]);
      entriesByKey.set(key, { transcript_id: tid, theme, tokens });
    }
  }

  const placed = new Set<string>();
  const clusters: ThemeEntry[][] = [];
  for (const group of clusterKeysets ?? []) {
    const cluster: ThemeEntry[] = [];
    for (const key of group) {
      if (placed.has(key)) continue;
      const entry = entriesByKey.get(key);
      if (!entry) continue;
      cluster.push(entry);
      placed.add(key);
    }
    if (cluster.length) clusters.push(cluster);
  }
  for (const [key, entry] of entriesByKey) {
    if (!placed.has(key)) {
      clusters.push([entry]);
      placed.add(key);
    }
  }
  return clusters;
}


export function aggregate(
  extractorDocs: Record<string, ExtractorOutput>,
  contradictionDocs: Record<string, ContradictionOutput>,
  severityDocs: Record<string, SeverityOutput>,
  transcripts: Record<string, string>,
  similarityThreshold = 0.45,
  clustersOverride?: string[][],
): AggregatedOutput {
  const transcriptIds = Object.keys(extractorDocs).sort();
  const nTranscripts = transcriptIds.length;
  const totalThemes = Object.values(extractorDocs).reduce((sum, doc) => sum + doc.themes.length, 0);

  const clusters = clustersOverride !== undefined
    ? clustersFromOverride(extractorDocs, clustersOverride)
    : clusterThemes(extractorDocs, similarityThreshold);
  const insights: AggregatedInsight[] = [];

  for (const cluster of clusters) {
    if (cluster.length === 0) continue;
    const tids = [...new Set(cluster.map(c => c.transcript_id))].sort();
    const totalMentions = cluster.reduce((sum, e) => sum + (e.theme.mention_count ?? 1), 0);
    const valences = cluster.map(e => e.theme.emotional_valence ?? "neutral");
    const valenceCounts: Record<string, number> = {};
    valences.forEach(v => valenceCounts[v] = (valenceCounts[v] ?? 0) + 1);
    const valenceMajority = Object.entries(valenceCounts).sort((a, b) => b[1] - a[1])[0][0];

    const sevStats = aggregateSeverity(cluster, severityDocs);
    const contradictions = gatherContradictions(cluster, contradictionDocs);
    const evidencePool = selectEvidencePool(cluster, transcripts);

    const categoryCounts: Record<string, number> = {};
    cluster.forEach(e => categoryCounts[e.theme.category] = (categoryCounts[e.theme.category] ?? 0) + 1);
    const primaryCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];

    const frequency_pct = Number((tids.length / nTranscripts).toFixed(3));

    insights.push({
      insight_id: buildInsightId(cluster),
      theme_name: bestThemeName(cluster),
      category: primaryCategory,
      transcripts_mentioning: tids,
      transcripts_total: nTranscripts,
      frequency_pct,
      total_mentions: totalMentions,
      emotional_valence_majority: valenceMajority,
      ...sevStats,
      evidence_pool: evidencePool,
      source_themes: cluster.map(e => ({
        transcript_id: e.transcript_id,
        theme_id: e.theme.theme_id,
        theme_name: e.theme.theme_name,
      })),
      contradictions_referenced: contradictions,
      impact_score: (sevStats.avg_severity ?? 5) * frequency_pct,
    });
  }

  insights.sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));

  // Dedupe insight_ids
  const seen: Record<string, number> = {};
  for (const ins of insights) {
    if (seen[ins.insight_id]) {
      seen[ins.insight_id] += 1;
      ins.insight_id = `${ins.insight_id}_${seen[ins.insight_id]}`;
    } else {
      seen[ins.insight_id] = 1;
    }
  }

  return {
    metadata: {
      transcripts_processed: nTranscripts,
      transcript_ids: transcriptIds,
      total_themes_found: totalThemes,
      themes_after_clustering: insights.length,
      similarity_threshold: similarityThreshold,
      clustering_method: clustersOverride !== undefined ? "llm" : "jaccard",
      generated_at: new Date().toISOString(),
    },
    aggregated_insights: insights,
  };
}
