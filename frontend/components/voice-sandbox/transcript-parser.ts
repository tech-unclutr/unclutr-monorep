// Transcript parser — Bolna sends transcripts as either:
//   1. A JSON-encoded list of turns: [{ role, content }, ...]
//   2. A plain text string: "agent: Hello\nuser: Hi"
// This utility normalizes both shapes into a single TranscriptTurn[] form.

export interface TranscriptTurn {
    role: "agent" | "user" | "system";
    content: string;
}

/** Parse a transcript from either array, JSON string, or plain text into turns. */
export function parseTranscript(
    raw: string | unknown[] | null | undefined,
    parsedTurns?: unknown[] | null,
): TranscriptTurn[] {
    // 1. Backend already gave us parsed turns — use them directly.
    if (parsedTurns && Array.isArray(parsedTurns) && parsedTurns.length > 0) {
        return normalizeTurnList(parsedTurns);
    }

    // 2. Raw is already an array
    if (Array.isArray(raw)) {
        return normalizeTurnList(raw);
    }

    // 3. Raw is a string — try JSON parse first, fall back to line splitting
    if (typeof raw === "string" && raw.trim().length > 0) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return normalizeTurnList(parsed);
            }
        } catch {
            // not JSON — fall through to line parser
        }
        return parseLineFormat(raw);
    }

    return [];
}

function normalizeTurnList(items: unknown[]): TranscriptTurn[] {
    return items
        .map((item): TranscriptTurn | null => {
            if (!item || typeof item !== "object") return null;
            const obj = item as Record<string, unknown>;
            const rawRole = (obj.role || obj.speaker || "agent") as string;
            const role = normalizeRole(rawRole);
            const content = String(obj.content || obj.text || obj.message || "").trim();
            if (!content) return null;
            return { role, content };
        })
        .filter((t): t is TranscriptTurn => t !== null);
}

function parseLineFormat(text: string): TranscriptTurn[] {
    return text
        .split("\n")
        .map((line): TranscriptTurn | null => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            const lower = trimmed.toLowerCase();

            if (lower.startsWith("agent:") || lower.startsWith("api:") || lower.startsWith("assistant:")) {
                return {
                    role: "agent",
                    content: trimmed.substring(trimmed.indexOf(":") + 1).trim(),
                };
            }
            if (lower.startsWith("user:") || lower.startsWith("participant:") || lower.startsWith("human:")) {
                return {
                    role: "user",
                    content: trimmed.substring(trimmed.indexOf(":") + 1).trim(),
                };
            }
            // Lines without a clear role prefix get attributed to the agent.
            return { role: "agent", content: trimmed };
        })
        .filter((t): t is TranscriptTurn => t !== null && t.content.length > 0);
}

function normalizeRole(role: string): TranscriptTurn["role"] {
    const lower = role.toLowerCase();
    if (lower === "user" || lower === "participant" || lower === "human") return "user";
    if (lower === "system") return "system";
    return "agent";
}

/** Format a duration in seconds as "M:SS". */
export function formatCallDuration(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
