"use client";

import { motion } from "framer-motion";

export function MagicLoader({ text = "Authenticating..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative group">
                {/* Glow Effect */}
                <motion.div
                    className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Custom Branded "U" Animation */}
                <motion.div
                    className="h-16 w-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-white font-bold text-2xl relative z-10 shadow-2xl"
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{
                        rotate: [0, -10, 0, 10, 0],
                        scale: [1, 0.95, 1.05, 0.95, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <motion.span
                        animate={{
                            opacity: [1, 0.5, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        U
                    </motion.span>
                </motion.div>
            </div>

            <motion.p
                className="text-sm text-neutral-500 font-medium tracking-tight"
                animate={{
                    opacity: [0.4, 1, 0.4],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {text}
            </motion.p>
        </div>
    );
}
