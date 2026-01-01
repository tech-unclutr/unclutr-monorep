"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/new/onboarding-shell';
import { useOnboarding } from '@/store/onboarding-context';
import { Button } from '@/components/ui/button';
import { Globe, Clock, Coins, Edit2, Check, Info, Building2, Sparkles, Tag, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { regions, allCurrencies, allTimezones } from '@/data/regions';
import { d2cCategories } from '@/data/categories';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function BasicsPage() {
    const router = useRouter();
    const { state, updateState } = useOnboarding();
    const [isEditingRegion, setIsEditingRegion] = useState(false);
    const [categoryInput, setCategoryInput] = useState(state.category || '');
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

    // Auto-detect Logic Helper
    const runAutoDetect = () => {
        try {
            const rawTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // 0. Normalize aliases (e.g. Calcutta -> Kolkata)
            const normalizeTimezone = (tz: string) => {
                if (tz.includes("Calcutta")) return "Asia/Kolkata";
                if (tz.includes("Kyiv")) return "Europe/Kiev";
                return tz;
            };
            const detectedTimezone = normalizeTimezone(rawTimezone);

            // 1. Try exact match from our expanded list first (for country derivation)
            let matchedRegion = regions.find(r => r.timezone === detectedTimezone);

            // 2. Fuzzy matching for common regions (if exact timezone implies a region we know)
            if (!matchedRegion) {
                if (detectedTimezone.includes("Kolkata") || detectedTimezone === "Asia/Calcutta") {
                    matchedRegion = regions.find(r => r.country === "India");
                } else if (detectedTimezone.startsWith("America/") && !detectedTimezone.includes("Toronto") && !detectedTimezone.includes("Vancouver")) {
                    matchedRegion = regions.find(r => r.country === "United States");
                } else if (detectedTimezone.startsWith("Australia/")) {
                    matchedRegion = regions.find(r => r.country === "Australia");
                } else if (detectedTimezone === "Europe/London" || detectedTimezone === "GMT" || detectedTimezone === "UTC") {
                    matchedRegion = regions.find(r => r.country === "United Kingdom");
                }
            }

            // 3. Fallback to US/India as default
            matchedRegion = matchedRegion || regions[0];

            // 4. Ensure Timezone exists in our dropdown list, else fallback to Region's timezone
            const isValidTimezone = allTimezones.some(tz => tz.value === detectedTimezone);
            const finalTimezone = isValidTimezone ? detectedTimezone : matchedRegion.timezone;

            updateState({
                region: {
                    country: matchedRegion.country,
                    currency: matchedRegion.currency,
                    timezone: finalTimezone
                }
            });
        } catch (e) {
            console.warn("Auto-detect failed", e);
        }
    };

    useEffect(() => {
        if (!state.region.country && !state.region.timezone) {
            runAutoDetect();
        }
    }, []);

    const handleNext = () => {
        if (state.companyName && state.brandName) {
            router.push('/onboarding/channels');
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && state.companyName && state.brandName && !isEditingRegion) {
                handleNext();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [state.companyName, state.brandName, isEditingRegion]);


    const currentRegionData = regions.find(r => r.country === state.region.country);
    // Fallback for currency symbol if custom currency selected
    const currencyData = allCurrencies.find(c => c.code === state.region.currency);

    // Category handlers
    const handleCategoryChange = (value: string) => {
        setCategoryInput(value);
        if (value.trim()) {
            const filtered = d2cCategories.filter(cat =>
                cat.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCategories(filtered);
            setShowCategorySuggestions(filtered.length > 0);
        } else {
            setShowCategorySuggestions(false);
        }
    };

    const handleCategoryBlur = () => {
        setTimeout(() => {
            // Validate: only accept if it matches a predefined category
            const isValid = d2cCategories.some(cat =>
                cat.toLowerCase() === categoryInput.trim().toLowerCase()
            );
            if (isValid) {
                const matchedCategory = d2cCategories.find(cat =>
                    cat.toLowerCase() === categoryInput.trim().toLowerCase()
                );
                updateState({ category: matchedCategory });
            } else {
                // Reset to previous valid value or empty
                setCategoryInput(state.category || '');
            }
            setShowCategorySuggestions(false);
        }, 200);
    };

    const selectCategory = (category: string) => {
        setCategoryInput(category);
        updateState({ category });
        setShowCategorySuggestions(false);
    };

    const isNextDisabled = !state.companyName || !state.brandName || !state.category;


    return (
        <TooltipProvider delayDuration={0}>
            <OnboardingShell
                title="First, the basics."
                subtitle="We’ll use this to organize your data and keep things clean."
                onNext={handleNext}
                nextDisabled={isNextDisabled}
            >
                <div className="space-y-6 mt-0">
                    {/* Editorial Style Inputs */}
                    <div className="space-y-6">

                        {/* Company Name */}
                        <div className="group relative">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                                Company Name
                            </label>
                            <input
                                autoFocus
                                placeholder="e.g. Acme Consumer Pvt Ltd"
                                value={state.companyName}
                                onChange={(e: { target: { value: string; }; }) => updateState({ companyName: e.target.value })}
                                className="w-full text-3xl font-light bg-transparent border-b border-zinc-200 py-2 focus:outline-none focus:border-black transition-colors placeholder:text-zinc-200 text-zinc-900"
                            />
                            {/* Context Chip */}
                            <div className="absolute top-0 right-0">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className={cn(
                                            "cursor-help text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300 transform",
                                            // State: Filled (Green)
                                            state.companyName ? "bg-emerald-50 text-emerald-600 scale-100 opacity-100" :
                                                // State: Focused (Indigo) - handled by group-focus-within
                                                "group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 group-focus-within:scale-100 group-focus-within:opacity-100",
                                            // State: Empty & Blur (Gray/Hidden/Subtle)
                                            !state.companyName && "bg-zinc-50 text-zinc-400 scale-95 opacity-0 group-hover:opacity-100"
                                        )}>
                                            {state.companyName ? <Check size={12} strokeWidth={2.5} /> : <Building2 size={12} />}
                                            Legal entity
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs bg-zinc-900 text-zinc-100 border-zinc-800 p-3 shadow-xl">
                                        <p>We use this for your <strong>official billing</strong> and legal entity verification.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Brand Name */}
                        <div className="group relative">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                                Brand Name
                            </label>
                            <input
                                placeholder="e.g. Zuvo"
                                value={state.brandName}
                                onChange={(e: { target: { value: string; }; }) => updateState({ brandName: e.target.value })}
                                className="w-full text-3xl font-light bg-transparent border-b border-zinc-200 py-2 focus:outline-none focus:border-black transition-colors placeholder:text-zinc-200 text-zinc-900"
                            />
                            {/* Context Chip */}
                            <div className="absolute top-0 right-0">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className={cn(
                                            "cursor-help text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300 transform",
                                            // State: Filled (Green)
                                            state.brandName ? "bg-emerald-50 text-emerald-600 scale-100 opacity-100" :
                                                // State: Focused (Indigo)
                                                "group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 group-focus-within:scale-100 group-focus-within:opacity-100",
                                            // State: Empty & Blur
                                            !state.brandName && "bg-zinc-50 text-zinc-400 scale-95 opacity-0 group-hover:opacity-100"
                                        )}>
                                            {state.brandName ? <Check size={12} strokeWidth={2.5} /> : <Sparkles size={12} />}
                                            Primary brand
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs bg-zinc-900 text-zinc-100 border-zinc-800 p-3 shadow-xl">
                                        <p>This is how your brand will appear on <strong>customer interactions</strong> and dashboard labels.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="group relative">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-black">
                                Category
                            </label>
                            <div className="relative">
                                <input
                                    placeholder="e.g. Fashion & Apparel"
                                    value={categoryInput}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    onFocus={() => {
                                        if (categoryInput.trim()) {
                                            const filtered = d2cCategories.filter(cat =>
                                                cat.toLowerCase().includes(categoryInput.toLowerCase())
                                            );
                                            setFilteredCategories(filtered);
                                            setShowCategorySuggestions(filtered.length > 0);
                                        }
                                    }}
                                    onBlur={handleCategoryBlur}
                                    className="w-full text-3xl font-light bg-transparent border-b border-zinc-200 py-2 pr-8 focus:outline-none focus:border-black transition-colors placeholder:text-zinc-200 text-zinc-900"
                                />
                                {/* Dropdown Icon */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilteredCategories(d2cCategories);
                                        setShowCategorySuggestions(!showCategorySuggestions);
                                    }}
                                    className="absolute right-0 bottom-2 p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                    <ChevronDown size={20} className={cn(
                                        "transition-transform duration-200",
                                        showCategorySuggestions && "rotate-180"
                                    )} />
                                </button>
                            </div>
                            {/* Filtered Suggestions Dropdown */}
                            <AnimatePresence>
                                {showCategorySuggestions && filteredCategories.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                                    >
                                        {filteredCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectCategory(cat);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors text-sm text-zinc-900 border-b border-zinc-100 last:border-b-0"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Context Chip */}
                            <div className="absolute top-0 right-0">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className={cn(
                                            "cursor-help text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300 transform",
                                            state.category ? "bg-emerald-50 text-emerald-600 scale-100 opacity-100" :
                                                "group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 group-focus-within:scale-100 group-focus-within:opacity-100",
                                            !state.category && "bg-zinc-50 text-zinc-400 scale-95 opacity-0 group-hover:opacity-100"
                                        )}>
                                            {state.category ? <Check size={12} strokeWidth={2.5} /> : <Tag size={12} />}
                                            Business type
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs bg-zinc-900 text-zinc-100 border-zinc-800 p-3 shadow-xl">
                                        <p>Helps us <strong>personalize recommendations</strong> and industry benchmarks for your business.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Region Card - Functional */}
                    <div className="py-4 border-t border-zinc-50">
                        <AnimatePresence mode="wait">
                            {!isEditingRegion ? (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-2xl border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-shadow bg-white group cursor-pointer"
                                    onClick={() => setIsEditingRegion(true)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            Region Settings
                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full lowercase font-medium">Auto-detected</span>
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full h-8 w-8"
                                        >
                                            <Edit2 size={14} />
                                        </Button>
                                    </div>

                                    {/* View Mode Grid - 2 Rows */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group/item pointer-events-none">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 pl-1">Country</p>
                                            <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                                                <span className="text-lg leading-none">{currentRegionData?.flag || '🌍'}</span>
                                                <span className="font-medium text-sm text-zinc-900">{state.region.country || 'Select Country'}</span>
                                            </div>
                                        </div>

                                        <div className="group/item pointer-events-none">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 pl-1">Currency</p>
                                            <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                                                <span className="flex-shrink-0 text-lg leading-none text-zinc-400 font-serif opacity-80">{currencyData?.symbol || '$'}</span>
                                                <span className="font-medium text-sm text-zinc-900">{state.region.currency || '---'}</span>
                                            </div>
                                        </div>

                                        <div className="group/item col-span-2 pointer-events-none">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 pl-1">Timezone</p>
                                            <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                                                <Clock size={16} className="text-zinc-400 flex-shrink-0" />
                                                <span className="font-medium text-sm text-zinc-900 truncate">
                                                    {state.region.timezone
                                                        ? allTimezones.find(tz => tz.value === state.region.timezone)?.label || state.region.timezone
                                                        : '---'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6 relative overflow-visible"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-zinc-900">Customize Region</h3>
                                            <p className="text-sm text-zinc-500">Personalizes the entire product for you.</p>
                                        </div>
                                        <Button
                                            onClick={() => setIsEditingRegion(false)}
                                            className="bg-black text-white hover:bg-zinc-800 rounded-xl px-5 h-10 shadow-lg shadow-black/10"
                                        >
                                            <Check size={16} className="mr-2" /> Done
                                        </Button>
                                    </div>

                                    {/* Edit Mode Grid - 2 Rows to match View */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <SearchableSelect
                                            label="Country"
                                            value={state.region.country}
                                            onLocate={runAutoDetect}
                                            options={regions.map(r => ({ label: r.country, value: r.country, icon: r.flag }))}
                                            onChange={(val) => {
                                                const matched = regions.find(r => r.country === val);
                                                updateState({
                                                    region: {
                                                        ...state.region,
                                                        country: val,
                                                        currency: matched?.currency || state.region.currency,
                                                        timezone: matched?.timezone || state.region.timezone
                                                    }
                                                });
                                            }}
                                        />

                                        <SearchableSelect
                                            label="Currency"
                                            value={state.region.currency}
                                            options={allCurrencies.map(c => ({
                                                label: c.code,
                                                value: c.code,
                                                subLabel: c.name,
                                                icon: <span className="font-serif text-zinc-400">{c.symbol}</span>
                                            }))}
                                            onChange={(val) => updateState({ region: { ...state.region, currency: val } })}
                                        />

                                        <div className="col-span-2">
                                            <SearchableSelect
                                                label="Timezone"
                                                value={state.region.timezone}
                                                onLocate={runAutoDetect}
                                                options={allTimezones.map(r => ({
                                                    label: r.label,
                                                    value: r.value,
                                                    subLabel: r.value,
                                                    icon: <Clock size={14} className="text-zinc-400" />
                                                }))}
                                                onChange={(val) => updateState({ region: { ...state.region, timezone: val } })}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </OnboardingShell>
        </TooltipProvider>
    );
}

