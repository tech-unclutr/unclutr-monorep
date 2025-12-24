"use client";

import { motion } from "framer-motion";

export function MagicLoader({ text = "Clearing the noise..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-12">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Ambient Glow */}
                <motion.div
                    className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full"
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Abstract Organic Lines */}
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="30"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-primary/30"
                        animate={{
                            r: [30, 35, 30],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.path
                        d="M30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70C38.9543 70 30 61.0457 30 50Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-primary/60"
                        animate={{
                            d: [
                                "M30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70C38.9543 70 30 61.0457 30 50Z",
                                "M25 50C25 35 35 25 50 25C65 25 75 35 75 50C75 65 65 75 50 75C35 75 25 65 25 50Z",
                                "M30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70C38.9543 70 30 61.0457 30 50Z"
                            ]
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.path
                        d="M50 20V30M50 70V80M20 50H30M70 50H80"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        className="text-primary/40"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.1, 0.8],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />
                </svg>
            </div>

            <motion.p
                className="text-[13px] text-neutral-400 font-light tracking-[0.2em] uppercase"
                animate={{
                    opacity: [0.3, 0.7, 0.3],
                    letterSpacing: ["0.2em", "0.25em", "0.2em"]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {text}
            </motion.p>
        </div>
    );
}
