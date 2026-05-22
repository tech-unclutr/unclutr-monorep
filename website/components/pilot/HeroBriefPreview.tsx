"use client";

import { motion } from "framer-motion";

const GLASS_CARD = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.30) 40%, rgba(255,255,255,0.25) 60%, rgba(255,255,255,0.45) 100%)",
  backdropFilter: "blur(48px) saturate(2.0)",
  WebkitBackdropFilter: "blur(48px) saturate(2.0)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow:
    "0 24px 64px -12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.95)",
};

const TAGS = ["Pricing", "SKU Strategy", "Entry Barrier"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HeroBriefPreview() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative"
    >
      {/* Floating glow behind card */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,138,76,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          transform: "scale(1.2)",
        }}
      />

      <motion.div
        className="rounded-[20px] sm:rounded-[24px] overflow-hidden"
        style={GLASS_CARD}
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Decision strip */}
        <motion.div
          variants={itemVariants}
          className="px-5 py-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,138,76,0.07) 0%, rgba(255,138,76,0.02) 100%)",
            borderBottom: "1px solid rgba(255,138,76,0.12)",
          }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-lime/60 mb-1">
            Decision
          </p>
          <p className="font-display text-[14px] sm:text-[15px] text-maze-black leading-snug">
            Launch &#8377;399 / 50ml entry SKU before full launch
          </p>
        </motion.div>

        {/* Meta row */}
        <motion.div
          variants={itemVariants}
          className="px-5 py-3 flex items-center gap-5 bg-cream/50"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
        >
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40">
              Confidence
            </p>
            <p className="text-xs font-bold text-lime">High</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40">
              Based on
            </p>
            <p className="text-xs font-bold text-maze-black">47 interviews</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40">
              Owner
            </p>
            <p className="text-xs font-bold text-maze-black">Product Lead</p>
          </div>
        </motion.div>

        {/* Evidence snippet */}
        <motion.div variants={itemVariants} className="px-5 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40 mb-2">
            Key evidence
          </p>
          <div
            className="rounded-xl p-3.5"
            style={{
              backgroundColor: "rgba(245,242,237,0.6)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-[13px] text-maze-black/80 leading-relaxed italic">
              &ldquo;I liked the scent but &#8377;1,200 for something I haven&rsquo;t
              tried? Give me a small one first.&rdquo;
            </p>
            <p className="mt-1.5 text-[11px] text-maze-gray/50">
              — Female, 24, first-time buyer
            </p>
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div
          variants={itemVariants}
          className="px-5 pb-4 flex flex-wrap gap-1.5"
        >
          {TAGS.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full bg-lime/[0.08] text-lime/70"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* Route to */}
        <motion.div
          variants={itemVariants}
          className="px-5 pb-5 flex items-center gap-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-maze-gray/40">
            Routes to
          </span>
          <div className="flex gap-1.5">
            {["Product", "Marketing"].map((team) => (
              <span
                key={team}
                className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-maze-black/60"
              >
                {team}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
