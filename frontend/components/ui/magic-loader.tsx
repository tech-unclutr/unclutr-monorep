"use client";

import { motion } from "framer-motion";

export function MagicLoader({ text = "Discovering your business truth" }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-8">
            <div className="w-48 h-[1px] bg-white/5 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
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
