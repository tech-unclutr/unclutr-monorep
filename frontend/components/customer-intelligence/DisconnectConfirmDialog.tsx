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
import { CalendarOff, Sparkles } from "lucide-react";

interface DisconnectConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function DisconnectConfirmDialog({ isOpen, onClose, onConfirm, isLoading = false }: DisconnectConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md border-none bg-transparent p-0 shadow-none overflow-visible">
                <div className="relative p-[1px] rounded-[2.5rem] overflow-hidden">
                    {/* Magical Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/50 via-orange-500/20 to-blue-500/50 animate-pulse" />

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
                                        className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20"
                                    >
                                        <CalendarOff className="w-10 h-10 text-red-500" />
                                    </motion.div>

                                    {/* Sparkling Atoms */}
                                    <motion.div
                                        animate={{ y: [-10, 10, -10], opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <Sparkles className="w-5 h-5 text-orange-400" />
                                    </motion.div>
                                </div>
                            </div>

                            <AlertDialogTitle className="text-2xl font-bold text-center dark:text-white tracking-tight">
                                Pause the Magic?
                            </AlertDialogTitle>

                            <AlertDialogDescription className="text-center text-gray-500 dark:text-zinc-400 text-base leading-relaxed mt-4">
                                Disconnecting your Google Calendar will stop our AI from knowing your availability. You&apos;ll have to manually coordinate interview slots.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter className="mt-10 flex flex-col sm:flex-row gap-3 relative z-10">
                            <AlertDialogCancel
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 rounded-2xl h-14 border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-zinc-400 font-bold transition-all text-lg"
                            >
                                Keep Connected
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    onConfirm();
                                }}
                                disabled={isLoading}
                                className="flex-1 rounded-2xl h-14 bg-red-500 hover:bg-red-600 text-white font-bold transition-all text-lg shadow-lg shadow-red-500/20 border-none flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Disconnecting...</span>
                                    </>
                                ) : (
                                    "Disconnect"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>

                        {/* Background subtle glow */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/5 blur-[80px] -z-10 pointer-events-none" />
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
