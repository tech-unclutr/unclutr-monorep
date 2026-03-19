"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "./LenisProvider";

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "problem", label: "Why SquareUp" },
  { id: "interview-studio", label: "Studio" },
  { id: "studies", label: "Studies" },
  { id: "book-call", label: "Book a Call" },
];

export default function SectionNav() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pulseDot, setPulseDot] = useState<string | null>(null);
  const lenis = useLenis();
  const prevActiveRef = useRef<string | null>(null);

  // Show/hide based on scroll position (after hero, before footer)
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const footer = document.querySelector('[data-section-name="footer"]');
      const footerVisible = footer
        ? footer.getBoundingClientRect().top <= window.innerHeight - 100
        : false;

      setVisible(window.scrollY > heroHeight * 0.8 && !footerVisible);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for active section + dark mode detection
  useEffect(() => {
    const sectionEls = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const darkEls = ["hero", "cta-section"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const footer = document.querySelector('[data-section-name="footer"]') as HTMLElement | null;
    if (footer) darkEls.push(footer);

    // Active section observer
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    // Dark section observer
    const darkObserver = new IntersectionObserver(
      (entries) => {
        const anyDarkVisible = entries.some((e) => e.isIntersecting);
        setIsDark(anyDarkVisible);
      },
      { rootMargin: "0px", threshold: 0.3 }
    );

    sectionEls.forEach((el) => sectionObserver.observe(el));
    darkEls.forEach((el) => darkObserver.observe(el));

    return () => {
      sectionObserver.disconnect();
      darkObserver.disconnect();
    };
  }, []);

  // Dark scrollbar class on <html> — driven by the same dark observer
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark-scrollbar");
    } else {
      document.documentElement.classList.remove("dark-scrollbar");
    }
  }, [isDark]);

  // Pulse animation on section change
  useEffect(() => {
    if (activeSection && activeSection !== prevActiveRef.current) {
      const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
      const nextSection = SECTIONS[currentIndex + 1];
      if (nextSection) {
        setPulseDot(nextSection.id);
        const timer = setTimeout(() => setPulseDot(null), 600);
        prevActiveRef.current = activeSection;
        return () => clearTimeout(timer);
      }
      prevActiveRef.current = activeSection;
    }
  }, [activeSection]);

  const scrollToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (lenis) {
        lenis.scrollTo(el, { offset: -40, duration: 1.6, easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -12 * t)) });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    },
    [lenis]
  );

  const dotColor = isDark ? "rgba(255,255,255," : "rgba(33,33,33,";
  const activeColor = isDark ? "#FF9F43" : "#FF6B00";

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-5"
          aria-label="Page sections"
        >
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isPulsing = pulseDot === section.id;

            return (
              <div
                key={section.id}
                className="relative flex items-center justify-end"
                onMouseEnter={() => setHoveredDot(section.id)}
                onMouseLeave={() => setHoveredDot(null)}
              >
                {/* Hover label */}
                <AnimatePresence>
                  {hoveredDot === section.id && (
                    <motion.span
                      initial={{ opacity: 0, x: 8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute right-5 whitespace-nowrap text-[11px] font-medium tracking-wide uppercase pointer-events-none select-none"
                      style={{
                        color: isDark ? "rgba(255,255,255,0.7)" : "rgba(33,33,33,0.5)",
                        marginRight: "8px",
                      }}
                    >
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Dot / Pill */}
                <button
                  onClick={() => scrollToSection(section.id)}
                  aria-label={`Scroll to ${section.label}`}
                  aria-current={isActive ? "true" : undefined}
                  className="relative flex items-center justify-center w-5 h-5 cursor-pointer group"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <motion.div
                    layout
                    className="rounded-full"
                    animate={{
                      width: isActive ? 6 : 6,
                      height: isActive ? 20 : 6,
                      backgroundColor: isActive ? activeColor : `${dotColor}0.15)`,
                      scale: isPulsing ? 1.4 : 1,
                      boxShadow: isActive
                        ? `0 0 10px ${isDark ? "rgba(255,159,67,0.4)" : "rgba(255,107,0,0.3)"}`
                        : "none",
                    }}
                    whileHover={{
                      backgroundColor: isActive ? activeColor : `${dotColor}0.35)`,
                      scale: 1.2,
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 500, damping: 35 },
                      scale: { type: "spring", stiffness: 400, damping: 25 },
                      backgroundColor: { duration: 0.2 },
                    }}
                    style={{ borderRadius: isActive ? 100 : 100 }}
                  />
                </button>
              </div>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
