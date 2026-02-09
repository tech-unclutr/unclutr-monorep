"use client";

import { useCompany } from "@/hooks/use-company";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BrandBasics } from "@/components/settings/brand-profile/brand-basics";
import { PresenceLinks } from "@/components/settings/brand-profile/presence-links";
import { UserProfileCard } from "@/components/settings/user-profile-card";
import { DangerZone } from "@/components/settings/danger-zone";

import { Loader2, User } from "lucide-react";

export default function SettingsPage() {
    const { company, loading: companyLoading, updateCompany } = useCompany();
    const { user, dbUser, role } = useAuth();

    if (companyLoading) {
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
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">Manage your brand profile and preferences.</p>
            </div>

            <div className="flex items-center gap-5 py-6">
                <div className="relative group/avatar">
                    {/* Premium Ambient Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-tr from-[#FF8A4C] to-orange-300 dark:from-orange-500/40 dark:to-orange-300/20 rounded-full blur-md opacity-20 group-hover/avatar:opacity-40 transition-opacity duration-500"></div>

                    <Avatar className="h-24 w-24 border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden ring-1 ring-zinc-200/20 dark:ring-zinc-700/20">
                        <AvatarImage
                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(dbUser?.full_name || user?.displayName || "User")}`}
                            alt={dbUser?.full_name || user?.displayName || "User"}
                            className="object-cover scale-110"
                        />
                        <AvatarFallback className="bg-zinc-50 dark:bg-zinc-900 text-zinc-400">
                            <User className="h-12 w-12" />
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {dbUser?.full_name || user?.displayName || "Anonymous User"}
                        </h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-500/10 text-[#FF8A4C] border border-orange-100 dark:border-orange-500/20 shadow-sm">
                            {role || "Member"}
                        </span>
                    </div>
                    <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Active Account</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* User Profile - Top Primary section */}
                <UserProfileCard workspaceName={company.brand_name} />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Main Brand Info - Left column (8/12 on XL) */}
                    <div className="xl:col-span-8">
                        <BrandBasics
                            data={company}
                            onUpdate={(updates) => updateCompany(updates)}
                        />
                    </div>

                    {/* Secondary Info & Actions - Right column (4/12 on XL) */}
                    <div className="xl:col-span-4 space-y-6">
                        <PresenceLinks
                            data={company.presence_links || []}
                            onUpdate={(updates) => updateCompany({ presence_links: updates })}
                        />

                        <DangerZone />
                    </div>
                </div>
            </div>
        </div>
    );
}
