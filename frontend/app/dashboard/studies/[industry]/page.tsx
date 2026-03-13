"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { type Study, type Industry } from "@/components/dashboard/study-explorer-shared";
import { StudyBrowsePage } from "@/components/dashboard/StudyBrowsePage";

export default function IndustryStudiesPage() {
    const router = useRouter();
    const params = useParams();
    const industry = decodeURIComponent(params.industry as string);

    const [studies, setStudies] = useState<Study[]>([]);
    const [industries, setIndustries] = useState<string[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            try {
                setIsLoading(true);
                const [metaData, studiesData] = await Promise.all([
                    api.get("/studies/meta"),
                    api.get("/studies"),
                ]);
                if (cancelled) return;
                setIndustries(metaData.industries.map((i: any) => i.name));
                setDepartments(metaData.departments.map((d: any) => d.name));
                setStudies(studiesData);
            } catch (err) {
                console.error("Failed to load study data:", err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    const openStudy = useCallback((study: Study) => {
        router.push(`/dashboard/studies/${encodeURIComponent(industry)}/${study.id}`);
    }, [router, industry]);

    const departmentSections = useMemo(() => {
        const filtered = studies.filter((s) => s.industries.includes(industry));
        const sortByUrgency = (a: Study, b: Study) => {
            const order: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
            return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
        };
        const grouped: { department: string; items: Study[] }[] = [];
        for (const dept of departments) {
            const items = filtered.filter((s) => s.departments.includes(dept)).sort(sortByUrgency);
            if (items.length > 0) grouped.push({ department: dept, items });
        }
        return grouped;
    }, [industry, studies, departments]);

    const featuredStudy = useMemo(() => {
        return studies.find((s) => s.industries.includes(industry) && s.urgency === "P0") || null;
    }, [industry, studies]);

    const totalStudies = useMemo(() => {
        return studies.filter((s) => s.industries.includes(industry)).length;
    }, [industry, studies]);

    const allIndustryStudies = useMemo(() => {
        return studies.filter((s) => s.industries.includes(industry));
    }, [industry, studies]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center w-full bg-[#FAFAFA] dark:bg-[#0C0C0E]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF8A4C]" />
                    <p className="text-muted-foreground text-sm">Loading studies…</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0C0C0E] relative selection:bg-[#FF8A4C]/20">
            <StudyBrowsePage
                selectedIndustry={industry}
                onBack={() => router.push("/dashboard/studies")}
                onSwitchIndustry={(ind) => router.push(`/dashboard/studies/${encodeURIComponent(ind)}`)}
                industries={industries}
                departmentSections={departmentSections}
                featuredStudy={featuredStudy}
                totalStudies={totalStudies}
                openStudy={openStudy}
                allStudies={allIndustryStudies}
            />
        </div>
    );
}
