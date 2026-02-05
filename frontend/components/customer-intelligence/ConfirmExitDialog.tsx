"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Sparkles } from "lucide-react";

interface ConfirmExitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export function ConfirmExitDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Discard Changes?",
    description = "You have unsaved changes that will be lost if you leave now.",
    confirmLabel = "Discard",
    cancelLabel = "Stay"
}: ConfirmExitDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md border-none bg-transparent p-0 shadow-none overflow-visible">
                <div className="relative p-[1px] rounded-[2.5rem] overflow-hidden">
                    {/* Magical Gradient Border - Using Orange/Indigo for Warning */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/50 via-indigo-500/20 to-purple-500/50 animate-pulse" />

                    {/* Content Container */}
                    <div className="relative bg-white dark:bg-[#09090B] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl border border-white/10 shadow-2xl">

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                        <AlertDialogHeader className="relative z-10">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                        className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20"
                                    >
                                        <AlertTriangle className="w-10 h-10 text-orange-500" />
                                    </motion.div>

                                    {/* Sparkling Atoms */}
                                    <motion.div
                                        animate={{ y: [-10, 10, -10], opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </motion.div>
                                </div>
                            </div>

                            <AlertDialogTitle className="text-2xl font-bold text-center dark:text-white tracking-tight">
                                {title}
                            </AlertDialogTitle>

                            <AlertDialogDescription className="text-center text-gray-500 dark:text-zinc-400 text-base leading-relaxed mt-4">
                                {description}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter className="mt-10 flex flex-col sm:flex-row gap-3 relative z-10">
                            <AlertDialogCancel
                                onClick={onClose}
                                className="flex-1 rounded-2xl h-14 border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-zinc-400 font-bold transition-all text-lg"
                            >
                                {cancelLabel}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    onConfirm();
                                }}
                                className="flex-1 rounded-2xl h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold transition-all text-lg shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 border-none flex items-center justify-center gap-2"
                            >
                                {confirmLabel}
                            </AlertDialogAction>
                        </AlertDialogFooter>

                        {/* Background subtle glow */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-orange-500/5 blur-[80px] -z-10 pointer-events-none" />
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
