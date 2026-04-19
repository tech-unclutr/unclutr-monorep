"use client";

import React, { useState } from "react";
import {
    BookOpenIcon,
    FilterIcon,
    MessageCircleIcon,
    GitBranchIcon,
    ListChecksIcon,
} from "lucide-react";
import type { CohortBriefData } from "./cohortBriefDummyData";
import {
    SectionCard,
    ContextSection,
    ScreeningSection,
    ModeratorSection,
    StructureSection,
    ScriptSection,
    type SectionId,
    type Accent,
} from "./cohort-brief";

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
    data: CohortBriefData;
    studyId?: string;
    cohortId?: string;
}

export function CohortBriefSections({
    cohort,
    data,
    studyId,
    cohortId,
}: CohortBriefSectionsProps) {
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const keyFor = (section: SectionId) => `${cohort}:${section}`;
    const isOpen = (section: SectionId) =>
        keyFor(section) in openMap
            ? openMap[keyFor(section)]
            : section === DEFAULT_OPEN_SECTION;
    const toggle = (section: SectionId) => (open: boolean) =>
        setOpenMap((prev) => ({ ...prev, [keyFor(section)]: open }));

    // Section 1 is wired to the DB; sections 2-5 still render dummy data.
    const renderSection = (id: SectionId) => {
        switch (id) {
            case "context":
                return <ContextSection studyId={studyId} cohortId={cohortId} />;
            case "screening":
                return <ScreeningSection data={data.screening} />;
            case "moderator":
                return <ModeratorSection data={data.moderator} />;
            case "structure":
                return <StructureSection data={data.structure} />;
            case "script":
                return <ScriptSection data={data.script} />;
        }
    };

    return (
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
    );
}
