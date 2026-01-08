"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface EmptyDashboardStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    image?: string;
    lightImage?: string;
}

export function EmptyDashboardState({
    title,
    description,
    actionLabel = "Connect Integrations",
    actionHref = "/dashboard-new/integrations",
    image,
    lightImage
}: EmptyDashboardStateProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentImage = (mounted && resolvedTheme === 'light' && lightImage) ? lightImage : image;

    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="relative mb-6">
                {/* Background Glows - subtle and centered */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#FF8A4C]/10 dark:bg-[#FF8A4C]/10 blur-[80px] rounded-full" />

                {/* Visual Container */}
                <div className="relative z-10 w-44 h-44 md:w-56 md:h-56 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {currentImage ? (
                            <motion.div
                                key={currentImage}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="relative w-full h-full group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E]/20 dark:from-black/40 to-transparent opacity-40 rounded-full" />
                                <img
                                    src={currentImage}
                                    alt="Visual"
                                    className="w-full h-full object-contain rounded-full shadow-[0_0_40px_rgba(255,138,76,0.1)] group-hover:scale-105 transition-transform duration-700"
                                />
                            </motion.div>
                        ) : (
                            <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                <div className="w-10 h-10 bg-[#FF8A4C]/20 rounded-full animate-pulse" />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-sm"
            >
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight mb-2 font-display">
                    {title}
                </h2>
                <p className="text-gray-500 dark:text-[#A1A1AA] text-xs md:text-sm mb-8 leading-relaxed px-6">
                    {description}
                </p>
                <Link href={actionHref}>
                    <Button
                        className="bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white px-5 py-1.5 h-9 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(255,138,76,0.15)] hover:shadow-[0_0_20px_rgba(255,138,76,0.25)] transition-all group"
                    >
                        {actionLabel}
                        <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
