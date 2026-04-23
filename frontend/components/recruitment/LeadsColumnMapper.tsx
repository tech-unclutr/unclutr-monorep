"use client";

import React, { useState, useMemo } from "react";
import {
    Table as TableIcon,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    User as UserIcon,
    Building2,
    MapPin,
    FileSpreadsheet,
} from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
    type ColumnMapping,
    type ExtractedLead,
    PROFILE_TARGETS,
    buildLeads,
} from "./recruitment-utils";

interface LeadsColumnMapperProps {
    rows: any[];
    headers: string[];
    initialMapping: ColumnMapping;
    fileName: string;
    onBack: () => void;
    onLeadsExtracted: (leads: ExtractedLead[]) => void;
    className?: string;
}

export function LeadsColumnMapper({
    rows,
    headers,
    initialMapping,
    fileName,
    onBack,
    onLeadsExtracted,
    className,
}: LeadsColumnMapperProps) {
    const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);
    const [isProfileExpanded, setIsProfileExpanded] = useState(false);

    const mappedLeads = useMemo(() => buildLeads(rows, mapping), [rows, mapping]);
    const canProceed = mapping.customer_name && mapping.contact_number && rows.length > 0;

    const usedCols = new Set([mapping.customer_name, mapping.contact_number, mapping.cohort].filter(Boolean));
    const extraCols = headers.filter((h) => !usedCols.has(h));
    const linkedCount = Object.keys(mapping.profile_fields || {}).length;
    const usedTargets = new Set(Object.values(mapping.profile_fields || {}));

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/[0.08] shadow-sm rounded-xl",
            className,
        )}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_0%,rgba(16,185,129,0.04),transparent_50%)]" />
            </div>

            <CardContent className="p-6 md:p-8 flex flex-col relative z-10 min-h-0 flex-1">
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                <TableIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Map Data Columns</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Align your file columns to extract leads.</p>
                                    {fileName && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-white/10">
                                            <FileSpreadsheet className="w-3 h-3" />
                                            {fileName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Mapping Active</span>
                        </div>
                    </div>

                    {/* Split layout */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-6">

                        {/* Left: Config */}
                        <div className="lg:col-span-5 flex flex-col space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Column Mapping</label>
                                    <span className="text-[10px] text-gray-400 font-medium italic">Auto-detected best matches</span>
                                </div>

                                <div className="space-y-3">
                                    <MappingField
                                        label="Customer Name"
                                        required
                                        value={mapping.customer_name}
                                        headers={headers}
                                        onChange={(val) => setMapping((prev) => ({ ...prev, customer_name: val }))}
                                    />
                                    <MappingField
                                        label="Phone Number"
                                        required
                                        value={mapping.contact_number}
                                        headers={headers}
                                        onChange={(val) => setMapping((prev) => ({ ...prev, contact_number: val }))}
                                    />
                                    <MappingField
                                        label="Cohort / Group"
                                        value={mapping.cohort}
                                        headers={headers}
                                        onChange={(val) => setMapping((prev) => ({ ...prev, cohort: val }))}
                                        showNone
                                    />
                                </div>

                                {/* Profile Fields */}
                                {extraCols.length > 0 && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <UserIcon className="w-3.5 h-3.5" />
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    <MapPin className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Profile Fields</span>
                                                {linkedCount > 0 && (
                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                                                        {linkedCount} linked
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {extraCols.length} extra {extraCols.length === 1 ? "column" : "columns"}
                                                </span>
                                                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform duration-200", isProfileExpanded && "rotate-180")} />
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isProfileExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-2 p-3 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.01] shadow-sm space-y-1.5">
                                                        <div className="flex items-center justify-between px-1 pb-2 border-b border-gray-50 dark:border-white/[0.03]">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Your Column</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Save As</span>
                                                        </div>

                                                        {extraCols.map((col) => {
                                                            const currentTarget = (mapping.profile_fields || {})[col];
                                                            const isLinked = !!currentTarget;

                                                            return (
                                                                <div key={col} className={cn(
                                                                    "flex items-center justify-between py-1.5 px-1 rounded-lg transition-colors",
                                                                    isLinked ? "bg-emerald-50/30 dark:bg-emerald-500/5" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]",
                                                                )}>
                                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMapping((prev) => {
                                                                                    const pf = { ...prev.profile_fields };
                                                                                    if (pf[col]) {
                                                                                        delete pf[col];
                                                                                    } else {
                                                                                        const used = new Set(Object.values(pf));
                                                                                        const available = PROFILE_TARGETS.find((t) => !used.has(t.value));
                                                                                        if (available) pf[col] = available.value;
                                                                                    }
                                                                                    return { ...prev, profile_fields: pf };
                                                                                });
                                                                            }}
                                                                            className={cn(
                                                                                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                                                isLinked
                                                                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                                                                    : "border-gray-300 dark:border-gray-600 hover:border-emerald-400",
                                                                            )}
                                                                        >
                                                                            {isLinked && <CheckCircle2 className="w-3 h-3" />}
                                                                        </button>
                                                                        <span className={cn(
                                                                            "text-[11px] font-medium truncate",
                                                                            isLinked ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500",
                                                                        )}>
                                                                            {col}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex-shrink-0 ml-2">
                                                                        {isLinked ? (
                                                                            <Select
                                                                                value={currentTarget}
                                                                                onValueChange={(val) => {
                                                                                    setMapping((prev) => ({
                                                                                        ...prev,
                                                                                        profile_fields: { ...prev.profile_fields, [col]: val },
                                                                                    }));
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="w-[140px] h-7 border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] rounded-md text-[10px] font-medium">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {PROFILE_TARGETS.map((t) => (
                                                                                        <SelectItem
                                                                                            key={t.value}
                                                                                            value={t.value}
                                                                                            className="text-[10px]"
                                                                                            disabled={usedTargets.has(t.value) && t.value !== currentTarget}
                                                                                        >
                                                                                            <span className="flex items-center gap-1.5">
                                                                                                {t.icon === "person" && <UserIcon className="w-3 h-3 text-blue-400" />}
                                                                                                {t.icon === "company" && <Building2 className="w-3 h-3 text-amber-400" />}
                                                                                                {t.icon === "location" && <MapPin className="w-3 h-3 text-emerald-400" />}
                                                                                                {t.label}
                                                                                            </span>
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium italic px-2">Skip</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Preview */}
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
                                    {rows.length} RECORDS READY
                                </div>
                            </div>

                            <div className="h-[400px] rounded-2xl border border-gray-200/60 dark:border-white/[0.08] bg-white dark:bg-zinc-900/50 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative group">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

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
                                            {rows.slice(0, 50).map((row, i) => {
                                                const name = mapping.customer_name ? row[mapping.customer_name] : null;
                                                const phone = mapping.contact_number ? row[mapping.contact_number] : null;
                                                const cohort = mapping.cohort && mapping.cohort !== "none" ? row[mapping.cohort] : null;

                                                return (
                                                    <tr key={i} className="group/row hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-colors">
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

                                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                            </div>

                            <div className="mt-4 flex items-center gap-2 px-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                    Ensure phone numbers include country codes for best results.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 mt-auto border-t border-gray-100 dark:border-white/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-700 delay-100">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white font-semibold text-xs uppercase tracking-wide px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                        >
                            Back
                        </Button>

                        <Button
                            type="button"
                            disabled={!canProceed}
                            onClick={() => onLeadsExtracted(mappedLeads)}
                            className={cn(
                                "rounded-xl h-11 px-8 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0",
                                canProceed
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/10"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/10",
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span>Extract {rows.length} Leads</span>
                                <ArrowRight className="w-4 h-4 opacity-70" />
                            </span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function MappingField({
    label,
    required,
    value,
    headers,
    onChange,
    showNone,
}: {
    label: string;
    required?: boolean;
    value: string;
    headers: string[];
    onChange: (val: string) => void;
    showNone?: boolean;
}) {
    return (
        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.01] shadow-sm hover:shadow-md transition-shadow group focus-within:ring-1 focus-within:ring-emerald-500/50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", required ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
                    <span className={cn("text-sm font-semibold", required ? "text-gray-700 dark:text-gray-200" : "text-gray-600 dark:text-gray-400")}>
                        {label}
                    </span>
                </div>
                <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border",
                    required
                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                        : "text-gray-400 bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10",
                )}>
                    {required ? "REQUIRED" : "OPTIONAL"}
                </span>
            </div>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={cn(
                    "w-full h-10 border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] focus:ring-emerald-500/20 rounded-lg text-xs font-medium",
                    !required && "text-gray-500",
                )}>
                    <SelectValue placeholder={showNone ? "No grouping selected" : "Select column..."} />
                </SelectTrigger>
                <SelectContent>
                    {showNone && <SelectItem value="none" className="text-xs">None</SelectItem>}
                    {headers.map((h) => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
}
