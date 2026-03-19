"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function ProblemSectionBento() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.1 });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    const headerY = useTransform(scrollYProgress, [0, 0.4], [60, 0]);
    const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const smoothHeaderY = useSpring(headerY, { stiffness: 100, damping: 30 });

    return (
        <section
            ref={sectionRef}
            id="problem-bento"
            className="relative bg-transparent min-h-screen flex flex-col pt-24 pb-32 overflow-hidden"
        >
            <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 sm:px-8">
                {/* Header */}
                <motion.div
                    className="mb-16 text-center"
                    style={{ y: smoothHeaderY, opacity: headerOpacity }}
                >
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#FF5A36]/10 border border-[#FF5A36]/20 text-[#FF5A36] text-sm font-semibold tracking-wide uppercase">
                        Option A: Bento Grid
                    </div>
                    <motion.h2
                        className="font-display text-[clamp(32px,5vw,56px)] font-bold text-[#1d1d1f] tracking-tight leading-[1.1] max-w-[800px] mx-auto"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                    >
                        Every team says they <br/>talk to their customers.
                    </motion.h2>
                    <motion.p
                        className="mt-6 text-[18px] sm:text-[20px] text-[#6e6e73] font-medium max-w-[600px] mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        But the reality of doing research is chaotic, exhausting, and slows down your entire roadmap.
                    </motion.p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[280px]">
                    
                    {/* Card 1: Scheduling Hell (Large) */}
                    <motion.div
                        className="col-span-1 lg:col-span-7 bg-white/60 backdrop-blur-2xl rounded-3xl p-8 border border-[#E0D0C2]/60 shadow-[0_8px_32px_rgba(140,100,70,0.06)] relative overflow-hidden group flex flex-col justify-between"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="relative z-10 max-w-[80%]">
                            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">90% No-Shows</h3>
                            <p className="text-[#6e6e73] font-medium text-lg leading-relaxed">
                                10 hours sourcing. 50 emails sent. 2 No-shows.<br/> Weeks wasted just trying to get on a single call.
                            </p>
                        </div>

                        {/* Visual Metaphor: Calendar Chaos */}
                        <div className="absolute right-[-40px] bottom-[-40px] w-[300px] h-[250px] rotate-[-5deg] group-hover:rotate-[0deg] transition-transform duration-700 ease-out">
                            {/* Fake Calendar Blocks */}
                            <div className="absolute top-[20px] right-[40px] w-[200px] h-[60px] bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-xl p-3 shadow-lg transform rotate-[-8deg] group-hover:-translate-y-4 group-hover:rotate-[-12deg] transition-all duration-500">
                                <div className="text-red-600 font-semibold text-sm">Canceled - User Interview</div>
                                <div className="text-red-600/60 text-xs mt-1">Declined</div>
                            </div>
                            <div className="absolute top-[80px] right-[20px] w-[220px] h-[60px] bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-xl p-3 shadow-lg transform rotate-[4deg] group-hover:translate-x-4 transition-all duration-500 delay-75">
                                <div className="text-amber-600 font-semibold text-sm">Reschedule?</div>
                                <div className="text-amber-600/60 text-xs mt-1">Pending response</div>
                            </div>
                            <div className="absolute top-[140px] right-[60px] w-[180px] h-[60px] bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-xl p-3 shadow-lg transform rotate-[-3deg] group-hover:translate-y-4 transition-all duration-500 delay-150">
                                <div className="text-red-600 font-semibold text-sm">No Show</div>
                                <div className="text-red-600/60 text-xs mt-1">Waited 15 mins</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2: The Notion Graveyard (Medium) */}
                    <motion.div
                        className="col-span-1 lg:col-span-5 bg-white/60 backdrop-blur-2xl rounded-3xl p-8 border border-[#E0D0C2]/60 shadow-[0_8px_32px_rgba(140,100,70,0.06)] relative overflow-hidden group flex flex-col justify-between"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">The Notion Graveyard</h3>
                            <p className="text-[#6e6e73] font-medium text-lg leading-relaxed">
                                Where insights go to die. Transcripts get skimmed, recorded videos stay unwatched.
                            </p>
                        </div>
                        
                        {/* Visual Metaphor: Fading Text */}
                        <div className="absolute bottom-6 left-8 right-8 pointer-events-none">
                            <div className="space-y-3 opacity-40 group-hover:opacity-20 transition-opacity duration-700">
                                <div className="h-3 w-3/4 bg-[#1d1d1f] rounded-full blur-[1px]"></div>
                                <div className="h-3 w-full bg-[#1d1d1f] rounded-full blur-[2px]"></div>
                                <div className="h-3 w-5/6 bg-[#1d1d1f] rounded-full blur-[3px]"></div>
                                <div className="h-3 w-2/3 bg-[#1d1d1f] rounded-full blur-[4px]"></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 3: Broken Telephone (Medium) */}
                    <motion.div
                        className="col-span-1 lg:col-span-4 bg-white/60 backdrop-blur-2xl rounded-3xl p-8 border border-[#E0D0C2]/60 shadow-[0_8px_32px_rgba(140,100,70,0.06)] relative overflow-hidden group"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="relative z-10 h-full flex flex-col">
                            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">Lost in Translation</h3>
                            <p className="text-[#6e6e73] font-medium text-lg leading-relaxed flex-1">
                                Sales says one thing. Support says another. Product builds blind.
                            </p>
                        </div>

                        {/* Visual Metaphor: Conflicting Arrows */}
                        <div className="absolute bottom-[-10px] right-[-10px] opacity-20 group-hover:opacity-50 transition-opacity duration-500">
                            <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                        </div>
                    </motion.div>

                    {/* Card 4: Roadmap Roulette (Large) */}
                    <motion.div
                        className="col-span-1 lg:col-span-8 bg-black backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group flex flex-col justify-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white mb-3">Roadmap Roulette</h3>
                                <p className="text-white/60 font-medium text-lg leading-relaxed">
                                    3 loud users dictate the roadmap while the silent majority silently churns. Building by gut feel instead of real data.
                                </p>
                            </div>
                            
                            {/* Visual Metaphor: Loud vs Silent */}
                            <div className="w-[200px] h-[120px] flex items-end justify-between gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <div className="w-1/4 h-[80%] bg-[#FF5A36] rounded-t-md animate-pulse"></div>
                                <div className="w-1/4 h-[20%] bg-white/20 rounded-t-md"></div>
                                <div className="w-1/4 h-[15%] bg-white/20 rounded-t-md"></div>
                                <div className="w-1/4 h-[10%] bg-white/20 rounded-t-md"></div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
