"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search,
    Database,
    Table as TableIcon,
    ArrowRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Papa from 'papaparse';
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CsvUploadCardProps {
    onSuccess?: (campaignId: string) => void;
    onCancel?: () => void;
    className?: string;
    mode?: 'create' | 'edit';
    campaignId?: string;
    onLeadsUpdated?: () => void;
}

type Stage = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'UPLOADING' | 'DONE' | 'ORCHESTRATION';

import { CampaignComposer } from './CampaignComposer';
import { ProcessingLog } from './ProcessingLog';

import { useLocalStorage } from "@/hooks/use-local-storage";

export function CsvUploadCard({ onSuccess, onCancel, className, mode = 'create', campaignId: propCampaignId, onLeadsUpdated }: CsvUploadCardProps) {
    // Dynamic storage key to avoid collisions between create and edit flows
    const storageKey = mode === 'edit' && propCampaignId
        ? `csv_upload_edit_${propCampaignId}`
        : 'csv_upload_state';

    const [persistedState, setPersistedState, removePersistedState] = useLocalStorage(storageKey, {
        stage: 'UPLOAD' as Stage,
        headers: [] as string[],
        data: [] as any[],
        mapping: {
            customer_name: '',
            contact_number: '',
            cohort: ''
        },
        campaignName: '',
        campaignId: null as string | null
    });

    const { stage, headers, data, mapping, campaignName, campaignId } = persistedState;
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Duplicate Detection State
    const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = useState(false);
    const [duplicateCampaignInfo, setDuplicateCampaignInfo] = useState<{ id: string, name: string, date: string } | null>(null);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            handleFileSelect(droppedFile);
        } else {
            toast.error("Please upload a valid CSV file");
        }
    }, [mode]);

    const handleFileSelect = (file: File) => {
        setFile(file);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const detectedHeaders = Object.keys(results.data[0] as object);

                    // Auto-mapping logic
                    const newMapping = { ...persistedState.mapping };
                    detectedHeaders.forEach(h => {
                        const low = h.toLowerCase();
                        if (low.includes('name')) newMapping.customer_name = h;
                        if (low.includes('phone') || low.includes('number') || low.includes('contact')) newMapping.contact_number = h;
                        if (low.includes('cohort') || low.includes('segment') || low.includes('group')) newMapping.cohort = h;
                    });

                    setPersistedState(prev => ({
                        ...prev,
                        headers: detectedHeaders,
                        data: results.data,
                        mapping: newMapping,
                        stage: 'MAPPING'
                    }));
                } else {
                    toast.error("The CSV file appears to be empty");
                }
            },
            error: (error) => {
                toast.error(`Error parsing CSV: ${error.message}`);
            }
        });
    };

    const handleCreateCampaign = async (forceCreate = false) => {
        if (!mapping.customer_name || !mapping.contact_number) {
            toast.error("Please map at least Name and Contact Number");
            return;
        }

        try {
            setIsProcessing(true);
            setPersistedState(prev => ({ ...prev, stage: 'UPLOADING' }));

            const leads = data.map(row => {
                const lead: any = {
                    customer_name: row[mapping.customer_name],
                    contact_number: String(row[mapping.contact_number]).trim(),
                    meta_data: row // Store original row as metadata
                };
                if (mapping.cohort && row[mapping.cohort]) {
                    lead.cohort = row[mapping.cohort];
                }
                return lead;
            });

            if (mode === 'edit' && propCampaignId) {
                // EDIT MODE: Update leads directly
                const payload = { leads };
                const response = await api.put(`/intelligence/campaigns/${propCampaignId}/leads`, payload);

                if (response.status === 'success') {
                    toast.success("Leads replaced successfully");
                    // Go directly to DONE, skip orchestration
                    setPersistedState(prev => ({
                        ...prev,
                        stage: 'DONE'
                    }));
                }
            } else {
                // CREATE MODE
                const payload: any = {
                    campaign_name: campaignName,
                    leads: leads
                };

                if (forceCreate) {
                    payload.force_create = true;
                }

                const response = await api.post("/intelligence/campaigns/create-from-csv", payload);

                if (response.status === 'success') {
                    setPersistedState(prev => ({
                        ...prev,
                        campaignId: response.campaign_id,
                        stage: 'ORCHESTRATION'
                    }));
                    // Defer onSuccess until orchestration is complete
                    setIsDuplicateAlertOpen(false);
                }
            }
        } catch (error: any) {
            // Check for duplicate upload (409 Conflict) PRIOR to logging error
            // Only relevant for create mode usually
            if (mode === 'create' && error.status === 409 && error.data?.code === 'DUPLICATE_UPLOAD') {
                console.log("Duplicate upload detected (handled gracefully)");
                setDuplicateCampaignInfo({
                    id: error.data.campaign_id,
                    name: error.data.campaign_name,
                    date: new Date(error.data.created_at).toLocaleDateString()
                });

                setIsDuplicateAlertOpen(true);
                setPersistedState(prev => ({ ...prev, stage: 'MAPPING' })); // Revert to mapping
                setIsProcessing(false);
                return;
            }

            console.error("Failed to process campaign:", error);
            toast.error(error.message || "Failed to process campaign");
            setPersistedState(prev => ({ ...prev, stage: 'MAPPING' }));
        } finally {
            if (!isDuplicateAlertOpen) {
                setIsProcessing(false);
            }
        }
    };

    const handleEditExisting = () => {
        if (duplicateCampaignInfo) {
            setPersistedState(prev => ({
                ...prev,
                campaignId: duplicateCampaignInfo.id,
                stage: 'ORCHESTRATION'
            }));
            setIsDuplicateAlertOpen(false);
            setDuplicateCampaignInfo(null);
        }
    };

    const handleForceCreate = () => {
        setIsDuplicateAlertOpen(false);
        setDuplicateCampaignInfo(null);
        handleCreateCampaign(true);
    };

    const reset = () => {
        removePersistedState();
        setFile(null);
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            reset();
        }
    };


    if (stage === 'ORCHESTRATION' && campaignId) {
        return (
            <CampaignComposer
                campaignId={campaignId}
                onBack={() => setPersistedState(prev => ({ ...prev, stage: 'MAPPING' }))}
                onComplete={() => {
                    setPersistedState(prev => ({ ...prev, stage: 'DONE' }));
                    if (onSuccess && campaignId) onSuccess(campaignId);
                }}
                className={className}
            />
        );
    }

    return (
        <Card className={cn(
            "overflow-hidden border-gray-100/50 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] backdrop-blur-md rounded-[2.5rem] relative group min-h-[550px] flex flex-col",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />

            {/* Cancel Button - Only show when onCancel is provided (modal context) */}
            {onCancel && (
                <div className="absolute top-4 right-4 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancel();
                        }}
                        className="rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            )}

            <CardContent className="p-8 md:p-12 flex flex-col h-full relative z-10 flex-1">
                {stage === 'UPLOAD' && (
                    <div
                        className="flex-1 flex flex-col items-center justify-center border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02] rounded-[2rem] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all cursor-pointer group/upload"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                        onClick={() => document.getElementById('csv-upload')?.click()}
                    >
                        <input
                            type="file"
                            id="csv-upload"
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500">
                            <Upload className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold dark:text-white mb-2">Upload Customer Dataset</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center">
                            Drag and drop your CSV file here, or click to browse.
                        </p>
                        <div className="mt-8 flex items-center gap-4 text-xs font-bold text-gray-400 group-hover/upload:text-indigo-400 transition-colors">
                            <span>Name</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                            <span>Phone</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                            <span>Cohort</span>
                        </div>
                    </div>
                )}

                {stage === 'MAPPING' && (
                    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-[1.25rem] bg-indigo-500/10 text-indigo-500 shadow-sm">
                                    <TableIcon className="w-8 h-8" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-2xl font-bold dark:text-white tracking-tight">Map Data Columns</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic">"Connect your CSV architecture to our intelligence engine."</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                {mode === 'create' && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Campaign Identity</label>
                                        <Input
                                            placeholder="Enter campaign name (e.g., Q1 Retention)"
                                            value={campaignName}
                                            onChange={(e) => setPersistedState(prev => ({ ...prev, campaignName: e.target.value }))}
                                            className="rounded-2xl h-12 bg-white/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/10 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Column Mapping</label>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.05]">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Customer Name</span>
                                            <Select value={mapping.customer_name} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, customer_name: val }
                                            }))}>
                                                <SelectTrigger className="w-[180px] h-9 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.05]">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone Number</span>
                                            <Select value={mapping.contact_number} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, contact_number: val }
                                            }))}>
                                                <SelectTrigger className="w-[180px] h-9 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.05]">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cohort (Optional)</span>
                                            <Select value={mapping.cohort} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, cohort: val }
                                            }))}>
                                                <SelectTrigger className="w-[180px] h-9 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                                    <SelectItem value="none">None</SelectItem>
                                                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-4">Data Preview ({data.length} records)</label>
                                <div className="flex-1 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-100/50 dark:bg-white/5">
                                                    {headers.slice(0, 3).map(h => (
                                                        <th key={h} className="px-3 py-2 font-bold text-gray-500 uppercase">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {data.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/[0.02]">
                                                        {headers.slice(0, 3).map(h => (
                                                            <td key={h} className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{row[h]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Verify that phone numbers include country codes.</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-4 mt-auto">
                            <Button
                                onClick={() => handleCreateCampaign(false)}
                                disabled={isProcessing}
                                size="lg"
                                className="rounded-2xl h-14 px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-gray-100 font-bold group"
                            >
                                {isProcessing ? "Processing..." : (mode === 'edit' ? "Update Campaign Leads" : "Create Development Batch")}
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                )}

                {stage === 'UPLOADING' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500 w-full">
                        <ProcessingLog data={data} mapping={mapping} />
                    </div>
                )}

                {stage === 'DONE' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold dark:text-white">
                                {mode === 'edit' ? "Leads Updated" : "Batch Created"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                {mode === 'edit'
                                    ? <>{data.length} customer records have been successfully updated.</>
                                    : <>{data.length} customers have been successfully added. You can now use this dataset for high-intent interviews.</>
                                }
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {mode === 'edit' ? (
                                <Button onClick={() => {
                                    if (onLeadsUpdated) onLeadsUpdated();
                                    else window.location.reload();
                                }} className="rounded-2xl h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white">
                                    Return to Campaign
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={reset} className="rounded-2xl h-12 px-8">
                                        Upload Another
                                    </Button>
                                    <Button onClick={() => {
                                        // Reset the upload state
                                        reset();

                                        // Scroll to Latest Campaigns section with smooth behavior
                                        setTimeout(() => {
                                            const campaignsList = document.getElementById('latest-campaigns');
                                            if (campaignsList) {
                                                const yOffset = -80; // Offset from top for better visibility
                                                const y = campaignsList.getBoundingClientRect().top + window.pageYOffset + yOffset;

                                                window.scrollTo({
                                                    top: y,
                                                    behavior: 'smooth'
                                                });
                                            }
                                        }, 100);
                                    }} className="rounded-2xl h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white">
                                        View Campaigns
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}



                <AlertDialog open={isDuplicateAlertOpen} onOpenChange={setIsDuplicateAlertOpen}>
                    <AlertDialogContent className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/10 rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold dark:text-white">Duplicate Data Detected</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                                This customer data looks identical to a previous upload
                                {duplicateCampaignInfo && <span className="font-semibold text-gray-700 dark:text-gray-300"> ({duplicateCampaignInfo.name}) </span>}
                                from {duplicateCampaignInfo?.date}.
                                <br /><br />
                                Would you like to edit the existing campaign or create a new one?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel onClick={() => setIsDuplicateAlertOpen(false)} className="rounded-xl">Cancel</AlertDialogCancel>
                            <Button variant="outline" onClick={handleForceCreate} className="rounded-xl border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300">
                                Create New
                            </Button>
                            <Button onClick={handleEditExisting} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                Edit Existing Campaign
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card >
    );
}
