"use client";

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface VerticalStepProps {
    stepNumber: number;
    title: string;
    description?: string;
    isActive: boolean;
    isCompleted: boolean;
    children: React.ReactNode;
    summary?: React.ReactNode;
    isLast?: boolean;
    onEdit?: () => void;
    optional?: boolean;
}

export function VerticalStep({
    stepNumber,
    title,
    description,
    isActive,
    isCompleted,
    children,
    summary,
    isLast,
    onEdit,
    optional
}: VerticalStepProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && contentRef.current) {
            setTimeout(() => {
                contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [isActive]);

    return (
        <div className="flex gap-5 md:gap-8 relative group/step bg-transparent">
            {/* Left Column: Indicator & Line */}
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <motion.div
                    initial={false}
                    animate={{
                        backgroundColor: isCompleted ? '#000000' : isActive ? '#000000' : '#ffffff',
                        borderColor: isCompleted || isActive ? '#000000' : '#e4e4e7',
                        color: isCompleted || isActive ? '#ffffff' : '#a1a1aa',
                        scale: isActive ? 1 : 0.95, // No massive scale, just subtle
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 border-2 relative select-none"
                >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : stepNumber}
                </motion.div>

                {!isLast && (
                    <div className="flex-1 w-px bg-zinc-200 my-2 relative overflow-hidden min-h-[2rem]">
                        {(isActive || isCompleted) && (
                            <motion.div
                                initial={{ height: '0%' }}
                                animate={{ height: '100%' }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="absolute top-0 left-0 w-full bg-black"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Right Column: Content */}
            <div className="flex-1 pb-12 pt-0.5" ref={contentRef}>
                <div
                    className={`flex items-start justify-between cursor-pointer transition-opacity duration-300 ${!isActive && !isCompleted ? 'opacity-40 hover:opacity-70' : 'opacity-100'
                        }`}
                    onClick={isCompleted && onEdit ? onEdit : undefined}
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className={`font-semibold text-lg tracking-tight transition-colors ${isActive || isCompleted ? 'text-black' : 'text-zinc-500'
                                }`}>
                                {title}
                            </h3>
                            {optional && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">
                                    Optional
                                </span>
                            )}
                        </div>

                        <AnimatePresence>
                            {(description && isActive) && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-zinc-500 text-sm mt-1 mb-2 leading-relaxed max-w-lg origin-top"
                                >
                                    {description}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {isCompleted && onEdit && (
                        <button className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-black transition-colors py-1 px-2">
                            Edit
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isActive && (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="pt-6 pl-1">
                                {children}
                            </div>
                        </motion.div>
                    )}

                    {isCompleted && summary && (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-2"
                        >
                            {summary}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
