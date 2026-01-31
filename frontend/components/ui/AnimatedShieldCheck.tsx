"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedShieldCheckProps {
    className?: string;
    color?: string;
}

export function AnimatedShieldCheck({ className, color = "currentColor" }: AnimatedShieldCheckProps) {
    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full z-10 drop-shadow-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0
                }}
            >
                {/* Shield outline */}
                <motion.path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: 0.05
                    }}
                />
                {/* Checkmark */}
                <motion.path
                    d="M9 12l2 2 4-4"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0, scale: 0.5 }}
                    animate={{ pathLength: 1, opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.2,
                        type: "spring",
                        bounce: 0.4,
                        delay: 0.2
                    }}
                />
            </motion.svg>

            {/* Stronger Glow / Pulse effect */}
            <motion.div
                className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                    opacity: [0, 0.5, 0],
                    scale: [0.8, 1.4, 1.4]
                }}
                transition={{
                    duration: 1.5,
                    times: [0, 0.4, 1],
                    repeat: Infinity,
                    repeatDelay: 0.5
                }}
            />
        </div>
    );
}
