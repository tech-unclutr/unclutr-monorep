"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useTransform, motion, AnimatePresence } from "framer-motion";

const COPY_LIBRARY = [
    ["Why did they churn?", "Let's find out."],
    ["Are we building the right feature?", "Let's ask them."],
    ["What do users actually want?", "We'll find out."],
    ["Stop debating in meeting rooms.", "Start listening."],
    ["Is the pricing too high?", "Let's ask your market."],
    ["Why aren't they converting?", "Let's talk to them."],
    ["What's blocking adoption?", "Let's uncover it."],
    ["Do they even need this feature?", "Let's validate it."],
    ["Why did they pick the competitor?", "Let's understand why."],
    ["Is the onboarding confusing?", "Let's hear from users."],
    ["What would make them pay more?", "Let's ask."],
    ["Why are trials dropping off?", "Let's investigate."],
    ["Are we solving the right problem?", "Let's find out."],
    ["What's their biggest frustration?", "Let's uncover it."],
    ["Would they recommend us?", "Let's hear the truth."],
    ["Is the messaging landing?", "Let's test it."],
    ["What keeps them coming back?", "Let's learn from it."],
    ["Who's our ideal customer, really?", "Let's define them."],
    ["Are we losing deals to confusion?", "Let's clarify."],
    ["What would they change first?", "Let's ask them."],
];

// Session-storage key — skip the splash entirely on repeat visits within a tab session.
const SPLASH_SHOWN_KEY = "squareup_splash_shown_v1";

export default function LoadingScreen() {
    // `done` MUST start as `false` on both server and client to avoid a
    // hydration mismatch (React error #418). The sessionStorage check that
    // used to live in the useState initializer caused server to render the
    // splash and client to render nothing, producing a hydration error that
    // surfaced as React #418 in prod. Now we initialize to `false` everywhere
    // and check sessionStorage inside the useEffect below — on repeat visits
    // the splash will flash for ~1 frame before unmounting, which is the
    // correct tradeoff vs. crashing React.
    const [done, setDone] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [showLogo, setShowLogo] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const [words, setWords] = useState<string[]>([]);
    const ranRef = useRef(false);
    const skipRef = useRef(false);

    // Pick a random copy sequence on mount to avoid hydration mismatch
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * COPY_LIBRARY.length);
        setWords(COPY_LIBRARY[randomIndex]);
    }, []);

    const overlayY = useMotionValue("0%");

    // Logo reveal animations
    const logoScale = useMotionValue(1.1);
    const logoBlur = useMotionValue(10);
    const logoOpacity = useMotionValue(0);

    const logoFilter = useTransform(logoBlur, (blur) => `blur(${blur}px)`);

    useEffect(() => {
        if (done || ranRef.current) return;

        // Repeat-visit fast-path: if we already showed the splash this session,
        // dismiss immediately. Runs in useEffect (not useState init) to keep
        // SSR and client-hydration output identical.
        try {
            if (sessionStorage.getItem(SPLASH_SHOWN_KEY) === "1") {
                setDone(true);
                return;
            }
        } catch {}

        ranRef.current = true;

        document.documentElement.style.overflow = "hidden";

        // Honor prefers-reduced-motion — these users get an instant reveal.
        const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Allow user to skip the splash with any scroll/click/key/touch input.
        const finishEarly = () => {
            skipRef.current = true;
        };
        window.addEventListener("wheel", finishEarly, { once: true, passive: true });
        window.addEventListener("touchstart", finishEarly, { once: true, passive: true });
        window.addEventListener("keydown", finishEarly, { once: true });
        window.addEventListener("pointerdown", finishEarly, { once: true });

        const wait = (ms: number) =>
            new Promise<void>((res) => {
                if (skipRef.current) return res();
                let resolved = false;
                const done = () => {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(t);
                    clearInterval(interval);
                    res();
                };
                const t = setTimeout(done, ms);
                // Resolve early if user breaks out mid-wait.
                const interval = setInterval(() => {
                    if (skipRef.current) done();
                }, 40);
            });

        const runSequence = async () => {
            // Reduce-motion users skip straight to reveal.
            if (reduceMotion) {
                document.documentElement.style.overflow = "";
                try { sessionStorage.setItem(SPLASH_SHOWN_KEY, "1"); } catch {}
                setDone(true);
                return;
            }

            // Phase 1: question (was 800ms → 350ms)
            await wait(350);

            // Phase 2: answer (was 1200ms → 600ms)
            setCurrentWordIndex(1);
            await wait(600);

            // Phase 3: hide words, show logo (was 400ms → 150ms)
            setCurrentWordIndex(-1);
            await wait(150);
            setShowLogo(true);

            // Logo reveal — concurrent animations, all shortened.
            // Previously: opacity 1.0s + blur 1.4s + scale 1.4s = 1.4s blocking.
            // Now: 0.45s blocking.
            animate(logoOpacity, 1, { duration: 0.35, ease: "easeOut" });
            animate(logoBlur, 0, { duration: 0.45, ease: "easeOut" });
            await animate(logoScale, 1, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });

            // Phase 4: subtitle (was 1200ms → 300ms)
            setShowSubtitle(true);
            await wait(300);

            // Phase 5: slide up (was 900ms → 500ms)
            await animate(overlayY, "-100%", {
                duration: 0.5,
                ease: [0.76, 0, 0.24, 1],
            });

            document.documentElement.style.overflow = "";
            try { sessionStorage.setItem(SPLASH_SHOWN_KEY, "1"); } catch {}
            setDone(true);
        };

        runSequence();

        return () => {
            document.documentElement.style.overflow = "";
            ranRef.current = false;
            window.removeEventListener("wheel", finishEarly);
            window.removeEventListener("touchstart", finishEarly);
            window.removeEventListener("keydown", finishEarly);
            window.removeEventListener("pointerdown", finishEarly);
        };
    }, [done, logoOpacity, logoBlur, logoScale, overlayY]);

    if (done) return null;

    return (
        <motion.div
            style={{ y: overlayY }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black"
        >
            <div className="relative flex items-center justify-center w-full h-full">
                {/* Typographic Sequence */}
                <AnimatePresence mode="wait">
                    {words.length > 0 && currentWordIndex >= 0 && currentWordIndex < words.length && (
                        <motion.h2
                            key={currentWordIndex}
                            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className={`absolute text-white font-display text-center tracking-tight ${currentWordIndex === 1
                                ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium" // Answer
                                : "text-xl sm:text-2xl text-white/70" // Question
                                }`}
                        >
                            {words[currentWordIndex]}
                        </motion.h2>
                    )}
                </AnimatePresence>

                {/* Logo Reveal */}
                <AnimatePresence>
                    {showLogo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute flex flex-col items-center justify-center"
                        >
                            {/* Logo */}
                            <motion.div
                                className="w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
                            >
                                <motion.div
                                    style={{
                                        opacity: logoOpacity,
                                        scale: logoScale,
                                        filter: logoFilter
                                    }}
                                    className="w-full relative origin-center"
                                >
                                    {/* Glowing backdrop for the logo */}
                                    <div className="absolute inset-0 bg-brand-orange mix-blend-screen opacity-20 blur-2xl rounded-full scale-150" />

                                    {/* The premium masked gradient logo */}
                                    <motion.div
                                        animate={{
                                            backgroundPosition: ["200% center", "-200% center"],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 4,
                                            ease: "linear"
                                        }}
                                        className="w-full aspect-[3/1] relative z-10"
                                        style={{
                                            background: "linear-gradient(110deg, #a3a3a3 0%, #ffffff 40%, #ff9f43 50%, #ffffff 60%, #a3a3a3 100%)",
                                            backgroundSize: "200% auto",
                                            WebkitMaskImage: "url(/su_wordmark_transparent.svg)",
                                            WebkitMaskSize: "contain",
                                            WebkitMaskRepeat: "no-repeat",
                                            WebkitMaskPosition: "center",
                                        }}
                                    />
                                </motion.div>
                            </motion.div>

                            {/* Subtitle: "Customer Understanding Department for Consumer Companies" */}
                            <AnimatePresence>
                                {showSubtitle && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/50 font-display tracking-widest uppercase text-center"
                                    >
                                        Your Customer Understanding Department.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
