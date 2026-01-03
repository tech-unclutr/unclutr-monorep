"use client";

import { useCompany } from "@/hooks/use-company";
import { BrandHeader } from "@/components/settings/brand-profile/brand-header";
import { BrandBasics } from "@/components/settings/brand-profile/brand-basics";
import { PresenceLinks } from "@/components/settings/brand-profile/presence-links";
import { SupportContact } from "@/components/settings/brand-profile/support-contact";
import { OnboardingSummary } from "@/components/settings/brand-profile/onboarding-summary";
import { UserProfileCard } from "@/components/settings/user-profile-card";
import { DangerZone } from "@/components/settings/danger-zone";
import { MOCK_USER_PROFILE } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getOnboardingSettings, OnboardingSettingsResponse } from "@/lib/api/settings";

export default function SettingsPage() {
    const { company, loading: companyLoading, updateCompany } = useCompany();
    const [onboardingData, setOnboardingData] = useState<OnboardingSettingsResponse | null>(null);
    const [onboardingLoading, setOnboardingLoading] = useState(true);

    useEffect(() => {
        if (!company) return;

        const fetchOnboardingData = async () => {
            try {
                const data = await getOnboardingSettings();
                setOnboardingData(data);
            } catch (error) {
                console.error("Failed to fetch onboarding settings:", error);
            } finally {
                setOnboardingLoading(false);
            }
        };

        fetchOnboardingData();
    }, [company]);

    const loading = companyLoading || onboardingLoading;

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="p-8 text-center">
                <p className="text-zinc-500">Failed to load company settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your brand profile and preferences.</p>
            </div>

            <BrandHeader
                data={company}
                onUpdate={(updates) => updateCompany(updates)}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Brand Info - Takes 2 columns on large screens */}
                <div className="xl:col-span-2 space-y-6">
                    <BrandBasics
                        data={company}
                        onUpdate={(updates) => updateCompany(updates)}
                    />
                    <SupportContact
                        data={company}
                        onUpdate={(updates) => updateCompany(updates)}
                    />

                    {onboardingData && (
                        <OnboardingSummary data={onboardingData} />
                    )}
                </div>

                {/* Sidebar / Secondary Info - Takes 1 column */}
                <div className="xl:col-span-1 space-y-6">
                    <UserProfileCard />
                    <PresenceLinks
                        data={company.presence_links || []}
                        onUpdate={(updates) => updateCompany({ presence_links: updates })}
                    />
                    <DangerZone />
                </div>
            </div>
        </div>
    );
}
