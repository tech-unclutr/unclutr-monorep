"use client";

import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";

const logos = [
  "Zepto",
  "Wild Stone",
  "Fastrack",
  "Skinn",
  "14U Capital",
  "Mumbai Pav Co.",
  "Mesa School",
];

export default function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.3 });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const }
    },
  };

  return (
    <section
      ref={containerRef}
      data-section-name="social-proof"
      className="relative z-10 py-24 lg:py-36 overflow-hidden"
      style={{
        background: "#FBF4EC"
      }}
    >

      {/* Subtle background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 0.25, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-[800px] h-[300px] bg-gradient-to-r from-orange-300 via-orange-100 to-transparent rounded-[100%] blur-[80px]"
          style={{ transform: "translateY(-20%)" }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="relative z-10 max-w-[1200px] mx-auto px-6"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <span className="inline-block py-1.5 px-4 rounded-full text-xs font-bold tracking-[0.15em] uppercase text-orange-600 bg-orange-50/80 border border-orange-200/50 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
            Validated by leaders from 50+ customer-centric teams
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="max-w-[1000px] mx-auto mb-20 lg:mb-24">
          <h2 className="font-display text-[clamp(28px,4vw,48px)] tracking-[-0.03em] text-[#0b132b] leading-[1.1] text-center">
            <span className="whitespace-nowrap">The world's sharpest consumer teams don't guess.</span>
            <br />
            <span>They build on <span className="text-[#FF5A36]">Square Up</span>.</span>
          </h2>
        </motion.div>

        {/* Logo Grid */}
        <motion.div variants={itemVariants} className="max-w-[1100px] mx-auto flex flex-col items-center gap-y-3 sm:gap-y-4">
          {/* Top row */}
          <div className="flex flex-wrap justify-center gap-x-10 sm:gap-x-16 lg:gap-x-20 gap-y-3 sm:gap-y-4">
            {logos.slice(0, 4).map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={inView ? { opacity: 1, filter: "blur(0px)" } : {}}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.08 }}
                className="font-display text-xl sm:text-2xl font-medium tracking-tight
                           text-[#8892B0] hover:text-[#FF5A36]
                           transition-all duration-300 ease-out
                           hover:drop-shadow-[0_4px_20px_rgba(255,90,54,0.3)]
                           whitespace-nowrap select-none cursor-default"
              >
                {name}
              </motion.span>
            ))}
          </div>
          {/* Bottom row – centered */}
          <div className="flex flex-wrap justify-center gap-x-10 sm:gap-x-16 lg:gap-x-20 gap-y-3 sm:gap-y-4">
            {logos.slice(4).map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={inView ? { opacity: 1, filter: "blur(0px)" } : {}}
                transition={{ duration: 0.8, delay: 0.4 + (i + 4) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.08 }}
                className="font-display text-xl sm:text-2xl font-medium tracking-tight
                           text-[#8892B0] hover:text-[#FF5A36]
                           transition-all duration-300 ease-out
                           hover:drop-shadow-[0_4px_20px_rgba(255,90,54,0.3)]
                           whitespace-nowrap select-none cursor-default"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
