"use client";

import { motion, AnimatePresence } from "framer-motion";

const SHORTCUTS = [
  { key: "↑ / ↓",             label: "Scroll up / down 30vh"        },
  { key: "Shift+↑ / Shift+↓", label: "Jump to prev / next section"  },
  { key: "PageUp / PageDown",  label: "Jump to prev / next section"  },
  { key: "Home",               label: "Scroll to top"                },
  { key: "End",                label: "Jump to Book a Call"          },
  { key: "/",                  label: "Open navigation menu"         },
  { key: "Escape",             label: "Close menus"                  },
  { key: "?",                  label: "Toggle this overlay"          },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsOverlay({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="kbd-backdrop"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="kbd-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-2rem))] bg-[#FBF4EC] border border-black/10 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.18)] p-6"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-black/40">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/8 transition-colors text-black/40 hover:text-black/70"
                aria-label="Close shortcuts overlay"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {SHORTCUTS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-[13px] text-black/60">{label}</span>
                  <kbd className="shrink-0 text-[11px] font-mono font-medium bg-black/[0.06] border border-black/10 rounded-md px-2 py-0.5 text-black/60 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[11px] text-black/30 text-center">
              Press{" "}
              <kbd className="text-[10px] bg-black/[0.06] border border-black/10 rounded px-1 font-mono">
                ?
              </kbd>{" "}
              or{" "}
              <kbd className="text-[10px] bg-black/[0.06] border border-black/10 rounded px-1 font-mono">
                Esc
              </kbd>{" "}
              to close
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
