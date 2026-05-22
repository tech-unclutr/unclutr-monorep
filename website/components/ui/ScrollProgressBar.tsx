"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function ScrollProgressBar() {
  const [visible, setVisible] = useState(false);
  const [idle, setIdle] = useState(false);
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  const scaleX = useTransform(smoothProgress, [0, 1], [0, 1]);

  // Show only after scrolling past the hero
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setVisible(window.scrollY > heroHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Idle dimming — fade to 0.3 after 2s of no scroll
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      setIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIdle(true), 2000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 hidden md:block pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? (idle ? 0.3 : 1) : 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div
        className="h-[2px] origin-left"
        style={{
          scaleX,
          background: "linear-gradient(90deg, #FF9F43, #FF6B00)",
          boxShadow: "0 0 8px rgba(255, 107, 0, 0.3), 0 0 2px rgba(255, 107, 0, 0.2)",
        }}
      />
    </motion.div>
  );
}
