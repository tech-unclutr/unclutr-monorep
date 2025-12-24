"use client";

import { motion } from "framer-motion";

export function MagicLoader({ text = "Loading" }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-[1px] bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-neutral-400 dark:bg-neutral-500"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
            <p className="text-[11px] text-neutral-400 font-medium tracking-wider lowercase opacity-50">
                {text}
            </p>
        </div>
    );
}
