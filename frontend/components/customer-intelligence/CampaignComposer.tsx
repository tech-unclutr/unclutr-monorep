"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import {
    ClipboardIcon,
    CheckIcon,
    ArrowRightIcon,
    CalendarIcon,
    UsersIcon,
    TargetIcon,
    PlusIcon,
    TrashIcon,
    ClockIcon,
    DownloadIcon,
    SparklesIcon,
    InfoIcon,
    Loader2,
    X
} from 'lucide-react';
import { useDebounce } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { containerVariants, itemVariants, glowInputVariants, magicButtonVariants } from "@/lib/animations";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TimeWindowSelector } from "./TimeWindowSelector";
import { AvailabilityMagicPopup } from "./AvailabilityMagicPopup";

interface CampaignComposerProps {
    campaignId: string;
    onComplete: () => void;
    onBack?: () => void;
    onEditLeads?: () => void;
    className?: string;
}

type Step = 'IDENTITY' | 'STRATEGY' | 'EXECUTION';

import { useLocalStorage } from "@/hooks/use-local-storage";

export function CampaignComposer({ campaignId, onComplete, onBack, onEditLeads, className }: CampaignComposerProps) {
    const [persistedState, setPersistedState, removePersistedState] = useLocalStorage(`campaign_composer_${campaignId}`, {
        step: 'IDENTITY' as Step,
        campaignName: '',
        brandContext: '',
        teamMemberContext: '',
        customerContext: '',
        cohorts: [] as string[],
        selectedCohorts: [] as string[],
        cohortConfig: {} as Record<string, number>,
        cohortCounts: {} as Record<string, number>, // { "Cohort A": 42 }
        preliminaryQuestions: [] as string[],
        questionBank: [] as string[],
        incentiveBank: ["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"] as string[], // Default Indian context
        cohortQuestions: {} as Record<string, string[]>,
        cohortIncentives: {} as Record<string, string>,
        activeCohort: null as string | null, // Currently selected cohort for overrides
        incentive: '',
        callDuration: 10,
        executionWindows: [{ day: new Date().toISOString().split('T')[0], start: '09:00', end: '11:00' }]
    });

    const {
        step = 'IDENTITY' as Step,
        campaignName = '',
        brandContext = '',
        teamMemberContext = '',
        customerContext = '',
        cohorts = [] as string[],
        selectedCohorts = [] as string[],
        cohortConfig = {} as Record<string, number>,
        cohortCounts = {} as Record<string, number>,
        preliminaryQuestions = [] as string[],
        questionBank = [] as string[],
        incentiveBank = [] as string[],
        cohortQuestions = {} as Record<string, string[]>,
        cohortIncentives = {} as Record<string, string>,
        activeCohort = null as string | null,
        incentive = '',
        callDuration = 10,
        executionWindows = [] as any[]
    } = persistedState || {};




    const sortedCohorts = React.useMemo(() => {
        return [...cohorts].sort((a, b) => {
            const aSelected = selectedCohorts.includes(a);
            const bSelected = selectedCohorts.includes(b);
            if (aSelected === bSelected) return 0;
            return aSelected ? -1 : 1;
        });
    }, [cohorts, selectedCohorts]);


    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const handlePasteSample = () => {
        setPersistedState(prev => ({
            ...prev,
            brandContext: "Faasos is a delivery-first food brand known primarily for wraps and rolls, positioned as a quick and filling meal option. Customers typically order for convenience, familiar flavours, and a product format that travels well for delivery.",
            teamMemberContext: "The interview will be conducted by a Customer Experience team member from Faasos, focused on understanding the customer’s real ordering experience, satisfaction drivers, and improvement areas.",
            customerContext: "To understand why the customer orders Faasos repeatedly, what they like most (items, taste, convenience), and what 1–2 improvements would increase order frequency (quality consistency, portioning, delivery, packaging, pricing)."
        }));
        toast.success("Pasted sample content for Faasos");
    };

    const [isLoading, setIsLoading] = useState(false);
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; provider?: string; busy_slots?: any[] }>({ connected: false });
    const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
    const [isAvailabilityPopupOpen, setIsAvailabilityPopupOpen] = useState(false);
    const hasInitializedRef = React.useRef(false);

    const checkCalendarStatus = async () => {
        try {
            const status = await api.get('/intelligence/calendar/status');
            setCalendarStatus(status);
        } catch (error) {
            console.error("Failed to check calendar status:", error);
        }
    };

    useEffect(() => {
        // Fetch initial suggestions, cohorts, and complete campaign data
        const initData = async () => {
            if (hasInitializedRef.current) return;

            try {
                setIsLoading(true);
                const [suggestions, cohortData, campaignData] = await Promise.all([
                    api.get(`/intelligence/campaigns/${campaignId}/context-suggestions`),
                    api.get(`/intelligence/campaigns/${campaignId}/cohorts`),
                    api.get(`/intelligence/campaigns/${campaignId}`)
                ]);

                setPersistedState(prev => {
                    const newState = { ...prev };

                    // Prefill campaign name
                    if (!newState.campaignName || newState.campaignName === '') {
                        newState.campaignName = campaignData.name || '';
                    }

                    // Prefill context fields (only if not already set locally or if we are loading existing campaign)
                    const isNewCampaign = campaignData.status === 'DRAFT' && !campaignData.brand_context;

                    if (!newState.brandContext || newState.brandContext === '') {
                        newState.brandContext = campaignData.brand_context || suggestions.brand_context || '';
                    }
                    if (!newState.teamMemberContext || newState.teamMemberContext === '') {
                        newState.teamMemberContext = campaignData.team_member_context || suggestions.team_member_context || '';
                    }
                    if (!newState.customerContext || newState.customerContext === '') {
                        newState.customerContext = campaignData.customer_context || '';
                    }

                    // Prefill questions and banks
                    if (!newState.preliminaryQuestions || newState.preliminaryQuestions.length === 0) {
                        newState.preliminaryQuestions = campaignData.preliminary_questions || [];
                    }
                    if (!newState.questionBank || newState.questionBank.length === 0) {
                        newState.questionBank = campaignData.question_bank || [];
                    }

                    // Critical Fix: Overwrite default incentive bank if backend has something else
                    const defaultIncentives = ["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"];
                    const hasDefaultIncentives = JSON.stringify(newState.incentiveBank) === JSON.stringify(defaultIncentives);
                    if (!newState.incentiveBank || newState.incentiveBank.length === 0 || hasDefaultIncentives) {
                        if (campaignData.incentive_bank && campaignData.incentive_bank.length > 0) {
                            newState.incentiveBank = campaignData.incentive_bank;
                        } else if (!hasDefaultIncentives) {
                            newState.incentiveBank = defaultIncentives;
                        }
                    }

                    // Prefill incentive
                    if (!newState.incentive || newState.incentive === '') {
                        newState.incentive = campaignData.incentive || '';
                    }

                    // Prefill call duration (convert from seconds to minutes)
                    if (campaignData.call_duration_limit && (!newState.callDuration || newState.callDuration === 10)) {
                        newState.callDuration = Math.floor(campaignData.call_duration_limit / 60);
                    }

                    // Prefill execution windows - Overwrite if only default is present
                    const isDefaultWindow = newState.executionWindows?.length === 1 &&
                        newState.executionWindows[0].start === '09:00' &&
                        newState.executionWindows[0].end === '11:00';

                    if (!newState.executionWindows || newState.executionWindows.length === 0 || isDefaultWindow) {
                        if (campaignData.execution_windows && campaignData.execution_windows.length > 0) {
                            newState.executionWindows = campaignData.execution_windows;
                        }
                    }

                    // Handle Cohorts & Counts - ALWAYS update counts to keep them fresh
                    if (newState.cohorts.length === 0 || (cohortData.cohorts?.length > 0 && JSON.stringify(newState.cohorts) !== JSON.stringify(cohortData.cohorts))) {
                        newState.cohorts = cohortData.cohorts || [];
                    }

                    // Initialize selectedCohorts based on backend data
                    if (!newState.selectedCohorts || newState.selectedCohorts.length === 0) {
                        newState.selectedCohorts = campaignData.selected_cohorts || cohortData.selected_cohorts || newState.cohorts;
                    }

                    // Always update counts
                    newState.cohortCounts = cohortData.cohort_counts || {};

                    // Prefill cohort configuration
                    if (Object.keys(newState.cohortConfig).length === 0 && campaignData.cohort_config) {
                        newState.cohortConfig = campaignData.cohort_config;
                    }

                    // Prefill cohort questions
                    if (Object.keys(newState.cohortQuestions).length === 0 && campaignData.cohort_questions) {
                        newState.cohortQuestions = campaignData.cohort_questions;
                    }

                    // Prefill cohort incentives
                    if (Object.keys(newState.cohortIncentives).length === 0 && campaignData.cohort_incentives) {
                        newState.cohortIncentives = campaignData.cohort_incentives;
                    }

                    return newState;
                });
                hasInitializedRef.current = true;
            } catch (error) {
                console.error("Failed to fetch campaign init data:", error);
                toast.error("Failed to load campaign data");
            } finally {
                setIsLoading(false);
            }
        };

        if (campaignId) {
            initData();
            checkCalendarStatus();
        }
    }, [campaignId]);



    // Auto-Save Logic
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const debouncedCampaignName = useDebounce(campaignName, 1500);
    const debouncedBrandContext = useDebounce(brandContext, 1500);
    const debouncedTeamContext = useDebounce(teamMemberContext, 1500);
    const debouncedCustomerContext = useDebounce(customerContext, 1500);
    const debouncedCohortConfig = useDebounce(cohortConfig, 1500);
    const debouncedCohortQuestions = useDebounce(cohortQuestions, 1500);
    const debouncedCohortIncentives = useDebounce(cohortIncentives, 1500);
    const debouncedIncentive = useDebounce(incentive, 1500);
    const debouncedPreliminaryQuestions = useDebounce(preliminaryQuestions, 1500);
    const debouncedSelectedCohorts = useDebounce(selectedCohorts, 1500);
    const debouncedQuestionBank = useDebounce(questionBank, 1500);
    const debouncedIncentiveBank = useDebounce(incentiveBank, 1500);
    const debouncedExecutionWindows = useDebounce(executionWindows, 1500);
    const debouncedCallDuration = useDebounce(callDuration, 1500);

    useEffect(() => {
        // Skip initial render or empty states if desirable, but we want to save if user clears it too.
        // We skip if campaignId is missing or if we are still loading initial data (which might set contexts)
        if (!campaignId || isLoading) return;

        const autoSave = async () => {
            setIsSaving(true);
            try {
                await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                    name: debouncedCampaignName,
                    brand_context: debouncedBrandContext,
                    team_member_context: debouncedTeamContext,
                    customer_context: debouncedCustomerContext,
                    cohort_config: debouncedCohortConfig,
                    selected_cohorts: debouncedSelectedCohorts,
                    cohort_questions: debouncedCohortQuestions,
                    cohort_incentives: debouncedCohortIncentives,
                    incentive: debouncedIncentive,
                    preliminary_questions: debouncedPreliminaryQuestions,
                    question_bank: debouncedQuestionBank,
                    incentive_bank: debouncedIncentiveBank,
                    execution_windows: debouncedExecutionWindows,
                    call_duration_limit: debouncedCallDuration * 60
                });
                setLastSaved(new Date());
            } catch (error) {
                console.error("Auto-save failed", error);
                // Optional: toast.error("Auto-save failed"); (keep silent to avoid spam)
            } finally {
                setIsSaving(false);
            }
        };

        // Only save if dirty? For now, we save whenever debounced value changes.
        // To avoid saving initial blank state over existing state on mount, ensure logic considers that.
        // However, initial load sets state, which triggers this effect.
        // WE NEED TO AVOID SAVING ON INITIAL FETCH.
        // The `isLoading` check above helps, but `isLoading` is set to false AFTER setting state.
        // Setting state triggers re-render, then effect.
        // We might want a ref to track if it's the first run or if data was just loaded.

        autoSave();

    }, [
        debouncedCampaignName,
        debouncedBrandContext,
        debouncedTeamContext,
        debouncedCustomerContext,
        JSON.stringify(debouncedCohortConfig),
        JSON.stringify(debouncedCohortQuestions),
        JSON.stringify(debouncedCohortIncentives),
        debouncedIncentive,
        JSON.stringify(debouncedPreliminaryQuestions),
        JSON.stringify(debouncedQuestionBank),
        JSON.stringify(debouncedIncentiveBank),
        JSON.stringify(debouncedSelectedCohorts),
        JSON.stringify(debouncedExecutionWindows),
        debouncedCallDuration,
        campaignId
    ]);
    // removed isLoading from dep array to avoid double trigger, but added logic check inside.


    const handleSaveAndNext = async () => {
        if (step === 'IDENTITY' && !customerContext) {
            toast.error("Customer context is mandatory");
            return;
        }

        if (step === 'EXECUTION') {
            await finalizeCampaign();
            return;
        }

        // Animated transition
        setPersistedState(prev => ({
            ...prev,
            step: step === 'IDENTITY' ? 'STRATEGY' : 'EXECUTION'
        }));
    };

    const finalizeCampaign = async () => {
        try {
            setIsLoading(true);

            // Format execution windows to ISO for backend
            const formattedWindows = executionWindows.map(w => {
                return { ...w };
            });

            await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                name: campaignName,
                brand_context: brandContext,
                customer_context: customerContext,
                team_member_context: teamMemberContext,
                preliminary_questions: preliminaryQuestions,
                question_bank: questionBank,
                incentive_bank: incentiveBank,
                cohort_questions: cohortQuestions,
                cohort_incentives: cohortIncentives,
                incentive: incentive,
                cohort_config: cohortConfig,
                call_duration_limit: callDuration * 60,
                execution_windows: formattedWindows
            });

            toast.success("Campaign successfully created & launched!");
            removePersistedState();
            onComplete();
        } catch (error) {
            toast.error("Failed to save campaign settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadIcs = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/intelligence/campaigns/${campaignId}/calendar-export`, {
                headers: {
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                }
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `campaign-block-${campaignId}.ics`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            toast.error("Failed to download calendar block");
        }
    };

    const handleConnectCalendar = async () => {
        try {
            const { url } = await api.get('/intelligence/calendar/google/login');
            window.location.href = url;
        } catch (error) {
            toast.error("Failed to initiate calendar connection");
        }
    };

    const handleCalendarSync = async () => {
        try {
            setIsSyncingCalendar(true);

            // Explicitly save current state first to ensure backend has latest windows
            await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                name: campaignName,
                brand_context: brandContext,
                customer_context: customerContext,
                team_member_context: teamMemberContext,
                execution_windows: executionWindows,
                call_duration_limit: callDuration * 60,
                selected_cohorts: selectedCohorts,
                cohort_config: cohortConfig,
                cohort_questions: cohortQuestions,
                cohort_incentives: cohortIncentives,
                preliminary_questions: preliminaryQuestions,
                incentive: incentive,
                question_bank: questionBank,
                incentive_bank: incentiveBank
            });

            const response = await api.post(`/intelligence/campaigns/${campaignId}/calendar-sync`);
            toast.success(response.message || "Calendar synced successfully!");
        } catch (error) {
            console.error("Calendar sync failed:", error);
            toast.error("Failed to sync calendar");
        } finally {
            setIsSyncingCalendar(false);
        }
    };

    const handleApplyQuestionsToSelected = (currentCohort: string) => {
        const questions = cohortQuestions[currentCohort] || preliminaryQuestions;
        setPersistedState(prev => {
            const newCohortQuestions = { ...prev.cohortQuestions };
            // Apply only to selected cohorts
            (prev.selectedCohorts || []).forEach(c => {
                newCohortQuestions[c] = [...questions];
            });
            return {
                ...prev,
                preliminaryQuestions: [...questions],
                cohortQuestions: newCohortQuestions
            };
        });
        toast.success(`Applied questions from ${currentCohort} to all selected cohorts`);
    };

    const handleApplyIncentiveToSelected = (currentCohort: string) => {
        const incentiveVal = cohortIncentives[currentCohort] ?? incentive;
        setPersistedState(prev => {
            const newCohortIncentives = { ...prev.cohortIncentives };
            // Apply only to selected cohorts
            (prev.selectedCohorts || []).forEach(c => {
                newCohortIncentives[c] = incentiveVal;
            });
            return {
                ...prev,
                incentive: incentiveVal,
                cohortIncentives: newCohortIncentives
            };
        });
        toast.success(`Applied incentive from ${currentCohort} to all selected cohorts`);
    };

    const steps = ['IDENTITY', 'STRATEGY', 'EXECUTION'];
    const currentStepIndex = steps.indexOf(step);

    return (
        <Card
            onMouseMove={handleMouseMove}
            className={cn(
                "overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[2rem] relative group min-h-[600px] flex flex-col transition-all duration-500 shadow-2xl",
                className
            )}
        >
            {/* Spotlight Overlay */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(99, 102, 241, 0.08),
                            transparent 80%
                        )
                    `,
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-emerald-500/[0.01] pointer-events-none" />

            <CardContent className="p-6 md:p-8 flex flex-col h-full relative z-10 flex-1">
                {/* Progress Header */}
                <div className="flex items-center gap-4 mb-6">
                    {steps.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={cn(
                                "flex items-center gap-3 transition-all duration-500",
                                step === s ? "opacity-100" : "opacity-30"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300",
                                    step === s ? "bg-indigo-500 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-transparent text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                )}>
                                    <span className="text-[10px] font-bold">0{i + 1}</span>
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-tight hidden md:inline transition-colors",
                                    step === s ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                                )}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                            </div>
                            {i < 2 && (
                                <div className="flex-1 h-[1px] bg-zinc-100 dark:bg-zinc-900 mx-2" />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 pb-12 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 'IDENTITY' && (
                            <motion.div
                                key="identity"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-10"
                            >
                                <motion.div variants={itemVariants} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-bold dark:text-white tracking-tight">Campaign Identity</h2>
                                        <p className="text-sm text-gray-500 font-medium">Define the persona and brand context for your interview agent.</p>
                                    </div>
                                </motion.div>

                                {/* Campaign Name Field */}
                                <motion.div variants={itemVariants} className="space-y-3">
                                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Campaign Name
                                    </label>
                                    <Input
                                        value={campaignName}
                                        onChange={(e) => setPersistedState(prev => ({ ...prev, campaignName: e.target.value }))}
                                        placeholder="Enter campaign name..."
                                        className="h-12 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 focus:border-indigo-500/10 transition-all duration-500 text-[15px] px-6 shadow-none focus:shadow-2xl focus:shadow-indigo-500/5 placeholder:text-zinc-300 caret-indigo-500"
                                    />
                                </motion.div>

                                {/* AI Feed - De-boxed & Integrated */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex flex-col md:flex-row items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                            <SparklesIcon className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">AI Intelligence Feed</h4>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Pre-fill context from Faasos dataset.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {onEditLeads && (
                                            <Button
                                                onClick={onEditLeads}
                                                variant="outline"
                                                className="border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all rounded-xl"
                                            >
                                                Manage Leads
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handlePasteSample}
                                            variant="ghost"
                                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 transition-all rounded-xl"
                                        >
                                            Load Sample Context
                                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                                            Brand Context
                                        </label>
                                        <motion.div
                                            variants={glowInputVariants}
                                            initial="initial"
                                            whileFocus="focus"
                                            animate={{}}
                                        >
                                            <Textarea
                                                value={brandContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, brandContext: e.target.value }))}
                                                placeholder="Describe your brand's identity and positioning..."
                                                className="min-h-[200px] rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 focus:border-indigo-500/10 resize-none transition-all duration-500 text-[15px] leading-loose p-6 shadow-none focus:shadow-2xl focus:shadow-indigo-500/5 placeholder:text-zinc-300 [&::-webkit-scrollbar]:hidden caret-indigo-500"
                                            />
                                        </motion.div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                                            Team Context
                                        </label>
                                        <motion.div variants={glowInputVariants} initial="initial" whileFocus="focus">
                                            <Textarea
                                                value={teamMemberContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, teamMemberContext: e.target.value }))}
                                                placeholder="Describe who will be conducting the interviews..."
                                                className="min-h-[200px] rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 focus:border-purple-500/10 resize-none transition-all duration-500 text-[15px] leading-loose p-6 shadow-none focus:shadow-2xl focus:shadow-purple-500/5 placeholder:text-zinc-300 [&::-webkit-scrollbar]:hidden caret-indigo-500"
                                            />
                                        </motion.div>
                                    </motion.div>


                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                                            Call Purpose
                                        </label>
                                        <motion.div variants={glowInputVariants} initial="initial" whileFocus="focus" className="relative z-10">
                                            <Textarea
                                                value={customerContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, customerContext: e.target.value }))}
                                                placeholder="Define the primary objective for this interview campaign..."
                                                className="min-h-[200px] rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 focus:border-orange-500/10 resize-none transition-all duration-500 text-[15px] leading-loose p-6 shadow-none focus:shadow-2xl focus:shadow-orange-500/5 placeholder:text-zinc-300 [&::-webkit-scrollbar]:hidden caret-indigo-500"
                                            />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'STRATEGY' && (
                            <motion.div
                                key="strategy"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-4"
                            >
                                <motion.div variants={itemVariants} className="space-y-1">
                                    <h2 className="text-2xl font-bold dark:text-white tracking-tight">Campaign Strategy</h2>
                                    <p className="text-sm text-gray-500 font-medium">Configure targets and protocols for each cohort segment.</p>
                                </motion.div>

                                {cohorts.length === 0 ? (
                                    <div className="p-12 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <UsersIcon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No Cohorts Found</h3>
                                        <p className="text-xs text-gray-500 font-medium">Upload a CSV with a 'Cohort' column to configure segments.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* AVATAR TABS NAVIGATION */}
                                        <div className="flex items-center gap-4 overflow-x-auto p-4 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {sortedCohorts.map((cohort, index) => {
                                                const isSelected = selectedCohorts.includes(cohort);
                                                const isActive = (activeCohort || sortedCohorts[0]) === cohort;
                                                const qCount = (cohortQuestions[cohort] || preliminaryQuestions).length;
                                                const tCalls = cohortConfig[cohort] || 0;

                                                // Deterministic avatar assignment based on string hash
                                                const avatarIndex = (cohort.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 12) + 1;

                                                return (
                                                    <motion.button
                                                        key={cohort}
                                                        onClick={() => setPersistedState(prev => {
                                                            const isActive = (prev.activeCohort || sortedCohorts[0]) === cohort;
                                                            let newSelected = [...(prev.selectedCohorts || [])];

                                                            if (!isActive) {
                                                                // Switching tabs: ensure it becomes selected if not already
                                                                if (!newSelected.includes(cohort)) {
                                                                    newSelected.push(cohort);
                                                                }
                                                            } else {
                                                                // Clicking the already active tab: toggle selection
                                                                if (newSelected.includes(cohort)) {
                                                                    newSelected = newSelected.filter(c => c !== cohort);
                                                                } else {
                                                                    newSelected.push(cohort);
                                                                }
                                                            }

                                                            return {
                                                                ...prev,
                                                                selectedCohorts: newSelected,
                                                                activeCohort: cohort // Switch view to this cohort
                                                            };
                                                        })}
                                                        whileHover={{ y: -2 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className={cn(
                                                            "relative flex-shrink-0 flex items-center gap-3 p-1.5 pr-5 rounded-full border transition-all duration-500 group",
                                                            isSelected
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20"
                                                                : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                                                            isActive && !isSelected && "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-900",
                                                            isActive && isSelected && "ring-2 ring-white ring-offset-2 ring-offset-indigo-600"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all duration-300 overflow-hidden bg-white",
                                                            isSelected ? "scale-105 ring-2 ring-white/20" : "group-hover:scale-110"
                                                        )}>
                                                            <img
                                                                src={`/images/avatars/avatar_${avatarIndex}.png`}
                                                                alt={cohort}
                                                                className={cn("w-full h-full object-cover transition-opacity duration-300",
                                                                    !isSelected && "opacity-50 grayscale"
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-start text-left gap-0.5">
                                                            <span className={cn(
                                                                "text-xs font-bold transition-colors duration-300",
                                                                isActive && isSelected ? "text-yellow-200" :
                                                                    isActive && !isSelected ? "text-indigo-600 dark:text-indigo-400" :
                                                                        isSelected ? "text-white" :
                                                                            "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white"
                                                            )}>
                                                                {cohort}
                                                            </span>
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 text-[10px] font-medium transition-colors duration-300",
                                                                isActive && isSelected ? "text-yellow-100/70" :
                                                                    isActive && !isSelected ? "text-indigo-500/70" :
                                                                        isSelected ? "text-indigo-100" :
                                                                            "text-zinc-400 group-hover:text-indigo-500/70"
                                                            )}>
                                                                <span>{tCalls} Calls Target</span>
                                                                <span className="opacity-40">&bull;</span>
                                                                <span>{qCount} Qs</span>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        {/* DETAIL CARD */}
                                        <AnimatePresence mode="wait">
                                            {(() => {
                                                const currentCohort = activeCohort || sortedCohorts[0];
                                                // Safety check
                                                if (!cohorts.includes(currentCohort)) return null;

                                                const currentQuestions = cohortQuestions[currentCohort] || preliminaryQuestions;
                                                const currentIncentive = cohortIncentives[currentCohort] ?? incentive;

                                                return (
                                                    <motion.div
                                                        key={currentCohort}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="group relative p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-xl shadow-zinc-200/50 dark:shadow-none"
                                                    >
                                                        <div className="flex flex-col md:flex-row gap-8">
                                                            {/* LEFT COLUMN: Target & Questions */}
                                                            <div className="flex-1 space-y-5">
                                                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-100 dark:border-white/5">
                                                                    <div className="relative w-20 h-28 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700/50 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-all duration-500 flex items-center justify-center p-1.5">
                                                                        <img
                                                                            src={`/images/avatars/full_body/avatar_${(currentCohort.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 12) + 1}.png`}
                                                                            alt={`${currentCohort} Avatar`}
                                                                            className="w-full h-full object-contain"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Target Volume</label>
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Conduct</span>
                                                                            <Input
                                                                                type="number"
                                                                                value={cohortConfig[currentCohort] || 0}
                                                                                onChange={(e) => setPersistedState(prev => ({
                                                                                    ...prev,
                                                                                    cohortConfig: { ...prev.cohortConfig, [currentCohort]: parseInt(e.target.value) || 0 }
                                                                                }))}
                                                                                className="w-16 h-8 text-center font-bold border-none bg-transparent p-0 text-lg focus-visible:ring-0 border-b border-zinc-200 rounded-none px-1"
                                                                            />
                                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">interviews</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                                            Preliminary Questions
                                                                        </label>
                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                onClick={() => handleApplyQuestionsToSelected(currentCohort)}
                                                                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                                                            >
                                                                                <SparklesIcon className="w-3 h-3" />
                                                                                Apply to selected
                                                                            </button>
                                                                            <span className="text-[10px] font-medium text-zinc-400">{currentQuestions.length}/3</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2.5">
                                                                        {currentQuestions.map((q, qIdx) => (
                                                                            <div key={qIdx} className="relative group/q">
                                                                                <SearchableSelect
                                                                                    value={q}
                                                                                    options={[
                                                                                        ...questionBank.map(bq => ({ label: bq, value: bq })),
                                                                                        // Add current value if not in bank (editing)
                                                                                        ...(q && !questionBank.includes(q) ? [{ label: q, value: q }] : [])
                                                                                    ]}
                                                                                    onChange={(val) => {
                                                                                        setPersistedState(prev => {
                                                                                            const newBank = [...(prev.questionBank || [])];
                                                                                            if (val.length > 5 && !newBank.includes(val)) newBank.push(val);

                                                                                            const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                            const newQList = currentCohortQuestions[currentCohort]
                                                                                                ? [...currentCohortQuestions[currentCohort]]
                                                                                                : [...(prev.preliminaryQuestions || [])];
                                                                                            newQList[qIdx] = val;

                                                                                            return {
                                                                                                ...prev,
                                                                                                questionBank: newBank,
                                                                                                cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList }
                                                                                            };
                                                                                        });
                                                                                    }}
                                                                                    allowCustomValue={true}
                                                                                    placeholder="Select or type a question..."
                                                                                    className="h-10 border-transparent bg-zinc-50 dark:bg-black/20 hover:bg-zinc-100"
                                                                                />
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setPersistedState(prev => {
                                                                                            const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                            const newQList = currentCohortQuestions[currentCohort]
                                                                                                ? [...currentCohortQuestions[currentCohort]]
                                                                                                : [...(prev.preliminaryQuestions || [])];
                                                                                            newQList.splice(qIdx, 1);
                                                                                            return {
                                                                                                ...prev,
                                                                                                cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList }
                                                                                            };
                                                                                        });
                                                                                    }}
                                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/q:opacity-100 text-zinc-300 hover:text-red-500 transition-all p-1 hover:bg-zinc-100 rounded-lg"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        {currentQuestions.length < 3 && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                className="w-full h-10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-xs font-bold uppercase tracking-wider"
                                                                                onClick={() => {
                                                                                    const defaultQ = "New question...";
                                                                                    setPersistedState(prev => {
                                                                                        const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                        const newQList = currentCohortQuestions[currentCohort]
                                                                                            ? [...currentCohortQuestions[currentCohort]] // already has override
                                                                                            : [...(prev.preliminaryQuestions || [])]; // clone global to start override
                                                                                        if (newQList.length < 3) newQList.push(defaultQ);
                                                                                        return {
                                                                                            ...prev,
                                                                                            cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList }
                                                                                        };
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <PlusIcon className="w-4 h-4 mr-2" /> Add Question
                                                                            </Button>
                                                                        )}

                                                                        {/* Question Bank Pills */}
                                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                                            {questionBank.filter(bq => !currentQuestions.includes(bq)).slice(0, 3).map((bq, bIdx) => (
                                                                                <button
                                                                                    key={bIdx}
                                                                                    onClick={() => {
                                                                                        setPersistedState(prev => {
                                                                                            const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                            const newQList = currentCohortQuestions[currentCohort]
                                                                                                ? [...currentCohortQuestions[currentCohort]]
                                                                                                : [...(prev.preliminaryQuestions || [])];
                                                                                            if (newQList.length < 3) {
                                                                                                newQList.push(bq);
                                                                                                return {
                                                                                                    ...prev,
                                                                                                    cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList }
                                                                                                };
                                                                                            }
                                                                                            return prev;
                                                                                        });
                                                                                    }}
                                                                                    className="text-[10px] items-center flex gap-1 font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all max-w-full truncate"
                                                                                >
                                                                                    <PlusIcon className="w-3 h-3" /> {bq}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* RIGHT COLUMN: Incentives & Context */}
                                                            <div className="w-full md:w-1/3 space-y-5 pt-2 md:pt-0 md:border-l border-zinc-100 dark:border-zinc-800 md:pl-6">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                                            Incentive
                                                                        </label>
                                                                        <button
                                                                            onClick={() => handleApplyIncentiveToSelected(currentCohort)}
                                                                            className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                                                                        >
                                                                            <SparklesIcon className="w-3 h-3" />
                                                                            Apply to selected
                                                                        </button>
                                                                    </div>
                                                                    <div className="bg-orange-50/50 dark:bg-orange-500/5 rounded-2xl p-1 border border-orange-100 dark:border-orange-500/10">
                                                                        <SearchableSelect
                                                                            value={currentIncentive}
                                                                            options={[
                                                                                { label: "₹100 UPI", value: "₹100 UPI" },
                                                                                { label: "₹200 UPI", value: "₹200 UPI" },
                                                                                { label: "₹500 Amazon Voucher", value: "₹500 Amazon Voucher" },
                                                                                { label: "Swiggy Coupon", value: "Swiggy Coupon" },
                                                                                { label: "Zomato Gold", value: "Zomato Gold" },
                                                                                ...(currentIncentive && !["₹100 UPI", "₹200 UPI", "₹500 Amazon Voucher", "Swiggy Coupon", "Zomato Gold"].includes(currentIncentive)
                                                                                    ? [{ label: currentIncentive, value: currentIncentive }]
                                                                                    : [])
                                                                            ]}
                                                                            onChange={(val) => {
                                                                                setPersistedState(prev => ({
                                                                                    ...prev,
                                                                                    cohortIncentives: { ...prev.cohortIncentives, [currentCohort]: val }
                                                                                }));
                                                                            }}
                                                                            onClear={() => {
                                                                                setPersistedState(prev => ({
                                                                                    ...prev,
                                                                                    cohortIncentives: { ...prev.cohortIncentives, [currentCohort]: "" }
                                                                                }));
                                                                            }}
                                                                            allowCustomValue={true}
                                                                            placeholder="Select incentive..."
                                                                            className="h-10 border-none bg-transparent shadow-none focus-visible:ring-0 text-orange-900 dark:text-orange-200 font-bold text-sm placeholder:text-orange-300"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Cohort Summary</h4>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="text-zinc-500">Segment Priority</span>
                                                                            <span className="font-bold text-zinc-900 dark:text-white">High</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="text-zinc-500">Total Customers</span>
                                                                            <span className="font-bold text-zinc-900 dark:text-white">{cohortCounts[currentCohort] || 0}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="text-zinc-500">Est. Duration</span>
                                                                            <span className="font-bold text-zinc-900 dark:text-white">~{Math.round((cohortConfig[currentCohort] || 0) * 10 / 60)} hrs</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })()}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'EXECUTION' && (
                            <motion.div
                                key="execution"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-8"
                            >
                                <motion.div variants={itemVariants} className="space-y-1">
                                    <h2 className="text-3xl font-bold dark:text-white tracking-tight">Execution Details</h2>
                                    <p className="text-sm text-gray-500 font-medium">Define temporal constraints and call limitations for this run.</p>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <motion.div variants={itemVariants} className="space-y-12">
                                        <div className="space-y-8 p-8 rounded-[2.5rem] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Target Call Duration</label>
                                                    <p className="text-xs text-gray-500 font-medium italic">How long are you planning to keep these calls?</p>
                                                </div>
                                                <div className="flex items-baseline gap-1 bg-white dark:bg-zinc-950 px-4 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{callDuration}</span>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Min</span>
                                                </div>
                                            </div>

                                            <div className="space-y-6 px-2">
                                                <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400 }}>
                                                    <Slider
                                                        value={[callDuration]}
                                                        min={3}
                                                        max={30}
                                                        step={1}
                                                        onValueChange={(val) => setPersistedState(prev => ({ ...prev, callDuration: val[0] }))}
                                                        className="cursor-pointer py-4"
                                                    />
                                                </motion.div>

                                                {/* Range Visual Cues */}
                                                <div className="flex justify-between relative px-1">
                                                    {[3, 10, 20, 30].map((tick) => (
                                                        <div key={tick} className="flex flex-col items-center gap-2">
                                                            <div className={cn(
                                                                "w-1 h-1 rounded-full transition-colors duration-300",
                                                                callDuration >= tick ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-800"
                                                            )} />
                                                            <span className={cn(
                                                                "text-[10px] font-bold transition-colors duration-300",
                                                                callDuration >= tick ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"
                                                            )}>{tick}m</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="h-5 px-2 text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-500">Quick Sync</Badge>
                                                    <span className="text-[10px] font-medium text-zinc-400">&bull; Tactical & Fast</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium text-zinc-400">Detailed & Deep &bull;</span>
                                                    <Badge variant="outline" className="h-5 px-2 text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-500">Deep Dive</Badge>
                                                </div>
                                            </div>
                                        </div>


                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-6">
                                        <div className="flex flex-col gap-5 pb-6 border-b border-zinc-100 dark:border-zinc-800/50 mb-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    Execution Windows
                                                </label>
                                                <p className="text-[11px] text-zinc-500 font-medium italic">Define when the AI agent is active.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            <AnimatePresence>
                                                {executionWindows.map((window, i) => (
                                                    <TimeWindowSelector
                                                        key={i}
                                                        day={window.day}
                                                        start={window.start}
                                                        end={window.end}
                                                        onChange={(updates) => {
                                                            const newW = [...executionWindows];
                                                            newW[i] = { ...newW[i], ...updates };
                                                            setPersistedState(prev => ({ ...prev, executionWindows: newW }));
                                                        }}
                                                        onDelete={() => {
                                                            setPersistedState(prev => ({
                                                                ...prev,
                                                                executionWindows: prev.executionWindows.filter((_, idx) => idx !== i)
                                                            }));
                                                        }}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        <div className="flex items-center gap-3 w-full pt-4">
                                            {/* Sync Button */}
                                            {calendarStatus.connected && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="flex-1 h-10 px-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-indigo-100/50"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            setIsSyncingCalendar(true);
                                                            await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                                                                execution_windows: executionWindows
                                                            });
                                                            const response = await api.post(`/intelligence/campaigns/${campaignId}/calendar-sync`);
                                                            toast.success(response.message || "Windows synced to Google Calendar!");
                                                        } catch (error) {
                                                            toast.error("Failed to sync calendar");
                                                        } finally {
                                                            setIsSyncingCalendar(false);
                                                        }
                                                    }}
                                                    disabled={isSyncingCalendar}
                                                >
                                                    {isSyncingCalendar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SparklesIcon className="w-3.5 h-3.5" />}
                                                    Block on Google
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="flex-1 h-10 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-xs gap-2 transition-all duration-300"
                                                onClick={() => setPersistedState(prev => ({ ...prev, executionWindows: [...prev.executionWindows, { day: new Date().toISOString().split('T')[0], start: '09:00', end: '11:00' }] }))}
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Add Window
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-10 mt-auto border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-8">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (step === 'IDENTITY') onBack?.();
                                if (step === 'STRATEGY') setPersistedState(prev => ({ ...prev, step: 'IDENTITY' }));
                                if (step === 'EXECUTION') setPersistedState(prev => ({ ...prev, step: 'STRATEGY' }));
                            }}
                            disabled={isLoading}
                            className="rounded-xl h-14 px-8 font-bold text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Back
                        </Button>

                        <AnimatePresence>
                            {isSaving && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-[10px] text-indigo-500 font-bold uppercase tracking-widest"
                                >
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Syncing Draft</span>
                                </motion.div>
                            )}
                            {!isSaving && lastSaved && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-3"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="hidden md:flex flex-col items-end"
                            >
                                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest leading-tight">Up Next</span>
                                <span className="text-sm text-zinc-900 dark:text-white font-bold tracking-tight">{step === 'IDENTITY' ? 'Strategy Mapping' : step === 'STRATEGY' ? 'Execution Slots' : 'Launch Campaign'}</span>
                            </motion.div>
                        </AnimatePresence>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={handleSaveAndNext}
                                disabled={isLoading}
                                size="lg"
                                className="rounded-xl h-14 px-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-200 font-black text-xs uppercase tracking-[0.2em] group relative shadow-2xl"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {isLoading ? "Processing" : step === 'EXECUTION' ? "Initialize" : "Proceed"}
                                    {step !== 'EXECUTION' && <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                    {step === 'EXECUTION' && <CheckIcon className="w-4 h-4" />}
                                </span>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </CardContent >

            <AvailabilityMagicPopup
                isOpen={isAvailabilityPopupOpen}
                onClose={() => setIsAvailabilityPopupOpen(false)}
                busySlots={calendarStatus?.busy_slots || []}
                activeCampaign={{ ...persistedState, execution_windows: executionWindows }}
                onSaveWindow={async (window) => {
                    setPersistedState(prev => ({
                        ...prev,
                        executionWindows: [...prev.executionWindows, window]
                    }));
                    // Also trigger backend save if we are in live mode?
                    // For now, local state update is sufficient as auto-save picks it up.
                    // But maybe we want instant feedback if possible.
                    toast.success("Window added! Auto-saving...");
                }}
            />
        </Card >
    );
}
