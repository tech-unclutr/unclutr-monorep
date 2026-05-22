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

export default function LoadingScreen() {
    const [done, setDone] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [showLogo, setShowLogo] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const [words, setWords] = useState<string[]>([]);
    const ranRef = useRef(false);

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
        if (ranRef.current) return;
        ranRef.current = true;

        document.documentElement.style.overflow = "hidden";

        const runSequence = async () => {
            // Show question
            await new Promise((res) => setTimeout(res, 800));

            // Show answer ("Let's find out.")
            setCurrentWordIndex(1);
            await new Promise((res) => setTimeout(res, 1200));

            // Hide words and show logo
            setCurrentWordIndex(-1);
            await new Promise((res) => setTimeout(res, 400));
            setShowLogo(true);

            // Animate Logo Reveal (Classy Apple-style)
            animate(logoOpacity, 1, { duration: 1.0, ease: "easeOut" });
            animate(logoBlur, 0, { duration: 1.4, ease: "easeOut" });
            await animate(logoScale, 1, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });

            // Show subtitle below logo
            setShowSubtitle(true);
            await new Promise((res) => setTimeout(res, 1200));

            // Slide up the background to reveal the site
            await animate(overlayY, "-100%", {
                duration: 0.9,
                ease: [0.76, 0, 0.24, 1],
            });

            document.documentElement.style.overflow = "";
            setDone(true);
        };

        runSequence();

        return () => {
            document.documentElement.style.overflow = "";
            ranRef.current = false;
        };
    }, [logoOpacity, logoBlur, logoScale, overlayY]);

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
