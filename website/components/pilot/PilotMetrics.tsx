"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";

const METRICS = [
  { value: 200, suffix: "+", label: "Studies delivered" },
  { value: 48, suffix: "hr", label: "Average turnaround" },
  { value: 4.9, suffix: "/5", label: "Client rating", decimals: 1 },
  { value: 30, suffix: "+", label: "Interviews per study" },
];

function AnimatedCounter({
  value,
  suffix,
  decimals = 0,
  delay = 0,
}: {
  value: number;
  suffix: string;
  decimals?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, {
    stiffness: 60,
    damping: 20,
    restDelta: decimals > 0 ? 0.01 : 0.5,
  });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) {
      const timeout = setTimeout(() => {
        motionVal.set(value);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [inView, value, delay, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (v) => {
      setDisplay(
        decimals > 0
          ? v.toFixed(decimals)
          : Math.round(v).toString()
      );
    });
    return unsubscribe;
  }, [spring, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

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
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
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
                <AnimatedCounter
                  value={metric.value}
                  suffix={metric.suffix}
                  decimals={metric.decimals}
                  delay={i * 0.15}
                />
              </p>
              <p className="mt-2 text-sm sm:text-base text-white/50 font-medium">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
