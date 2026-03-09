"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";

const VALUE_PROPS = [
  { highlight: "1-on-1", label: "Real customer interviews" },
  { highlight: "48hr", label: "From brief to first insight" },
  { highlight: "Zero", label: "Recruitment hassle for you" },
  { highlight: "Full", label: "Research & action" },
];

export default function PilotMetrics() {
  const containerRef = useRef<HTMLElement>(null);
  useSectionVisibility("pilot_metrics" as any, containerRef);

  return (
    <section
      ref={containerRef}
      data-section-name="pilot_metrics"
      className="relative py-16 sm:py-20 overflow-hidden"
      style={{ backgroundColor: "#212121" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,138,76,0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[1000px] mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-6">
          {VALUE_PROPS.map((prop, i) => (
            <motion.div
              key={prop.label}
              className="text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="font-display text-[clamp(32px,8vw,56px)] tracking-[-0.04em] text-white leading-none">
                {prop.highlight}
              </p>
              <p className="mt-2 text-sm sm:text-base text-white/50 font-medium">
                {prop.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
