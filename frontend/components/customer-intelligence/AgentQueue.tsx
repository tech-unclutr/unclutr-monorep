import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Radio, Wifi, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LeadStatusCard } from "./LeadStatusCard";

export interface AgentStatus {
    agent_id: string;
    status: string; // initiated, ringing, connected, speaking, completed, failed
    lead_name: string;
    lead_id: string;
    duration: number;
    agent_name?: string;
}

export interface UpcomingLead {
    lead_id: string;
    name: string;
    cohort?: string;
    avatar_seed: string;
    outcome?: string;
}

export interface HistoryItem {
    lead_id: string;
    name: string;
    status: string; // COMPLETED, FAILED, CONSUMED
    avatar_seed: string;
    outcome?: string;
}

export interface ExecutionEvent {
    id: string;
    timestamp: string;
    type: 'agent_action' | 'system';
    agent_name?: string;
    message: string;
    status: string;
}

interface AgentQueueProps {
    activeAgents: AgentStatus[];
    upcomingLeads: UpcomingLead[];
    historyItems?: HistoryItem[]; // New Prop
    events?: ExecutionEvent[]; // New Prop for Chat Bubbles
    maxConcurrency: number;
    onAgentClick: (agent: AgentStatus | null, agentName: string, index: number) => void;
    onLeadAction?: (action: 'approve' | 'reschedule', leadId: string) => void;
    onViewFullQueue?: () => void;
}

export function AgentQueue({ activeAgents, upcomingLeads, historyItems = [], events = [], maxConcurrency, onAgentClick, onLeadAction, onViewFullQueue }: AgentQueueProps) {
    // Distribute items across lanes for visual balance
    const lanes = Array.from({ length: maxConcurrency }, (_, i) => {
        const agent = activeAgents[i] || null;

        // Realistic name pool for idle lanes
        const FRONTEND_NAMES = [
            "Alex Rivera", "Sarah Chen", "Rohan Gupta", "Maya Williams",
            "Jordan Vance", "Priya Sharma", "Vikram Malhotra", "Tara Knight",
            "Leo Zhang", "Elena Rossi", "Marcus Thorne", "Skylar Page"
        ];
        const defaultName = FRONTEND_NAMES[i % FRONTEND_NAMES.length];

        // Simple distribution: Leads index % maxConcurrency === lane index
        const laneLeads = upcomingLeads.filter((_, idx) => idx % maxConcurrency === i);
        const laneHistory = historyItems.filter((_, idx) => idx % maxConcurrency === i);

        return {
            agent,
            name: agent?.agent_name || defaultName,
            leads: laneLeads.slice(0, 3),
            history: laneHistory.slice(0, 3)
        };
    });

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div
                    onClick={onViewFullQueue}
                    className={cn(
                        "flex items-center gap-2 group transition-all",
                        onViewFullQueue ? "cursor-pointer hover:opacity-80" : ""
                    )}
                >
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Agent Team</h3>
                            {onViewFullQueue && (
                                <Badge className="bg-indigo-500/10 text-indigo-500 border-0 text-[10px] px-1.5 py-0 h-4 font-black uppercase tracking-widest">Q</Badge>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500">Autonomous Dialing Lanes</p>
                    </div>
                </div>

                {onViewFullQueue && (
                    <button
                        onClick={onViewFullQueue}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-1.5"
                    >
                        Full Queue
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {lanes.map((lane, index) => (
                    <AgentLane
                        key={index}
                        agent={lane.agent}
                        agentName={lane.name}
                        leads={lane.leads}
                        history={lane.history}
                        events={events}
                        index={index}
                        onClick={() => onAgentClick(lane.agent, lane.name, index)}
                        onLeadAction={onLeadAction}
                    />
                ))}
            </div>
        </div>
    );
}

function AgentLane({ agent, agentName, leads, history, events, index, onClick, onLeadAction }: { agent: AgentStatus | null, agentName: string, leads: UpcomingLead[], history: HistoryItem[], events: ExecutionEvent[], index: number, onClick: () => void, onLeadAction?: (action: 'approve' | 'reschedule', leadId: string) => void }) {
    const isActive = agent && ['speaking', 'connected', 'ringing', 'initiated'].includes(agent.status);

    // Filter events for this agent
    const agentEvents = events.filter(e => e.agent_name === agentName);
    const latestEvent = agentEvents.length > 0 ? agentEvents[0] : null;

    // Determine if we should show the bubble (recent event < 8s ago)
    const showBubble = latestEvent && isActive && (Date.now() - new Date(latestEvent.timestamp).getTime() < 8000);

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-between h-24 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 px-4 overflow-hidden transition-all",
                isActive ? "cursor-pointer hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-900" : "opacity-70"
            )}
        >
            {/* --- HISTORY STREAM (Left Side) --- */}
            <div className="flex-1 flex items-center justify-start gap-3 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                <AnimatePresence mode="popLayout">
                    {history.map((item, itemIdx) => (
                        <motion.div
                            key={`lane-${index}-history-${item.lead_id}-${itemIdx}`}
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 0.9 }}
                            exit={{ opacity: 0, x: -20, scale: 0.8 }}
                            className="flex flex-col items-center gap-1 min-w-[50px] grayscale hover:grayscale-0 transition-all cursor-pointer"
                        >
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <div className="flex flex-col items-center gap-1">
                                        <motion.div layoutId={`lane-${index}-history-avatar-${item.lead_id}`}>
                                            <Avatar
                                                className={cn(
                                                    "w-8 h-8 border-2 shadow-sm",
                                                    item.status === 'COMPLETED' ? "border-emerald-200" : "border-red-200"
                                                )}
                                            >
                                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.avatar_seed}`} />
                                                <AvatarFallback className="text-[8px]">{item.name.slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                        </motion.div>
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase",
                                            item.status === 'COMPLETED' ? "text-emerald-500" : "text-red-500"
                                        )}>{item.status === 'COMPLETED' ? 'DONE' : 'FAIL'}</span>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent side="bottom" align="start">
                                    <LeadStatusCard
                                        type="HISTORY"
                                        lead={{
                                            id: item.lead_id,
                                            name: item.name,
                                            avatar_seed: item.avatar_seed,
                                            status: item.status,
                                            duration: 124
                                        }}
                                        onAction={onLeadAction}
                                    />
                                </HoverCardContent>
                            </HoverCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* --- AGENT (Center) --- */}
            <div className="relative z-10 mx-4 flex-shrink-0">
                <AnimatePresence>
                    {showBubble && latestEvent && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                            exit={{ opacity: 0, y: 5, scale: 0.9, x: '-50%' }}
                            className="absolute -top-16 left-1/2 w-[200px] pointer-events-none z-50"
                        >
                            <div className="relative bg-white dark:bg-zinc-800 rounded-2xl p-3 shadow-xl border border-indigo-100 dark:border-zinc-700">
                                <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-tight line-clamp-2 italic font-medium">
                                    "{latestEvent.message}"
                                </p>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-indigo-100 dark:border-zinc-700 rotate-45" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={cn(
                    "relative flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-300",
                    isActive ? "bg-white dark:bg-zinc-900 shadow-xl shadow-indigo-500/20 border-2 border-indigo-100" : "opacity-70 grayscale border-2 border-transparent"
                )}>
                    {isActive && (
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-lg animate-pulse opacity-30" />
                    )}

                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="relative cursor-pointer">
                                <motion.div layoutId={`lane-${index}-agent-avatar-${agent?.lead_id || 'idle'}`}>
                                    <Avatar
                                        className="w-12 h-12 border-2 border-white dark:border-zinc-950 shadow-md mb-1"
                                    >
                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent?.lead_name || agentName}&backgroundColor=e0e7ff`} />
                                        <AvatarFallback>{(agent?.agent_name || agentName).slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </motion.div>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="top">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{agentName}</h4>
                                <p className="text-xs text-zinc-500">
                                    {agent ? `Currently ${agent.status} with ${agent.lead_name}` : "Idle and waiting for next lead..."}
                                </p>
                                {agent && (
                                    <LeadStatusCard
                                        type="AGENT_ACTIVE"
                                        lead={{
                                            id: agent.lead_id,
                                            name: agent.lead_name,
                                            status: agent.status,
                                            duration: agent.duration
                                        }}
                                        onAction={onLeadAction}
                                    />
                                )}
                            </div>
                        </HoverCardContent>
                    </HoverCard>

                    <div className={cn(
                        "absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] text-white shadow-sm",
                        agent?.status === 'speaking' ? "bg-indigo-500" :
                            agent?.status === 'connected' ? "bg-emerald-500" :
                                agent?.status === 'ringing' ? "bg-amber-500" :
                                    agent?.status === 'initiated' ? "bg-blue-500" :
                                        "bg-zinc-300 dark:bg-zinc-700"
                    )}>
                        {agent?.status === 'speaking' ? <Radio className="w-2.5 h-2.5" /> :
                            agent?.status === 'ringing' ? <Wifi className="w-2.5 h-2.5" /> :
                                <Bot className="w-2.5 h-2.5" />}
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {agentName}
                        </span>
                        <span className={cn(
                            "text-[8px] font-medium uppercase tracking-[0.1em] transition-colors",
                            isActive ? "text-indigo-500 font-bold" : "text-zinc-500"
                        )}>
                            {isActive && agent?.lead_name ? `Calling ${agent.lead_name.split(' ')[0]}` : "AI Agent"}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- UPCOMING STREAM (Right Side) --- */}
            <div className="flex-1 flex items-center justify-end gap-3 overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {leads.map((lead, leadIdx) => (
                        <motion.div
                            key={`lane-${index}-upcoming-${lead.lead_id}-${leadIdx}`}
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            transition={{ type: "spring", bounce: 0.2 }}
                            className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer"
                        >
                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <div className="flex flex-col items-center gap-1">
                                        <motion.div layoutId={`lane-${index}-upcoming-avatar-${lead.lead_id}`}>
                                            <Avatar
                                                className="w-10 h-10 border-2 border-white dark:border-zinc-800 shadow-sm transition-transform hover:scale-110"
                                            >
                                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.avatar_seed}`} />
                                                <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600">
                                                    {lead.name.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </motion.div>
                                        <span className="text-[10px] font-medium text-zinc-500 truncate max-w-[60px]">
                                            {lead.name.split(' ')[0]}
                                        </span>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent side="bottom" align="end">
                                    <LeadStatusCard
                                        type="UPCOMING"
                                        lead={{
                                            id: lead.lead_id,
                                            name: lead.name,
                                            cohort: lead.cohort,
                                            avatar_seed: lead.avatar_seed,
                                            status: 'Queueing'
                                        }}
                                        onAction={onLeadAction}
                                    />
                                </HoverCardContent>
                            </HoverCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {leads.length > 0 && (
                    <div className="w-6 h-[2px] bg-gradient-to-l from-zinc-200 to-transparent dark:from-zinc-700 rounded-full mr-2 opacity-50" />
                )}
            </div>
        </div>
    );
}

function formatDuration(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
