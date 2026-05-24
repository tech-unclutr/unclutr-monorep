"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Lock, UserCog, Server, ShieldCheck, Fingerprint, FolderLock } from "lucide-react";
import { useSectionVisibility } from "@/lib/analytics";
const securityCards = [
  {
    icon: Lock,
    iconColor: "text-rose-500",
    bgLight: "bg-rose-500/10",
    label: "ENCRYPTED TRANSMISSION",
    body: "All traffic, including customer data, is transported securely and encrypted via SSL.",
  },
  {
    icon: UserCog,
    iconColor: "text-emerald-500",
    bgLight: "bg-emerald-500/10",
    label: "ACCESS CONTROL",
    body: "Set up passwords for tests and assign roles to view, manage, and collaborate on studies.",
  },
  {
    icon: Server,
    iconColor: "text-amber-500",
    bgLight: "bg-amber-500/10",
    label: "DATA CENTER SECURITY",
    body: "Our platform leverages Google Cloud’s comprehensive security measures to keep your data safe and our services highly available.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-blue-500",
    bgLight: "bg-blue-500/10",
    label: "GDPR COMPLIANCE",
    body: "We protect your data according to GDPR standards and make it easy for you to be compliant too.",
  },
  {
    icon: Fingerprint,
    iconColor: "text-purple-500",
    bgLight: "bg-purple-500/10",
    label: "MULTI-FACTOR AUTH",
    body: "Add an extra layer of protection to your account with robust multi-factor authentication (MFA).",
  },
  {
    icon: FolderLock,
    iconColor: "text-orange-500",
    bgLight: "bg-orange-500/10",
    label: "PRIVATE WORKSPACES",
    body: "Enable role-based access to workspaces, which only certain members of your team can collaborate on.",
  },
];

function SecurityCard({ card, index }: { card: typeof securityCards[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);

  const backgroundGlare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
      }}
      className="relative perspective-1000 h-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-full transition-transform duration-200 ease-out"
      >
        <div className="absolute inset-0 rounded-2xl bg-white shadow-lg border border-black/5 dark:bg-neutral-800 dark:border-white/10 z-0" />

        {/* Dynamic Glare */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: backgroundGlare }}
        />

        <div className="relative z-20 p-5 sm:p-6 lg:p-8 h-full flex flex-col items-start rounded-2xl" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm ${card.bgLight}`}>
              <card.icon className={`w-4 h-4 ${card.iconColor}`} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-neutral-800 dark:text-neutral-200">
              {card.label}
            </span>
          </div>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            {card.body}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TrustSecurity() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  useSectionVisibility("trust_security", sectionRef);

  return (
    <section
      ref={sectionRef}
      data-section-name="grid-card"
      className="relative overflow-hidden bg-gradient-to-b from-[#FBF4EC] via-[#F6F2ED] to-[#FBF4EC] dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900"
    >
      {/* Magical glowing background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#1E40AF] via-[#3B82F6] to-transparent rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 pt-20 sm:pt-28 lg:pt-36 pb-24">
        {/* V4 2-column header + SOC 2 callout (Phase 3 / Change 3.1, doc §7.3).
            Cream bg preserved per live design language; original blue-gradient
            accent kept (no swap to V4 lavender). The SOC 2 phrasing reflects
            the doc's default — Param to confirm actual audit status before
            production push (change "in progress" → "scheduled" / "on the
            roadmap" if not yet started). */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-8 mb-12 text-left"
        >
          <div className="flex-1 max-w-[640px]">
            <h2 className="font-display text-[clamp(32px,4.2vw,52px)] tracking-[-0.03em] text-neutral-900 dark:text-white leading-[1.1] mb-3">
              Trust and security{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">at every level.</span>
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#475569] leading-[1.6] max-w-[560px]">
              <strong className="text-[#0b132b] font-semibold">SOC 2 Type II audit in progress.</strong>{" "}
              GDPR-compliant. Built on enterprise-grade cloud infrastructure with
              end-to-end encryption.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-[13px] text-[#FF5A36] font-semibold whitespace-nowrap hover:underline shrink-0 md:mt-2"
          >
            View full security details <span aria-hidden>→</span>
          </a>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.1, delayChildren: 0.3 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {securityCards.map((card, i) => (
            <SecurityCard key={i} card={card} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
