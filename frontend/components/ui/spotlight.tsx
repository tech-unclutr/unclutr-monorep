"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
    className?: string;
    fill?: string;
}

export const Spotlight = ({ className, fill }: SpotlightProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const dx = useSpring(mouseX, springConfig);
    const dy = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { left, top } = containerRef.current.getBoundingClientRect();
            mouseX.set(e.clientX - left);
            mouseY.set(e.clientY - top);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "pointer-events-none absolute inset-0 z-0 overflow-hidden",
                className
            )}
        >
            <motion.div
                className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition duration-500"
                style={{
                    background: `radial-gradient(600px circle at ${dx}px ${dy}px, ${fill || "rgba(255,255,255,0.06)"
                        }, transparent 80%)`,
                }}
            />
        </div>
    );
};
