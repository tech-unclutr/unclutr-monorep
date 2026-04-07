"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Reveal from "../ui/Reveal";
import { useSectionVisibility } from "@/lib/analytics";

export default function BookingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionVisibility("book_call", sectionRef);

  return (
    <motion.section
      ref={sectionRef}
      id="book-call"
      className="py-12 sm:py-16 lg:py-24 relative overflow-hidden group"
      style={{ background: "#FBF4EC" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
      }}
    >

      { }
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,235,225,0.6) 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] rounded-full blur-[100px] bg-[#FF5A36]/5 z-0 pointer-events-none" />

      { }
      <motion.div animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] rounded-full border border-[#FF5A36]/10 z-0 pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.5], opacity: [0.4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] rounded-full border border-[#fc7c62]/10 z-0 pointer-events-none" />

      { }
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-normal animate-in fade-in"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,90,54,0.4) 0%, rgba(255,109,64,0.1) 40%, transparent 60%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12">
        {/* Left column - Heading & Subheadline */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center">
          <Reveal width="100%">
            <div className="mb-8 lg:mb-0">
              <h2 className="font-display text-[clamp(28px,5vw,56px)] tracking-[-0.04em] text-[#0b132b] mb-4 text-left leading-[1.05]">
                Watch it{" "}
                <span className="text-[#FF5A36]">
                  work.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-[#475569] font-medium text-left max-w-lg">
                Book a 30-minute tailored setup call to see how SquareUp can unify
                your customer data.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Right column - CTA Card */}
        <div className="w-full lg:w-2/3">
          <Reveal width="100%">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center justify-center text-center relative overflow-hidden rounded-[32px] bg-white ring-1 ring-black/[0.04] p-10 sm:p-16"
              style={{
                boxShadow:
                  "0 40px 100px -16px rgba(0,0,0,0.08), 0 24px 64px -12px rgba(255,90,54,0.06)",
                minHeight: "min(400px, 50vh)",
              }}
            >
              <div className="mb-8 p-5 rounded-full bg-[#FF5A36]/10 text-[#FF5A36]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-semibold text-[#0b132b] mb-4">
                Schedule a Demo
              </h3>
              <p className="text-[#475569] mb-8 max-w-sm mx-auto text-base sm:text-lg">
                Pick a time that works for you. We'll show you exactly how our platform can fit into your workflow.
              </p>
              <a
                href="https://calendar.app.google/WyiQUVRZxAdJJ5Yu7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#FF5A36] text-white font-medium px-8 py-4 rounded-xl hover:bg-[#e04a2a] transition-all duration-300 hover:shadow-lg hover:shadow-[#FF5A36]/30 transform hover:-translate-y-0.5 whitespace-nowrap text-lg"
              >
                Book 30-min Setup Call
              </a>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </motion.section>
  );
}
