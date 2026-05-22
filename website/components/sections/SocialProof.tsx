"use client";

import { useRef, MouseEvent, ReactNode } from "react";
import { motion, useInView, useMotionTemplate, useMotionValue } from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";

function Wordmark({
  children,
  inView,
  index,
}: {
  children: ReactNode;
  inView: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 1.2, delay: 0.3 + index * 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="select-none"
    >
      {children}
    </motion.div>
  );
}

export default function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.2 });
  useSectionVisibility("social_proof", containerRef);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  const spotlightColor = "rgba(255, 140, 100, 0.12)";
  const spotlightStyle = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;

  const headlineLines = [
    "The world's sharpest consumer teams don't guess.",
    "They build on"
  ];

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      data-section-name="social-proof"
      className="relative z-10 w-full py-24 lg:py-36 overflow-hidden"
      style={{
        background: "#FBF4EC"
      }}
    >
      {/* Interactive Spotlight Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700"
        style={{ background: spotlightStyle }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      
      {/* Static subtle center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full overflow-hidden z-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-[800px] h-[300px] bg-gradient-to-r from-orange-400 via-orange-200 to-transparent rounded-[100%] blur-[100px]"
          style={{ transform: "translateY(-20%)" }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        {/* Shimmering Badge */}
        <div className="text-center mb-10 flex justify-center w-full">
          <motion.div 
             initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
             animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
             className="relative group overflow-hidden inline-block py-2 px-6 rounded-full border border-orange-200/50 bg-white/40 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.03)]"
          >
            <span className="relative z-10 text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase text-orange-600">
              Validated by leaders from 120+ customer-centric teams
            </span>
            <motion.div 
               animate={{ x: ["-100%", "200%"] }}
               transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1 }}
               className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/70 to-transparent w-1/2 skew-x-[-20deg]"
            />
          </motion.div>
        </div>

        {/* Dynamic Headline */}
        <div className="w-full mx-auto mb-16 lg:mb-20 text-center flex flex-col items-center">
          <h2 className="font-display text-[clamp(26px,4.5vw,56px)] tracking-[-0.03em] text-[#0b132b] leading-[1.1] z-10 max-w-[900px] text-balance">
            <span className="block mb-2 md:mb-3">
              {headlineLines[0].split(" ").map((word, i) => (
                <span key={i} className="inline-block whitespace-pre">
                  <motion.span
                    initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                    animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                    transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                  {i < headlineLines[0].split(" ").length - 1 && " "}
                </span>
              ))}
            </span>
            
            <span className="inline-block relative">
              {headlineLines[1].split(" ").map((word, i) => (
                <span key={i} className="inline-block whitespace-pre">
                  <motion.span
                    initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                    animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                    transition={{ duration: 1, delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                  {" "}
                </span>
              ))}
              <motion.span
                initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
                animate={inView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block ml-1 sm:ml-2 relative"
              >
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8C64] drop-shadow-sm">
                  Square Up.
                </span>
                <motion.span 
                   animate={{ opacity: [0.3, 0.7, 0.3] }}
                   transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                   className="absolute inset-0 z-0 text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8C64] blur-[10px] opacity-60 pointer-events-none"
                >
                  Square Up.
                </motion.span>
              </motion.span>
            </span>
          </h2>
        </div>

        {/* Wordmarks */}
        <div className="max-w-[1100px] mx-auto flex flex-wrap justify-center items-center gap-x-8 sm:gap-x-12 lg:gap-x-16 gap-y-10 relative z-20">
          {/* Mesa School of Business */}
          <Wordmark inView={inView} index={0}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mesa-school-logo.svg"
              alt="Mesa School of Business"
              className="h-12 sm:h-14 w-auto"
            />
          </Wordmark>

          {/* Entrepreneurs First */}
          <Wordmark inView={inView} index={1}>
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl sm:text-[28px] font-black tracking-[-0.02em] leading-none whitespace-nowrap">
                <span className="text-[#6A1FE5]">Entrepreneurs</span>{" "}
                <span className="text-[#F26D1F]">First</span>
              </span>
              <span className="text-[11px] sm:text-xs italic font-medium text-[#6B6B6B] mt-1 self-end">
                Spring 2026 Cohort
              </span>
            </div>
          </Wordmark>
        </div>
      </div>
    </section>
  );
}
