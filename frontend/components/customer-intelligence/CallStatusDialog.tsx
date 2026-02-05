"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    CheckCircle2,
    XCircle,
    Clock,
    UserMinus,
    PhoneOff,
    Calendar,
    MessageSquare,
    Target,
    PhoneCall,
    Voicemail
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface CallStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    lead: {
        id: string;
        name: string;
        item_id: string;
        campaign_id: string;
    };
    onSuccess: () => void;
}

const STATUS_OPTIONS = [
    { value: 'CONNECTED', label: 'Connected', icon: CheckCircle2, color: 'text-emerald-500' },
    { value: 'VOICEMAIL', label: 'Voicemail', icon: Voicemail, color: 'text-amber-500' },
    { value: 'NO_ANSWER', label: 'No Answer', icon: PhoneOff, color: 'text-zinc-500' },
    { value: 'BUSY', label: 'Busy', icon: Clock, color: 'text-blue-500' },
    { value: 'WRONG_PERSON', label: 'Wrong Person', icon: UserMinus, color: 'text-red-500' },
    { value: 'NOT_INTERESTED', label: 'Not Interested', icon: XCircle, color: 'text-red-600' },
];

const NEXT_ACTION_OPTIONS = [
    { value: 'CLOSE_WON', label: 'Booked / Won', icon: Target, color: 'text-emerald-600' },
    { value: 'CLOSE_LOST', label: 'Closed / Lost', icon: XCircle, color: 'text-red-600' },
    { value: 'RETRY_NOW', label: 'Retry Immediately (AI)', icon: RefreshCw, color: 'text-indigo-600' },
    { value: 'RETRY_SCHEDULED', label: 'Schedule Follow-up', icon: Calendar, color: 'text-amber-600' },
];

import { RefreshCw } from 'lucide-react';

export const CallStatusDialog = ({ isOpen, onClose, lead, onSuccess }: CallStatusDialogProps) => {
    const [status, setStatus] = useState<string>("");
    const [duration, setDuration] = useState<number>(0);
    const [notes, setNotes] = useState<string>("");
    const [nextAction, setNextAction] = useState<string>("");
    const [retryDate, setRetryDate] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!status) {
            toast.error("Please select a call status");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                status,
                duration,
                notes,
                next_action: nextAction,
                retry_scheduled_for: retryDate?.toISOString(),
                user_id: "me" // Backend handles this
            };

            await api.post(`/user-queue/${lead.item_id}/call-status`, payload);
            toast.success("Call outcome logged successfully");
            onSuccess();
            onClose();
            // Reset form
            setStatus("");
            setDuration(0);
            setNotes("");
            setNextAction("");
            setRetryDate(undefined);
        } catch (error: any) {
            toast.error(error.message || "Failed to log call outcome");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-0 overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PhoneCall className="w-24 h-24" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tight">Log Call Outcome</DialogTitle>
                        <DialogDescription className="text-emerald-100 font-bold text-base">
                            Summarize your conversation with <span className="text-white underline underline-offset-4">{lead.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Call Result</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setStatus(opt.value)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 transition-all duration-300",
                                        status === opt.value
                                            ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                                            : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <opt.icon className={cn("w-6 h-6", status === opt.value ? "text-emerald-500" : opt.color)} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-wider", status === opt.value ? "text-emerald-600" : "text-zinc-500")}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Duration */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Duration (min)</Label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                    className="w-full pl-12 pr-4 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 font-bold focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Next Action */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Next Action</Label>
                            <Select value={nextAction} onValueChange={setNextAction}>
                                <SelectTrigger className="h-14 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold">
                                    <SelectValue placeholder="What's next?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                    {NEXT_ACTION_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="h-12 font-bold focus:bg-emerald-500/10 focus:text-emerald-600">
                                            <div className="flex items-center gap-2">
                                                <opt.icon className={cn("w-4 h-4", opt.color)} />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Conditional Scheduler */}
                    {nextAction === 'RETRY_SCHEDULED' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, height: 0 }}
                            animate={{ opacity: 1, scale: 1, height: "auto" }}
                            className="space-y-3"
                        >
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Follow-up Time</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-14 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold text-left justify-start",
                                            !retryDate && "text-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {retryDate ? format(retryDate, "PPP 'at' HH:mm") : <span>Pick a time</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800" align="start">
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-transparent font-bold outline-none"
                                        onChange={(e) => setRetryDate(new Date(e.target.value))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </motion.div>
                    )}

                    {/* Notes */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Internal Notes</Label>
                        <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
                            <Textarea
                                placeholder="Any specific details from the call..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full pl-12 pr-4 pt-4 min-h-[120px] rounded-3xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 font-medium focus:border-emerald-500 transition-all outline-none resize-none"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-16 rounded-3xl text-xl shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                            <>SAVE & CONFRONT NEXT LEAD</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
