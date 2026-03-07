"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function LogoNotch() {
  const { scrollY } = useScroll();
  const [isHero, setIsHero] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Hide when study modal is open
    const observer = new MutationObserver(() => {
      setHidden(document.documentElement.hasAttribute("data-study-modal"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-study-modal"] });

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (typeof window !== "undefined") {
      // Transition out of hero centering after a bit of scroll
      // but keep the white logo until the background switch (3.3vh)
      const triggerPoint = window.innerHeight * 0.2;
      setIsHero(latest < triggerPoint);
    }
  });

  // Track dark section positions for logo switching
  const darkSectionsRef = useRef<Array<{ top: number; bottom: number }>>([]);

  useEffect(() => {
    const updateDarkSections = () => {
      const selectors = ['[data-section-name="cta"]', '[data-section-name="footer"]'];
      darkSectionsRef.current = selectors
        .map((sel) => document.querySelector(sel))
        .filter(Boolean)
        .map((el) => {
          const rect = el!.getBoundingClientRect();
          return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
        });
    };

    // Measure after layout settles
    const timer = setTimeout(updateDarkSections, 1000);
    window.addEventListener("resize", updateDarkSections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateDarkSections);
    };
  }, []);

  // White vs colored logo: white in hero zone OR when over dark sections
  const [useWhiteLogo, setUseWhiteLogo] = useState(true);
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (typeof window === "undefined") return;
    const bgSwitchPoint = window.innerHeight * 2.5;
    const inHeroZone = latest < bgSwitchPoint;
    const inDarkSection = darkSectionsRef.current.some(
      (s) => latest + 60 >= s.top && latest + 60 <= s.bottom
    );
    setUseWhiteLogo(inHeroZone || inDarkSection);
  });

  // Calculate positions in pixels for smooth interpolation
  const heroWidth = 320;
  const scrolledWidth = 200;
  const heroLeft = windowWidth / 2 - heroWidth / 2; // Centered
  const scrolledLeft = windowWidth - 40 - scrolledWidth; // 40px from right edge

  // Hide when study modal is open
  if (hidden) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        left: isHero ? heroLeft : scrolledLeft,
        top: isHero ? "12vh" : "24px",
        filter: useWhiteLogo
          ? "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
          : "drop-shadow(0 1px 3px rgba(0,0,0,0.15))",
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-50 pointer-events-auto"
    >
      <motion.a
        href="/"
        aria-label="Square Up"
        className="block relative hover:opacity-80 cursor-pointer"
        animate={{
          width: isHero ? heroWidth : scrolledWidth,
          height: isHero ? 64 : 40,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <>
          <motion.img
            initial={false}
            animate={{ opacity: useWhiteLogo ? 1 : 0 }}
            transition={{ duration: 0 }}
            src="/su_d_wordmark_transparent.svg"
            alt="Square Up"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <motion.img
            initial={false}
            animate={{ opacity: useWhiteLogo ? 0 : 1 }}
            transition={{ duration: 0 }}
            src="/su_wordmark_transparent.svg"
            alt="Square Up"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </>
      </motion.a>
    </motion.div>
  );
}
