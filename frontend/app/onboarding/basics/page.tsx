"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/new/onboarding-shell';
import { useOnboarding } from '@/store/onboarding-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
    Globe, Clock, Coins, Edit2, Building2, Sparkles, Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { regions, allCurrencies, allTimezones } from '@/data/regions';
import { d2cCategories } from '@/data/categories';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { client } from '@/lib/api/client';
import { toast } from "sonner";
import { Spotlight } from '@/components/ui/spotlight';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";

export default function BasicsPage() {
    const router = useRouter();
    const { state, updateState, saveCurrentPage } = useOnboarding();
    const { refreshAuth } = useAuth();

    const [isSaving, setIsSaving] = useState(false);
    const [isEditingRegion, setIsEditingRegion] = useState(false);
    const [categoryInput, setCategoryInput] = useState(state.category || '');
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
    const [isInputFocused, setIsInputFocused] = useState<string | null>(null);

    useEffect(() => {
        if (state.category) setCategoryInput(state.category);
    }, [state.category]);

    const runAutoDetect = () => {
        try {
            const rawTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log("Detecting region for timezone:", rawTimezone);

            const normalizeTimezone = (tz: string) => {
                if (tz.includes("Calcutta")) return "Asia/Kolkata";
                if (tz.includes("Kyiv")) return "Europe/Kiev";
                return tz;
            };
            const detectedTimezone = normalizeTimezone(rawTimezone);
            let matchedRegion = regions.find(r => r.timezone === detectedTimezone);

            // Fallback logic for regions not perfectly matched by timezone name
            if (!matchedRegion) {
                if (detectedTimezone.includes("Kolkata") || detectedTimezone === "Asia/Calcutta") {
                    matchedRegion = regions.find(r => r.country === "India");
                } else if (detectedTimezone.startsWith("America/") && !detectedTimezone.includes("Toronto") && !detectedTimezone.includes("Vancouver") && !detectedTimezone.includes("Sao_Paulo") && !detectedTimezone.includes("Mexico_City")) {
                    matchedRegion = regions.find(r => r.country === "United States");
                } else if (detectedTimezone.includes("Toronto") || detectedTimezone.includes("Vancouver") || detectedTimezone.includes("Edmonton") || detectedTimezone.includes("Winnipeg") || detectedTimezone.includes("Halifax") || detectedTimezone.includes("St_Johns")) {
                    matchedRegion = regions.find(r => r.country === "Canada");
                } else if (detectedTimezone.startsWith("Australia/")) {
                    matchedRegion = regions.find(r => r.country === "Australia");
                } else if (detectedTimezone === "Europe/London" || detectedTimezone === "GMT" || detectedTimezone === "UTC") {
                    matchedRegion = regions.find(r => r.country === "United Kingdom");
                }
            }

            if (matchedRegion) {
                const isValidTimezone = allTimezones.some(tz => tz.value === detectedTimezone);
                const finalTimezone = isValidTimezone ? detectedTimezone : matchedRegion.timezone;
                const safeTimezone = allTimezones.some(tz => tz.value === finalTimezone)
                    ? finalTimezone
                    : (allTimezones.some(tz => tz.value === matchedRegion.timezone) ? matchedRegion.timezone : allTimezones[0].value);

                const newRegion = {
                    country: matchedRegion.country,
                    currency: matchedRegion.currency,
                    timezone: safeTimezone
                };

                if (newRegion.country !== state.region.country || newRegion.timezone !== state.region.timezone) {
                    updateState({ region: newRegion });
                    console.log("Auto-detected region:", matchedRegion.country, "Timezone:", safeTimezone);
                }
            } else {
                console.warn("No matching region found for timezone:", detectedTimezone);
            }
        } catch (e) {
            console.warn("Auto-detect failed", e);
        }
    };

    useEffect(() => {
        // Trigger if country is missing OR if timezone is UTC (default) or missing
        if (!state.region.country || state.region.timezone === 'UTC' || !state.region.timezone) {
            runAutoDetect();
        }
    }, [state.region.country, state.region.timezone]);

    const handleNext = async () => {
        if (!state.companyName || !state.brandName || !state.category) return;
        setIsSaving(true);
        try {
            await saveCurrentPage('basics');
            const response = await client.onboarding.finishOnboardingApiV1OnboardingFinishPost();
            const respData = response as any;
            if (respData.company_id) {
                localStorage.setItem('unclutr_company_id', respData.company_id);
            }
            await refreshAuth();
            localStorage.removeItem('unclutr_onboarding_draft');
            toast.success("Welcome aboard!", { description: "Unleashing your dashboard pulse now..." });
            setTimeout(() => { router.push('/dashboard-new'); }, 1000);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            toast.error("Finish Failed", { description: "We couldn't finalize your setup. Try again?" });
        } finally {
            setIsSaving(false);
        }
    };

    const isNextDisabled = !state.companyName || !state.brandName || !state.category || isSaving;
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isNextDisabled) handleNext();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10, filter: 'blur(5px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }
    };

    return (
        <OnboardingShell
            title="First, the basics"
            subtitle="Let's set up your workspace identity."
            onNext={handleNext}
            nextDisabled={isNextDisabled}
            nextLabel={isSaving ? "Finalizing..." : "Go to Dashboard"}
            maxWidth="max-w-4xl" // Wider, but constrained
            titleAlign="center"
            tightHeader={true}
        >
            {/* Subtle premium background glow */}
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 opacity-40" fill="#f97316" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full mx-auto pb-32 mt-4"
                onKeyDown={handleKeyDown}
            >
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] border border-white/50 ring-1 ring-zinc-900/5 p-8 md:p-12 relative overflow-hidden">
                    {/* Decorative top gradient line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-50" />

                    <div className="space-y-8">
                        {/* Company Name */}
                        <motion.div variants={itemVariants} className="group/field">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">
                                Company Legal Name
                            </label>
                            <div className={`relative transition-all duration-300 rounded-2xl ${isInputFocused === 'company' ? 'shadow-lg shadow-orange-500/5 ring-2 ring-orange-500/10 scale-[1.01]' : 'shadow-sm hover:shadow-md'}`}>
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors duration-300 group-focus-within/field:text-orange-600">
                                    <Building2 size={20} strokeWidth={1.5} />
                                </div>
                                <input
                                    autoFocus
                                    placeholder="e.g. Acme Inc."
                                    value={state.companyName}
                                    onFocus={() => setIsInputFocused('company')}
                                    onBlur={() => setIsInputFocused(null)}
                                    onChange={(e) => updateState({ companyName: e.target.value })}
                                    className="w-full bg-zinc-50/50 hover:bg-white focus:bg-white border-0 rounded-2xl py-4 pl-14 pr-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:ring-0 transition-all duration-300 ease-out"
                                />
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Brand Name */}
                            <motion.div variants={itemVariants} className="group/field">
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">
                                    Brand Name
                                </label>
                                <div className={`relative transition-all duration-300 rounded-2xl ${isInputFocused === 'brand' ? 'shadow-lg shadow-orange-500/5 ring-2 ring-orange-500/10 scale-[1.01]' : 'shadow-sm hover:shadow-md'}`}>
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors duration-300 group-focus-within/field:text-orange-600">
                                        <Sparkles size={20} strokeWidth={1.5} />
                                    </div>
                                    <input
                                        placeholder="e.g. Acme"
                                        value={state.brandName}
                                        onFocus={() => setIsInputFocused('brand')}
                                        onBlur={() => setIsInputFocused(null)}
                                        onChange={(e) => updateState({ brandName: e.target.value })}
                                        className="w-full bg-zinc-50/50 hover:bg-white focus:bg-white border-0 rounded-2xl py-4 pl-14 pr-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:ring-0 transition-all duration-300 ease-out"
                                    />
                                </div>
                            </motion.div>

                            {/* Category */}
                            <motion.div variants={itemVariants} className="group/field relative z-20">
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">
                                    Industry Category
                                </label>
                                <div className={`relative transition-all duration-300 rounded-2xl ${isInputFocused === 'category' ? 'shadow-lg shadow-orange-500/5 ring-2 ring-orange-500/10 scale-[1.01]' : 'shadow-sm hover:shadow-md'}`}>
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors duration-300 group-focus-within/field:text-orange-600">
                                        <Tag size={20} strokeWidth={1.5} />
                                    </div>
                                    <input
                                        placeholder="Select category..."
                                        value={categoryInput}
                                        onFocus={() => setIsInputFocused('category')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCategoryInput(val);
                                            updateState({ category: val });
                                            const filtered = d2cCategories.filter(cat => cat.toLowerCase().includes(val.toLowerCase()));
                                            setFilteredCategories(filtered);
                                            setShowCategorySuggestions(filtered.length > 0 && val.length > 0);
                                        }}
                                        onBlur={() => {
                                            setIsInputFocused(null);
                                            setTimeout(() => setShowCategorySuggestions(false), 200);
                                        }}
                                        className="w-full bg-zinc-50/50 hover:bg-white focus:bg-white border-0 rounded-2xl py-4 pl-14 pr-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:ring-0 transition-all duration-300 ease-out"
                                    />
                                    <AnimatePresence>
                                        {showCategorySuggestions && filteredCategories.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl shadow-zinc-900/10 ring-1 ring-black/5 max-h-60 overflow-y-auto overflow-x-hidden p-2 z-[50]"
                                            >
                                                {filteredCategories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setCategoryInput(cat);
                                                            updateState({ category: cat });
                                                            setShowCategorySuggestions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-orange-50 text-sm font-medium text-zinc-600 hover:text-orange-900 transition-colors"
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>

                        {/* Region & Currency */}
                        <motion.div variants={itemVariants} className="pt-2">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">
                                Region Settings
                            </label>
                            <div
                                onClick={() => setIsEditingRegion(true)}
                                role="button"
                                className="group relative w-full bg-zinc-50/50 hover:bg-white rounded-2xl border-0 ring-1 ring-zinc-200/50 hover:ring-zinc-300 transition-all duration-300 p-1 pl-5 pr-2 flex items-center shadow-sm hover:shadow-md cursor-pointer h-[72px]"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100/50 text-orange-600 flex items-center justify-center shrink-0">
                                        <Globe size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-base font-semibold text-zinc-900">{state.region.country}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                            <span className="text-base font-medium text-zinc-500">{state.region.currency}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                            <Clock size={12} />
                                            <span>{state.region.timezone}</span>
                                        </div>

                                    </div>
                                </div>
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-900 transition-all">
                                    <Edit2 size={16} strokeWidth={2} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Region Editing Modal */}
            <Dialog open={isEditingRegion} onOpenChange={setIsEditingRegion}>
                <DialogContent
                    className="sm:max-w-md p-0 bg-white border-0 shadow-2xl shadow-zinc-900/20 rounded-3xl gap-0" // Removed overflow-hidden to allow dropdowns to pop out
                    onPointerDownOutside={(e) => {
                        if ((e.target as HTMLElement).closest('.searchable-select-dropdown')) {
                            e.preventDefault();
                        }
                    }}
                >
                    <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 rounded-t-3xl">
                        <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900">
                            Regional Settings
                        </DialogTitle>
                        <p className="text-sm text-zinc-500 mt-1">
                            Configure your location and currency preferences.
                        </p>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Globe size={12} /> Country
                            </label>
                            <SearchableSelect
                                usePortal={false}
                                value={state.region.country}
                                onChange={(country) => {
                                    const region = regions.find(r => r.country === country);
                                    if (region) {
                                        updateState({
                                            region: {
                                                country: region.country,
                                                currency: region.currency,
                                                timezone: region.timezone
                                            }
                                        });
                                    }
                                }}
                                options={regions.map(r => ({ label: `${r.flag} ${r.country}`, value: r.country }))}
                                placeholder="Select country"
                                className="h-11 bg-white border-zinc-200 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Coins size={12} /> Currency
                            </label>
                            <SearchableSelect
                                usePortal={false}
                                value={state.region.currency}
                                onChange={(currency) => updateState({ region: { ...state.region, currency } })}
                                options={allCurrencies.map(c => ({ label: `${c.code} - ${c.name} (${c.symbol})`, value: c.code }))}
                                placeholder="Select currency"
                                className="h-11 bg-white border-zinc-200 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} /> Timezone
                            </label>
                            <SearchableSelect
                                usePortal={false}
                                value={state.region.timezone}
                                onChange={(timezone) => updateState({ region: { ...state.region, timezone } })}
                                options={allTimezones}
                                placeholder="Select timezone"
                                className="h-11 bg-white border-zinc-200 rounded-xl"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => setIsEditingRegion(false)}
                                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl shadow-lg shadow-zinc-900/10 active:scale-[0.98] transition-all"
                            >
                                Apply Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </OnboardingShell>
    );
}
