"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegritySuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    reconciledCount?: number;
}

export function IntegritySuccessModal({ isOpen, onClose, reconciledCount = 0 }: IntegritySuccessModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-zinc-950 p-0 overflow-hidden rounded-3xl shadow-2xl">
                <DialogTitle className="sr-only">Integrity Verification Complete</DialogTitle>
                <DialogDescription className="sr-only">
                    Your data integrity has been verified and zero-drift confirmed.
                </DialogDescription>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="p-12 flex flex-col items-center text-center space-y-6"
                        >
                            {/* Shield Icon with Animation */}
                            <div className="relative">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center relative"
                                >
                                    <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-500" strokeWidth={2} />

                                    {/* Pulse Ring */}
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full border-2 border-emerald-500"
                                    />
                                </motion.div>

                                {/* Sparkles */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                    className="absolute -top-2 -right-2"
                                >
                                    <Sparkles className="w-6 h-6 text-emerald-500" fill="currentColor" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, duration: 0.4 }}
                                    className="absolute -bottom-2 -left-2"
                                >
                                    <Sparkles className="w-5 h-5 text-emerald-400" fill="currentColor" />
                                </motion.div>
                            </div>

                            {/* Text Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="space-y-2"
                            >
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    Integrity Verified!
                                </h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-500">100% Match Confirmed.</span><br />
                                    We audited your Orders and Products against Shopify and found Zero Drift.
                                </p>
                            </motion.div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="w-full pt-2"
                            >
                                <Button
                                    onClick={onClose}
                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Excellent
                                </Button>
                            </motion.div>

                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
