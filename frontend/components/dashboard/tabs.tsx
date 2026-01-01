"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
    return (
        <div className={cn("flex space-x-1 bg-white/5 p-1 rounded-xl", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg z-10",
                        activeTab === tab.id ? "text-white" : "text-white/50 hover:text-white/70"
                    )}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="active-tab"
                            className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

interface TabsContentProps {
    id: string;
    activeTab: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsContent({ id, activeTab, children, className }: TabsContentProps) {
    if (id !== activeTab) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
