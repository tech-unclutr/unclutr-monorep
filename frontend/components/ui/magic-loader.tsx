"use client";

import { motion } from "framer-motion";

export function MagicLoader({ text = "Discovering your business truth" }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <motion.div
                className="w-16 relative"
                animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.95, 1.05, 0.95]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <img src="/brand/icon.svg" alt="Loading..." className="w-full h-auto object-contain" />
            </motion.div>
            <div className="w-48 h-[1px] bg-white/5 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-orange-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
            <p className="text-xs text-white/40 font-light tracking-[0.2em] uppercase">
                {text}
            </p>
        </div>
    );
}
