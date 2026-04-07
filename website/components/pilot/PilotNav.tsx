"use client";

import { useCTATracking } from "@/lib/analytics";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function PilotNav() {
  const { trackCTA } = useCTATracking();

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center w-full">
      {/* Full-width gradient backdrop */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none -z-20"
        style={{
          width: "100vw",
          height: "clamp(48px, 13vw, 68px)",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Nav links — left side (hidden on mobile) */}
      <nav className="absolute left-4 sm:left-6 lg:left-10 top-0 hidden sm:flex items-center gap-5 lg:gap-7"
        style={{ height: "clamp(52px, 15vw, 72px)" }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-[13px] font-medium text-maze-black/50 hover:text-maze-black transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Book Call — right side */}
      <div className="absolute right-4 sm:right-6 lg:right-10 top-0 flex items-center"
        style={{ height: "clamp(52px, 15vw, 72px)" }}
      >
        <a
          href="https://calendar.app.google/WyiQUVRZxAdJJ5Yu7"
          onClick={() => trackCTA("Book a call", "https://calendar.app.google/WyiQUVRZxAdJJ5Yu7", "pilot_nav", "nav_bar")}
          className="bg-maze-black text-white rounded-full px-3 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-bold hover:bg-black active:scale-[0.97] transition-all"
        >
          Book a call
        </a>
      </div>

      {/* Center logo */}
      <a href="/">
        <img
          src="/su_wordmark_transparent.svg"
          alt="Square Up"
          style={{ height: "clamp(38px, 10vw, 54px)", width: "auto", marginTop: "max(6px, env(safe-area-inset-top, 6px))" }}
        />
      </a>

      {/* Notch background */}
      <div
        className="absolute top-0 backdrop-blur-xl -z-10"
        style={{
          width: "clamp(160px, 50vw, 220px)",
          height: "clamp(52px, 15vw, 72px)",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "0 0 20px 20px",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          borderTop: "none",
        }}
      />
    </div>
  );
}
