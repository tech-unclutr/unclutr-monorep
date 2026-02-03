import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Play,
    Pause,
    Download,
    MessageSquare,
    Cpu,
    FileText,
    Activity,
    Clock,
    DollarSign
} from "lucide-react";

interface CallDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    call: any; // Ideally typed properly based on API response
}

export function CallDetailsModal({ isOpen, onClose, call }: CallDetailsModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    if (!call) return null;

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-slate-950 border-slate-800 text-slate-100">

                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-slate-800 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                            {call.lead?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                                {call.lead?.name || "Unknown Lead"}
                                <Badge variant="outline" className={`
                   ${call.status === 'completed' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                                        call.status === 'failed' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                            'border-indigo-500 text-indigo-500 bg-indigo-500/10'} capitalize`
                                }>
                                    {call.outcome || call.status}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 flex items-center gap-3 mt-1 text-xs">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(call.duration)}</span>
                                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${call.total_cost?.toFixed(4)}</span>
                                {call.telephony_provider && <span className="uppercase tracking-wider text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{call.telephony_provider}</span>}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        ID: {call.bolna_call_id?.slice(0, 8)}...
                        <br />
                        {new Date(call.created_at).toLocaleString()}
                    </div>
                </DialogHeader>

                {/* content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
                        <div className="px-6 pt-2 border-b border-slate-800 bg-slate-900/50">
                            <TabsList className="bg-transparent h-10 w-full justify-start gap-6 p-0">
                                <TabsTrigger value="transcript" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-2 text-slate-400 data-[state=active]:text-indigo-400 font-medium transition-all">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Transcript
                                </TabsTrigger>
                                <TabsTrigger value="analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-2 text-slate-400 data-[state=active]:text-indigo-400 font-medium transition-all">
                                    <Activity className="w-4 h-4 mr-2" /> Analysis & Extraction
                                </TabsTrigger>
                                <TabsTrigger value="technical" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-2 text-slate-400 data-[state=active]:text-indigo-400 font-medium transition-all">
                                    <Cpu className="w-4 h-4 mr-2" /> Technical Metadata
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Transcript Tab */}
                        <TabsContent value="transcript" className="flex-1 p-0 m-0 overflow-hidden relative group">
                            <ScrollArea className="h-full w-full p-6">
                                <div className="max-w-3xl mx-auto space-y-6 pb-20">
                                    {call.full_transcript ? (
                                        // Simple parser for "Agent: text \n User: text" format if that's what comes back
                                        // Or just displaying raw text if it's unstructured
                                        <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-mono text-sm">
                                            {call.full_transcript}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                                            <FileText className="w-8 h-8 opacity-50" />
                                            <p>No transcript available for this call.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Analysis Tab */}
                        <TabsContent value="analysis" className="flex-1 p-0 m-0 overflow-hidden bg-slate-900/30">
                            <ScrollArea className="h-full w-full p-6">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {/* Summary Card */}
                                    {call.transcript_summary && (
                                        <Card className="bg-slate-950 border-slate-800 shadow-sm">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Activity className="w-3 h-3 text-indigo-400" /> Executive Summary
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-slate-300 leading-relaxed text-sm">
                                                    {call.transcript_summary}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Extracted Data Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="bg-slate-950 border-slate-800 shadow-sm md:col-span-2">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    Extracted Data Points
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {call.extracted_data && Object.keys(call.extracted_data).length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {Object.entries(call.extracted_data).map(([key, value]) => (
                                                            <div key={key} className="bg-slate-900/50 p-3 rounded-md border border-slate-800/50 flex flex-col gap-1">
                                                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{key.replace(/_/g, " ")}</span>
                                                                <span className="text-sm text-indigo-300 font-medium">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 italic text-sm">No structured data extracted from this conversation.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Technical Tab */}
                        <TabsContent value="technical" className="flex-1 p-0 m-0 overflow-hidden bg-slate-950">
                            <ScrollArea className="h-full w-full p-6">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Detailed Costs</h4>
                                            <div className="text-2xl font-mono text-emerald-400">${call.total_cost?.toFixed(6)}</div>
                                            <div className="text-xs text-slate-600 mt-1">Total spend for this execution</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Duration</h4>
                                            <div className="text-2xl font-mono text-blue-400">{call.duration}s</div>
                                            <div className="text-xs text-slate-600 mt-1">Connection time</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-slate-400 text-sm font-medium">Raw Usage Metadata</h4>
                                        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-400 overflow-x-auto">
                                            <pre>{JSON.stringify(call.usage_metadata || {}, null, 2)}</pre>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-slate-400 text-sm font-medium">Termination Reason</h4>
                                        <p className="text-sm text-slate-300 bg-slate-900 p-3 rounded border border-slate-800/50">
                                            {call.termination_reason || "Normal Completion"}
                                        </p>
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Audio Player Footer */}
                {call.recording_url && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-4">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-full"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                        </Button>

                        <div className="flex-1">
                            {/* 
                  Hidden audio element controlled by React state.
                  Using a progress bar here would be ideal next step.
                 */}
                            <audio
                                ref={audioRef}
                                src={call.recording_url}
                                onEnded={() => setIsPlaying(false)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                {/* Mock progress bar for visual style - actual progress binding would need onTimeUpdate */}
                                <div className={`h-full bg-indigo-500 transition-all duration-300 ${isPlaying ? 'w-2/3 animate-pulse' : 'w-0'}`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono uppercase">
                                <span>Wait to buffer...</span>
                                <span>Recording Available</span>
                            </div>
                        </div>

                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" asChild>
                            <a href={call.recording_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
