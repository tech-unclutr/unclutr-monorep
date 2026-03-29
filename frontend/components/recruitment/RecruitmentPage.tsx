"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { RecruitmentProvider, useRecruitment } from "./RecruitmentContext";
import { LeadsFileUpload } from "./LeadsFileUpload";
import { LeadsColumnMapper } from "./LeadsColumnMapper";
import { LeadsCohortConfigurator } from "./LeadsCohortConfigurator";
import { ExecutionPromptView, type StudyContext } from "./ExecutionPromptView";

function RecruitmentFlow({ studyContext }: { studyContext?: StudyContext }) {
    const ctx = useRecruitment();

    return (
        <div className="max-w-[1920px] mx-auto">
            {ctx.step === "upload" && (
                <LeadsFileUpload
                    onFileParsed={(data) => {
                        ctx.setParsedFile(data);
                        ctx.setStep("mapping");
                    }}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                />
            )}

            {ctx.step === "mapping" && ctx.parsedFile && (
                <LeadsColumnMapper
                    rows={ctx.parsedFile.rows}
                    headers={ctx.parsedFile.headers}
                    initialMapping={ctx.parsedFile.mapping}
                    fileName={ctx.parsedFile.fileName}
                    onBack={() => ctx.setStep("upload")}
                    onLeadsExtracted={(leads) => {
                        ctx.setExtractedLeads(leads);
                        ctx.setStep("cohorts");
                    }}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                />
            )}

            {ctx.step === "cohorts" && ctx.extractedLeads.length > 0 && (
                <LeadsCohortConfigurator
                    onBack={() => ctx.setStep("mapping")}
                    onComplete={() => ctx.setStep("execution")}
                    className="min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
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

export function RecruitmentPage({ studyContext }: { studyContext?: StudyContext }) {
    return (
        <RecruitmentProvider>
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
                    <RecruitmentFlow studyContext={studyContext} />
                </div>
            </div>
        </RecruitmentProvider>
    );
}
