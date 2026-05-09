"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Transcript = { id: string; text: string; source: "paste" | "upload" | "sample"; filename?: string };

export function TranscriptInput({
  transcripts, onChange, disabled, mode,
}: {
  transcripts: Transcript[];
  onChange: (transcripts: Transcript[]) => void;
  disabled: boolean;
  mode: "playback" | "live" | "production";
}) {
  const [pasteText, setPasteText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load sample once for playback mode
  useEffect(() => {
    if (mode === "playback" && transcripts.length === 0) {
      loadSample().then(t => onChange([t]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const txts: Transcript[] = [];
    let nextIdx = transcripts.length;
    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
        console.warn("Skipping non-text file:", file.name);
        continue;
      }
      const text = await file.text();
      if (!text.trim()) continue;
      nextIdx += 1;
      txts.push({
        id: `T${nextIdx}`,
        text,
        source: "upload",
        filename: file.name,
      });
    }
    if (txts.length > 0) onChange([...transcripts, ...txts]);
  }, [transcripts, onChange]);

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return;
    const next = transcripts.length + 1;
    onChange([
      ...transcripts,
      { id: `T${next}`, text: pasteText.trim(), source: "paste" },
    ]);
    setPasteText("");
  }, [pasteText, transcripts, onChange]);

  const removeTranscript = (id: string) => onChange(transcripts.filter(t => t.id !== id));
  const clearAll = () => onChange([]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Transcripts</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Drop .txt files, paste, or load the sample. Multi-transcript runs cluster better.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500">
            {transcripts.length} loaded
            {transcripts.length > 0 && ` • ${transcripts.reduce((s, t) => s + t.text.length, 0).toLocaleString()} chars`}
          </span>
          {transcripts.length > 0 && (
            <button onClick={clearAll} disabled={disabled} className="text-xs text-ink-500 hover:text-signal-red">Clear all</button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-all " +
          (isDragging ? "border-accent-500 bg-accent-50"
            : "border-ink-200 bg-ink-50 hover:bg-ink-100/50") +
          (disabled ? " opacity-50 cursor-not-allowed" : " cursor-pointer")
        }
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />
        <svg className="w-7 h-7 mx-auto mb-2 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 16l5-5L21 21M14 14l3-3 4 4M21 13V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-sm text-ink-700 font-medium">Drop .txt transcripts here</div>
        <div className="text-xs text-ink-500 mt-0.5">or click to browse · multiple files OK</div>
      </div>

      {/* Loaded transcripts */}
      {transcripts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {transcripts.map(t => (
            <TranscriptChip key={t.id} t={t} onRemove={() => removeTranscript(t.id)} disabled={disabled} />
          ))}
        </div>
      )}

      {/* Paste fallback */}
      <details className="mt-4 group">
        <summary className="text-xs text-accent-500 hover:text-accent-600 cursor-pointer font-medium">
          Or paste transcript text →
        </summary>
        <div className="mt-3">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            disabled={disabled}
            placeholder="Paste a transcript..."
            className="w-full h-32 p-3 font-mono text-xs border border-ink-200 rounded-lg
                       focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500
                       resize-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={async () => onChange([...transcripts, await loadSample()])}
              disabled={disabled}
              className="text-xs text-ink-500 hover:text-ink-900"
            >
              + Add sample transcript
            </button>
            <button onClick={handlePaste} disabled={disabled || !pasteText.trim()} className="btn-secondary text-xs">
              Add this transcript
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

function TranscriptChip({ t, onRemove, disabled }: { t: Transcript; onRemove: () => void; disabled: boolean }) {
  const sourceIcon = t.source === "upload" ? "📄" : t.source === "sample" ? "✨" : "✏";
  const label = t.source === "upload" ? t.filename : t.source === "sample" ? "Sample · Wildstone (Rohit)" : "Pasted";
  return (
    <div className="flex items-center justify-between p-2.5 bg-ink-50 rounded-lg border border-ink-100">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-base flex-shrink-0">{sourceIcon}</span>
        <code className="text-xs font-mono text-ink-600 flex-shrink-0">{t.id}</code>
        <span className="text-sm text-ink-800 truncate">{label}</span>
        <span className="text-xs text-ink-400 flex-shrink-0">{t.text.length.toLocaleString()} chars</span>
      </div>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="text-ink-400 hover:text-signal-red text-sm px-2"
        title="Remove this transcript"
      >×</button>
    </div>
  );
}

async function loadSample(): Promise<Transcript> {
  const res = await fetch("/fixtures/transcript.txt");
  const text = await res.text();
  return { id: "T1", text, source: "sample", filename: "wildstone-rohit-sample.txt" };
}
