"use client";

import React, { useState } from "react";
import {
    BookOpenIcon,
    FilterIcon,
    MessageCircleIcon,
    GitBranchIcon,
    ListChecksIcon,
} from "lucide-react";
import {
    SectionCard,
    ContextSection,
    ScreeningSection,
    ModeratorSection,
    StructureSection,
    ScriptSection,
    CohortBriefProvider,
    type SectionId,
    type Accent,
} from "./cohort-brief";
import { useCohortBrief } from "./cohort-brief/useCohortBrief";

interface SectionMeta {
    id: SectionId;
    number: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accent: Accent;
}

const SECTION_META: SectionMeta[] = [
    {
        id: "context",
        number: 1,
        title: "Cohort Context",
        subtitle: "Definition, hypothesis, and research objectives",
        icon: <BookOpenIcon className="w-4 h-4" />,
        accent: "indigo",
    },
    {
        id: "script",
        number: 2,
        title: "Detailed Question Script",
        subtitle: "Canonical questions with follow-up probes",
        icon: <ListChecksIcon className="w-4 h-4" />,
        accent: "rose",
    },
    {
        id: "screening",
        number: 3,
        title: "Screening & Logistics",
        subtitle: "Counts, duration, and qualification rules",
        icon: <FilterIcon className="w-4 h-4" />,
        accent: "emerald",
    },
    {
        id: "moderator",
        number: 4,
        title: "Moderator Instructions",
        subtitle: "Script, consent, tone, and behavior rules",
        icon: <MessageCircleIcon className="w-4 h-4" />,
        accent: "amber",
    },
    {
        id: "structure",
        number: 5,
        title: "Interview Structure",
        subtitle: "The narrative flow and phase timing",
        icon: <GitBranchIcon className="w-4 h-4" />,
        accent: "violet",
    },
];

const DEFAULT_OPEN_SECTION: SectionId = "context";

interface CohortBriefSectionsProps {
    cohort: string;
    studyId?: string;
    cohortId?: string;
}

export function CohortBriefSections({
    cohort,
    studyId,
    cohortId,
}: CohortBriefSectionsProps) {
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
    const brief = useCohortBrief(studyId, cohortId);
    const briefData = brief.data;

    const keyFor = (section: SectionId) => `${cohort}:${section}`;
    const isOpen = (section: SectionId) =>
        keyFor(section) in openMap
            ? openMap[keyFor(section)]
            : section === DEFAULT_OPEN_SECTION;
    const toggle = (section: SectionId) => (open: boolean) =>
        setOpenMap((prev) => ({ ...prev, [keyFor(section)]: open }));

    // Sections 1 (context), 2 (script), 3 (screening criteria) are wired to
    // the DB. Section 3's metrics (count, duration) are derived from Section
    // 2's live selection via CohortBriefProvider. Moderator and Structure
    // sections still render dummy data until their backends land.
    const renderSection = (id: SectionId) => {
        switch (id) {
            case "context":
                return (
                    <ContextSection
                        context={briefData?.context_section}
                        loading={brief.loading}
                        error={brief.error}
                    />
                );
            case "script":
                return (
                    <ScriptSection
                        script={briefData?.script_section}
                        loading={brief.loading}
                        error={brief.error}
                    />
                );
            case "screening":
                return (
                    <ScreeningSection
                        screening={briefData?.screening_section}
                        studyId={studyId}
                        cohortId={cohortId}
                        initialIncentive={briefData?.incentive}
                    />
                );
            case "moderator":
                return (
                    <ModeratorSection
                        moderator={briefData?.moderator_section}
                        loading={brief.loading}
                        error={brief.error}
                    />
                );
            case "structure":
                return (
                    <StructureSection
                        structure={briefData?.structure_section}
                        loading={brief.loading}
                        error={brief.error}
                    />
                );
        }
    };

    return (
        <CohortBriefProvider script={briefData?.script_section}>
            <div className="space-y-3 mb-6">
                {SECTION_META.map((s) => (
                    <SectionCard
                        key={s.id}
                        number={s.number}
                        title={s.title}
                        subtitle={s.subtitle}
                        icon={s.icon}
                        accent={s.accent}
                        open={isOpen(s.id)}
                        onOpenChange={toggle(s.id)}
                    >
                        {renderSection(s.id)}
                    </SectionCard>
                ))}
            </div>
        </CohortBriefProvider>
    );
}
