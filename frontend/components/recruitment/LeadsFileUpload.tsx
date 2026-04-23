"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, Users, Trash2, Plus, ArrowRight, Phone, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { autoMapHeaders, type ColumnMapping } from "./recruitment-utils";
import type { ExistingLead } from "./RecruitmentPage";

interface LeadsFileUploadProps {
    onFileParsed: (data: {
        rows: any[];
        headers: string[];
        mapping: ColumnMapping;
        fileName: string;
    }) => void;
    className?: string;
    existingLeads?: ExistingLead[];
    loadingExisting?: boolean;
    onRemoveLead?: (leadId: string) => void;
    onContinueWithExisting?: () => void;
}

export function LeadsFileUpload({
    onFileParsed,
    className,
    existingLeads = [],
    loadingExisting = false,
    onRemoveLead,
    onContinueWithExisting,
}: LeadsFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploader, setShowUploader] = useState(false);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

    const hasExisting = existingLeads.length > 0;

    // ── File parsing (unchanged) ──────────────────────────────────────────

    const applyParsedData = useCallback((data: any[], fileName: string) => {
        if (!data || data.length === 0) {
            toast.error("The file appears to be empty");
            return;
        }
        const headers = Object.keys(data[0] as object);
        onFileParsed({
            rows: data,
            headers,
            mapping: autoMapHeaders(headers),
            fileName,
        });
    }, [onFileParsed]);

    const handleExcelParse = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                applyParsedData(XLSX.utils.sheet_to_json(worksheet), file.name);
            } catch {
                toast.error("Failed to parse Excel file");
            }
        };
        reader.readAsArrayBuffer(file);
    }, [applyParsedData]);

    const handleFileSelect = useCallback((file: File) => {
        if (file.name.endsWith(".csv")) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => applyParsedData(results.data, file.name),
                error: (error) => toast.error(`Error parsing CSV: ${error.message}`),
            });
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            handleExcelParse(file);
        } else {
            toast.error("Please upload a valid CSV or Excel file");
        }
    }, [applyParsedData, handleExcelParse]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && /\.(csv|xlsx|xls)$/.test(droppedFile.name)) {
            handleFileSelect(droppedFile);
        } else {
            toast.error("Please upload a valid CSV or Excel file");
        }
    }, [handleFileSelect]);

    // ── Upload zone (reusable) ────────────────────────────────────────────

    const uploadZone = (
        <div
            className="relative w-full max-w-2xl min-h-[300px] py-12 flex flex-col items-center justify-center rounded-lg overflow-hidden transition-all duration-300 group/upload cursor-pointer"
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
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    e.target.value = "";
                }}
            />

            <div className="absolute inset-0 bg-gray-50/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/[0.08] rounded-xl transition-all duration-300 group-hover/upload:border-emerald-400 dark:group-hover/upload:border-emerald-500/40" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <motion.div whileHover={{ y: -5, scale: 1.05 }} className="relative w-24 h-24 mb-1">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center transition-all duration-300">
                        <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xl shadow-emerald-500/50 border-2 border-white dark:border-zinc-900"
                    >
                        LEADS
                    </motion.div>
                </motion.div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                        Upload Recruitment Leads
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                        Drag and drop your CSV or Excel file to extract participant leads
                    </p>
                </div>
            </div>

            <div className="absolute bottom-6 flex items-center gap-8 opacity-60">
                {["Name", "Phone", "Cohort"].map((label) => (
                    <div key={label} className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );

    // ── Existing leads view ───────────────────────────────────────────────

    if (loadingExisting) {
        return (
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
                className,
            )}>
                <CardContent className="p-6 md:p-8 flex items-center justify-center min-h-[300px]">
                    <div className="text-sm text-muted-foreground animate-pulse">Loading enrolled leads...</div>
                </CardContent>
            </Card>
        );
    }

    if (hasExisting && !showUploader) {
        return (
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
                className,
            )}>
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(16,185,129,0.04),transparent_50%)]" />
                </div>

                <CardContent className="p-6 md:p-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    Enrolled Leads
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {existingLeads.length} lead{existingLeads.length !== 1 ? "s" : ""} assigned to this study
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUploader(true)}
                            className="rounded-xl text-xs font-semibold gap-2"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add more leads
                        </Button>
                    </div>

                    {/* Leads list */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-subtle">
                        <AnimatePresence>
                            {existingLeads.map((lead) => (
                                <motion.div
                                    key={lead.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                                {lead.first_name?.[0]}{lead.last_name?.[0] || ""}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {lead.first_name} {lead.last_name || ""}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <Phone className="w-3 h-3" />
                                                    {lead.contact_number}
                                                </span>
                                                {lead.cohort_name && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Tag className="w-3 h-3" />
                                                        {lead.cohort_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                                            lead.participant_status === "PENDING"
                                                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                                        )}>
                                            {lead.participant_status}
                                        </span>

                                        {confirmRemoveId === lead.id ? (
                                            <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setConfirmRemoveId(null)}
                                                    className="h-7 px-2 text-[10px] font-semibold text-muted-foreground rounded-lg"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        onRemoveLead?.(lead.id);
                                                        setConfirmRemoveId(null);
                                                    }}
                                                    className="h-7 px-2 text-[10px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConfirmRemoveId(lead.id)}
                                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 dark:hover:text-red-400 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-end">
                        <Button
                            onClick={onContinueWithExisting}
                            className="rounded-xl h-11 px-8 text-sm font-bold shadow-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span className="flex items-center gap-2">
                                Continue with {existingLeads.length} lead{existingLeads.length !== 1 ? "s" : ""}
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ── Default upload view ───────────────────────────────────────────────

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 !flex-none !h-auto !self-start",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
        )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(16,185,129,0.04),transparent_50%)]" />
            </div>

            <CardContent className="p-6 md:p-8 !flex-none !h-auto relative z-10">
                {hasExisting && showUploader && (
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {existingLeads.length} existing lead{existingLeads.length !== 1 ? "s" : ""} enrolled
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUploader(false)}
                            className="text-xs font-semibold text-muted-foreground rounded-xl"
                        >
                            Back to leads
                        </Button>
                    </div>
                )}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-4 md:p-6"
                >
                    {uploadZone}
                </motion.div>
            </CardContent>
        </Card>
    );
}
