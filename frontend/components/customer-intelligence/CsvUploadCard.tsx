"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Table as TableIcon,
    ArrowRight,
    Loader2,
    RefreshCcw,
    AlertTriangle
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
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface CsvUploadCardProps {
    onSuccess?: (campaignId: string) => void;
    onCancel?: () => void;
    className?: string;
    mode?: 'create' | 'edit';
    campaignId?: string;
    onLeadsUpdated?: () => void;
}

type Stage = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'UPLOADING' | 'DONE' | 'ORCHESTRATION' | 'ERROR';

import { CampaignComposer } from './CampaignComposer';
import { ProcessingLog } from './ProcessingLog';

import { useSessionStorage } from "@/hooks/use-session-storage";
import { useAuth } from "@/context/auth-context";

export function CsvUploadCard({ onSuccess, onCancel, className, mode = 'create', campaignId: propCampaignId, onLeadsUpdated }: CsvUploadCardProps) {
    const { companyId: authCompanyId, user } = useAuth();

    // Dynamic storage key to avoid collisions between create and edit flows
    const storageKey = mode === 'edit' && propCampaignId
        ? `csv_upload_edit_${propCampaignId}`
        : `csv_upload_state_${authCompanyId || 'default'}`;

    const [persistedState, setPersistedState, removePersistedState] = useSessionStorage(storageKey, {
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

    // Force reset to UPLOAD stage when mode or campaignId changes to ensure fresh start
    // This is critical for edit mode to work on first attempt
    useEffect(() => {
        console.log("CsvUpload: Init Effect triggered", { mode, propCampaignId, currentStage: persistedState.stage, hasFile: !!file });

        // In edit mode: ALWAYS reset if the campaign ID changes or if we are mounting fresh.
        // This ensures that clicking "Edit Campaign" always starts at the Upload screen.
        if (mode === 'edit' && propCampaignId) {
            console.log("CsvUpload: Enforcing fresh start for edit mode");
            // Clear ALL data for this campaign's edit session to ensure clean slate
            setPersistedState({
                stage: 'UPLOAD',
                headers: [],
                data: [],
                mapping: { customer_name: '', contact_number: '', cohort: '' },
                campaignName: '',
                campaignId: null
            });
            setFile(null);
            setIsProcessing(false);
            setErrorResult(null);
        }
        // In create mode, only reset if we're not in UPLOAD stage and have no file
        else if (mode === 'create' && !file && persistedState.stage !== 'UPLOAD') {
            console.log("CsvUpload: Resetting stale create state");
            setPersistedState(prev => ({
                ...prev,
                stage: 'UPLOAD',
                data: [],
                headers: [],
                mapping: { customer_name: '', contact_number: '', cohort: '' }
            }));
        }
    }, [mode, propCampaignId]);


    // Cleanup on unmount removed to prevents accidental state loss during re-renders.
    // We will rely on explicit Cancel/Success actions to clean up.

    const { stage, headers, data, mapping, campaignName, campaignId } = persistedState;
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorResult, setErrorResult] = useState<{ title: string; message: string; canRetry: boolean } | null>(null);

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
    }, [mode]); // Dependencies will be updated via handleFileSelect

    const handleFileSelect = useCallback((file: File) => {
        console.log("CsvUpload: Handling file selection", file.name);
        setFile(file);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log("CsvUpload: Parse complete", { rows: results.data.length, fields: results.meta.fields });
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
                console.error("CsvUpload: Parse error", error);
                toast.error(`Error parsing CSV: ${error.message}`);
            }
        });
    }, [persistedState.mapping, setPersistedState]);

    /**
     * Pre-flight check to ensure auth and company ID are ready.
     * This fixes the silent failure where companyId was undefined on first load.
     */
    const validateAuth = async (): Promise<boolean> => {
        try {
            // 1. Check if user is logged in
            if (!user) {
                console.error("CsvUpload: No user validated during pre-flight check");
                toast.error("Authentication check failed. Please refresh page.");
                return false;
            }

            // 2. Check if company ID is available
            // If authCompanyId is missing, try to fetch it or wait a moment
            if (!authCompanyId) {
                console.warn("CsvUpload: Company ID missing in context. Attempting to retrieve...");
                // Just a fallback check on localStorage directly as a hail mary
                const storedCompanyId = localStorage.getItem('unclutr_company_id');
                if (!storedCompanyId) {
                    console.error("CsvUpload: Company ID completely missing.");
                    toast.error("Organization context missing. Please refresh page.");
                    return false;
                }
                console.log("CsvUpload: Recovered Company ID from storage:", storedCompanyId);
                return true;
            }

            return true;
        } catch (err) {
            console.error("CsvUpload: Auth validation error", err);
            return false;
        }
    };

    const handleCreateCampaign = async (forceCreate = false) => {
        console.log("CsvUpload: Starting campaign creation/update", { mode, campaignId: propCampaignId });

        if (!mapping.customer_name || !mapping.contact_number) {
            toast.error("Please map at least Name and Contact Number");
            return;
        }

        // Run validation first
        setIsProcessing(true);
        const isValid = await validateAuth();
        if (!isValid) {
            console.warn("CsvUpload: Auth validation failed");
            setIsProcessing(false);
            return; // Toast already shown
        }

        try {
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
                console.log(`CsvUpload: Updating leads for campaign ${propCampaignId}`);
                const payload = { leads };
                const response = await api.put(`/intelligence/campaigns/${propCampaignId}/leads`, payload);
                console.log("CsvUpload: Update response", response);

                if (response.status === 'success') {
                    toast.success("Leads replaced successfully");
                    // Go directly to DONE, skip orchestration
                    setPersistedState(prev => ({
                        ...prev,
                        stage: 'DONE'
                    }));
                } else {
                    console.error("CsvUpload: Non-success status", response);
                    throw new Error(response.message || "Failed to update leads (Unknown error)");
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

                console.log("CsvUpload: Submitting payload...", { leadCount: leads.length, forceCreate });
                const response = await api.post("/intelligence/campaigns/create-from-csv", payload);

                if (response.status === 'success') {
                    console.log("CsvUpload: Success!", response);
                    setPersistedState(prev => ({
                        ...prev,
                        campaignId: response.campaign_id,
                        stage: 'ORCHESTRATION'
                    }));
                    // Defer onSuccess until orchestration is complete
                    setIsDuplicateAlertOpen(false);
                } else {
                    throw new Error("Unexpected response status: " + response.status);
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

            // Set error state for UI display
            setErrorResult({
                title: "Upload Failed",
                message: error.message || "Failed to process campaign. Please try again.",
                canRetry: true
            });
            setPersistedState(prev => ({ ...prev, stage: 'ERROR' }));

            toast.error(error.message || "Failed to process campaign");
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

    const reset = useCallback(() => {
        removePersistedState();
        setFile(null);
        setErrorResult(null);
        setIsProcessing(false);
    }, [removePersistedState]);

    useEffect(() => {
        if (stage === 'DONE') {
            const timer = setTimeout(() => {
                reset();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [stage, reset]);

    // Safety check: If we mount in UPLOADING stage but isProcessing is false, 
    // it means the session was interrupted. Revert to MAPPING to avoid being stuck.
    useEffect(() => {
        if (stage === 'UPLOADING' && !isProcessing) {
            // Small delay to allow react to hydration
            const t = setTimeout(() => {
                setPersistedState(prev => ({ ...prev, stage: 'MAPPING' }));
            }, 500);
            return () => clearTimeout(t);
        }
    }, []);

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
                onError={(error) => {
                    if (error.status === 404) {
                        toast.error("Session expired: Campaign not found. Starting fresh.");
                        removePersistedState();
                        setFile(null);
                        // Optional: Reset parent if needed, but removePersistedState handles the internal state
                        if (onCancel) onCancel();
                    }
                }}
                className={className}
            />
        );
    }

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-700 ease-out",
            "border-white/10 dark:border-white/5 backdrop-blur-2xl shadow-2xl",
            "bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-white/10 rounded-[2.5rem]",
            className
        )}>
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000 overflow-hidden opacity-100">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(99,102,241,0.08),transparent_50%)]" />
                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_100%,rgba(16,185,129,0.05),transparent_50%)]" />
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Cancel Button - Only show when onCancel is provided (modal context) */}
            {onCancel && (
                <div className="absolute top-6 right-6 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancel();
                        }}
                        className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors w-10 h-10"
                    >
                        <X className="w-5 h-5 opacity-70" />
                    </Button>
                </div>
            )}

            <CardContent className="p-8 md:p-12 flex flex-col h-full relative z-10 flex-1">
                {stage === 'UPLOAD' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex-1 flex flex-col items-center justify-center p-8 md:p-12"
                    >
                        <div
                            className={cn(
                                "relative w-full max-w-2xl aspect-[1.8/1] flex flex-col items-center justify-center",
                                "rounded-[3rem] overflow-hidden transition-all duration-500",
                                "group/upload cursor-pointer"
                            )}
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

                            {/* Organic Portal Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/50 to-indigo-100/30 dark:from-indigo-900/10 dark:via-zinc-900/40 dark:to-zinc-800/20 backdrop-blur-md transition-all duration-700 group-hover/upload:scale-105" />

                            {/* Glowing Orbs - Portal Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] opacity-60 group-hover/upload:opacity-100 transition-all duration-1000 group-hover/upload:scale-110" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[60px] opacity-40 group-hover/upload:opacity-80 transition-all duration-1000 delay-100 animate-pulse" />

                            {/* Border Glow (Instead of Dashed Line) */}
                            <div className="absolute inset-0 border border-indigo-500/10 dark:border-white/10 rounded-[3rem] transition-all duration-500 group-hover/upload:border-indigo-500/30 group-hover/upload:shadow-[0_0_40px_-10px_rgba(99,102,241,0.15)]" />

                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <motion.div
                                    whileHover={{ y: -5, scale: 1.05 }}
                                    className="relative w-28 h-28 mb-2"
                                >
                                    {/* Icon Background */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] opacity-10 dark:opacity-20 blur-xl group-hover/upload:blur-2xl transition-all duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 rounded-[2rem] border border-white/40 dark:border-white/10 shadow-xl shadow-indigo-500/10 flex items-center justify-center">
                                        <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                    </div>

                                    {/* Floating Particles/Badge */}
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20"
                                    >
                                        CSV
                                    </motion.div>
                                </motion.div>

                                <div className="space-y-3 max-w-md">
                                    <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-zinc-800 to-indigo-600 dark:from-white dark:via-indigo-200 dark:to-indigo-400 tracking-tight">
                                        Upload Dataset
                                    </h3>
                                    <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                                        Drag & drop your customer file to begin <br />
                                        <span className="text-indigo-500 dark:text-indigo-400 opacity-80">Automatic Column Mapping Active</span>
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Indicators */}
                            <div className="absolute bottom-8 flex items-center gap-6 opacity-60 group-hover/upload:opacity-100 transition-opacity duration-500">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Name
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Phone
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                    Cohort
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {stage === 'MAPPING' && (
                    <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">

                                <div className="relative group">
                                    <div className="absolute -inset-2 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/10">
                                        <TableIcon className="w-8 h-8" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-extrabold dark:text-white tracking-tight leading-none">Map Data Columns</h3>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Connect your CSV architecture to our intelligence engine.</p>
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
                                            className="rounded-2xl h-14 bg-white/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/10 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium text-lg px-6"
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Column Mapping</label>

                                    <div className="space-y-4">
                                        <div className="group/row flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/[0.05] hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all">
                                            <div className="space-y-1">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Customer Name</span>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-60">Primary Identifier</p>
                                            </div>
                                            <Select value={mapping.customer_name} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, customer_name: val }
                                            }))}>
                                                <SelectTrigger className="w-[180px] h-11 rounded-xl border-gray-100 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                                    {headers.map(h => <SelectItem key={h} value={h} className="rounded-lg">{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="group/row flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/[0.05] hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all">
                                            <div className="space-y-1">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Phone Number</span>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-60">Reachability</p>
                                            </div>
                                            <Select value={mapping.contact_number} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, contact_number: val }
                                            }))}>
                                                <SelectTrigger className="w-[180px] h-11 rounded-xl border-gray-100 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                                    {headers.map(h => <SelectItem key={h} value={h} className="rounded-lg">{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="group/row flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/[0.05] hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all">
                                            <div className="space-y-1">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cohort (Optional)</span>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-60">Segmentation</p>
                                            </div>
                                            <Select value={mapping.cohort} onValueValue={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, cohort: val }
                                            }))} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, cohort: val }
                                            }))}>
                                                <SelectTrigger className="w-[180px] h-11 rounded-xl border-gray-100 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                                                    <SelectItem value="none" className="rounded-lg">None</SelectItem>
                                                    {headers.map(h => <SelectItem key={h} value={h} className="rounded-lg">{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <div className="flex flex-col space-y-4 h-full">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Data Preview ({data.length} records)</label>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Live View</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 rounded-[2rem] border border-gray-100 dark:border-white/10 bg-white/30 dark:bg-black/40 backdrop-blur-sm overflow-hidden shadow-sm relative">
                                        <div className="absolute inset-0 overflow-auto custom-scrollbar">
                                            <table className="w-full text-[11px] text-left border-collapse">
                                                <thead className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
                                                    <tr className="border-b border-gray-100 dark:border-white/5">
                                                        {headers.slice(0, 3).map(h => (
                                                            <th key={h} className="px-5 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100/50 dark:divide-white/[0.03]">
                                                    {data.slice(0, 15).map((row, i) => (
                                                        <tr key={i} className="hover:bg-indigo-500/[0.02] transition-colors">
                                                            {headers.slice(0, 3).map(h => (
                                                                <td key={h} className="px-5 py-3 text-gray-600 dark:text-gray-400 font-medium truncate max-w-[120px]">
                                                                    {row[h]}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/[0.03] dark:bg-amber-500/5 border border-amber-500/10 group/alert hover:bg-amber-500/[0.05] transition-all">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 shadow-sm">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-semibold tracking-tight">Verify that phone numbers include country codes for global reach.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 mt-auto">
                            <Button
                                variant="ghost"
                                onClick={() => setPersistedState(prev => ({ ...prev, stage: 'UPLOAD' }))}
                                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => handleCreateCampaign(false)}
                                disabled={isProcessing}
                                size="lg"
                                className="relative group overflow-hidden rounded-2xl h-14 px-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-gray-100 font-bold transition-all shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center">
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Processing Analysis...
                                        </>
                                    ) : (mode === 'edit' ? "Update Campaign Leads" : "Create Intelligence Batch")}
                                    {!isProcessing && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </Button>
                        </div>
                    </div>
                )}

                {stage === 'UPLOADING' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500 w-full">
                        <ProcessingLog data={data} mapping={mapping} />
                    </div>
                )}

                {stage === 'ERROR' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center"
                    >
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                            <AlertTriangle className="w-10 h-10" />
                        </div>

                        <div className="space-y-2 max-w-md">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {errorResult?.title || "Upload Failed"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {errorResult?.message || "Something went wrong while uploading your CSV. Please try again."}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setPersistedState(prev => ({ ...prev, stage: 'MAPPING' }))}
                                className="rounded-xl"
                            >
                                Back to Mapping
                            </Button>
                            <Button
                                onClick={() => handleCreateCampaign(false)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 gap-2"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Try Again
                            </Button>
                        </div>
                    </motion.div>
                )}

                {stage === 'DONE' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center space-y-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                {mode === 'edit' ? "Leads Updated" : "Batch Created"}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
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
                                }} className="rounded-2xl h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl shadow-indigo-500/10">
                                    Return to Campaign
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={reset} className="rounded-2xl h-12 px-8 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
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
                                    }} className="rounded-2xl h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 font-bold">
                                        View Campaigns
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}



                <AlertDialog open={isDuplicateAlertOpen} onOpenChange={setIsDuplicateAlertOpen}>
                    <AlertDialogContent className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-gray-100 dark:border-white/10 rounded-[2rem] shadow-2xl">
                        <AlertDialogHeader>
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <AlertDialogTitle className="text-xl font-extrabold dark:text-white">Duplicate Data Detected</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-500 dark:text-gray-400 font-medium">
                                This customer data looks identical to a previous upload
                                {duplicateCampaignInfo && <span className="font-bold text-gray-900 dark:text-gray-200"> ({duplicateCampaignInfo.name}) </span>}
                                from {duplicateCampaignInfo?.date}.
                                <br /><br />
                                Would you like to edit the existing campaign or create a new one?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel onClick={() => setIsDuplicateAlertOpen(false)} className="rounded-xl border-none bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10">Cancel</AlertDialogCancel>
                            <Button variant="outline" onClick={handleForceCreate} className="rounded-xl border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold">
                                Create New
                            </Button>
                            <Button onClick={handleEditExisting} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20">
                                Edit Existing Campaign
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card >
    );
}
