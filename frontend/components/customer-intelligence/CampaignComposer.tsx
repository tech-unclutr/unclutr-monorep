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
import { getUniqueCohortAvatars } from "@/lib/avatar-utils";
import { addMinutes, format, setMinutes, startOfHour } from 'date-fns';

const getNextTimeSlot = () => {
    const now = new Date();
    // Round up to next 15 min slot
    const minutes = now.getMinutes();
    const remainder = minutes % 15;
    const minutesToAdd = 15 - remainder;

    // If it's exactly on the hour/15/30/45, start from NEXT slot (so +15 is correct, assuming "next available")
    // If user said "it can be now, if slot is free", but also "start from next full number slot".
    // "start from next full number slot" -> implication is clear 00/15/30/45.
    // If now is 12:00, "next" 15 min slot could be 12:15 or 12:00 if we consider "available now"?
    // "always in 00, 15, 30, 45"
    // "it can be now". So if it is 12:00, start at 12:00?
    // Let's being safe: always round UP to the next 15m block to give user time.
    // Actually, "it can be now" implies if it's 14:00, we can start at 14:00.
    // But usually software takes a moment. Let's stick to rounding up to next realistic slot. 
    // If 14:01 -> 14:15. If 14:14 -> 14:15. If 14:15 -> 14:30? Or 14:15?
    // Let's go with: current time -> ceil to nearest 15.

    let nextSlot = addMinutes(now, minutesToAdd);

    // Ensure we are at least "now" or future. (addMinutes handles rollover)

    const startStr = format(nextSlot, 'HH:mm');
    const endStr = format(addMinutes(nextSlot, 60), 'HH:mm'); // Default 1 hour duration

    return {
        day: format(now, 'yyyy-MM-dd'),
        start: startStr,
        end: endStr
    };
};

interface CampaignComposerProps {
    campaignId: string;
    initialName?: string;
    onComplete: () => void;
    onBack?: () => void;
    onEditLeads?: () => void;
    onError?: (error: any) => void;
    className?: string;
}

type Step = 'IDENTITY' | 'STRATEGY' | 'EXECUTION';

import { useSessionStorage } from "@/hooks/use-session-storage";

const SAMPLE_BRAND_CONTEXT = "Faasos is a delivery-first food brand known primarily for wraps and rolls, positioned as a quick and filling meal option. Customers typically order for convenience, familiar flavours, and a product format that travels well for delivery.";
const SAMPLE_TEAM_CONTEXT = "The interview will be conducted by a Customer Experience team member from Faasos, focused on understanding the customer’s real ordering experience, satisfaction drivers, and improvement areas.";
const SAMPLE_CUSTOMER_CONTEXT = "To understand why the customer orders Faasos repeatedly, what they like most (items, taste, convenience), and what 1–2 improvements would increase order frequency (quality consistency, portioning, delivery, packaging, pricing).";

export function CampaignComposer({ campaignId, initialName, onComplete, onBack, onEditLeads, onError, className }: CampaignComposerProps) {
    const [persistedState, setPersistedState, removePersistedState] = useSessionStorage(`campaign_composer_${campaignId}`, {
        step: 'IDENTITY' as Step,
        campaignName: initialName || '',
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
        executionWindows: [getNextTimeSlot()]
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
        // Grouping selected cohorts at the front while maintaining original relative order.
        return [...cohorts].sort((a, b) => {
            const aSelected = selectedCohorts.includes(a);
            const bSelected = selectedCohorts.includes(b);
            if (aSelected === bSelected) return 0;
            return aSelected ? -1 : 1;
        });
    }, [cohorts, selectedCohorts]);

    const assignedAvatars = React.useMemo(() => getUniqueCohortAvatars(cohorts), [cohorts]);

    // Helper to get ALL cohorts that might need an avatar (selected + available) so collision logic considers them all?
    // Actually, `getUniqueCohortAvatars` needs the full set to ensure stability if we want them to stay same.
    // If we only pass "sortedCohorts", that changes order -> probing changes.
    // But `getUniqueCohortAvatars` sorts internally. So passing `sortedCohorts` or `cohorts` is fine as long as the set is consistent.
    // Let's use `cohorts` (the full list) to generate the map.



    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const spotlightGradient = useMotionTemplate`
        radial-gradient(
            650px circle at ${mouseX}px ${mouseY}px,
            rgba(99, 102, 241, 0.08),
            transparent 80%
        )
    `;

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const handlePasteSample = () => {
        setPersistedState(prev => ({
            ...prev,
            brandContext: SAMPLE_BRAND_CONTEXT,
            teamMemberContext: SAMPLE_TEAM_CONTEXT,
            customerContext: SAMPLE_CUSTOMER_CONTEXT
        }));
        toast.success("Sarah: Sample context for Faasos is ready for you to customize.");
    };

    const [isLoading, setIsLoading] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; provider?: string; busy_slots?: any[] }>({ connected: false });
    const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
    const [isAvailabilityPopupOpen, setIsAvailabilityPopupOpen] = useState(false);
    const hasInitializedRef = React.useRef(false);

    const checkCalendarStatus = async () => {
        if (!campaignId || campaignId === 'null' || campaignId === 'undefined') return;
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
            if (hasInitializedRef.current || !campaignId || campaignId === 'null' || campaignId === 'undefined') {
                if (!campaignId || campaignId === 'null' || campaignId === 'undefined') {
                    console.warn("CampaignComposer: Missing or null campaignId, skipping initData");
                }
                return;
            }

            try {
                setIsLoading(true);
                const [suggestions, cohortData, campaignData] = await Promise.all([
                    api.get(`/intelligence/campaigns/${campaignId}/context-suggestions`),
                    api.get(`/intelligence/campaigns/${campaignId}/cohorts`),
                    api.get(`/intelligence/campaigns/${campaignId}`)
                ]);

                setPersistedState(prev => {
                    const newState = { ...prev };

                    // Determine if the server has actual context data already
                    // If it does, we should prioritize server data as the source of truth
                    const hasServerContext = !!campaignData.brand_context || !!campaignData.customer_context;

                    // Prefill campaign name - ONLY if not already set locally
                    if (!newState.campaignName || newState.campaignName === '') {
                        newState.campaignName = initialName || campaignData.name || '';
                    }

                    // Prefill context fields
                    if (!newState.brandContext || newState.brandContext === '' || hasServerContext) {
                        newState.brandContext = campaignData.brand_context || (!newState.brandContext ? suggestions.brand_context : newState.brandContext) || '';
                    }
                    if (!newState.teamMemberContext || newState.teamMemberContext === '' || hasServerContext) {
                        newState.teamMemberContext = campaignData.team_member_context || (!newState.teamMemberContext ? suggestions.team_member_context : newState.teamMemberContext) || '';
                    }
                    if (!newState.customerContext || newState.customerContext === '' || hasServerContext) {
                        newState.customerContext = campaignData.customer_context || newState.customerContext || '';
                    }

                    // Prefill questions and banks
                    if (!newState.preliminaryQuestions || newState.preliminaryQuestions.length === 0 || hasServerContext) {
                        newState.preliminaryQuestions = (campaignData.preliminary_questions && campaignData.preliminary_questions.length > 0)
                            ? campaignData.preliminary_questions
                            : newState.preliminaryQuestions;
                    }
                    if (!newState.questionBank || newState.questionBank.length === 0 || hasServerContext) {
                        newState.questionBank = (campaignData.question_bank && campaignData.question_bank.length > 0)
                            ? campaignData.question_bank
                            : newState.questionBank;
                    }

                    // Critical Fix: Overwrite default incentive bank if backend has something else
                    const defaultIncentives = ["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"];
                    const hasDefaultIncentives = JSON.stringify(newState.incentiveBank) === JSON.stringify(defaultIncentives);

                    if (!newState.incentiveBank || newState.incentiveBank.length === 0 || hasDefaultIncentives || hasServerContext) {
                        if (campaignData.incentive_bank && campaignData.incentive_bank.length > 0) {
                            newState.incentiveBank = campaignData.incentive_bank;
                        } else if (!newState.incentiveBank || newState.incentiveBank.length === 0) {
                            newState.incentiveBank = defaultIncentives;
                        }
                    }

                    if (!newState.incentive || newState.incentive === '' || hasServerContext) {
                        newState.incentive = campaignData.incentive || newState.incentive || '';
                    }

                    // Prefill call duration (convert from seconds to minutes)
                    if (campaignData.call_duration && (!newState.callDuration || newState.callDuration === 10 || hasServerContext)) {
                        newState.callDuration = Math.floor(campaignData.call_duration / 60);
                    }

                    // Prefill execution windows - Overwrite if only default is present or if server has windows
                    const isDefaultWindow = newState.executionWindows?.length === 1 &&
                        newState.executionWindows[0].start === '09:00' &&
                        newState.executionWindows[0].end === '11:00';

                    if (!newState.executionWindows || newState.executionWindows.length === 0 || isDefaultWindow || hasServerContext || (campaignData.execution_windows && campaignData.execution_windows.length > 0)) {
                        if (campaignData.execution_windows && campaignData.execution_windows.length > 0) {
                            newState.executionWindows = campaignData.execution_windows;
                        } else if (isDefaultWindow) {
                            // Only override if it looks like our default "09-11" stub, which we just replaced with dynamic.
                            // Accessing the dynamic default we just set in initial state is tricky inside this callback if we don't carry it.
                            // But actually, we initialized state with `getNextTimeSlot()`.
                            // If persistedState came from storage, it might have old 09:00 data or user data.
                            // If it came from default in `useSessionStorage`, it has `getNextTimeSlot()`.

                            // If this runs, it means we MIGHT want to use server data.
                            // The logic here says: if (no windows OR isDefaultWindow OR hasServerContext) -> try campaignData.
                            // We need to define "isDefaultWindow" more loosely now, or just trust campaignData if available.
                            // If campaignData has windows, USE THEM.
                            if (campaignData.execution_windows && campaignData.execution_windows.length > 0) {
                                newState.executionWindows = campaignData.execution_windows;
                            }
                        }
                    }

                    // Handle Cohorts & Counts - ALWAYS update counts to keep them fresh
                    if (newState.cohorts.length === 0 || (cohortData.cohorts?.length > 0 && JSON.stringify(newState.cohorts) !== JSON.stringify(cohortData.cohorts))) {
                        newState.cohorts = cohortData.cohorts || [];
                    }

                    // Initialize selectedCohorts based on backend data
                    if (!newState.selectedCohorts || newState.selectedCohorts.length === 0 || hasServerContext) {
                        newState.selectedCohorts = campaignData.selected_cohorts || cohortData.selected_cohorts || newState.selectedCohorts || newState.cohorts;
                    }

                    // Always update counts
                    newState.cohortCounts = cohortData.cohort_counts || {};

                    // Prefill cohort configuration
                    if ((!newState.cohortConfig || Object.keys(newState.cohortConfig).length === 0 || hasServerContext) && campaignData.cohort_config) {
                        newState.cohortConfig = campaignData.cohort_config;
                    }

                    // Prefill cohort questions
                    if ((!newState.cohortQuestions || Object.keys(newState.cohortQuestions).length === 0 || hasServerContext) && campaignData.cohort_questions) {
                        newState.cohortQuestions = campaignData.cohort_questions;
                    }

                    // Prefill cohort incentives
                    if ((!newState.cohortIncentives || Object.keys(newState.cohortIncentives).length === 0 || hasServerContext) && campaignData.cohort_incentives) {
                        newState.cohortIncentives = campaignData.cohort_incentives;
                    }

                    return newState;
                });
                hasInitializedRef.current = true;
                setIsNotFound(false);
            } catch (error: any) {
                console.error("Failed to fetch campaign init data:", error);
                if (onError) {
                    onError(error);
                }

                if (error.status === 404) {
                    setIsNotFound(true);
                    toast.error("Campaign not found");
                } else {
                    toast.error("Failed to load campaign data");
                }
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

    const debouncedCampaignName = useDebounce(campaignName, 500);
    const debouncedBrandContext = useDebounce(brandContext, 500);
    const debouncedTeamContext = useDebounce(teamMemberContext, 500);
    const debouncedCustomerContext = useDebounce(customerContext, 500);
    const debouncedCohortConfig = useDebounce(cohortConfig, 500);
    const debouncedCohortQuestions = useDebounce(cohortQuestions, 500);
    const debouncedCohortIncentives = useDebounce(cohortIncentives, 500);
    const debouncedIncentive = useDebounce(incentive, 500);
    const debouncedPreliminaryQuestions = useDebounce(preliminaryQuestions, 500);
    const debouncedSelectedCohorts = useDebounce(selectedCohorts, 500);
    const debouncedQuestionBank = useDebounce(questionBank, 500);
    const debouncedIncentiveBank = useDebounce(incentiveBank, 500);
    const debouncedExecutionWindows = useDebounce(executionWindows, 500);
    const debouncedCallDuration = useDebounce(callDuration, 500);

    const lastErrorTimeRef = React.useRef<number>(0);

    useEffect(() => {
        // Skip initial render or empty states if desirable, but we want to save if user clears it too.
        // We skip if campaignId is missing, invalid, incomplete, or if we are still loading initial data
        // Prevent auto-save from running before we have successfully initialized data from the backend
        // This fixes the race condition where default empty state overwrites existing campaign data
        if (!campaignId || campaignId === 'null' || campaignId === 'undefined' || isLoading || isNotFound || !hasInitializedRef.current) return;

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
                    call_duration: debouncedCallDuration * 60
                });
                setLastSaved(new Date());
            } catch (error: any) {
                console.error("Auto-save failed", error);

                // Only show toast if it's a 404 and we haven't toasted recently (avoid spam)
                if (error.status === 404 && Date.now() - lastErrorTimeRef.current > 10000) {
                    toast.error("Auto-save failed: Campaign not found. It may have been deleted.");
                    lastErrorTimeRef.current = Date.now();
                }
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
        console.log("DEBUG: handleSaveAndNext clicked", { step, customerContext });
        // toast.info("Debug: Button Clicked"); // Temporary debug


        if (step === 'IDENTITY') {
            if (!customerContext) {
                console.log("DEBUG: Validation Failed - Missing customerContext");
                toast.error("Customer context is mandatory");
                return;
            }

            // check if any field is exactly the same as sample context
            const isSampleBrand = brandContext?.trim() === SAMPLE_BRAND_CONTEXT.trim();
            const isSampleTeam = teamMemberContext?.trim() === SAMPLE_TEAM_CONTEXT.trim();
            const isSampleCustomer = customerContext?.trim() === SAMPLE_CUSTOMER_CONTEXT.trim();

            console.log("DEBUG: Sample Checks", { isSampleBrand, isSampleTeam, isSampleCustomer });

            if (isSampleBrand || isSampleTeam || isSampleCustomer) {
                toast.error("Please customize the sample context for your brand. It cannot be exactly the same as the Faasos example.");
                return;
            }
        }

        if (step === 'STRATEGY') {
            const invalidCohorts = selectedCohorts.filter(c => (cohortConfig[c] || 0) > (cohortCounts[c] || 0));
            if (invalidCohorts.length > 0) {
                toast.error(`Please adjust target volumes. Some exceed the total customer count in: ${invalidCohorts.join(', ')}`);
                return;
            }

            if (selectedCohorts.length === 0) {
                toast.error("Please select at least one cohort segment");
                return;
            }
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
                call_duration: callDuration * 60,
                execution_windows: formattedWindows
            });

            // Auto-sync to calendar if connected
            if (calendarStatus?.connected) {
                try {
                    await api.post(`/intelligence/campaigns/${campaignId}/calendar-sync`);
                    toast.success("Maya: Great news! We've successfully blocked the time on your calendar.");
                } catch (syncError) {
                    console.error("Auto-sync to calendar failed:", syncError);
                    toast.error("Maya: We hit a small snag syncing to your calendar, but the campaign is saved.");
                }
            }

            toast.success("Alex: Mission initiated! Your campaign is now live and the team is ready.");
            removePersistedState();
            onComplete();
        } catch (error) {
            console.error("Failed to save campaign:", error);
            toast.error("Failed to save campaign settings");
            if (onError) onError(error);
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
                call_duration: callDuration * 60,
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
            toast.success("Maya: All synced up! Your calendar is now in lockstep with the success team.");
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
        toast.success(`Rohan: Applied questions from ${currentCohort} to all selected cohorts`);
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
        toast.success(`Rohan: Applied incentive from ${currentCohort} to all selected cohorts`);
    };

    const steps = ['IDENTITY', 'STRATEGY', 'EXECUTION'];
    const currentStepIndex = steps.indexOf(step);

    if (isNotFound) {
        return (
            <Card className={cn("overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl", className)}>
                <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                    <X className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold dark:text-white">Campaign Not Found</h2>
                    <p className="text-zinc-500 text-sm max-w-xs">
                        The campaign you're looking for doesn't exist or was recently deleted.
                    </p>
                </div>
                <Button
                    onClick={onBack}
                    className="rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 px-8"
                >
                    Back to Dashboard
                </Button>
            </Card>
        );
    }

    if (!campaignId || campaignId === 'null') {
        return (
            <Card className={cn("overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl", className)}>
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                    <SparklesIcon className="w-10 h-10 text-indigo-500" />
                </div>
                <div className="space-y-4 max-w-md">
                    <h2 className="text-3xl font-bold dark:text-white tracking-tight">Ready for a New Campaign?</h2>
                    <p className="text-zinc-500 text-[15px] leading-relaxed">
                        To create a campaign, you first need to align on your goals with our AI interviewer.
                        It only takes 2 minutes!
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={onBack}
                        variant="outline"
                        className="rounded-xl px-8 border-zinc-200 dark:border-zinc-800"
                    >
                        Maybe Later
                    </Button>
                    <Button
                        onClick={() => {
                            if (onBack) onBack();
                            // Implementation note: The parent page handles scrolling to the AI Interview section
                            const element = document.getElementById('ai-alignment-section');
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 px-8 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        Start AI Interview
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card
            onMouseMove={handleMouseMove}
            className={cn(
                "overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[2rem] relative group min-h-[500px] flex flex-col transition-all duration-500 shadow-2xl",
                className
            )}
        >
            {/* Spotlight Overlay */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: spotlightGradient,
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-emerald-500/[0.01] pointer-events-none" />

            <CardContent className="p-6 md:p-8 flex flex-col h-full relative z-10 flex-1">
                {/* Loading State Overlay */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-[2rem]"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                    <div className="relative p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                </div>
                                <div className="space-y-1 text-center">
                                    <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-400">The team is syncing...</p>
                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">Applying your campaign context...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                                Use "Load Sample Context" for a Faasos example to understand the format.
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

                                                // Deterministic avatar assignment based on collision-free logic
                                                const avatarIndex = assignedAvatars[cohort] || 1;

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
                                                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all duration-300 overflow-hidden bg-transparent",
                                                            isSelected ? "scale-105 ring-2 ring-white/20" : "group-hover:scale-110"
                                                        )}>
                                                            <img
                                                                src={`/images/avatars/notionists/full_body/avatar_${avatarIndex}.png`}
                                                                alt={cohort}
                                                                className={cn("w-full h-full object-cover transition-opacity duration-300",
                                                                    !isSelected && "opacity-50 grayscale",
                                                                    "mix-blend-multiply dark:mix-blend-normal"
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-start text-left gap-0.5">
                                                            <span className={cn(
                                                                "text-xs font-bold transition-colors duration-300 flex items-center gap-1.5",
                                                                isActive ? (isSelected ? "text-white" : "text-indigo-600 dark:text-indigo-400") :
                                                                    isSelected ? "text-indigo-100" :
                                                                        "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white"
                                                            )}>
                                                                {isSelected && <CheckIcon className="w-3 h-3 text-white transition-all animate-in fade-in zoom-in duration-300" />}
                                                                {cohort === 'Default' ? 'General Audience' : cohort}
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
                                                                    <div className="relative w-20 h-28 bg-gradient-to-b from-transparent to-transparent dark:from-transparent dark:to-transparent rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700/50 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-all duration-500 flex items-center justify-center p-1.5">
                                                                        <img
                                                                            src={`/images/avatars/notionists/full_body/avatar_${assignedAvatars[currentCohort] || 1}.png`}
                                                                            alt={`${currentCohort} Avatar`}
                                                                            className="w-full h-full object-contain drop-shadow-2xl"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
                                                                            {currentCohort === 'Default' ? 'General Audience' : currentCohort}
                                                                        </h3>
                                                                        <div className="flex items-center justify-between mb-0.5">
                                                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Target Volume</label>
                                                                            <button
                                                                                onClick={() => setPersistedState(prev => ({
                                                                                    ...prev,
                                                                                    cohortConfig: { ...prev.cohortConfig, [currentCohort]: cohortCounts[currentCohort] || 0 }
                                                                                }))}
                                                                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                                            >
                                                                                MAX
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Conduct</span>
                                                                            <div className="relative">
                                                                                <Input
                                                                                    type="number"
                                                                                    value={cohortConfig[currentCohort] || 0}
                                                                                    onChange={(e) => {
                                                                                        const val = parseInt(e.target.value) || 0;
                                                                                        const maxSize = cohortCounts[currentCohort] || 0;
                                                                                        if (val > maxSize) {
                                                                                            toast.error(`Rohan: Target volume for ${currentCohort} cannot exceed ${maxSize} (cohort size)`);
                                                                                        }
                                                                                        setPersistedState(prev => ({
                                                                                            ...prev,
                                                                                            cohortConfig: { ...prev.cohortConfig, [currentCohort]: Math.min(val, maxSize) }
                                                                                        }));
                                                                                    }}
                                                                                    className={cn(
                                                                                        "w-16 h-8 text-center font-bold border-none bg-transparent p-0 text-lg focus-visible:ring-0 border-b rounded-none px-1 transition-colors",
                                                                                        (cohortConfig[currentCohort] || 0) > (cohortCounts[currentCohort] || 0)
                                                                                            ? "border-red-500 text-red-500"
                                                                                            : "border-zinc-200"
                                                                                    )}
                                                                                />
                                                                            </div>
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
                                                                                setPersistedState(prev => {
                                                                                    return {
                                                                                        ...prev,
                                                                                        cohortIncentives: { ...prev.cohortIncentives, [currentCohort]: val }
                                                                                    };
                                                                                });
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
                                                <div className="space-y-1 max-w-[65%] pr-6">
                                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Target Call Duration</label>
                                                    <p className="text-xs text-gray-500 font-medium italic">How long are you planning to keep these calls?</p>
                                                </div>
                                                <div className="flex items-baseline gap-1 bg-white dark:bg-zinc-950 px-4 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{callDuration}</span>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Min</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4 px-2">
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

                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Sync</span>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deep Dive</span>
                                                </div>

                                                {/* Fun UI Element: Smart Waveform & Discovery Vibe */}
                                                <div className="pt-8 flex flex-col items-center justify-center space-y-6">
                                                    <div className="flex items-center gap-1.5 h-12">
                                                        {Array.from({ length: 15 }).map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    height: [
                                                                        '20%',
                                                                        `${Math.max(20, (callDuration / 30) * 100 * (0.4 + Math.random() * 0.6))}%`,
                                                                        '20%'
                                                                    ],
                                                                    opacity: [0.3, 0.6, 0.3],
                                                                }}
                                                                transition={{
                                                                    duration: Math.max(0.4, 1.5 - (callDuration / 30)),
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut",
                                                                    delay: i * 0.1
                                                                }}
                                                                className="w-1 rounded-full bg-indigo-500"
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="px-6 py-2 rounded-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                                                            {callDuration <= 8 ? "⚡️ Tactical Feedback Vibe" :
                                                                callDuration <= 15 ? "⚖️ Balanced Discovery Vibe" :
                                                                    "🧠 Deep Synthesis Vibe"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                    </motion.div>

                                    <motion.div variants={itemVariants} className="h-full">
                                        <div className="space-y-8 p-8 rounded-[2.5rem] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 flex flex-col h-full">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1 max-w-[65%] pr-6">
                                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Execution Windows</label>
                                                    <p className="text-xs text-gray-500 font-medium italic">Which slot should we block on your calendar for talking to customers?</p>
                                                </div>
                                                <div className="flex items-baseline gap-1 bg-white dark:bg-zinc-950 px-4 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{executionWindows.length}</span>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{executionWindows.length === 1 ? 'Slot' : 'Slots'}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                <AnimatePresence>
                                                    {executionWindows.map((window, i) => (
                                                        <TimeWindowSelector
                                                            key={i}
                                                            day={window.day}
                                                            start={window.start}
                                                            end={window.end}
                                                            allWindows={executionWindows}
                                                            currentIndex={i}
                                                            onChange={(updates) => {
                                                                setPersistedState(prev => {
                                                                    const newW = [...prev.executionWindows];
                                                                    newW[i] = { ...newW[i], ...updates };
                                                                    return { ...prev, executionWindows: newW };
                                                                });
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
                                                <div className="flex flex-col gap-2 flex-1">
                                                    {!calendarStatus.connected ? (
                                                        <div className="relative group/cal w-full">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full h-12 px-4 rounded-xl border-dashed border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs gap-2 transition-all duration-300"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const response = await api.get('/intelligence/calendar/google/login');
                                                                        if (response.url) {
                                                                            window.location.href = response.url;
                                                                        } else {
                                                                            toast.error("Failed to get authorization URL");
                                                                        }
                                                                    } catch (error) {
                                                                        toast.error("Failed to initiate calendar connection");
                                                                    }
                                                                }}
                                                            >
                                                                <CalendarIcon className="w-4 h-4" />
                                                                Connect Calendar to Block
                                                            </Button>
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-lg opacity-0 group-hover/cal:opacity-100 transition-opacity pointer-events-none text-center transform translate-y-2 group-hover/cal:translate-y-0 duration-200">
                                                                Connect Google Calendar to automatically block these execution windows.
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={cn(
                                                                "w-full h-12 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-indigo-100/50",
                                                                "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                                                            )}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    setIsSyncingCalendar(true);
                                                                    await api.patch(`/intelligence/campaigns/${campaignId}/settings`, {
                                                                        execution_windows: executionWindows
                                                                    });
                                                                    const response = await api.post(`/intelligence/campaigns/${campaignId}/calendar-sync`);

                                                                    const count = response.events_created || response.events_count || 0;
                                                                    toast.success(
                                                                        <div className="flex flex-col gap-1">
                                                                            <span>Synced to Google Calendar!</span>
                                                                            <span className="text-[10px] opacity-80">{count} events created/updated</span>
                                                                        </div>
                                                                    );
                                                                } catch (error) {
                                                                    console.error(error);
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
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="flex-1 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 font-bold text-sm gap-2 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                                                    onClick={() => setPersistedState(prev => ({
                                                        ...prev,
                                                        executionWindows: [...(prev.executionWindows || []), getNextTimeSlot()]
                                                    }))}
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    Add Window
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="relative z-[100] flex items-center justify-between mt-auto border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-6">
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
