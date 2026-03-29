"use client";

import React, { useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { autoMapHeaders, type ColumnMapping } from "./recruitment-utils";

interface LeadsFileUploadProps {
    onFileParsed: (data: {
        rows: any[];
        headers: string[];
        mapping: ColumnMapping;
        fileName: string;
    }) => void;
    className?: string;
}

export function LeadsFileUpload({ onFileParsed, className }: LeadsFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-4 md:p-6"
                >
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
                </motion.div>
            </CardContent>
        </Card>
    );
}
