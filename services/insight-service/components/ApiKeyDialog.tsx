"use client";

import { useState } from "react";

const STORAGE_KEY = "squareup_synthesis_api_key";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredApiKey(key: string) {
  if (typeof window === "undefined") return;
  if (key) window.localStorage.setItem(STORAGE_KEY, key);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function ApiKeyDialog({ open, onClose, onSave, currentKey }: {
  open: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}) {
  const [value, setValue] = useState(currentKey);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 animate-fade-in">
      <div className="card w-full max-w-md p-6 mx-4 animate-slide-up">
        <h2 className="text-lg font-semibold text-ink-900 mb-1">Anthropic API key</h2>
        <p className="text-sm text-ink-500 mb-4">
          Stored only in your browser&apos;s localStorage. Never sent to SquareUp servers.
          Used to call <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded">api.anthropic.com</code> directly from this page.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full px-3 py-2 border border-ink-200 rounded-lg font-mono text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
        />
        <p className="text-xs text-ink-400 mt-2">
          Get a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-accent-500 hover:underline">console.anthropic.com</a>.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => { onSave(value); onClose(); }}
            disabled={!value.startsWith("sk-ant-")}
            className="btn-primary"
          >
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
