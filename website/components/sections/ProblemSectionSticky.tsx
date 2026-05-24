"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useSpring, useInView } from "framer-motion";
import { useScrollSnap } from "@/lib/hooks/useScrollSnap";
import { useIsMobile } from "@/components/ui/useIsMobile";

const FLAWS = [
    {
        title: "Zero Interview Visibility",
        // V4 canonical copy — see squareup_homepage_migration.md §5.5. Phase 1 / Change 1.3.
        desc: "You get a sanitized PDF. You never see the raw interview. You don't know if leading questions were asked or if the respondent was even qualified. You're just told to trust it.",
        accent: "from-[#1d1d1f] to-[#424245]", // Dark / Graphite
        shadowGlow: "shadow-[0_0_100px_rgba(29,29,31,0.06)]",
        iconColor: "#1d1d1f"
    },
    {
        title: "Starting From Scratch",
        desc: "Every new PM or marketer starts from zero. Hundreds of past conversations are ignored because the data is unsearchable. You keep paying for the same answers.",
        accent: "from-[#FF5A36] to-[#FF8B36]", // Orange
        shadowGlow: "shadow-[0_0_100px_rgba(255,90,54,0.08)]",
        iconColor: "#FF5A36"
    },
    {
        title: "Trapped Insights",
        desc: "Your growth team uncovers a massive UX flaw. Product never sees it. The insight dies in a Figma file. Customer knowledge never compounds across your business.",
        accent: "from-[#6366F1] to-[#8B5CF6]", // Indigo / Purple
        shadowGlow: "shadow-[0_0_100px_rgba(99,102,241,0.08)]",
        iconColor: "#6366F1"
    },
    {
        title: "Filtered Findings",
        desc: "You hear a researcher's interpretation, not the customer. Human bias, fatigue, and varying skill levels mean every insight is heavily distorted before it reaches your desk.",
        accent: "from-[#F43F5E] to-[#FB7185]", // Rose
        shadowGlow: "shadow-[0_0_100px_rgba(244,63,94,0.08)]",
        iconColor: "#F43F5E"
    }
];

// --- 15/10 Interactive Metaphor Components ---

// 1. Black Box (Zero Visibility) - Magically responsive obsidian glass block
function BlackBoxMetaphor({ mousePos }: { mousePos: { x: number, y: number } }) {
    return (
        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center pointer-events-none group">
            {/* Ambient Shadow cast on the "floor" beneath the box */}
            <div 
                className="absolute w-44 h-8 bg-black/40 blur-[40px] rounded-full scale-y-[0.3] transition-transform duration-700"
                style={{ 
                    transform: `translateY(140px) scale(${1 + (mousePos.y - 0.5) * 0.1})`,
                    opacity: 0.6 + (mousePos.y - 0.5) * 0.2
                }}
            />

            <motion.div 
                className="relative w-56 h-56 rounded-[44px] transition-transform duration-700 select-none"
                style={{ 
                    transform: `perspective(1200px) rotateX(${(mousePos.y - 0.5) * -18}deg) rotateY(${(mousePos.x - 0.5) * 18}deg)`,
                    transformStyle: "preserve-3d"
                 }}
            >
                {/* --- The Glass Block (Obsidian) --- */}
                <div className="absolute inset-0 rounded-[44px] bg-gradient-to-br from-[#1d1d1f] via-[#0a0a0c] to-black border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6),inset_0_2px_20px_rgba(255,255,255,0.1)] overflow-hidden">
                    
                    {/* Interior Depth (The Core) */}
                    <div className="absolute inset-1.5 rounded-[38px] bg-black/95 border border-white/5 overflow-hidden flex items-center justify-center">
                        
                        {/* Hidden "Interview Data" (The Trapped Insights) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-[8px] scale-110" style={{ transform: "translateZ(-40px)" }}>
                            <motion.div 
                                className="w-32 h-32 bg-white/20 rounded-full"
                                animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>

                        {/* Breathing Core Energy Glimmer */}
                        <motion.div 
                            className="w-52 h-52 bg-white/5 blur-3xl rounded-full absolute"
                            animate={{ opacity: [0.05, 0.15, 0.05], scale: [0.8, 1.3, 0.8] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Enhanced Lock Icon - Floats with separate physical layer */}
                        <div className="relative z-10 flex flex-col items-center gap-5 transition-transform duration-500" style={{ transform: "translateZ(30px)" }}>
                            <div className="relative">
                                <svg className="w-14 h-14 text-white/40 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <rect x="5" y="11" width="14" height="10" rx="3.5" fill="currentColor" fillOpacity="0.08" />
                                    <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                                    <circle cx="12" cy="16" r="1" fill="currentColor" fillOpacity="0.4" />
                                </svg>
                                {/* Hardware glint on the lock */}
                                <motion.div 
                                    className="absolute top-1/2 left-0 w-full h-px bg-white/40 blur-[1px]"
                                    animate={{ top: ["20%", "80%", "20%"] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </div>
                            <span className="text-[9px] font-bold tracking-[0.4em] text-white/15 uppercase select-none">Encrypted Core</span>
                        </div>
                    </div>

                    {/* Dynamic Fresnel / Specular Glare */}
                    <div 
                        className="absolute inset-0 rounded-[44px] opacity-40 pointer-events-none transition-opacity duration-500"
                        style={{
                            background: `radial-gradient(circle 220px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.22), transparent)`
                        }}
                    />

                    {/* Edge Lustre (Apple rim light) */}
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
            </motion.div>
        </div>
    );
}

// 2. Starting From Scratch (Amnesia) - 15/10 Network Collapse
function AmnesiaMetaphor() {
    return (
        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-visible group">
            <div className="relative w-56 h-56 flex items-center justify-center">
                {/* The single surviving core node */}
                <div className="absolute w-4 h-4 bg-gradient-to-br from-[#FF8B36] to-[#FF5A36] rounded-full shadow-[0_0_20px_#FF5A36] z-20" />
                <motion.div 
                    className="absolute w-12 h-12 bg-[#FF5A36]/20 rounded-full blur-[8px] z-10"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
                />

                {/* Building and collapsing network */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute flex items-center justify-center"
                        style={{ width: `${(i+2)*30}px`, height: `${(i+2)*30}px`, border: `1px solid rgba(255, 90, 54, 0.15)`, borderRadius: "50%" }}
                        animate={{ 
                            rotate: 360,
                            scale: [1, 1.1, 1],
                            opacity: [0, 0.6, 0] // Build up then wipe out
                        }}
                        transition={{
                            rotate: { duration: 15 + i*3, repeat: Infinity, ease: "linear" },
                            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                            opacity: { duration: 5, repeat: Infinity, ease: "easeInOut", times: [0, 0.8, 1] }
                        }}
                    >
                        {/* Data Nodes on the rings */}
                        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-[#FF5A36]/80 rounded-full blur-[0.5px] -translate-x-1/2 -translate-y-1/2" />
                        {(i % 2 === 0) && (
                            <div className="absolute bottom-1/4 right-0 w-2 h-2 bg-gradient-to-tr from-[#FF5A36] to-white rounded-full blur-[0.5px] translate-x-1/2" />
                        )}
                        
                        {/* Connecting lines that fade in and snap */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                            <line x1="50%" y1="0" x2="50%" y2="50%" stroke="#FF5A36" strokeWidth="0.5" strokeDasharray="3 3" />
                        </svg>
                    </motion.div>
                ))}
                
                {/* 15/10 Pulse Wave that causes the amnesia destruction */}
                <motion.div
                    className="absolute w-full h-full rounded-full border border-white/80"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5], opacity: [0, 1, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeOut", times: [0, 0.1, 1] }}
                />
            </div>
            {/* Ambient Background Glow */}
            <div className="absolute w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[300px] lg:h-[300px] bg-[#FF5A36]/5 blur-[40px] sm:blur-[50px] lg:blur-[60px] rounded-full pointer-events-none -z-10" />
        </div>
    );
}

// 3. Trapped Insights (Silos) - 15/10 Frosted Containment Sphere
function SiloMetaphor() {
    return (
        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
            {/* Massive Thick Frosted Glass Sphere */}
            <div className="relative w-64 h-64 rounded-full border border-white/60 bg-white/20 backdrop-blur-3xl shadow-[0_40px_80px_rgba(99,102,241,0.2),inset_0_4px_30px_rgba(255,255,255,0.9),inset_0_-10px_40px_rgba(99,102,241,0.15)] flex items-center justify-center overflow-hidden">
                
                {/* 3D Specular Highlight on Glass */}
                <div className="absolute top-[8%] left-[12%] w-24 h-12 bg-white/80 rounded-[100%] blur-[8px] rotate-[-30deg] mix-blend-overlay" />
                <div className="absolute bottom-[10%] right-[10%] w-32 h-16 bg-[#6366F1]/20 rounded-[100%] blur-[12px] rotate-[-30deg]" />

                {/* Highly Energetic Trapped Light (The Insight) */}
                <motion.div 
                    className="absolute w-8 h-8 rounded-full z-10"
                    style={{
                        background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #a78bfa 40%, #6366F1 100%)',
                        boxShadow: '0 0 40px 15px rgba(139, 92, 246, 0.8)'
                    }}
                    animate={{
                        x: [0, 60, -50, 40, -60, 0],
                        y: [0, -50, 60, 50, -40, 0],
                        scale: [1, 1.4, 0.8, 1.2, 0.7, 1]
                    }}
                    transition={{ duration: 4, ease: "anticipate", repeat: Infinity }}
                />

                {/* Secondary Fragment bouncing chaotically */}
                <motion.div 
                    className="absolute w-3 h-3 rounded-full z-10"
                    style={{
                        background: '#ffffff',
                        boxShadow: '0 0 15px 5px rgba(255, 255, 255, 0.9)'
                    }}
                    animate={{
                        x: [30, -40, 50, -30, 40, 30],
                        y: [-30, 40, -20, -50, 30, -30]
                    }}
                    transition={{ duration: 2.7, ease: "anticipate", repeat: Infinity }}
                />

                {/* Containment Grid lines (Subtle depth inside glass) */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
            </div>
            
            {/* Ambient Aura proving energy is radiating but contained */}
            <div className="absolute w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[450px] lg:h-[450px] bg-[#6366F1]/10 blur-[55px] sm:blur-[70px] lg:blur-[80px] -z-10 rounded-full" />
        </div>
    );
}

// 4. Filtered Findings (Hallucination) - 15/10 Lens of Distortion
function HallucinationMetaphor({ mousePos }: { mousePos: { x: number, y: number } }) {
    // Smoothed positional mapping for the floating lens
    const lensX = (mousePos.x - 0.5) * 80;
    const lensY = (mousePos.y - 0.5) * 60;
    
    return (
        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-visible pointer-events-none">
            {/* Absolute crisp data structure underneath (The raw truth) */}
            <div className="absolute inset-0 flex flex-col justify-center gap-3 px-10 sm:px-14 lg:px-16 opacity-40 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-full flex gap-3">
                        <div className={`h-1.5 rounded-full bg-[#1d1d1f] ${i % 2 === 0 ? 'w-[62%]' : 'w-[48%]'}`} />
                        <div className={`h-1.5 rounded-full bg-[#1d1d1f] ${i % 3 === 0 ? 'w-[22%]' : 'w-[14%]'}`} />
                    </div>
                ))}
            </div>

            {/* The Lens (The Filter / Researcher) */}
            <motion.div 
                className="absolute z-10 w-48 h-48 rounded-full border border-[rgba(255,255,255,0.7)] shadow-[0_20px_50px_rgba(244,63,94,0.15),inset_0_4px_20px_rgba(255,255,255,0.9)] overflow-hidden"
                style={{ backdropFilter: "blur(4px) contrast(150%) saturate(150%)", background: "rgba(255,255,255,0.1)" }}
                animate={{
                    x: [lensX - 20, lensX + 20, lensX - 20],
                    y: [lensY - 10, lensY + 10, lensY - 10],
                    rotateZ: [-5, 5, -5]
                }}
                transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
            >
                {/* Internal colored highlight causing the "distortion" in color/meaning */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#F43F5E]/20 to-[#FB7185]/20 mix-blend-color-burn" />
                
                {/* Glare on the lens */}
                <div className="absolute top-[10%] left-[10%] w-[80%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-full opacity-60 pointer-events-none" />

                {/* Apply distortion to whatever is seen through the glass via pseudo-masking the contents, 
                    since standard CSS filters on backdrop are limited, we use a wavy internal mesh mapping */}
                <div className="w-[150%] h-[150%] absolute top-[-25%] left-[-25%] opacity-30" style={{ backgroundImage: "repeating-radial-gradient(circle at 0 0, transparent 0, #F43F5E 1px, transparent 1px, transparent 100%)", backgroundSize: "14px 14px" }} />
            </motion.div>
            
            <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] lg:w-[400px] lg:h-[400px] bg-[#F43F5E]/10 blur-[50px] sm:blur-[65px] lg:blur-[80px] -z-10 rounded-full" />
        </div>
    );
}

// 5. Particle Highlight for the headline - matches hero aesthetic
function ParticleHighlight({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-block group px-1">
            {/* The "Dotted" Text Layer (composed of fine particles) */}
            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-[#FF5A36] to-[#F43F5E] 
                           [mask-image:radial-gradient(circle,black_0.7px,transparent_0.7px)] [mask-size:4px_4px]">
                {children}
            </span>
            
            {/* Readable Shadow Layer (very faint to maintain "dotted" feel but provide legibility) */}
            <span className="absolute inset-0 z-0 bg-clip-text text-transparent bg-gradient-to-r from-[#FF5A36]/30 to-[#F43F5E]/30 pointer-events-none blur-[0.5px]">
                {children}
            </span>
            
            {/* Floating Micro-Particles (matching hero aesthetics) */}
            <span className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.span
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-[#FF5A36] blur-[0.4px]"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                            opacity: [0, 0.7, 0],
                            scale: [0, 1.5, 0],
                            x: [0, (Math.random() - 0.5) * 80],
                            y: [0, (Math.random() - 0.5) * 80],
                        }}
                        transition={{ 
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 8,
                            ease: "easeInOut"
                        }}
                        style={{ 
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </span>
        </span>
    );
}

// --- Main Section ---

export default function ProblemSectionSticky() {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const isTextInView = useInView(textRef, { once: true, margin: "-10%" });
    // 1024 (not 768) — iPads fall in 768-1024 and were getting the desktop snap
    // threshold + tight fade window, making the header unreadable on tablet too.
    const isMobile = useIsMobile(1024);

    // ─── Particle Impact Glow on Top Border ───
    const topGlowRef = useRef<HTMLDivElement>(null);
    const glowIntensity = useRef(0);
    useEffect(() => {
        let rafId: number;
        const onParticleHit = () => {
            glowIntensity.current = 1.0;
        };
        window.addEventListener('hero-particle-exit', onParticleHit);

        const decay = () => {
            if (topGlowRef.current) {
                glowIntensity.current = Math.max(0, glowIntensity.current - 0.025);
                topGlowRef.current.style.opacity = glowIntensity.current.toString();
            }
            rafId = requestAnimationFrame(decay);
        };
        rafId = requestAnimationFrame(decay);

        return () => {
            window.removeEventListener('hero-particle-exit', onParticleHit);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Track mouse for 15/10 Parallax interactions
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    
    useEffect(() => {
        let rafId: number;
        let targetX = 0.5, targetY = 0.5;
        let currentX = 0.5, currentY = 0.5;

        const handleMouseMove = (e: MouseEvent) => {
            targetX = e.clientX / window.innerWidth;
            targetY = e.clientY / window.innerHeight;
        };
        const smoothParallax = () => {
            currentX += (targetX - currentX) * 0.05;
            currentY += (targetY - currentY) * 0.05;
            setMousePos({ x: currentX, y: currentY });
            rafId = requestAnimationFrame(smoothParallax);
        };
        window.addEventListener("mousemove", handleMouseMove);
        rafId = requestAnimationFrame(smoothParallax);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Scroll Physics
    const { scrollYProgress: rawScrollProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });
    
    // Add spring physics for Apple-level smoothness
    const scrollYProgress = useSpring(rawScrollProgress, {
        stiffness: 100,
        damping: 30,
        mass: 0.5
    });

    // ─── Phase 0: Auto-Snap to Complete Transitions ───
    // Mobile: tighter threshold so the snap doesn't yank the user past the header
    // before they can read it. Desktop keeps the original "magnetic" feel.
    useScrollSnap(rawScrollProgress, containerRef, [0, 0.16, 0.38, 0.60, 0.82, 1.0], {
        threshold: isMobile ? 0.05 : 0.12,
        delay: isMobile ? 700 : 450,
        duration: 1.2,
    });

    // ─── Phase 1: Header ───
    // Mobile: header lingers visible until 0.14 (overlaps card-1 entry at 0.08-0.16),
    // so users have time to read it. Desktop fades fast (0 → 0.1) for the cinematic feel.
    const fadeStart = isMobile ? 0.04 : 0;
    const fadeEnd = isMobile ? 0.14 : 0.1;
    const headerOpacity = useTransform(scrollYProgress, [fadeStart, fadeEnd], [1, 0]);
    const headerScale = useTransform(scrollYProgress, [fadeStart, fadeEnd], [1, 0.95]);
    const headerY = useTransform(scrollYProgress, [fadeStart, fadeEnd], ["0vh", "-10vh"]);
    const headerBlurNum = useTransform(scrollYProgress, [fadeStart, fadeEnd], [0, 20]);
    const headerFilter = useMotionTemplate`blur(${headerBlurNum}px)`;

    return (
        <section 
            ref={containerRef} 
            className="relative bg-[#FBF4EC] font-sans selection:bg-[#1d1d1f]/10 h-[250vh] md:h-[400vh]"
        >
            {/* ─── Particle Impact Glow (top border) ─── */}
            <div
                ref={topGlowRef}
                className="absolute top-0 left-0 w-full pointer-events-none z-[50]"
                style={{ opacity: 0 }}
            >
                <div className="w-full h-[1px] bg-[#FF6B00]/50" />
                <div className="w-full h-20 bg-gradient-to-b from-[rgba(255,107,0,0.18)] to-transparent blur-[10px]" />
            </div>

            {/* Ambient Background Texture / Lighting */}
            <div className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply opacity-30">
                <div
                    className="absolute inset-0 opacity-20 brightness-100 contrast-150"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                    }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-[#FF5A36]/5 to-[#6366F1]/5 blur-[120px]" />
            </div>

            <div className="sticky top-0 left-0 w-full h-screen flex flex-col items-center justify-center overflow-x-clip px-6">
                
                {/* ─── Hero Text Group ─── */}
                <motion.div 
                    ref={textRef}
                    className="absolute inset-0 flex flex-col items-center justify-center md:justify-start md:pt-[22vh] text-center z-10 pointer-events-none px-4"
                    style={{ y: headerY, opacity: headerOpacity, scale: headerScale, filter: headerFilter }}
                >
                    <motion.p 
                        className="font-semibold tracking-[0.2em] text-[#FF5A36] text-[13px] uppercase mb-5 drop-shadow-sm"
                        initial={{ opacity: 0, y: 15 }}
                        animate={isTextInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        The Broken Status Quo
                    </motion.p>
                    
                    <motion.h2
                        className="font-display text-[clamp(22px,5.5vw,72px)] font-bold text-[#1d1d1f] tracking-tight leading-[1.15] sm:leading-[1.05] max-w-[1100px] mx-auto drop-shadow-sm px-2"
                        initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
                        animate={isTextInView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        {/* Forced 4-line layout: text-balance was wrapping every word at desktop widths. */}
                        {/* V4 copy — see squareup_homepage_migration.md §5.5. Phase 1 / Change 1.3. */}
                        <span className="block"><ParticleHighlight>Customer insights</ParticleHighlight> should</span>
                        <span className="block">drive your decisions.</span>
                        <span className="text-[#86868b] font-medium tracking-tight block opacity-90 mt-2 sm:mt-3">
                            Instead, the way you get them
                        </span>
                        <span className="text-[#86868b] font-medium tracking-tight block opacity-90">
                            is built on 4 fundamental flaws.
                        </span>
                    </motion.h2>
                </motion.div>

                {/* ─── Card Stack (Starts appearing after 0.15) ─── */}
                <div className="relative w-full max-w-[1100px] h-[78vh] sm:h-[72vh] md:h-[70vh] lg:h-[68vh] xl:h-[65vh] flex items-center justify-center pointer-events-none z-20 mt-[2vh] sm:mt-[5vh]">
                    {FLAWS.map((flaw, index) => {
                        // Math for choreography — cards start immediately after header fades
                        const start = 0.08 + (index * 0.22);
                        const fullyVisible = start + 0.08;
                        const nextCardEnters = start + 0.22; // when THIS card should start to recede
                        
                        // Y transform: Fly in from 100vh -> 0vh -> hold -> push up slightly to -5vh
                        const y = useTransform(
                            scrollYProgress,
                            [start - 0.05, fullyVisible, nextCardEnters, nextCardEnters + 0.1],
                            ["100vh", "0vh", "0vh", "-6vh"]
                        );
                        
                        const opacity = useTransform(
                            scrollYProgress,
                            [start - 0.05, fullyVisible],
                            [0, 1]
                        );

                        // Card tilts away when the next card comes (the stack effect)
                        const scale = useTransform(
                            scrollYProgress,
                            [nextCardEnters, nextCardEnters + 0.1],
                            [1, 0.9]
                        );

                        const rotateXNum = useTransform(
                            scrollYProgress,
                            [nextCardEnters, nextCardEnters + 0.1],
                            [0, 10]
                        );
                        
                        // Content opacity: fade out the text/images of cards that are pushed back
                        const contentOpacity = useTransform(
                            scrollYProgress,
                            [nextCardEnters, nextCardEnters + 0.1],
                            [1, 0]
                        );

                        // Dynamic rotation for mouse parallax (only active when this card is the top card)
                        const mouseRotateX = (mousePos.y - 0.5) * -6;
                        const mouseRotateY = (mousePos.x - 0.5) * 6;
                        
                        // Combine scroll rotateX with mouse rotateX
                        const combinedRotateX = useTransform(rotateXNum, val => val + mouseRotateX);

                        return (
                            <motion.div
                                key={index}
                                className={`absolute inset-0 flex flex-col md:flex-row rounded-[28px] sm:rounded-[40px] md:rounded-[48px] overflow-hidden
                                           bg-white/40 backdrop-blur-[60px]
                                           border border-white/60 shadow-[0_40px_100px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.02),inset_0_2px_10px_rgba(255,255,255,0.4)]
                                           pointer-events-auto ${flaw.shadowGlow}`}
                                style={{
                                    y,
                                    opacity,
                                    scale,
                                    rotateX: combinedRotateX,
                                    rotateY: mouseRotateY,
                                    zIndex: 10 + index,
                                    transformStyle: "preserve-3d"
                                }}
                            >
                                {/* Left Side: Copy */}
                                <motion.div className="flex-[1.4] md:flex-[1.5] lg:flex-[1.4] p-6 sm:p-8 md:p-10 lg:p-12 xl:p-20 flex flex-col justify-center relative translate-z-[30px]" style={{ transform: "translateZ(40px)", opacity: contentOpacity }}>

                                    {/* Number Watermark (Apple style precise typography) */}
                                    <div className="font-display text-[120px] sm:text-[150px] md:text-[170px] lg:text-[180px] xl:text-[220px] font-black absolute top-[-30px] sm:top-[-40px] md:top-[-45px] lg:top-[-50px] xl:top-[-60px] left-[0px] pointer-events-none select-none tracking-tighter opacity-5" style={{ color: flaw.iconColor, mixBlendMode: 'multiply' }}>
                                        0{index + 1}
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className={`text-2xl sm:text-[28px] md:text-[32px] lg:text-[38px] xl:text-5xl font-black tracking-tight mb-3 sm:mb-4 lg:mb-5 xl:mb-6 text-transparent bg-clip-text bg-gradient-to-r ${flaw.accent} leading-[1.05]`}>
                                            {flaw.title}
                                        </h3>
                                        <p className="text-[15px] sm:text-[16px] md:text-[16px] lg:text-[18px] xl:text-[22px] font-medium text-[#1d1d1f]/80 leading-[1.5] sm:leading-[1.55] xl:leading-[1.6] text-balance">
                                            {flaw.desc}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Right Side: Visual Metaphor */}
                                <motion.div className="flex-1 md:flex-[0.8] lg:flex-[0.85] relative border-t md:border-t-0 md:border-l border-black/[0.04] bg-gradient-to-br from-black/[0.01] to-transparent flex items-center justify-center p-4 sm:p-6 lg:p-8 translate-z-[20px]" style={{ transform: "translateZ(20px)", opacity: contentOpacity }}>
                                    {index === 0 && <BlackBoxMetaphor mousePos={mousePos} />}
                                    {index === 1 && <AmnesiaMetaphor />}
                                    {index === 2 && <SiloMetaphor />}
                                    {index === 3 && <HallucinationMetaphor mousePos={mousePos} />}
                                    
                                    {/* Structural internal vignette */}
                                    <div className="absolute inset-0 pointer-events-none shadow-[inset_-30px_0_50px_rgba(0,0,0,0.02)]" />
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
