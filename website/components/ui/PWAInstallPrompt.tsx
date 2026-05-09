"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "squareup_pwa_install_dismissed_at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const SHOW_AFTER_MS = 8000; // wait 8s of engagement before showing

export default function PWAInstallPrompt() {
  const haptic = useHaptic();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosInstructionsVisible, setIosInstructionsVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed (running in standalone mode)?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS-specific
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Recently dismissed?
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    if (!isMobile) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setInstallEvent(ev);
      timer = setTimeout(() => setBannerVisible(true), SHOW_AFTER_MS);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari has no beforeinstallprompt — show our own instruction banner.
    if (isIOS) {
      timer = setTimeout(() => setBannerVisible(true), SHOW_AFTER_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    haptic("selection");
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setBannerVisible(false);
    setIosInstructionsVisible(false);
  };

  const handleInstall = async () => {
    haptic("medium");
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setBannerVisible(false);
      }
      setInstallEvent(null);
    } else {
      // iOS path — toggle in-app instructions
      setIosInstructionsVisible(true);
    }
  };

  if (!bannerVisible && !iosInstructionsVisible) return null;

  return (
    <AnimatePresence>
      {iosInstructionsVisible ? (
        <motion.div
          key="ios-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
          >
            <h3 className="text-base font-bold text-[#0b132b] mb-2">Add SquareUp to Home Screen</h3>
            <ol className="text-sm text-[#475569] leading-relaxed space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#FF5A36]">1.</span>
                <span>
                  Tap the <Share size={14} className="inline -mt-0.5" /> Share button in Safari
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#FF5A36]">2.</span>
                <span>Scroll and tap <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#FF5A36]">3.</span>
                <span>Tap <strong>Add</strong> in the top right</span>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="w-full rounded-xl bg-[#0b132b] text-white font-medium py-2.5 text-sm active:scale-[0.98] transition-transform"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="banner"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="fixed left-0 right-0 z-[55] flex justify-center px-4 pointer-events-none"
          style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.12)] px-3.5 py-2.5 max-w-sm w-full">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5A36] to-[#FF8B36] flex items-center justify-center shrink-0">
              <Download size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0b132b] leading-tight">Install SquareUp</p>
              <p className="text-[11px] text-[#64748b] leading-tight">Faster access from your home screen</p>
            </div>
            <button
              onClick={handleInstall}
              className="text-[12px] font-semibold text-white bg-[#FF5A36] rounded-full px-3.5 py-1.5 active:scale-95 transition-transform whitespace-nowrap"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              className="w-7 h-7 flex items-center justify-center text-[#94a3b8] active:scale-90 transition-transform"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
