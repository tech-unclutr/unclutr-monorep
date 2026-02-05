import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { AgentStatus, UpcomingLead, HistoryItem } from "./AgentQueue";
import AgentIntelligenceDashboard from "./AgentIntelligenceDashboard";

interface AgentQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeAgents: AgentStatus[];
    upcomingLeads: UpcomingLead[];
    historyItems: HistoryItem[];
    allLeadsByCohort: Record<string, any[]>;
    allEvents: any[];
    maxConcurrency?: number;
    isPaused?: boolean;
    isResetting?: boolean;
    onReset?: () => void;
    onLeadAction?: (action: 'approve' | 'reschedule' | 'retry', leadId: string) => void;
    onRefreshQueue?: () => void | Promise<void>;
}

export function AgentQueueModal({ isOpen, onClose, activeAgents, upcomingLeads, historyItems, allLeadsByCohort, allEvents, maxConcurrency, isPaused, isResetting, onReset, onLeadAction, onRefreshQueue }: AgentQueueModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl w-[98vw] h-[90vh] bg-transparent border-0 p-0 overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/20 flex flex-col transition-colors duration-300">
                <VisuallyHidden>
                    <DialogTitle>AI Agent Queue Control</DialogTitle>
                    <DialogDescription>
                        Unified view of upcoming, active, and historical agent activity.
                    </DialogDescription>
                </VisuallyHidden>

                <AgentIntelligenceDashboard
                    activeAgents={activeAgents}
                    upcomingLeads={upcomingLeads}
                    historyItems={historyItems}
                    allLeadsByCohort={allLeadsByCohort}
                    allEvents={allEvents}
                    maxConcurrency={maxConcurrency}
                    isPaused={isPaused}
                    isResetting={isResetting}
                    onClose={onClose}
                    onReset={onReset}
                    onLeadAction={onLeadAction}
                    onRefreshQueue={onRefreshQueue}
                    className="h-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                />
            </DialogContent>
        </Dialog>
    );
}

