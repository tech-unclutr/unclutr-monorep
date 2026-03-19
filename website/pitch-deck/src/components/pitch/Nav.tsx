import { useReadingProgress } from "@/lib/useScrollAnimation";
import iconSvg from "@/assets/icon.svg";
import wordmarkBlack from "@/assets/wordmark-black.svg";
import wordmarkWhite from "@/assets/wordmark-white.svg";
import { type DeckLength, type SlideMode } from "@/lib/slides";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface NavProps {
  mode: SlideMode;
  onModeChange: (m: SlideMode) => void;
  deckLength: DeckLength;
  onDeckLengthChange: (l: DeckLength) => void;
}

export default function Nav({ mode, onModeChange, deckLength, onDeckLengthChange }: NavProps) {
  const progress = useReadingProgress();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const modes: { id: SlideMode; label: string; sub: string; tooltip: string }[] = [
    { id: "short", label: "Pitch", sub: "YC style", tooltip: "Crisp, YC-style sendable version" },
    { id: "detailed", label: "Deep Dive", sub: "Full deck", tooltip: "Full story with competitors, ICP & more" },
    { id: "download", label: "Download", sub: "PDF export", tooltip: "Export either version as PDF" },
    { id: "presenter", label: "Present", sub: "Slideshow", tooltip: "Distilled, less-cluttered slideshow for live presenting" },
  ];

  return (
    <>
      {/* Reading progress bar */}
      {mode !== "presenter" && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, background: "hsl(var(--sq-ember))" }}
          />
        </div>
      )}

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
        style={{
          background: scrolled ? "transparent" : "transparent",
          paddingTop: scrolled ? "10px" : "16px",
        }}
      >
        <div 
          className="w-full mx-auto"
          style={{ 
            padding: mode === "presenter" || mode === "download" 
              ? "0 clamp(48px, 6vw, 140px)" 
              : "0 clamp(40px, 8vw, 180px)" 
          }}
        >
          <div 
            className={`flex items-center justify-between h-[64px] transition-all duration-500 rounded-full px-8 ${scrolled ? "sq-glass-premium" : ""}`}
            style={{
              border: scrolled ? "1px solid var(--glass-border)" : "1px solid transparent",
            }}
          >

            {/* Logo */}
            <a href="#hero" className="flex items-center flex-shrink-0 group">
              <img 
                src={isDark ? wordmarkWhite : wordmarkBlack} 
                alt="SquareUp" 
                className="h-7 w-auto transition-transform duration-300 group-hover:scale-105" 
              />
            </a>

            {/* Center: segmented mode pill — Apple-style sophistication */}
            <div className="hidden lg:flex items-center rounded-full p-[2px] gap-0"
              style={{
                background: scrolled ? "var(--glass-shimmer)" : "rgba(0,0,0,0.04)",
                border: "1px solid var(--glass-border)"
              }}>
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onModeChange(m.id)}
                  className="group/tip relative px-5 py-[6px] rounded-full text-center transition-all duration-300"
                  style={{
                    background: mode === m.id ? "var(--sq-card)" : "transparent",
                    color: mode === m.id ? "var(--sq-text)" : "var(--hero-text-sub)",
                    boxShadow: mode === m.id ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <span className="block text-[12px] font-bold leading-tight">{m.label}</span>
                  <span className="block text-[9px] font-bold leading-tight mt-[1px] opacity-40">
                    {m.sub}
                  </span>
                  
                  {/* Premium Tooltip */}
                  <div
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-3 whitespace-nowrap rounded-xl px-4 py-2 text-[11px] font-bold opacity-0 transition-all duration-300 group-hover/tip:opacity-100 group-hover/tip:translate-y-1 z-50 sq-glass-premium"
                    style={{
                      color: "var(--sq-text)",
                    }}
                  >
                    {m.tooltip}
                  </div>
                </button>
              ))}
            </div>

            {/* Right Group */}
            <div className="hidden md:flex items-center gap-6">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  aria-label="Toggle theme"
                  style={{ color: "var(--hero-text)" }}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}
              
              <a
                href="mailto:hello@joinsquareup.com"
                className="text-[12px] font-black tracking-widest uppercase px-6 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "hsl(var(--sq-ember))",
                  color: "white",
                  boxShadow: "0 4px 16px hsl(var(--sq-ember) / 0.3)"
                }}
              >
                Get in touch
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              style={{ color: "var(--hero-text)" }}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer — Modern Overlay */}
        {open && (
          <div className="lg:hidden fixed inset-x-0 top-[76px] mx-4 rounded-3xl overflow-hidden sq-glass-premium border border-white/10 p-6 space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Viewing Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { onModeChange(m.id); setOpen(false); }}
                    className="flex flex-col items-start p-4 rounded-2xl transition-all"
                    style={{
                      background: mode === m.id ? "hsl(var(--sq-ember))" : "rgba(0,0,0,0.03)",
                      color: mode === m.id ? "white" : "var(--sq-text)",
                    }}
                  >
                    <span className="text-[13px] font-bold">{m.label}</span>
                    <span className="text-[10px] font-medium opacity-60">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a href="mailto:hello@joinsquareup.com"
                className="w-full text-center font-black text-[13px] uppercase tracking-widest py-4 rounded-2xl text-white"
                style={{ background: "hsl(var(--sq-ember))" }}
                onClick={() => setOpen(false)}>
                Get in touch
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
