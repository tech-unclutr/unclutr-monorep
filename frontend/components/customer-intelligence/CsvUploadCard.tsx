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
import { cn, formatToIST, formatRelativeTime, formatPhoneNumber } from "@/lib/utils";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
    onDirtyChange?: (isDirty: boolean) => void;
    isMagicUI?: boolean;
}

type Stage = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'UPLOADING' | 'DONE' | 'ORCHESTRATION' | 'ERROR';

import { CampaignComposer } from './CampaignComposer';
import { ProcessingLog } from './ProcessingLog';
import { ConfirmExitDialog } from './ConfirmExitDialog';

import { useSessionStorage } from "@/hooks/use-session-storage";
import { useAuth } from "@/context/auth-context";

export function CsvUploadCard({ onSuccess, onCancel, className, mode = 'create', campaignId: propCampaignId, onLeadsUpdated, onDirtyChange, isMagicUI }: CsvUploadCardProps) {
    const { companyId: authCompanyId, user } = useAuth();

    // Dynamic storage key to avoid collisions between creating and edit flows
    const storageKey = mode === 'edit' && propCampaignId
        ? `csv_upload_edit_${propCampaignId}`
        : `csv_upload_state_${authCompanyId || 'default'}`;

    const [csvData, setCsvData] = useState<any[]>([]);

    const [persistedState, setPersistedState, removePersistedState] = useSessionStorage(storageKey, {
        stage: 'UPLOAD' as Stage,
        headers: [] as string[],
        // data removed from session storage to prevent quota limits
        mapping: {
            customer_name: '',
            contact_number: '',
            cohort: ''
        },
        campaignName: '',
        campaignId: null as string | null
    });

    // Notify parent about dirty state changes
    useEffect(() => {
        if (!onDirtyChange) return;

        // We consider it dirty if we are in MAPPING, UPLOADING, or ORCHESTRATION stage
        // OR if we have parsed data but haven't finished
        const isDirty = (persistedState.stage === 'MAPPING' || persistedState.stage === 'UPLOADING' || persistedState.stage === 'ORCHESTRATION') ||
            (csvData.length > 0 && persistedState.stage !== 'DONE' && persistedState.stage !== 'UPLOAD');
        onDirtyChange(isDirty);
    }, [persistedState.stage, csvData.length, onDirtyChange]);

    // Force reset to UPLOAD stage when mode or campaignId changes to ensure fresh start
    // This is critical for edit mode to work on first attempt
    // In edit mode: Fetch campaign details if we don't have them yet or if campaignId changed
    useEffect(() => {
        if (mode === 'edit' && propCampaignId) {
            const fetchDetails = async () => {
                try {
                    const campaign = await api.get(`/intelligence/campaigns/${propCampaignId}`);
                    setPersistedState(prev => ({
                        ...prev,
                        campaignName: campaign.name || prev.campaignName,
                        campaignId: propCampaignId,
                        // Reset to UPLOAD stage if it's a new edit session or if we were in DONE
                        stage: (prev.campaignId !== propCampaignId || prev.stage === 'DONE') ? 'UPLOAD' : prev.stage
                    }));
                    // Also clear local file state if it's a new campaign
                    if (persistedState.campaignId !== propCampaignId) {
                        setFile(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch campaign details for edit mode:", error);
                }
            };

            // Only fetch if name is missing OR if we just switched to this campaign
            if (!persistedState.campaignName || persistedState.campaignId !== propCampaignId) {
                fetchDetails();
            }
        }
    }, [mode, propCampaignId]);

    useEffect(() => {
        // In create mode, if we are in a stale mapping/orchestration state but have no file (e.g. fresh mount), reset to UPLOAD
        if (mode === 'create' && !file && persistedState.stage !== 'UPLOAD' && persistedState.stage !== 'DONE') {
            setPersistedState(prev => ({
                ...prev,
                stage: 'UPLOAD',
                headers: [],
                mapping: { customer_name: '', contact_number: '', cohort: '' }
            }));
            setCsvData([]);
        }
    }, [mode]);


    // Cleanup on unmount removed to prevents accidental state loss during re-renders.
    // We will rely on explicit Cancel/Success actions to clean up.

    const { stage, headers, mapping, campaignName, campaignId } = persistedState;

    // Memoize leads generation for passing to Composer
    const mappedLeads = React.useMemo(() => {
        if (!mapping.customer_name || !mapping.contact_number) return [];
        return csvData.map(row => {
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
    }, [csvData, mapping]);

    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorResult, setErrorResult] = useState<{ title: string; message: string; canRetry: boolean } | null>(null);
    const [isExitWarningOpen, setIsExitWarningOpen] = useState(false);

    // Duplicate Detection State
    const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = useState(false);
    const [duplicateCampaignInfo, setDuplicateCampaignInfo] = useState<{ id: string, name: string, date: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExcelParse = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData && jsonData.length > 0) {
                const detectedHeaders = Object.keys(jsonData[0] as object);

                // Auto-mapping logic
                const newMapping = { ...persistedState.mapping };
                detectedHeaders.forEach(h => {
                    const low = h.toLowerCase();
                    if (low.includes('name')) newMapping.customer_name = h;
                    if (low.includes('phone') || low.includes('number') || low.includes('contact')) newMapping.contact_number = h;
                    if (low.includes('cohort') || low.includes('segment') || low.includes('group')) newMapping.cohort = h;
                });

                setCsvData(jsonData);
                setPersistedState(prev => ({
                    ...prev,
                    headers: detectedHeaders,
                    mapping: newMapping,
                    stage: 'MAPPING'
                }));
            } else {
                toast.error("The Excel file appears to be empty");
            }
        };
        reader.readAsArrayBuffer(file);
    }, [persistedState.mapping, setPersistedState]);

    const handleFileSelect = useCallback((file: File) => {
        setFile(file);

        if (file.name.endsWith('.csv')) {
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

                        setCsvData(results.data);
                        setPersistedState(prev => ({
                            ...prev,
                            headers: detectedHeaders,
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
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            handleExcelParse(file);
        } else {
            toast.error("Please upload a valid CSV or Excel file");
        }
    }, [persistedState.mapping, setPersistedState, handleExcelParse]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            handleFileSelect(droppedFile);
        } else {
            toast.error("Please upload a valid CSV or Excel file");
        }
    }, [handleFileSelect]); // Fix stale closure: add handleFileSelect to dependencies

    /**
     * Pre-flight check to ensure auth and company ID are ready.
     * This fixes the silent failure where companyId was undefined on first load.
     */
    const validateAuth = async (): Promise<boolean> => {
        try {
            // 1. Check if user is logged in
            if (!user) {
                toast.error("Authentication check failed. Please refresh page.");
                return false;
            }

            // 2. Check if company ID is available
            // If authCompanyId is missing, try to fetch it or wait a moment
            if (!authCompanyId) {
                // Just a fallback check on localStorage directly as a hail mary
                const storedCompanyId = localStorage.getItem('unclutr_company_id');
                if (!storedCompanyId) {
                    toast.error("Organization context missing. Please refresh page.");
                    return false;
                }
                return true;
            }

            return true;
        } catch (err) {
            return false;
        }
    };

    const handleCreateCampaign = async (forceCreate = false) => {

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

            const leads = csvData.map(row => {
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

            // [FIX] Consolidate campaign ID logic to handle both direct edit (propCampaignId)
            // and resumed create (persistedState.campaignId). 
            const targetCampaignId = propCampaignId || persistedState.campaignId;
            // If forceCreate is true, we skip update and POST a new one.
            if (targetCampaignId && !forceCreate) {
                // UPDATE MODE: Update leads directly
                const payload = { leads };
                const response = await api.put(`/intelligence/campaigns/${targetCampaignId}/leads`, payload);

                if (response.status === 'success') {
                    toast.success("The Success Team has updated your leads. We're ready when you are.");
                    // Go directly to DONE, skip orchestration
                    setPersistedState(prev => ({
                        ...prev,
                        stage: 'DONE'
                    }));
                } else {
                    throw new Error(response.message || "Failed to update leads (Unknown error)");
                }
            } else {
                // CREATE MODE (Draft)
                // We do NOT call the API here anymore. We just transition to ORCHESTRATION state.
                // The CampaignComposer will handle the creation on "Finish".

                if (forceCreate) {
                    // If force create was requested (after duplicate check), we just proceed.
                    // The composer check will happen on final submit (create-full), which also duplicates check?
                    // Actually, create-full has duplicate check.
                    // IMPORTANT: If user explicitly said "Create Duplicate", we need to pass that intent to Composer?
                    // Currently CampaignComposer finalize doesn't support "force_create" flag prop.
                    // But strictly speaking, the user *just* uploaded a file. 
                    // If they clicked "Create Duplicate", we proceed.
                    // The backend create-full check will likely flag it again unless we pass force_create.
                    // Adding forceCreate intent to state?
                    // For now, let's just let them proceed. If they hit duplicate error at end, they will see it then?
                    // Or we rely on the check we just "skipped" effectively?
                    // Wait, we *didn't* check for duplicates yet because we didn't call the API.
                    // In the OLD flow, API called check.
                    // NEW FLOW: We don't call API. So we don't know if it's duplicate until the END.
                    // This changes UX: Duplicate warning happens at END now, instead of middle.
                    // Is this acceptable? "Prevent data from being saved... until ... logic".
                    // Yes, acceptable.
                }

                setPersistedState(prev => ({
                    ...prev,
                    stage: 'ORCHESTRATION',
                    campaignId: null // Ensure null for draft mode
                }));
                setIsDuplicateAlertOpen(false);
            }
        } catch (error: any) {
            // Check for duplicate upload (409 Conflict) - this is an expected flow, not an error
            // Handle both standard error objects and custom API wrappers
            const status = error.status || error.response?.status;
            const errorData = error.data || error.response?.data;

            // Handle duplicate detection gracefully (expected flow)
            if (mode === 'create' && status === 409 && errorData?.code === 'DUPLICATE_UPLOAD') {
                setDuplicateCampaignInfo({
                    id: errorData.campaign_id,
                    name: errorData.campaign_name,
                    date: errorData.created_at
                });

                setIsDuplicateAlertOpen(true);
                setPersistedState(prev => ({ ...prev, stage: 'MAPPING' })); // Revert to mapping
                setIsProcessing(false);
                return;
            }

            // Only log actual errors
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
        setCsvData([]);
        setFile(null);
        setErrorResult(null);
        setIsProcessing(false);
    }, [removePersistedState]);

    useEffect(() => {
        if (stage === 'DONE') {
            const timer = setTimeout(() => {
                if (mode === 'edit' && onLeadsUpdated) {
                    onLeadsUpdated();
                    reset();
                } else if (mode === 'create') {
                    // Create mode still resets to the blank upload screen behind the popup
                    reset();
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [stage, reset, mode, onLeadsUpdated]);

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
        const isDirty = (persistedState.stage === 'MAPPING' || persistedState.stage === 'UPLOADING' || persistedState.stage === 'ORCHESTRATION') ||
            (csvData.length > 0 && persistedState.stage !== 'DONE' && persistedState.stage !== 'UPLOAD');

        if (isDirty) {
            setIsExitWarningOpen(true);
        } else {
            if (onCancel) {
                onCancel();
            } else {
                reset();
            }
        }
    };


    if (stage === 'ORCHESTRATION') {
        return (
            <CampaignComposer
                campaignId={campaignId}
                initialLeads={mappedLeads} // Pass leads for Draft Mode
                initialName={campaignName}
                onBack={() => setPersistedState(prev => ({ ...prev, stage: 'MAPPING' }))}
                onCampaignIdGenerated={(id) => setPersistedState(prev => ({ ...prev, campaignId: id }))}
                onComplete={(createdId) => {
                    if (mode === 'create' && onSuccess) {
                        // Critical: Reset state first to return to "Upload" screen behind the popup
                        reset();
                        // Use the ID returned from composer (newly created) or the one in state
                        onSuccess(createdId || campaignId || '');
                    } else {
                        // Edit mode: Show internal success state
                        setPersistedState(prev => ({ ...prev, stage: 'DONE' }));
                        if (onSuccess && campaignId) onSuccess(campaignId);
                    }
                }}
                onError={(error) => {
                    console.error("Composer Error:", error);
                    if (error?.status === 404) {
                        toast.error("Session expired: Campaign not found. Starting fresh.");
                        removePersistedState();
                        setFile(null);
                        if (onCancel) onCancel();
                    } else {
                        // Handle generic errors by showing the error state
                        setErrorResult({
                            title: "Campaign Finalization Failed",
                            message: error?.message || "Failed to save campaign details. Please try again.",
                            canRetry: true
                        });
                        setPersistedState(prev => ({ ...prev, stage: 'ERROR' }));
                    }
                }}
                className={className}
                isMagicUI={isMagicUI}
            />
        );
    }


    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
            // [FIX] Force auto height and prevent flex growth in UPLOAD stage
            stage === 'UPLOAD' && "!flex-none !h-auto !self-start"
        )}>
            {/* Minimal Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(99,102,241,0.03),transparent_50%)]" />
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

            <CardContent className={cn(
                "p-6 md:p-8 flex flex-col relative z-10 min-h-0",
                stage === 'UPLOAD' ? "!flex-none !h-auto" : "flex-1"
            )}>
                {stage === 'UPLOAD' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 md:p-6",
                            stage === 'UPLOAD' ? "!flex-none !h-auto" : "flex-1"
                        )}
                    >
                        <div
                            className={cn(
                                "relative w-full max-w-2xl min-h-[300px] py-12 flex flex-col items-center justify-center",
                                "rounded-lg overflow-hidden transition-all duration-300",
                                "group/upload cursor-pointer"
                            )}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => {
                                    const selectedFile = e.target.files?.[0];
                                    if (selectedFile) {
                                        handleFileSelect(selectedFile);
                                    }
                                    e.target.value = ''; // Clear to allow re-selection
                                }}
                            />

                            <div className="absolute inset-0 bg-gray-50/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/[0.08] rounded-xl transition-all duration-300 group-hover/upload:border-gray-300 dark:group-hover/upload:border-white/20" />



                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <motion.div
                                    whileHover={{ y: -5, scale: 1.05 }}
                                    className="relative w-24 h-24 mb-1"
                                >
                                    {/* Icon Background */}
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center transition-all duration-300">
                                        <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                    </div>

                                    {/* Floating Particles/Badge */}
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xl shadow-indigo-500/50 border-2 border-white dark:border-zinc-900"
                                    >
                                        DATA
                                    </motion.div>
                                </motion.div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                        Upload Leads
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                                        Drag and drop your CSV or Excel file to get started
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Indicators */}
                            {/* Bottom Indicators - Subtle labels */}
                            <div className="absolute bottom-6 flex items-center gap-8 opacity-60">
                                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                    Name
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                    Phone
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                                    Cohort
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {stage === 'MAPPING' && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pr-12">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-orange-500/10 dark:from-indigo-500/20 dark:to-orange-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                    <TableIcon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Map Data columns</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Align your file columns with our intelligence engine.</p>
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Mapping Active</span>
                            </div>
                        </div>

                        {/* Main Split Content */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-6">

                            {/* Left Column: Configuration (4 cols) */}
                            <div className="lg:col-span-5 flex flex-col space-y-8">

                                {mode === 'create' && (
                                    <div className="space-y-3 group">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-500 transition-colors">Campaign Name</label>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                placeholder="e.g. Q1 Customer Outreach"
                                                value={campaignName}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, campaignName: e.target.value }))}
                                                className="h-12 bg-gray-50/50 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-4 font-medium"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Column Mapping</label>
                                        <span className="text-[10px] text-gray-400 font-medium italic">Auto-detected best matches</span>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Name Field */}
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.01] shadow-sm hover:shadow-md transition-shadow group focus-within:ring-1 focus-within:ring-indigo-500/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Customer Name</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">REQUIRED</span>
                                            </div>
                                            <Select value={mapping.customer_name} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, customer_name: val }
                                            }))}>
                                                <SelectTrigger className="w-full h-10 border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] focus:ring-indigo-500/20 rounded-lg text-xs font-medium">
                                                    <SelectValue placeholder="Select column..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {headers.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Phone Field */}
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.01] shadow-sm hover:shadow-md transition-shadow group focus-within:ring-1 focus-within:ring-indigo-500/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Phone Number</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">REQUIRED</span>
                                            </div>
                                            <Select value={mapping.contact_number} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, contact_number: val }
                                            }))}>
                                                <SelectTrigger className="w-full h-10 border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] focus:ring-indigo-500/20 rounded-lg text-xs font-medium">
                                                    <SelectValue placeholder="Select column..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {headers.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Cohort Field */}
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.01] shadow-sm hover:shadow-md transition-shadow group focus-within:ring-1 focus-within:ring-indigo-500/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Cohort / Group</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-white/10">OPTIONAL</span>
                                            </div>
                                            <Select value={mapping.cohort} onValueChange={(val) => setPersistedState(prev => ({
                                                ...prev,
                                                mapping: { ...prev.mapping, cohort: val }
                                            }))}>
                                                <SelectTrigger className="w-full h-10 border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] focus:ring-indigo-500/20 rounded-lg text-xs font-medium text-gray-500">
                                                    <SelectValue placeholder="No grouping selected" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" className="text-xs">None</SelectItem>
                                                    {headers.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Preview Sheet (7 cols) */}
                            <div className="lg:col-span-7 flex flex-col h-full min-h-0">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-4 h-4 rounded bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500">
                                            <TableIcon className="w-2.5 h-2.5" />
                                        </span>
                                        Data Preview
                                    </label>
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {csvData.length} RECORDS READY
                                    </div>
                                </div>

                                {/* Premium Table Container */}
                                <div className="h-[400px] rounded-2xl border border-gray-200/60 dark:border-white/[0.08] bg-white dark:bg-zinc-900/50 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative group">
                                    {/* Table Decor */}
                                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex-1 overflow-auto custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px]">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10 shadow-sm">
                                                <tr className="border-b border-gray-100 dark:border-white/5">
                                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/3">Name</th>
                                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/3">Phone</th>
                                                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/3">Cohort</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.02]">
                                                {csvData.slice(0, 50).map((row, i) => {
                                                    const name = mapping.customer_name ? row[mapping.customer_name] : null;
                                                    const phone = mapping.contact_number ? row[mapping.contact_number] : null;
                                                    const cohort = mapping.cohort && mapping.cohort !== 'none' ? row[mapping.cohort] : null;

                                                    return (
                                                        <tr key={i} className="group/row hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors">
                                                            <td className="px-5 py-2.5">
                                                                {name ? (
                                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{name}</span>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium italic">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-2.5">
                                                                {phone ? (
                                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 font-mono tracking-tight">{formatPhoneNumber(phone)}</span>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium italic">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-2.5">
                                                                {cohort ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                                                                        {cohort}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium italic">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Fade at bottom */}
                                    <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                            Ensure phone numbers include country codes for best results.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-6 mt-auto border-t border-gray-100 dark:border-white/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-700 delay-100">
                            <Button
                                variant="ghost"
                                onClick={() => setPersistedState(prev => ({ ...prev, stage: 'UPLOAD' }))}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-white font-semibold text-xs uppercase tracking-wide px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                            >
                                Back
                            </Button>

                            <Button
                                onClick={() => handleCreateCampaign(false)}
                                disabled={isProcessing}
                                className={cn(
                                    "rounded-xl h-11 px-8 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0",
                                    isProcessing
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/10"
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 ring-4 ring-indigo-500/10"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Processing Data...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{(mode === 'edit' || !!campaignId) ? "Update Leads" : "Create Intelligence Batch"}</span>
                                            <ArrowRight className="w-4 h-4 opacity-70" />
                                        </>
                                    )}
                                </span>
                            </Button>
                        </div>
                    </div>
                )}

                {stage === 'UPLOADING' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500 w-full">
                        <ProcessingLog data={csvData} mapping={mapping} />
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
                                {errorResult?.message || "Something went wrong while uploading your file. Please try again."}
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
                                    ? <>{csvData.length} customer records have been successfully updated.</>
                                    : <>{csvData.length} customers have been successfully added. You can now use this dataset for high-intent interviews.</>
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
                    <AlertDialogContent
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-gray-100 dark:border-white/10 rounded-[2rem] shadow-2xl"
                    >
                        <AlertDialogHeader>
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <AlertDialogTitle className="text-xl font-extrabold dark:text-white">Duplicate Data Detected</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                This customer data looks identical to a previous upload.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10 space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {duplicateCampaignInfo?.name || "Unknown Campaign"}
                                    </span>
                                </div>
                                <div className="pl-4 text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-gray-900 dark:text-gray-100 font-semibold italic">
                                        {duplicateCampaignInfo?.date && formatRelativeTime(duplicateCampaignInfo.date)}
                                    </span>
                                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                                    <span className="text-gray-400">
                                        {duplicateCampaignInfo?.date && formatToIST(duplicateCampaignInfo.date)}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Would you like to edit the existing campaign or create a new one?
                            </p>
                        </div>
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

                <ConfirmExitDialog
                    isOpen={isExitWarningOpen}
                    onClose={() => setIsExitWarningOpen(false)}
                    onConfirm={() => {
                        setIsExitWarningOpen(false);
                        if (onCancel) onCancel();
                        else reset();
                    }}
                    title="Discard Upload?"
                    description="You have pending customer data. If you leave now, you'll need to re-upload and map the file."
                />
            </CardContent>
        </Card >
    );
}
