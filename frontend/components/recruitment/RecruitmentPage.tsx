"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRecruitment } from "./RecruitmentContext";
import { LeadsFileUpload } from "./LeadsFileUpload";
import { LeadsColumnMapper } from "./LeadsColumnMapper";
import { LeadsCohortConfigurator } from "./LeadsCohortConfigurator";
import { ExecutionPromptView, type StudyContext } from "./ExecutionPromptView";
import { api } from "@/lib/api";
import type { ExtractedLead } from "./recruitment-utils";

export interface ExistingLead {
    id: string;
    first_name: string;
    last_name?: string;
    contact_number: string;
    cohort_id?: string;
    cohort_name?: string;
    participant_status: string;
    contact_profile?: Record<string, any>;
}

function RecruitmentFlow({ studyContext, onStartExecution }: { studyContext?: StudyContext; onStartExecution?: (cohortInterviewMap: Record<string, number[]>) => void }) {
    const ctx = useRecruitment();
    const [saving, setSaving] = useState(false);
    const [existingLeads, setExistingLeads] = useState<ExistingLead[]>([]);
    const [loadingExisting, setLoadingExisting] = useState(false);

    // Fetch existing leads for this study on mount
    useEffect(() => {
        if (!studyContext?.studyId) return;
        setLoadingExisting(true);
        api.get(`/study-planner/studies/${studyContext.studyId}/leads`)
            .then((data: ExistingLead[]) => setExistingLeads(data))
            .catch(() => setExistingLeads([]))
            .finally(() => setLoadingExisting(false));
    }, [studyContext?.studyId]);

    const handleRemoveLead = async (leadId: string) => {
        if (!studyContext?.studyId) return;
        try {
            await api.request(`/study-planner/studies/${studyContext.studyId}/participants/${leadId}`, {
                method: "DELETE",
            });
            setExistingLeads((prev) => prev.filter((l) => l.id !== leadId));
            toast.success("Lead removed from study");
        } catch (err: any) {
            toast.error(err.message || "Failed to remove lead");
        }
    };

    const persistLeads = async (leads: ExtractedLead[]) => {
        const companyId = typeof window !== "undefined" ? localStorage.getItem("unclutr_company_id") : null;
        if (!companyId) {
            toast.error("No company selected");
            return;
        }

        setSaving(true);
        try {
            const res = await api.request("/leads/upload", {
                method: "POST",
                body: JSON.stringify({
                    company_id: companyId,
                    study_id: studyContext?.studyId || null,
                    leads: leads.map((l) => ({
                        first_name: l.first_name,
                        last_name: l.last_name || null,
                        contact_number: l.contact_number,
                        cohort: l.cohort || null,
                        contact_profile: l.contact_profile || null,
                        meta_data: l.meta_data || null,
                    })),
                }),
            });
            toast.success(`${res.inserted} leads saved, ${res.skipped} duplicates skipped`);
            // Enrich local leads with cohort_id from the upload response so downstream
            // UI (cohort brief fetch) can key on UUIDs, not names.
            const cohortIdByPhone = new Map<string, string>();
            for (const r of res.leads ?? []) {
                if (r.contact_number && r.cohort_id) cohortIdByPhone.set(r.contact_number, r.cohort_id);
            }
            ctx.setExtractedLeads(
                leads.map((l) => ({ ...l, cohort_id: cohortIdByPhone.get(l.contact_number) ?? l.cohort_id }))
            );
            // Refresh existing leads list after upload
            if (studyContext?.studyId) {
                api.get(`/study-planner/studies/${studyContext.studyId}/leads`)
                    .then((data: ExistingLead[]) => setExistingLeads(data))
                    .catch(() => {});
            }
            ctx.setStep("cohorts");
        } catch (err: any) {
            toast.error(err.message || "Failed to save leads");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1920px] mx-auto">
            {ctx.step === "upload" && (
                <LeadsFileUpload
                    onFileParsed={(data) => {
                        ctx.setParsedFile(data);
                        ctx.setStep("mapping");
                    }}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                    existingLeads={existingLeads}
                    loadingExisting={loadingExisting}
                    onRemoveLead={handleRemoveLead}
                    onContinueWithExisting={() => {
                        // Convert existing leads to ExtractedLead format and skip to cohorts
                        const extracted: ExtractedLead[] = existingLeads.map((l) => ({
                            first_name: l.first_name,
                            last_name: l.last_name,
                            contact_number: l.contact_number,
                            cohort: l.cohort_name,
                            cohort_id: l.cohort_id,
                            contact_profile: l.contact_profile,
                        }));
                        ctx.setExtractedLeads(extracted);
                        ctx.setStep("cohorts");
                    }}
                />
            )}

            {ctx.step === "mapping" && ctx.parsedFile && (
                <LeadsColumnMapper
                    rows={ctx.parsedFile.rows}
                    headers={ctx.parsedFile.headers}
                    initialMapping={ctx.parsedFile.mapping}
                    fileName={ctx.parsedFile.fileName}
                    onBack={() => ctx.setStep("upload")}
                    onLeadsExtracted={persistLeads}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                />
            )}

            {ctx.step === "cohorts" && ctx.extractedLeads.length > 0 && (
                <LeadsCohortConfigurator
                    onBack={() => ctx.setStep("mapping")}
                    onComplete={(map) => onStartExecution ? onStartExecution(map) : ctx.setStep("execution")}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                    studyContext={studyContext}
                />
            )}

            {ctx.step === "execution" && (
                <ExecutionPromptView
                    onBack={() => ctx.setStep("cohorts")}
                    onExecute={() => ctx.setStep("done")}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                    studyContext={studyContext}
                />
            )}

            {ctx.step === "done" && (
                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-card p-8 text-center space-y-4">
                    <div className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        {ctx.extractedLeads.length} leads configured successfully
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Next steps coming soon — outreach, screening, and scheduling.
                    </p>
                    <button
                        onClick={ctx.reset}
                        className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                    >
                        Start over
                    </button>
                </div>
            )}
        </div>
    );
}

export function RecruitmentPage({ studyContext, onStartExecution }: { studyContext?: StudyContext; onStartExecution?: (cohortInterviewMap: Record<string, number[]>) => void }) {
    return (
        <div className="h-full overflow-y-auto scrollbar-subtle">
            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06]">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Recruitment Engine
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight">
                        Recruitment Studio
                    </h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Upload your participant leads and let our AI handle personalized outreach.
                        Screen, schedule, and engage participants—automatically.
                    </p>
                </div>
                <RecruitmentFlow studyContext={studyContext} onStartExecution={onStartExecution} />
            </div>
        </div>
    );
}
