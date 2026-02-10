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
import { useCampaignWebSocket } from "@/hooks/use-campaign-websocket";
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
import { formatToIST, formatRelativeTime } from "@/lib/utils";
import { addMinutes, format, parseISO, setMinutes, startOfHour, formatDistanceToNow } from 'date-fns';
import { ConfirmExitDialog } from './ConfirmExitDialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, LayoutGrid, Zap, HelpCircle, Users } from 'lucide-react';

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
    campaignId?: string | null;
    initialLeads?: any[];
    initialName?: string;
    onComplete: (campaignId?: string) => void;
    onBack?: () => void;
    onEditLeads?: () => void;
    onError?: (error: any) => void;
    className?: string;
    initialStep?: Step;
    isMagicUI?: boolean;
    onCampaignIdGenerated?: (id: string) => void;
}

type Step = 'IDENTITY' | 'STRATEGY' | 'EXECUTION';

import { useLocalStorage } from "@/hooks/use-local-storage";

const SAMPLE_BRAND_CONTEXT = "Faasos is a delivery-first food brand known primarily for wraps and rolls, positioned as a quick and filling meal option. Customers typically order for convenience, familiar flavours, and a product format that travels well for delivery.";
const SAMPLE_TEAM_CONTEXT = "The interview will be conducted by a Customer Experience team member from Faasos, focused on understanding the customer’s real ordering experience, satisfaction drivers, and improvement areas.";
const SAMPLE_CUSTOMER_CONTEXT = "To understand why the customer orders Faasos repeatedly, what they like most (items, taste, convenience), and what 1–2 improvements would increase order frequency (quality consistency, portioning, delivery, packaging, pricing).";

const AI_GUIDES = {
    IDENTITY: {
        name: "Sarah",
        seed: "Sarah",
        role: "Brand Architect",
        message: "I'm Sarah. Let's start by defining the essence of your campaign. Be clear, be bold.",
        tips: ["Highlight your unique value proposition.", "Keep it punchy for better AI conversion."]
    },
    STRATEGY: {
        name: "Alex",
        seed: "Alex",
        role: "Strategy Lead",
        message: "Hey! Alex here. Time to map out who we're talking to and how we'll delight them.",
        tips: ["Target cohorts with high intent.", "Choose incentives that drive immediate action."]
    },
    EXECUTION: {
        name: "Maya",
        seed: "Maya",
        role: "Operations Manager",
        message: "Final stretch! Maya reporting. When is the perfect time to reach your audience?",
        tips: ["Sync your calendar for zero overlaps.", "Avoid early morning slots for better reach."]
    }
} as const;

export function CampaignComposer({ campaignId, initialLeads, initialName, onComplete, onBack, onEditLeads, onError, className, initialStep, isMagicUI, onCampaignIdGenerated }: CampaignComposerProps): React.JSX.Element {
    // Use campaignId in key if present (Edit Mode), otherwise finding a stable key for Draft Mode is tricky without an ID.
    // For Draft Mode, we use a generic key. If multiple drafts needed, we'd need a draft ID.
    // User flow implies one active creation flow.
    const initialStorageKey = React.useMemo(() => {
        return campaignId ? `campaign_composer_${campaignId}` : `campaign_composer_draft`;
        // We use useMemo to keep this key STABLE during the lifecycle of this component instance, 
        // even if campaignId prop updates from null to a real ID.
    }, []); // Empty deps = stable for life of mount

    // Check expiry logic wrapper? Or just rely on code below.
    const [persistedState, setPersistedState, removePersistedState] = useLocalStorage(initialStorageKey, {
        step: 'IDENTITY' as Step,
        campaignName: initialName || '',
        brandContext: '',
        teamMemberContext: '',
        customerContext: '',
        cohorts: [] as string[],
        selectedCohorts: [] as string[],
        cohortConfig: {} as Record<string, number>,
        cohortCounts: {} as Record<string, number>,
        preliminaryQuestions: [] as string[],
        questionBank: [] as string[],
        incentiveBank: ["₹500 Amazon Voucher", "₹200 UPI", "Swiggy Coupon", "Zomato Gold"] as string[],
        cohortQuestions: {} as Record<string, string[]>,
        cohortIncentives: {} as Record<string, string>,
        activeCohort: null as string | null,
        incentive: '',
        callDuration: 10,
        executionWindows: [getNextTimeSlot()],
        leadsUpdatedAt: null as string | null,
        draftCreatedAt: Date.now() // Track creation for expiry
    });

    // Expiry Check (24 hours)
    useEffect(() => {
        if (!campaignId && persistedState.draftCreatedAt) {
            const oneDay = 24 * 60 * 60 * 1000;
            if (Date.now() - persistedState.draftCreatedAt > oneDay) {
                removePersistedState();
                if (onBack) onBack();
            }
        }
    }, [campaignId, persistedState.draftCreatedAt]);

    // Force initial step if provided
    useEffect(() => {
        if (initialStep && persistedState.step !== initialStep) {
            setPersistedState(prev => ({ ...prev, step: initialStep }));
        }
    }, [initialStep]);

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
        executionWindows = [] as any[],
        leadsUpdatedAt = null as string | null
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

    const currentCohort = activeCohort || sortedCohorts[0] || 'Default';
    const currentQuestions = (cohortQuestions[currentCohort] || preliminaryQuestions || []) as string[];
    const currentIncentive = (cohortIncentives[currentCohort] ?? incentive) as string;

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
    const [isExitWarningOpen, setIsExitWarningOpen] = useState(false);
    const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = useState(false);
    const [duplicateCampaignInfo, setDuplicateCampaignInfo] = useState<{ id: string; name: string } | null>(null);

    const hasInitializedRef = React.useRef(false);
    const isReadyToSave = React.useRef(false);

    // Real-time Updates
    const { data: realtimeData, isConnected: isRealtimeConnected } = useCampaignWebSocket(campaignId || null);

    useEffect(() => {
        if (realtimeData?.campaign_metadata?.leads_updated_at) {
            const newDate = realtimeData.campaign_metadata.leads_updated_at;
            if (newDate && newDate !== leadsUpdatedAt) {
                setPersistedState(prev => ({ ...prev, leadsUpdatedAt: newDate }));
                toast.success("Leads refreshed from background update.");
            }
        }
    }, [realtimeData, leadsUpdatedAt, setPersistedState]);

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

            // DRAFT MODE INITIALIZATION
            if (!campaignId || campaignId === 'null' || campaignId === 'undefined') {
                if (initialLeads && initialLeads.length > 0) {
                    setPersistedState(prev => {
                        // Calculate cohorts from leads
                        const leads = initialLeads;
                        const cohortsSet = new Set<string>();
                        const counts: Record<string, number> = {};

                        leads.forEach(l => {
                            const c = l.cohort || 'Default';
                            cohortsSet.add(c);
                            counts[c] = (counts[c] || 0) + 1;
                        });

                        const cohortsList = Array.from(cohortsSet);

                        return {
                            ...prev,
                            cohorts: cohortsList,
                            cohortCounts: counts,
                            selectedCohorts: prev.selectedCohorts.length > 0 ? prev.selectedCohorts : []
                        };
                    });
                    hasInitializedRef.current = true;
                }
                return;
            }

            // EDIT MODE INITIALIZATION
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
                        newState.selectedCohorts = campaignData.selected_cohorts || cohortData.selected_cohorts || newState.selectedCohorts || [];
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

                    // Extract leads_updated_at from meta_data
                    if (campaignData.meta_data && campaignData.meta_data.leads_updated_at) {
                        newState.leadsUpdatedAt = campaignData.meta_data.leads_updated_at;
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
                // Allow debouncer to settle before enabling auto-save (Safety Buffer)
                setTimeout(() => {
                    isReadyToSave.current = true;
                }, 1000);
            }
        };

        initData();
        checkCalendarStatus();
    }, [campaignId, initialLeads]);



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

    // Create a stable hash of the data to save to avoid complex dependency arrays
    // This ensures useEffect only re-runs when actual data content changes
    const autoSaveDataHash = JSON.stringify({
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
        call_duration: debouncedCallDuration
    });

    useEffect(() => {
        // Skip initial render or empty states if desirable, but we want to save if user clears it too.
        // We skip if campaignId is missing, invalid, incomplete, or if we are still loading initial data
        // Prevent auto-save from running before we have successfully initialized data from the backend
        // This fixes the race condition where default empty state overwrites existing campaign data
        // Added isReadyToSave check to allow debounce to settle after init.
        if (isLoading || isNotFound || !hasInitializedRef.current || !isReadyToSave.current) return;

        // DRAFT MODE: Skip API Auto-Save
        if (!campaignId || campaignId === 'null' || campaignId === 'undefined') return;

        const autoSave = async () => {
            setIsSaving(true);
            try {
                // We use the debounced variables directly as they are in closure scope
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

        autoSave();

    }, [autoSaveDataHash, campaignId, isLoading, isNotFound]);
    // removed isLoading from dep array to avoid double trigger, but added logic check inside.


    const handleSaveAndNext = async () => {
        if (isLoading || isSubmittingRef.current) return;

        if (step === 'IDENTITY') {
            if (!customerContext) {
                toast.error("Customer context is mandatory");
                return;
            }

            // check if any field is exactly the same as sample context
            const isSampleBrand = brandContext?.trim() === SAMPLE_BRAND_CONTEXT.trim();
            const isSampleTeam = teamMemberContext?.trim() === SAMPLE_TEAM_CONTEXT.trim();
            const isSampleCustomer = customerContext?.trim() === SAMPLE_CUSTOMER_CONTEXT.trim();

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

    const isSubmittingRef = React.useRef(false);

    const finalizeCampaign = async (shouldComplete: boolean = true, forceCreate: boolean = false) => {
        // Prevent duplicate submission
        if (isSubmittingRef.current) return null;

        try {
            isSubmittingRef.current = true;
            setIsLoading(true);

            // Format execution windows to ISO for backend
            const formattedWindows = (executionWindows || []).map((w: any) => ({
                day: w.day,
                start: w.start,
                end: w.end
            })).filter(w => w.day && w.start && w.end);

            // DRAFT MODE: Full Creation
            if (!campaignId || campaignId === 'null' || campaignId === 'undefined') {
                const payload = {
                    campaign_name: campaignName,
                    leads: initialLeads || [], // We expect leads to be passed or stored. 
                    force_create: forceCreate,
                    settings: {
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
                        execution_windows: formattedWindows,
                        selected_cohorts: selectedCohorts
                    }
                };

                const response = await api.post('/intelligence/campaigns/create-full', payload);
                if (response.status === 'success') {
                    const newCampaignId = response.campaign_id;
                    // Success!
                    if (shouldComplete) {
                        toast.success("Alex: Mission initiated! Your campaign is now live.");
                        removePersistedState();
                    } else {
                        toast.success("Alex: Draft saved and campaign created.");
                        if (onCampaignIdGenerated) onCampaignIdGenerated(newCampaignId);
                    }

                    // Calendar Sync for new campaign logic?
                    if (calendarStatus?.connected && newCampaignId) {
                        try {
                            await api.post(`/intelligence/campaigns/${newCampaignId}/calendar-sync`);
                            if (!shouldComplete) {
                                toast.success("Maya: Great news! We've successfully blocked the time on your calendar.");
                            }
                        } catch (e) { console.error("Calendar sync warning", e); }
                    }

                    if (shouldComplete) {
                        onComplete(newCampaignId);
                    }
                    return newCampaignId;
                }
            }

            // EDIT MODE: Existing Logic
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

            if (shouldComplete) {
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
                onComplete(campaignId || undefined);
            } else {
                return campaignId;
            }
        } catch (error: any) {
            console.error("Failed to save campaign:", error);

            if (error?.status === 409 && error?.data?.code === 'DUPLICATE_UPLOAD') {
                setDuplicateCampaignInfo({
                    id: error.data.campaign_id,
                    name: error.data.campaign_name
                });
                setIsDuplicateAlertOpen(true);
                return null;
            }

            toast.error("Failed to save campaign settings");
            if (onError) onError(error);
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
        return null;
    };

    const handleDownloadIcs = async () => {
        try {
            let activeCampaignId = campaignId;
            if (!activeCampaignId || activeCampaignId === 'null' || activeCampaignId === 'undefined') {
                activeCampaignId = await finalizeCampaign(false);
                if (!activeCampaignId) return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/intelligence/campaigns/${activeCampaignId}/calendar-export`, {
                headers: {
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                }
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `campaign-block-${activeCampaignId}.ics`;
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
            if (!campaignId) return; // Draft Mode: No calendar sync
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

    const segmentedWindows = React.useMemo(() => {
        const now = new Date();
        const indexedWindows = (executionWindows || []).map((w, i) => ({ ...w, _originalIndex: i }));

        const current: any[] = [];
        const upcoming: any[] = [];
        const past: any[] = [];

        indexedWindows.forEach(w => {
            try {
                const startDt = parseISO(`${w.day}T${w.start}`);
                const endDt = parseISO(`${w.day}T${w.end}`);
                const bufferMins = 30;

                if (now > endDt) {
                    past.push(w);
                } else if (now >= startDt && now <= endDt) {
                    // Any window that includes "now" is Current
                    const remainingMins = Math.max(0, Math.round((endDt.getTime() - now.getTime()) / (60 * 1000)));
                    const isInvalid = remainingMins < bufferMins;
                    current.push({
                        ...w,
                        _durationLabel: `${remainingMins} MINS LEFT`,
                        _isInvalid: isInvalid
                    });
                } else {
                    // Future window
                    upcoming.push(w);
                }
            } catch {
                upcoming.push(w);
            }
        });

        // Sort
        upcoming.sort((a, b) => parseISO(`${a.day}T${a.start}`).getTime() - parseISO(`${b.day}T${b.start}`).getTime());
        past.sort((a, b) => parseISO(`${b.day}T${b.start}`).getTime() - parseISO(`${a.day}T${a.start}`).getTime());

        return { current, upcoming, past };
    }, [executionWindows]);

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



    const guide = AI_GUIDES[step as keyof typeof AI_GUIDES];

    if (isMagicUI) {
        return (
            <div className={cn(
                "w-full h-full min-h-[600px] flex flex-col bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[3rem] relative overflow-hidden",
                className
            )}>
                {/* Immersive Background Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full" />
                </div>


                {/* Header */}
                <div className="p-8 flex items-center justify-between border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-3">
                            {Object.entries(AI_GUIDES).map(([s, g]) => (
                                <Avatar key={s} className={cn(
                                    "w-10 h-10 border-2 border-white dark:border-zinc-900 transition-all duration-500",
                                    step === s ? "ring-4 ring-indigo-500/20 scale-110 z-20" : "opacity-40 grayscale z-10"
                                )}>
                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${g.seed}&backgroundColor=e0e7ff`} />
                                </Avatar>
                            ))}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {guide.name}
                                <span className="text-zinc-400 font-medium ml-2">— {guide.role}</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Prominent Manage Leads Button */}
                        {onEditLeads && (
                            <Button
                                onClick={onEditLeads}
                                className="bg-gradient-to-r from-orange-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                            >
                                <Users className="w-5 h-5" />
                                <div className="flex flex-col items-start">
                                    <span className="text-sm leading-none">Manage Leads</span>
                                    {leadsUpdatedAt && (
                                        <span className="text-[9px] font-medium opacity-80 leading-none mt-0.5" title={formatToIST(leadsUpdatedAt)}>
                                            Updated {formatRelativeTime(leadsUpdatedAt)}
                                        </span>
                                    )}
                                </div>
                            </Button>
                        )}

                        {/* Compact Step Indicator */}
                        <div className="flex items-center gap-2 bg-zinc-900/5 dark:bg-white/5 p-1 rounded-full border border-white/10">
                            {steps.map((s, idx) => (
                                <div key={s} className={cn(
                                    "h-2 transition-all duration-500 rounded-full",
                                    step === s ? "w-8 bg-indigo-500" : "w-2 bg-zinc-300 dark:bg-zinc-700"
                                )} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full flex flex-col"
                        >
                            {/* AI Message Bubble */}
                            <div className="mb-6 flex items-start gap-4">
                                <div className="p-4 bg-white/70 dark:bg-white/10 rounded-2xl rounded-tl-none shadow-sm border border-indigo-500/10 max-w-2xl relative">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 italic">
                                        "{guide.message}"
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {guide.tips.map((tip, i) => (
                                            <span key={i} className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                                <SparklesIcon className="w-3 h-3" /> {tip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step Specific UI */}
                            {step === 'IDENTITY' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                    <div className="space-y-4">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest px-1">Campaign Title</label>
                                            <Input
                                                value={campaignName}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, campaignName: e.target.value }))}
                                                placeholder="e.g., Q1 Retention Strategy"
                                                className="h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 text-lg font-black shadow-sm"
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest px-1">Brand Context</label>
                                            <Textarea
                                                value={brandContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, brandContext: e.target.value }))}
                                                placeholder="Describe your brand..."
                                                className="h-32 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 resize-none text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest px-1">Team Context</label>
                                            <Textarea
                                                value={teamMemberContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, teamMemberContext: e.target.value }))}
                                                placeholder="Who is reaching out?"
                                                className="h-32 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 resize-none text-sm shadow-sm"
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest px-1">Campaign Objective</label>
                                            <Textarea
                                                value={customerContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, customerContext: e.target.value }))}
                                                placeholder="What are we trying to achieve?"
                                                className="h-32 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/20 resize-none text-sm border-2 border-orange-500/10 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 'STRATEGY' && (
                                <div className="flex flex-col gap-6 flex-1 overflow-hidden">
                                    {/* Cohort Selection with Avatars */}
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {cohorts.map((c) => {
                                            const isSelected = selectedCohorts.includes(c);
                                            const avatarIdx = assignedAvatars[c] || 1;
                                            return (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        const newSelected = isSelected
                                                            ? selectedCohorts.filter(sc => sc !== c)
                                                            : [...selectedCohorts, c];
                                                        setPersistedState(prev => ({ ...prev, selectedCohorts: newSelected }));
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-4 rounded-3xl transition-all duration-300 min-w-[100px]",
                                                        isSelected ? "bg-indigo-500 text-white shadow-xl scale-105" : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                    )}
                                                >
                                                    <Avatar className="w-12 h-12 border-2 border-white/20">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=cohort-${avatarIdx}&backgroundColor=e0e7ff`} />
                                                    </Avatar>
                                                    <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[80px]">{c}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Integrated Strategy Detail */}
                                    {selectedCohorts.length > 0 ? (
                                        <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Strategy for {currentCohort}</h3>
                                                <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                                                    <UsersIcon className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{cohortCounts[currentCohort]} Leads Available</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MessageSquare className="w-3 h-3" /> Preliminary Questions
                                                    </label>
                                                    <div className="space-y-2">
                                                        {currentQuestions.map((q: string, idx: number) => (
                                                            <div key={idx} className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                                                                {q}
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full rounded-xl border-dashed border-2 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                                                        >
                                                            Customize Questions
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 block">Target Engagement</label>
                                                        <div className="flex items-center gap-4">
                                                            <Slider
                                                                value={[cohortConfig[currentCohort] || 0]}
                                                                max={cohortCounts[currentCohort]}
                                                                step={1}
                                                                onValueChange={(val) => {
                                                                    setPersistedState(prev => ({
                                                                        ...prev,
                                                                        cohortConfig: { ...prev.cohortConfig, [currentCohort]: val[0] }
                                                                    }));
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span className="text-2xl font-black text-indigo-500">{cohortConfig[currentCohort] || 0}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 block">Cohort Incentive</label>
                                                        <Input
                                                            value={cohortIncentives[currentCohort] || ''}
                                                            onChange={(e) => {
                                                                setPersistedState(prev => ({
                                                                    ...prev,
                                                                    cohortIncentives: { ...prev.cohortIncentives, [currentCohort]: e.target.value }
                                                                }));
                                                            }}
                                                            placeholder="e.g., $10 Amazon Gift Card"
                                                            className="h-12 bg-white/50 dark:bg-black/20 border-white/20 rounded-2xl font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-white/10 rounded-[3rem]">
                                            <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="font-bold uppercase tracking-widest text-[10px]">Select a cohort to begin mapping</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 'EXECUTION' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                                    <div className="md:col-span-2 space-y-6 flex flex-col">
                                        <div className="bg-white/40 dark:bg-white/5 rounded-[2.5rem] border border-white/20 p-8 flex-1 flex flex-col overflow-hidden">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Execution Windows</h3>
                                                <Button
                                                    onClick={() => setPersistedState(prev => ({
                                                        ...prev,
                                                        executionWindows: [...(prev.executionWindows || []), getNextTimeSlot()]
                                                    }))}
                                                    className="rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 font-bold px-6"
                                                >
                                                    <PlusIcon className="w-4 h-4 mr-2" /> Add Slot
                                                </Button>
                                            </div>

                                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                                                {segmentedWindows.current.length > 0 && (
                                                    <div className="mb-6">
                                                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5">
                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                            Current Window
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {segmentedWindows.current.map((window) => (
                                                                <TimeWindowSelector
                                                                    key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                    {...window}
                                                                    onChange={(updates) => {
                                                                        setPersistedState(prev => {
                                                                            const newW = [...prev.executionWindows];
                                                                            newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                            return { ...prev, executionWindows: newW };
                                                                        });
                                                                    }}
                                                                    onDelete={() => {
                                                                        setPersistedState(prev => ({
                                                                            ...prev,
                                                                            executionWindows: prev.executionWindows.filter((_, idx) => idx !== window._originalIndex)
                                                                        }));
                                                                    }}
                                                                    customDurationLabel={window._durationLabel}
                                                                    isInvalid={window._isInvalid}
                                                                    className="bg-white/50 dark:bg-white/5 border-white/10"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {segmentedWindows.upcoming.length > 0 && (
                                                    <div className="mb-6">
                                                        <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">Upcoming Windows</h4>
                                                        <div className="space-y-3">
                                                            <AnimatePresence>
                                                                {segmentedWindows.upcoming.map((window) => (
                                                                    <TimeWindowSelector
                                                                        key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                        {...window}
                                                                        onChange={(updates) => {
                                                                            setPersistedState(prev => {
                                                                                const newW = [...prev.executionWindows];
                                                                                newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                return { ...prev, executionWindows: newW };
                                                                            });
                                                                        }}
                                                                        onDelete={() => {
                                                                            setPersistedState(prev => ({
                                                                                ...prev,
                                                                                executionWindows: prev.executionWindows.filter((_, idx) => idx !== window._originalIndex)
                                                                            }));
                                                                        }}
                                                                        className="bg-white/50 dark:bg-white/5 border-white/10"
                                                                    />
                                                                ))}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}

                                                {segmentedWindows.past.length > 0 && (
                                                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Past Windows</h4>
                                                        <div className="opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 space-y-3">
                                                            <AnimatePresence>
                                                                {segmentedWindows.past.map((window) => (
                                                                    <TimeWindowSelector
                                                                        key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                        {...window}
                                                                        onChange={(updates) => {
                                                                            setPersistedState(prev => {
                                                                                const newW = [...prev.executionWindows];
                                                                                newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                return { ...prev, executionWindows: newW };
                                                                            });
                                                                        }}
                                                                        onDelete={() => {
                                                                            setPersistedState(prev => ({
                                                                                ...prev,
                                                                                executionWindows: prev.executionWindows.filter((_, idx) => idx !== window._originalIndex)
                                                                            }));
                                                                        }}
                                                                        className="bg-white/50 dark:bg-white/5 border-white/10"
                                                                    />
                                                                ))}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}

                                                {executionWindows.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 italic text-sm py-10">
                                                        <ClockIcon className="w-8 h-8 mb-4 opacity-20" />
                                                        No windows defined yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-indigo-500/10 rounded-[2.5rem] border border-indigo-500/20 p-8">
                                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6 block">Interview Depth</label>
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{callDuration}m</div>
                                                <Slider
                                                    value={[callDuration]}
                                                    min={3}
                                                    max={30}
                                                    onValueChange={(val) => setPersistedState(prev => ({ ...prev, callDuration: val[0] }))}
                                                />
                                                <p className="text-[10px] text-center text-indigo-500 font-bold uppercase leading-relaxed tracking-wider">Targeting high-quality insights</p>
                                            </div>
                                        </div>

                                        {!calendarStatus.connected ? (
                                            <div className="bg-zinc-900 dark:bg-zinc-950 text-white rounded-[2.5rem] p-8 flex flex-col gap-4">
                                                <CalendarIcon className="w-8 h-8 text-indigo-400" />
                                                <h4 className="font-black text-lg leading-tight">Calendar Sync</h4>
                                                <p className="text-xs text-zinc-400 leading-relaxed">Prevent scheduling conflicts automatically.</p>
                                                <Button
                                                    onClick={() => setIsAvailabilityPopupOpen(true)}
                                                    className="w-full rounded-2xl bg-white text-zinc-950 font-black hover:bg-zinc-200"
                                                >
                                                    Connect
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Live Sync Active</span>
                                                </div>
                                                <p className="text-[10px] text-emerald-700/60 font-medium">Your windows are synchronized.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="pt-8 pb-12 px-8 border-t border-white/10 flex items-center justify-between relative z-20">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (step === 'IDENTITY') onBack?.();
                            if (step === 'STRATEGY') setPersistedState(prev => ({ ...prev, step: 'IDENTITY' }));
                            if (step === 'EXECUTION') setPersistedState(prev => ({ ...prev, step: 'STRATEGY' }));
                        }}
                        className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest text-zinc-500"
                    >
                        {step === 'IDENTITY' ? 'Back' : 'Previous'}
                    </Button>

                    <div className="flex items-center gap-6">
                        {isSaving ? (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 animate-pulse tracking-widest">
                                <Zap className="w-3 h-3" /> Syncing Ideas...
                            </div>
                        ) : lastSaved && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-[10px] font-black uppercase text-zinc-400 tracking-widest cursor-help">
                                            Last Sync: {lastSaved.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[9999]" side="top">
                                        <p>{lastSaved.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        <Button
                            onClick={handleSaveAndNext}
                            className="bg-zinc-950 dark:bg-white text-white dark:text-black rounded-full h-14 px-12 font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                        >
                            {step === 'EXECUTION' ? 'Launch Magic' : 'Continue'}
                            <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div >
        );
    }

    return (
        <Card
            onMouseMove={handleMouseMove}
            className={cn(
                "overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[2rem] relative group min-h-[500px] flex flex-col transition-all duration-500 shadow-xl",
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

            {/* Exit Button */}
            <div className="absolute top-6 right-6 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        if (step === 'IDENTITY') {
                            setIsExitWarningOpen(true);
                        } else {
                            onBack?.();
                        }
                    }}
                    className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors w-10 h-10"
                >
                    <X className="w-5 h-5 opacity-70" />
                </Button>
            </div>

            <CardContent className="p-4 pb-0 flex flex-col h-full relative z-10 flex-1">
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
                <div className="flex justify-center items-center gap-4 mb-2 shrink-0">
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
                                <div className="w-12 h-[1px] bg-zinc-100 dark:bg-zinc-900 mx-2" />
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
                                className="space-y-5"
                            >
                                <motion.div variants={itemVariants} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-bold dark:text-white tracking-tight">Campaign Identity</h2>
                                        <p className="text-sm text-gray-500 font-medium">Define the persona and brand context for your interview agent.</p>
                                    </div>
                                </motion.div>

                                {/* Campaign Name Field */}
                                <motion.div variants={itemVariants} className="space-y-3">
                                    <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Campaign Name
                                    </label>
                                    <Input
                                        value={campaignName}
                                        onChange={(e) => setPersistedState(prev => ({ ...prev, campaignName: e.target.value }))}
                                        placeholder="Enter campaign name..."
                                        className="h-10 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 transition-all duration-300 text-[14px] px-4 shadow-sm placeholder:text-zinc-400 caret-indigo-500"
                                    />
                                </motion.div>

                                {/* AI Feed - De-boxed & Integrated */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 shadow-sm"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                                            <SparklesIcon className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-base font-black text-gray-900 dark:text-white">AI Intelligence Feed</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-lg">
                                                Use "Load Sample Context" for a Faasos example to understand the format and expected depth.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {onEditLeads && (
                                            <div className="flex flex-col items-end gap-1.5">
                                                <Button
                                                    onClick={onEditLeads}
                                                    variant="secondary"
                                                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-black hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all rounded-xl h-10 px-4 shadow-sm"
                                                >
                                                    Manage Leads
                                                </Button>
                                                {leadsUpdatedAt && new Date(leadsUpdatedAt).getTime() > 0 && (
                                                    <span className="text-[10px] font-black text-zinc-500 px-2 py-0.5" title={formatToIST(leadsUpdatedAt)}>
                                                        Updated {formatRelativeTime(leadsUpdatedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <Button
                                            onClick={handlePasteSample}
                                            variant="ghost"
                                            className="text-indigo-600 dark:text-indigo-400 font-black hover:bg-white dark:hover:bg-zinc-900 transition-all rounded-xl h-10 px-4 group"
                                        >
                                            Load Sample Context
                                            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full pb-4">
                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1.5 px-1">
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
                                                className="min-h-[140px] rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 resize-none transition-all duration-300 text-[14px] leading-relaxed p-4 shadow-sm placeholder:text-zinc-400 [&::-webkit-scrollbar]:hidden caret-indigo-500"
                                            />
                                        </motion.div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1.5 px-1">
                                            Team Context
                                        </label>
                                        <motion.div variants={glowInputVariants} initial="initial" whileFocus="focus">
                                            <Textarea
                                                value={teamMemberContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, teamMemberContext: e.target.value }))}
                                                placeholder="Describe who will be conducting the interviews..."
                                                className="min-h-[140px] rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/20 resize-none transition-all duration-300 text-[14px] leading-relaxed p-4 shadow-sm placeholder:text-zinc-400 [&::-webkit-scrollbar]:hidden caret-indigo-500"
                                            />
                                        </motion.div>
                                    </motion.div>


                                    <motion.div variants={itemVariants} className="space-y-3 md:col-span-2">
                                        <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1.5 px-1">
                                            Call Purpose
                                        </label>
                                        <motion.div variants={glowInputVariants} initial="initial" whileFocus="focus" className="relative z-10">
                                            <Textarea
                                                value={customerContext}
                                                onChange={(e) => setPersistedState(prev => ({ ...prev, customerContext: e.target.value }))}
                                                placeholder="Define the primary objective for this interview campaign..."
                                                className="min-h-[120px] rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/20 resize-none transition-all duration-300 text-[14px] leading-relaxed p-4 shadow-sm border-2 border-orange-500/10 placeholder:text-zinc-400 [&::-webkit-scrollbar]:hidden caret-indigo-500"
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
                                    <h2 className="text-3xl font-black dark:text-white tracking-tight">Campaign Strategy</h2>
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
                                        <div className="flex items-center gap-4 overflow-x-auto py-4 px-2 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {sortedCohorts.map((cohort, index) => {
                                                const isSelected = selectedCohorts.includes(cohort);
                                                const isActive = (activeCohort || sortedCohorts[0]) === cohort;
                                                const qCount = (cohortQuestions[cohort] || preliminaryQuestions).length;
                                                const tCalls = cohortConfig[cohort] || 0;
                                                const avatarIndex = assignedAvatars[cohort] || 1;

                                                return (
                                                    <motion.div
                                                        key={cohort}
                                                        onClick={() => setPersistedState(prev => ({
                                                            ...prev,
                                                            activeCohort: cohort
                                                        }))}
                                                        whileHover={{ y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={cn(
                                                            "relative flex-shrink-0 flex items-center gap-3.5 p-2 rounded-[1.5rem] border transition-all duration-300 cursor-pointer group select-none min-w-[180px]",
                                                            isActive
                                                                ? "bg-white dark:bg-zinc-900 border-indigo-500 ring-4 ring-indigo-500/5 shadow-lg shadow-indigo-500/5 z-10"
                                                                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden border-2 bg-zinc-50 dark:bg-zinc-800",
                                                            isActive ? "border-indigo-100 scale-105" : "border-transparent group-hover:scale-105"
                                                        )}>
                                                            <img
                                                                src={`/images/avatars/notionists/full_body/avatar_${avatarIndex}.png`}
                                                                alt={cohort}
                                                                className={cn("w-full h-full object-cover transition-all duration-500",
                                                                    !isActive && "opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0",
                                                                    "mix-blend-multiply dark:mix-blend-normal"
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-start text-left gap-0.5 flex-1 min-w-0">
                                                            <span className={cn(
                                                                "text-sm font-bold truncate w-full transition-colors duration-300",
                                                                isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
                                                            )}>
                                                                {cohort === 'Default' ? 'General Audience' : cohort}
                                                            </span>
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 text-[10px] font-bold transition-colors duration-300",
                                                                isActive ? "text-indigo-500" : "text-zinc-400 group-hover:text-indigo-400"
                                                            )}>
                                                                <span>{tCalls} Calls</span>
                                                                <span className="opacity-30">&bull;</span>
                                                                <span>{qCount} Qs</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPersistedState(prev => {
                                                                    const newSelected = prev.selectedCohorts.includes(cohort)
                                                                        ? prev.selectedCohorts.filter(c => c !== cohort)
                                                                        : [...prev.selectedCohorts, cohort];
                                                                    return {
                                                                        ...prev,
                                                                        selectedCohorts: newSelected
                                                                    };
                                                                });
                                                            }}
                                                            className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm",
                                                                isSelected
                                                                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                                                    : isActive
                                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400 border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100"
                                                                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-white hover:text-indigo-400 hover:border-indigo-200"
                                                            )}
                                                        >
                                                            {isSelected ? (
                                                                <CheckIcon className="w-4 h-4" strokeWidth={3} />
                                                            ) : (
                                                                <PlusIcon className="w-4 h-4" strokeWidth={3} />
                                                            )}
                                                        </button>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* DETAIL CARD */}
                                        <AnimatePresence mode="wait">
                                            {(() => {
                                                const currentCohort = activeCohort || sortedCohorts[0];
                                                if (!cohorts.includes(currentCohort)) return null;

                                                const currentQuestions = cohortQuestions[currentCohort] || preliminaryQuestions;
                                                const currentIncentive = cohortIncentives[currentCohort] ?? incentive;

                                                return (
                                                    <motion.div
                                                        key={currentCohort}
                                                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="group relative p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-2xl shadow-zinc-200/50 dark:shadow-none"
                                                    >
                                                        <div className="flex flex-col lg:flex-row gap-12">
                                                            {/* LEFT COLUMN: Core Strategy */}
                                                            <div className="flex-1 space-y-8">
                                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                                                                    <div className="relative w-32 h-32 rounded-[2rem] bg-zinc-50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-all duration-500">
                                                                        <img
                                                                            src={`/images/avatars/notionists/full_body/avatar_${assignedAvatars[currentCohort] || 1}.png`}
                                                                            alt={currentCohort}
                                                                            className="w-full h-full object-contain filter drop-shadow-lg"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 text-center sm:text-left space-y-4">
                                                                        <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                                                            {currentCohort === 'Default' ? 'General Audience' : currentCohort}
                                                                        </h3>

                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center justify-center sm:justify-between">
                                                                                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Target Volume</label>
                                                                                <button
                                                                                    onClick={() => setPersistedState(prev => ({
                                                                                        ...prev,
                                                                                        cohortConfig: { ...prev.cohortConfig, [currentCohort]: cohortCounts[currentCohort] || 0 }
                                                                                    }))}
                                                                                    className="hidden sm:block text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-widest"
                                                                                >
                                                                                    MAX
                                                                                </button>
                                                                            </div>
                                                                            <div className="flex items-center justify-center sm:justify-start gap-3">
                                                                                <span className="text-lg font-bold text-zinc-900 dark:text-white">Conduct</span>
                                                                                <div className="relative group/input">
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={cohortConfig[currentCohort] || 0}
                                                                                        onChange={(e) => {
                                                                                            const val = parseInt(e.target.value) || 0;
                                                                                            const maxSize = cohortCounts[currentCohort] || 0;
                                                                                            if (val > maxSize) toast.error(`Max size for ${currentCohort} is ${maxSize}`);
                                                                                            setPersistedState(prev => ({
                                                                                                ...prev,
                                                                                                cohortConfig: { ...prev.cohortConfig, [currentCohort]: Math.min(val, maxSize) }
                                                                                            }));
                                                                                        }}
                                                                                        className="w-20 h-10 text-center text-2xl font-black border-none bg-transparent p-0 focus-visible:ring-0 selection:bg-indigo-100"
                                                                                    />
                                                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800 group-hover/input:bg-indigo-500 transition-colors" />
                                                                                </div>
                                                                                <span className="text-lg font-bold text-zinc-900 dark:text-white">interviews</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-6">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                                            <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Preliminary Questions</label>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <button
                                                                                onClick={() => handleApplyQuestionsToSelected(currentCohort)}
                                                                                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-2 uppercase tracking-widest"
                                                                            >
                                                                                <SparklesIcon className="w-3.5 h-3.5" />
                                                                                Apply to selected
                                                                            </button>
                                                                            <span className="text-[11px] font-black text-zinc-300 tabular-nums">{currentQuestions.length}/3</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        {currentQuestions.map((q, qIdx) => (
                                                                            <div key={qIdx} className="relative group/q">
                                                                                <SearchableSelect
                                                                                    value={q}
                                                                                    options={[
                                                                                        ...questionBank.map(bq => ({ label: bq, value: bq })),
                                                                                        ...(q && !questionBank.includes(q) ? [{ label: q, value: q }] : [])
                                                                                    ]}
                                                                                    onChange={(val) => {
                                                                                        setPersistedState(prev => {
                                                                                            const newBank = [...(prev.questionBank || [])];
                                                                                            if (val.length > 5 && !newBank.includes(val)) newBank.push(val);
                                                                                            const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                            const newQList = currentCohortQuestions[currentCohort] ? [...currentCohortQuestions[currentCohort]] : [...(prev.preliminaryQuestions || [])];
                                                                                            newQList[qIdx] = val;
                                                                                            return { ...prev, questionBank: newBank, cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList } };
                                                                                        });
                                                                                    }}
                                                                                    allowCustomValue={true}
                                                                                    placeholder="Select or type a question..."
                                                                                    className="h-14 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-2xl px-6 font-medium text-sm transition-all"
                                                                                />
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setPersistedState(prev => {
                                                                                            const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                            const newQList = currentCohortQuestions[currentCohort] ? [...currentCohortQuestions[currentCohort]] : [...(prev.preliminaryQuestions || [])];
                                                                                            newQList.splice(qIdx, 1);
                                                                                            return { ...prev, cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList } };
                                                                                        });
                                                                                    }}
                                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/q:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl shadow-sm"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ))}

                                                                        {currentQuestions.length < 3 && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const defaultQ = "";
                                                                                    setPersistedState(prev => {
                                                                                        const currentCohortQuestions = prev.cohortQuestions || {};
                                                                                        const newQList = currentCohortQuestions[currentCohort] ? [...currentCohortQuestions[currentCohort]] : [...(prev.preliminaryQuestions || [])];
                                                                                        if (newQList.length < 3) newQList.push(defaultQ);
                                                                                        return { ...prev, cohortQuestions: { ...currentCohortQuestions, [currentCohort]: newQList } };
                                                                                    });
                                                                                }}
                                                                                className="w-full h-14 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest"
                                                                            >
                                                                                <PlusIcon className="w-4 h-4" strokeWidth={3} />
                                                                                Add Question
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* RIGHT COLUMN: Sidebar */}
                                                            <div className="w-full lg:w-[320px] space-y-8">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                                                            <label className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Incentive</label>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleApplyIncentiveToSelected(currentCohort)}
                                                                            className="text-[10px] font-black text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-2 uppercase tracking-widest"
                                                                        >
                                                                            <SparklesIcon className="w-3.5 h-3.5" />
                                                                            Apply to selected
                                                                        </button>
                                                                    </div>
                                                                    <div className="bg-orange-50/30 dark:bg-orange-500/5 rounded-2xl p-1 border border-orange-100 dark:border-orange-500/10 shadow-sm">
                                                                        <SearchableSelect
                                                                            value={currentIncentive}
                                                                            options={[
                                                                                { label: "₹100 UPI", value: "₹100 UPI" },
                                                                                { label: "₹200 UPI", value: "₹200 UPI" },
                                                                                { label: "₹500 Amazon Voucher", value: "₹500 Amazon Voucher" },
                                                                                { label: "Swiggy Coupon", value: "Swiggy Coupon" },
                                                                                { label: "Zomato Gold", value: "Zomato Gold" },
                                                                            ]}
                                                                            onChange={(val) => setPersistedState(prev => ({ ...prev, cohortIncentives: { ...prev.cohortIncentives, [currentCohort]: val } }))}
                                                                            allowCustomValue={true}
                                                                            placeholder="Select incentive..."
                                                                            className="h-12 border-none bg-transparent shadow-none focus-visible:ring-0 text-orange-950 dark:text-orange-100 font-bold text-sm"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="p-8 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
                                                                    <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cohort Summary</h4>
                                                                    <div className="space-y-4">
                                                                        <div className="flex justify-between items-center py-1">
                                                                            <span className="text-xs font-bold text-zinc-500">Segment Priority</span>
                                                                            <span className="text-sm font-black text-zinc-900 dark:text-white">High</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center py-1">
                                                                            <span className="text-xs font-bold text-zinc-500">Total Customers</span>
                                                                            <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">{cohortCounts[currentCohort] || 0}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center py-1">
                                                                            <span className="text-xs font-bold text-zinc-500">Est. Duration</span>
                                                                            <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">~{Math.round((cohortConfig[currentCohort] || 0) * 10 / 60)} hrs</span>
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

                                            <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-2 custom-scrollbar flex-1 p-1">
                                                {segmentedWindows.current.length > 0 && (
                                                    <div className="mb-6">
                                                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5">
                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                                            Current Window
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {segmentedWindows.current.map((window) => (
                                                                <TimeWindowSelector
                                                                    key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                    day={window.day}
                                                                    start={window.start}
                                                                    end={window.end}
                                                                    allWindows={executionWindows}
                                                                    currentIndex={window._originalIndex}
                                                                    customDurationLabel={window._durationLabel}
                                                                    isInvalid={window._isInvalid}
                                                                    onChange={(updates) => {
                                                                        setPersistedState(prev => {
                                                                            const newW = [...prev.executionWindows];
                                                                            newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                            return { ...prev, executionWindows: newW };
                                                                        });
                                                                    }}
                                                                    onDelete={() => {
                                                                        setPersistedState(prev => ({
                                                                            ...prev,
                                                                            executionWindows: prev.executionWindows.filter((_, idx) => idx !== window._originalIndex)
                                                                        }));
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {segmentedWindows.upcoming.length > 0 && (
                                                    <div className="mb-6">
                                                        <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">Upcoming Windows</h4>
                                                        <div className="space-y-2">
                                                            <AnimatePresence>
                                                                {segmentedWindows.upcoming.map((window) => (
                                                                    <TimeWindowSelector
                                                                        key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                        day={window.day}
                                                                        start={window.start}
                                                                        end={window.end}
                                                                        allWindows={executionWindows}
                                                                        currentIndex={window._originalIndex}
                                                                        onChange={(updates) => {
                                                                            setPersistedState(prev => {
                                                                                const newW = [...prev.executionWindows];
                                                                                newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                return { ...prev, executionWindows: newW };
                                                                            });
                                                                        }}
                                                                        onDelete={() => {
                                                                            setPersistedState(prev => ({
                                                                                ...prev,
                                                                                executionWindows: prev.executionWindows.filter((_, idx) => idx !== window._originalIndex)
                                                                            }));
                                                                        }}
                                                                    />
                                                                ))}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}

                                                {segmentedWindows.past.length > 0 && (
                                                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Past Windows</h4>
                                                        <div className="opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 space-y-2">
                                                            <AnimatePresence>
                                                                {segmentedWindows.past.map((window) => (
                                                                    <TimeWindowSelector
                                                                        key={`${window.day}-${window.start}-${window._originalIndex}`}
                                                                        day={window.day}
                                                                        start={window.start}
                                                                        end={window.end}
                                                                        allWindows={executionWindows}
                                                                        currentIndex={window._originalIndex}
                                                                        onChange={(updates) => {
                                                                            setPersistedState(prev => {
                                                                                const newW = [...prev.executionWindows];
                                                                                newW[window._originalIndex] = { ...newW[window._originalIndex], ...updates };
                                                                                return { ...prev, executionWindows: newW };
                                                                            });
                                                                        }}
                                                                        onDelete={() => {
                                                                            setPersistedState(prev => ({
                                                                                ...prev,
                                                                                executionWindows: prev.executionWindows.filter((_, idx) => idx !== window._originalIndex)
                                                                            }));
                                                                        }}
                                                                    />
                                                                ))}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}

                                                {executionWindows.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                                                        <ClockIcon className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
                                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Windows Defined</p>
                                                    </div>
                                                )}
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

                                                                // Improved Guard: Automatically save and create campaign if in Draft Mode
                                                                let activeCampaignId = campaignId;
                                                                if (!activeCampaignId || activeCampaignId === 'null' || activeCampaignId === 'undefined') {
                                                                    activeCampaignId = await finalizeCampaign(false);
                                                                    if (!activeCampaignId) return; // Creation failed
                                                                }

                                                                try {
                                                                    setIsSyncingCalendar(true);

                                                                    // Clean execution windows to ensure only backend-compatible fields are sent
                                                                    const cleanedWindows = (executionWindows || []).map((w: any) => ({
                                                                        day: w.day,
                                                                        start: w.start,
                                                                        end: w.end
                                                                    })).filter(w => w.day && w.start && w.end);


                                                                    await api.patch(`/intelligence/campaigns/${activeCampaignId}/settings`, {
                                                                        execution_windows: cleanedWindows
                                                                    });
                                                                    const response = await api.post(`/intelligence/campaigns/${activeCampaignId}/calendar-sync`);

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
                                                    className="flex-1 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-orange-600 dark:from-indigo-500 dark:to-orange-500 text-white hover:from-indigo-700 hover:to-orange-700 dark:hover:from-indigo-600 dark:hover:to-orange-600 font-bold text-sm gap-2 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
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
                <div className="relative z-[100] flex items-center justify-between mt-auto border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 pt-6 pb-12">
                    <div className="flex items-center gap-8">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (step === 'IDENTITY') setIsExitWarningOpen(true);
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
                                className="rounded-xl h-14 px-10 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 font-black text-xs uppercase tracking-[0.2em] group relative shadow-2xl"
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

            <ConfirmExitDialog
                isOpen={isExitWarningOpen}
                onClose={() => setIsExitWarningOpen(false)}
                onConfirm={() => {
                    setIsExitWarningOpen(false);
                    onBack?.();
                }}
                title="Exit Campaign Builder?"
                description="Your progress is auto-saved as a draft, but the campaign will not be live until you initialize it."
                confirmLabel="Exit"
                cancelLabel="Continue"
            />
        </Card >
    );
}
