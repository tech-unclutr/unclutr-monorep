"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Share2 } from "lucide-react";
import { NAVIGABLE_SECTIONS } from "@/lib/constants/sections";
import { useHaptic } from "@/lib/hooks/useHaptic";

const SECTION_DESCRIPTIONS: Record<string, string> = {
  hero: "Stop guessing. Start listening.",
  problem: "The 4 fundamental flaws of insights today",
  "interview-studio": "Your customer-research team that never sleeps",
  studies: "On-demand customer intelligence",
  "book-call": "30-min tailored setup call",
  "cta-section": "Square up with your customers",
};

const SHARE_PAYLOAD = {
  title: "SquareUp — Customer Understanding for Consumer Companies",
  text: "The customer understanding team you wish you had.",
  url: typeof window !== "undefined" ? window.location.origin + "/" : "https://joinsquareup.com/",
};

export default function MobileSectionDrawer() {
  const haptic = useHaptic();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("hero");
  const [shareSupported, setShareSupported] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Only render on touch / narrow screens
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.matchMedia("(max-width: 1024px)").matches;
    setShouldRender(isTouch || isNarrow);
    setShareSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");

    const onResize = () => {
      setShouldRender("ontouchstart" in window || window.matchMedia("(max-width: 1024px)").matches);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Track which section is currently in view (highlights the right entry in the drawer)
  useEffect(() => {
    if (!shouldRender) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    NAVIGABLE_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [shouldRender]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!shouldRender) return null;

  const handleSectionTap = (id: string) => {
    haptic("selection");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  const handleShare = async () => {
    haptic("medium");
    try {
      if (shareSupported) {
        await navigator.share(SHARE_PAYLOAD);
      } else {
        await navigator.clipboard.writeText(SHARE_PAYLOAD.url);
      }
    } catch {
      // user cancelled or clipboard blocked — silent
    }
    setOpen(false);
  };

  return (
    <>
      {/* FAB — premium glassmorphic with brand-tinted multi-layer shadow + custom asymmetric icon.
          Hidden while the user is in the hero (initial state) to keep the entrance clean. */}
      <motion.button
        onClick={() => {
          haptic("selection");
          setOpen(true);
        }}
        aria-label="Open section menu"
        className="group fixed z-[55] left-4 flex items-center justify-center w-11 h-11 rounded-full active:scale-90 transition-transform"
        style={{
          top: "calc(14px + env(safe-area-inset-top, 0px))",
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(251,244,236,0.92) 100%)",
          backdropFilter: "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: "blur(20px) saturate(1.6)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow:
            "0 10px 32px -6px rgba(255,107,0,0.18), 0 4px 12px -2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: open || activeId === "hero" ? 0 : 1,
          scale: open || activeId === "hero" ? 0.8 : 1,
          pointerEvents: open || activeId === "hero" ? "none" : "auto",
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Soft brand-orange pulse ring — gives the button presence on dark hero too */}
        <span
          className="absolute inset-[-2px] rounded-full pointer-events-none opacity-50"
          style={{
            background: "radial-gradient(circle, rgba(255,107,0,0.18) 0%, transparent 65%)",
          }}
        />

        {/* Custom asymmetric "stack" icon — three lines of decreasing width = scroll/section feel */}
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="none"
          aria-hidden="true"
          className="relative transition-transform duration-300 group-active:scale-90"
        >
          <rect x="0" y="0" width="16" height="2" rx="1" fill="#FF6B00" />
          <rect x="0" y="5" width="12" height="2" rx="1" fill="#1d1d1f" opacity="0.85" />
          <rect x="0" y="10" width="8" height="2" rx="1" fill="#1d1d1f" opacity="0.7" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[58] bg-[#1d1d1f]/45 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Drawer — glassmorphic sheet, matching Interview Studio card language */}
            <motion.div
              key="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) setOpen(false);
              }}
              className="fixed left-0 right-0 bottom-0 z-[59] rounded-t-[32px] overflow-hidden"
              style={{
                paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
                background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,244,236,0.98) 100%)",
                backdropFilter: "blur(48px) saturate(1.4)",
                WebkitBackdropFilter: "blur(48px) saturate(1.4)",
                borderTop: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 -24px 80px -8px rgba(255,107,0,0.12), 0 -12px 40px -6px rgba(0,0,0,0.10)",
              }}
            >
              {/* Subtle brand-orange ambient glow at top */}
              <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 60%)",
                }}
              />

              {/* Drag handle */}
              <div className="relative pt-3 pb-1 flex justify-center">
                <div className="w-9 h-[4px] rounded-full bg-[#1d1d1f]/20" />
              </div>

              {/* Header — matches site's section-header pattern: orange eyebrow + display headline */}
              <div className="relative flex items-start justify-between px-6 pt-4 pb-5">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#FF6B00] mb-1.5">
                    Navigate
                  </span>
                  <h2 className="font-display text-[22px] font-bold text-[#1d1d1f] tracking-[-0.02em] leading-[1.1]">
                    Jump to a section
                  </h2>
                </div>
                <button
                  onClick={() => {
                    haptic("selection");
                    setOpen(false);
                  }}
                  aria-label="Close menu"
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-[#1d1d1f]/60 active:scale-90 transition-transform"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  <X size={15} />
                </button>
              </div>

              <nav className="relative px-3 pb-3">
                {NAVIGABLE_SECTIONS.map((s, i) => {
                  const isActive = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSectionTap(s.id)}
                      className="group relative w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-left active:scale-[0.985] transition-all overflow-hidden"
                      style={
                        isActive
                          ? {
                              background: "linear-gradient(135deg, rgba(255,107,0,0.08) 0%, rgba(255,90,54,0.04) 100%)",
                              border: "1px solid rgba(255,107,0,0.18)",
                              boxShadow: "0 8px 24px -4px rgba(255,107,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
                            }
                          : { border: "1px solid transparent" }
                      }
                    >
                      {/* Index chip — uses brand gradient on active, matching site CTA buttons */}
                      <span
                        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold tracking-tight transition-all"
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(135deg, #FF9F43 0%, #FF6B00 50%, #FF3800 100%)",
                                color: "white",
                                boxShadow: "0 4px 14px -2px rgba(255,107,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
                              }
                            : {
                                background: "rgba(255,255,255,0.7)",
                                color: "rgba(29,29,31,0.55)",
                                border: "1px solid rgba(0,0,0,0.05)",
                              }
                        }
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      {/* Label + description — matches site's body type scale */}
                      <span className="flex-1 min-w-0 flex flex-col">
                        <span
                          className={`text-[15px] font-semibold leading-tight tracking-[-0.01em] ${
                            isActive ? "text-[#FF6B00]" : "text-[#1d1d1f]"
                          }`}
                        >
                          {s.label}
                        </span>
                        {SECTION_DESCRIPTIONS[s.id] && (
                          <span className="text-[12px] text-[#86868b] leading-snug mt-0.5 truncate">
                            {SECTION_DESCRIPTIONS[s.id]}
                          </span>
                        )}
                      </span>

                      {/* Arrow */}
                      <ArrowUpRight
                        size={16}
                        className={`shrink-0 transition-all ${
                          isActive
                            ? "text-[#FF6B00] -translate-y-0.5 translate-x-0.5"
                            : "text-[#1d1d1f]/25"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>

              <div className="relative px-5 pt-2 pb-1">
                <button
                  onClick={handleShare}
                  className="relative w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[14px] font-bold tracking-[-0.01em] overflow-hidden active:scale-[0.98] transition-transform bg-gradient-brand shadow-brand-glow"
                >
                  <Share2 size={15} />
                  <span>{shareSupported ? "Share SquareUp" : "Copy link"}</span>
                  {/* Subtle shimmer on press */}
                  <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
