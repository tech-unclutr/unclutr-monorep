import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, Sparkles, Clock, ArrowRight, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LeadStatusCard } from "./LeadStatusCard";

export interface ReadyLead {
    queue_item_id: string;
    lead_id: string;
    name: string;
    number: string;
    cohort?: string;
    status: string;
    meta_data?: any;
    priority_score?: number;
    avatar_index?: number;
}

interface HumanQueueProps {
    leads: ReadyLead[];
    maxCapacity?: number;
    onCallClick: (lead: ReadyLead) => void;
}

export function HumanQueue({ leads, onCallClick }: HumanQueueProps) {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Your Queue</h3>
                    <p className="text-xs text-zinc-500">Ready for Interaction</p>
                </div>
            </div>

            <div className="relative flex items-center justify-end min-h-[160px] bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 pr-6 overflow-hidden">

                {/* Empty State */}
                {leads.length === 0 && (
                    <div className="absolute left-10 flex flex-col items-center justify-center text-zinc-400 opacity-50">
                        <Clock className="w-8 h-8 mb-2" />
                        <p className="text-sm font-medium">Waiting for agents...</p>
                    </div>
                )}

                {/* The Queue (Approaching from Left) */}
                <div className="absolute left-0 inset-y-0 flex items-center pl-6 gap-4 overflow-x-auto scrollbar-hide pr-[200px]">
                    <AnimatePresence mode="popLayout">
                        {leads.map((lead, index) => (
                            <HumanLeadCard
                                key={lead.queue_item_id + index}
                                lead={lead}
                                onCall={() => onCallClick(lead)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* The "User" (You) - Right Side Anchor */}
                <div className="relative z-10 pl-12 bg-gradient-to-l from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 dark:to-transparent h-full flex items-center">
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-emerald-500/20 blur-lg rounded-full animate-pulse group-hover:bg-emerald-500/30 transition-all" />
                            <Avatar className="w-20 h-20 border-4 border-white dark:border-zinc-950 shadow-xl shadow-emerald-500/20">
                                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=User&backgroundColor=d1fae5" />
                                <AvatarFallback>YOU</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-950 flex items-center justify-center text-white shadow-md">
                                <PhoneCall className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">YOU</span>
                            <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function HumanLeadCard({ lead, onCall }: { lead: ReadyLead, onCall: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="flex-shrink-0 w-[260px]"
        >
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-lg shadow-emerald-500/5 p-4 flex flex-col gap-3 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors relative">

                {/* Connector Line (Visual) */}
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-zinc-200 dark:bg-zinc-800" />

                <div className="flex items-center gap-3">
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="flex items-center gap-3 cursor-pointer group/hover">
                                <Avatar className="w-12 h-12 border-2 border-emerald-50 dark:border-emerald-900/30 transition-transform group-hover/hover:scale-105">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.lead_id}`} />
                                    <AvatarFallback>{lead.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <h4 className="font-bold text-zinc-900 dark:text-white truncate group-hover/hover:text-emerald-600 dark:group-hover/hover:text-emerald-400 transition-colors">
                                        {lead.name}
                                    </h4>
                                    <p className="text-xs text-zinc-500 truncate">{lead.number}</p>
                                </div>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="top" align="start">
                            <LeadStatusCard
                                type="HUMAN_QUEUE"
                                lead={{
                                    id: lead.lead_id,
                                    name: lead.name,
                                    status: 'Ready for Call',
                                    cohort: lead.cohort,
                                    meta_data: lead.meta_data
                                }}
                            />
                        </HoverCardContent>
                    </HoverCard>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-tight">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Context: </span>
                        {lead.meta_data?.transcript_summary || "Ready for discussion."}
                    </p>
                </div>

                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCall();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs shadow-md shadow-emerald-500/20"
                >
                    <PhoneCall className="w-3.5 h-3.5 mr-2" />
                    Accept Call
                </Button>
            </div>
        </motion.div>
    );
}
