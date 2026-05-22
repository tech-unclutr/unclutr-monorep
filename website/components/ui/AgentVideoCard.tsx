"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useVideoTracking } from "@/lib/analytics";

interface AgentVideoCardProps {
    name: string;
    videoSrc: string;
    posterSrc: string;
    description: string;
    isActive: boolean;
    isAdjacent: boolean;
    cardWidth: number;
}

export default function AgentVideoCard({
    name,
    description,
    videoSrc,
    posterSrc,
    isActive,
    isAdjacent,
    cardWidth,
}: AgentVideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useVideoTracking(videoRef, { name, sourceCarousel: "agents", cardIndex: 0 });

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            video.currentTime = 0;
            video.playbackRate = 1.3;
            const timer = setTimeout(() => {
                video.play().catch((err) => {
                    if (err.name !== "AbortError") {
                        console.warn(`Video playback failed for ${name}:`, err.message);
                    }
                });
            }, 300);
            return () => clearTimeout(timer);
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [isActive]);

    // 3D Tilt Effect
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
    const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);

    // Smoothly calculate background glare based on motion values
    const backgroundGlare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isActive) return;
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const scale = isActive ? 1 : isAdjacent ? 0.88 : 0.78;
    const brightness = isActive ? 1 : isAdjacent ? 0.6 : 0.4;
    const isMobileCard = cardWidth < 400;
    const cropAmount = Math.min(46, cardWidth * 0.055);
    const h = cardWidth * (9 / 16) - cropAmount;

    return (
        <motion.div
            ref={cardRef}
            role="group"
            aria-label={`${name} agent: ${description}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{
                scale,
                filter: `brightness(${brightness})`
            }}
            transition={{
                scale: { type: "spring", stiffness: isMobileCard ? 200 : 300, damping: isMobileCard ? 35 : 30, mass: 0.8 },
                filter: { duration: 0.5, ease: "easeInOut" }
            }}
            className="flex-shrink-0 relative cursor-pointer"
            style={{
                width: cardWidth,
                height: h,
                perspective: 1200,
                transformStyle: "preserve-3d",
                zIndex: isActive ? 10 : isAdjacent ? 5 : 1,
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    rotateX: isActive ? rotateX : 0,
                    rotateY: isActive ? rotateY : 0,
                    borderRadius: 24,
                    overflow: "hidden",
                    transformStyle: "preserve-3d",
                    boxShadow: isActive
                        ? "0 32px 80px -16px rgba(0,0,0,0.25), 0 12px 32px -8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                        : "0 12px 40px -12px rgba(0,0,0,0.1)",
                }}
            >
                {/* 3D Glare */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay"
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ background: backgroundGlare }}
                />

                {/* Info Overlay */}
                <motion.div
                    initial={false}
                    animate={{
                        opacity: isActive ? 1 : 0,
                        y: isActive ? 0 : 16,
                        scale: isActive ? 1 : 0.98
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: isActive ? 0.15 : 0 }}
                    className="absolute bottom-4 left-4 right-4 z-20 rounded-[16px] p-4 sm:p-5 flex flex-col items-start text-left pointer-events-none"
                    style={{
                        background: "linear-gradient(180deg, rgba(20,20,20,0.4) 0%, rgba(10,10,10,0.7) 100%)",
                        backdropFilter: "blur(16px) saturate(180%)",
                        WebkitBackdropFilter: "blur(16px) saturate(180%)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                        transform: "translateZ(30px)", // Push text forward in 3D
                    }}
                >
                    <h3 className="text-white font-semibold text-lg sm:text-xl tracking-tight mb-1" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{name}</h3>
                    <p className="text-white/80 text-sm sm:text-base leading-snug font-medium" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{description}</p>
                </motion.div>
                { }
                <video
                    ref={videoRef}
                    src={(isActive || isAdjacent) ? videoSrc : undefined}
                    poster={posterSrc}
                    width={cardWidth}
                    height={Math.round(cardWidth * (9 / 16))}
                    muted
                    loop
                    playsInline
                    preload={isActive ? "auto" : "metadata"}
                    className="absolute top-0 left-0 w-full object-cover"
                    style={{ height: cardWidth * (9 / 16) }}
                />

                {/* Outer sleek border */}
                <div className="absolute inset-0 rounded-[24px] pointer-events-none border border-white/10 z-30" />
            </motion.div>
        </motion.div>
    );
}
