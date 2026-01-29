"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Sparkles,
    CheckCircle2,
    Clock,
    ChevronRight,
    ArrowUpRight,
    ShieldCheck,
    Edit3,
    Check,
    X,
    Pencil,
    Phone
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LiveWaveform } from "@/components/customer-intelligence/LiveWaveform";
import { api } from "@/lib/api";
import { useSearchParams } from 'next/navigation';
import { DisconnectConfirmDialog } from "@/components/customer-intelligence/DisconnectConfirmDialog";
import { AvailabilityMagicPopup } from "@/components/customer-intelligence/AvailabilityMagicPopup"; // [NEW]
import { MagicLoader } from "@/components/ui/magic-loader";
import { toast } from "sonner";
import { CampaignCard } from "@/components/customer-intelligence/CampaignCard";
import { ContactDetailsInline } from "@/components/customer-intelligence/ContactDetailsInline"; // [NEW]
import { CallAnalysisSummary } from "@/components/customer-intelligence/CallAnalysisSummary"; // [NEW]
import { ContactDetailsCard } from "@/components/customer-intelligence/ContactDetailsCard";

// Types for Mock State
type ExtractionStatus = 'IDLE' | 'CALLING' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW' | 'ERROR';

export default function CustomerIntelligencePage() {
    const [status, setStatus] = useState<ExtractionStatus>('IDLE');
    const [detailedStatus, setDetailedStatus] = useState<string | null>(null); // [NEW]
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    const [calendarData, setCalendarData] = useState<any>(null);
    const [extractedGoals, setExtractedGoals] = useState<string[]>([]);
    const [displayText, setDisplayText] = useState("");
    const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isAvailabilityPopupOpen, setIsAvailabilityPopupOpen] = useState(false); // [NEW]
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // [NEW]

    const [activeCampaign, setActiveCampaign] = useState<any>(null); // [NEW]
    const [contactDetails, setContactDetails] = useState({ name: '', phone: '' }); // [NEW]
    const [isContactSaved, setIsContactSaved] = useState(false); // [NEW]
    const [isLoadingUser, setIsLoadingUser] = useState(true); // [NEW]
    const searchParams = useSearchParams();

    // Campaign History State
    const [latestCampaigns, setLatestCampaigns] = useState<any[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [campaignOffset, setCampaignOffset] = useState(0);
    const [hasMoreCampaigns, setHasMoreCampaigns] = useState(true);

    const CAMPAIGNS_PER_PAGE = 3;

    const fetchCampaigns = async (offset = 0, append = false) => {
        try {
            setIsLoadingCampaigns(true);
            const data = await api.get(`/intelligence/campaigns?limit=${CAMPAIGNS_PER_PAGE}&offset=${offset}`);

            if (append) {
                setLatestCampaigns(prev => [...prev, ...data.campaigns]);
            } else {
                setLatestCampaigns(data.campaigns);
            }

            if (data.campaigns.length < CAMPAIGNS_PER_PAGE) {
                setHasMoreCampaigns(false);
            }

            setCampaignOffset(offset + CAMPAIGNS_PER_PAGE);

        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
            toast.error("Failed to load campaign history");
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleLoadMore = () => {
        fetchCampaigns(campaignOffset, true);
    };

    // Refresh campaigns when an interview completes
    useEffect(() => {
        if (status === 'COMPLETED' && activeCampaign) {
            fetchCampaigns(0, false);
        }
    }, [status, activeCampaign]);


    // Fetch Calendar Status
    const fetchCalendarStatus = async () => {
        try {
            const data = await api.get("/intelligence/calendar/status");
            // console.log("Calendar status data:", data);
            setIsCalendarConnected(data.connected);
            setCalendarData(data);
        } catch (error) {
            console.error("Failed to fetch calendar status:", error);
        } finally {
            setIsLoadingInitial(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            setIsLoadingUser(true);
            const user = await api.get("/users/me");
            if (user) {
                setContactDetails({
                    name: user.full_name || '',
                    phone: user.contact_number || ''
                });
                // Mark as saved if both fields are present
                if (user.full_name && user.contact_number) {
                    setIsContactSaved(true);
                    setOriginalContactDetails({
                        name: user.full_name,
                        phone: user.contact_number
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    useEffect(() => {
        fetchCalendarStatus();
        fetchUserProfile();
        const interval = setInterval(fetchCalendarStatus, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    // If redirected back from Google, refresh status
    useEffect(() => {
        if (searchParams?.get('calendar_connected') === 'true') {
            fetchCalendarStatus();
        }
    }, [searchParams]);

    const handleConnectCalendar = async () => {
        try {
            setIsConnecting(true);
            const companyId = localStorage.getItem('unclutr_company_id');
            if (!companyId) {
                console.error("Missing unclutr_company_id in localStorage");
                toast.error("Session error: Please try refreshing the page or logging in again.");
                setIsConnecting(false);
                return;
            }

            const response = await api.get("/intelligence/calendar/google/login");
            if (response.url) {
                window.location.href = response.url;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error: any) {
            console.error("Failed to start Google OAuth:", error);
            toast.error(`Failed to connect calendar: ${error.message || "Unknown error"}`);
            setIsConnecting(false);
        }
    };

    const handleDisconnectCalendar = () => {
        setIsDisconnectDialogOpen(true);
    };

    const handleContactChange = (field: 'name' | 'phone', value: string) => {
        setContactDetails(prev => ({ ...prev, [field]: value }));
    };

    const [originalContactDetails, setOriginalContactDetails] = useState({ name: '', phone: '' });

    const handleSaveContact = async () => {
        // Validate before saving
        if (!contactDetails.name.trim() || contactDetails.name.trim().length < 2) {
            toast.error("Please enter a valid name (at least 2 characters).");
            return;
        }

        const parts = contactDetails.phone.trim().split(' ');
        if (parts.length < 2 || !parts[0].startsWith('+')) {
            toast.error("Please enter a valid phone number with country code.");
            return;
        }

        const numberPart = parts.slice(1).join('').replace(/\D/g, '');
        if (numberPart.length < 10) {
            toast.error("Please enter a valid phone number (at least 10 digits).");
            return;
        }

        try {
            // Save to backend
            await api.patch('/users/me', {
                full_name: contactDetails.name,
                contact_number: contactDetails.phone
            });
            setIsContactSaved(true);
            setOriginalContactDetails({ ...contactDetails });
            toast.success("Contact details saved securely");
        } catch (error) {
            console.error("Failed to save contact details:", error);
            toast.error("Failed to save contact details");
        }
    };

    const handleCancelEdit = () => {
        // Restore original values
        setContactDetails({ ...originalContactDetails });
    };

    const isContactReady = contactDetails.name.length > 0 && contactDetails.phone.length > 0 && isContactSaved;

    // Calculate Readiness Score
    const calculateReadinessScore = () => {
        let score = 25; // Base score
        if (isContactReady) score += 25;
        if (isCalendarConnected) score += 25;
        if (status === 'REVIEW') score += 25; // AI Calibration/Goal Alignment
        return score;
    };

    const readinessScore = calculateReadinessScore();

    const confirmDisconnect = async () => {
        try {
            setIsDisconnecting(true);
            await api.delete("/intelligence/calendar/disconnect");
            setIsCalendarConnected(false);
            setCalendarData(null);
            setIsDisconnectDialogOpen(false);
            toast.success("Calendar disconnected successfully");
        } catch (error: any) {
            console.error("Failed to disconnect calendar:", error);
            toast.error(`Failed to disconnect calendar: ${error.message || "Unknown error"}`);
        } finally {
            setIsDisconnecting(false);
        }
    };

    // START REAL PHONE INTERVIEW
    const handleStartInterview = async () => {
        if (!contactDetails.phone) {
            toast.error("Phone number is required to start interview");
            return;
        }

        // Clear any previous errors
        setErrorMessage(null);
        setStatus('CALLING');
        let pollInterval: NodeJS.Timeout | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        try {
            // Normalize phone number to E.164 format (remove spaces)
            const normalizedPhone = contactDetails.phone.replace(/\s+/g, '');

            // 1. Trigger REAL Bolna phone call
            const payload: any = {
                phone_number: normalizedPhone
            };

            // If retrying a failed campaign, pass the ID to reuse it
            if (status === 'ERROR' && activeCampaign?.id) {
                payload.campaign_id = activeCampaign.id;
            }

            const response = await api.post("/intelligence/interview/trigger", payload);

            const { execution_id, campaign_id } = response;

            if (!execution_id || !campaign_id) {
                throw new Error("Invalid response from server");
            }

            toast.success(`Phone call initiated to ${contactDetails.phone}`);

            // 2. Poll for campaign updates (check every 2 seconds for faster feedback initially)
            pollInterval = setInterval(async () => {
                try {
                    const campaignRes = await api.get(`/intelligence/campaigns/${campaign_id}`);
                    const campaign = campaignRes;

                    if (campaign.bolna_call_status) {
                        setDetailedStatus(campaign.bolna_call_status);
                    }

                    // Update status based on campaign status
                    if (campaign.status === 'RINGING') {
                        setStatus('RINGING');
                    } else if (campaign.status === 'IN_PROGRESS') {
                        setStatus('IN_PROGRESS');
                    } else if (campaign.status === 'COMPLETED') {
                        if (pollInterval) clearInterval(pollInterval);
                        if (timeoutId) clearTimeout(timeoutId);

                        // Testing Popup
                        toast.info("Testing: Callback received from Bolna (COMPLETED)");

                        setStatus('COMPLETED');
                        setActiveCampaign(campaign);
                        toast.success("Interview completed & Campaign generated!");
                    } else if (campaign.status === 'FAILED') {
                        if (pollInterval) clearInterval(pollInterval);
                        if (timeoutId) clearTimeout(timeoutId);

                        // Testing Popup
                        toast.info("Testing: Callback received from Bolna (FAILED)");

                        const errorMsg = campaign.bolna_error_message || "Call failed. Please try again.";
                        setErrorMessage(errorMsg);
                        setActiveCampaign(campaign); // Save for retry
                        setStatus('ERROR');
                        toast.error(errorMsg);
                    }
                } catch (pollError) {
                    console.error("Polling error:", pollError);
                    // Don't clear interval on poll errors, keep trying
                }
            }, 1000); // Poll faster (1s)

            // Stop polling after 10 minutes (timeout)
            timeoutId = setTimeout(() => {
                if (pollInterval) clearInterval(pollInterval);
                if (status !== 'COMPLETED') {
                    const timeoutMsg = "Interview timed out. Please try again.";
                    setErrorMessage(timeoutMsg);
                    setStatus('ERROR');
                    toast.error(timeoutMsg);
                }
            }, 600000); // 10 minutes

        } catch (error: any) {
            console.error("Failed to trigger phone interview:", error);

            // Clean up polling if it was started
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutId) clearTimeout(timeoutId);

            // Parse error message from backend
            let errorMessage = "Failed to start phone interview";

            if (error.message) {
                // Backend returns structured error messages
                errorMessage = error.message;
            }

            // Show user-friendly error
            toast.error(errorMessage, {
                duration: 5000,
            });

            setErrorMessage(errorMessage);
            setStatus('ERROR');
        }
    };


    return (
        <div className="p-6 md:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section - Only show when not in blocking state */}
                {(isLoadingUser || isContactReady) && (
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-500/20">
                                    Phase 1: Goal Extraction
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-display">
                                Customer Intelligence
                            </h1>
                            <p className="text-gray-400 dark:text-[#71717A] text-sm">
                                Strategic Command Center for User Research
                            </p>
                        </div>

                        {(isContactReady && !isLoadingUser) && (
                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="rounded-2xl border-gray-100 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm">
                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                    History
                                </Button>
                                <Button className="rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    New Campaign
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {isLoadingUser ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <MagicLoader text="Loading your profile..." />
                    </div>
                ) : !isContactReady ? (
                    // BLOCKING STATE: Contact Details Required
                    <div className="relative flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-700 max-w-lg mx-auto">
                        {/* Ambient Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10 text-center mb-8 space-y-3">
                            <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 shadow-2xl shadow-orange-500/10 mb-2"
                            >
                                <ShieldCheck className="w-10 h-10 text-orange-500 drop-shadow-sm" />
                            </motion.div>
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500 tracking-tight">
                                Unlock Customer Intelligence
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-md mx-auto">
                                Provide your contact details so our AI agent can call you to extract campaign priorities.
                            </p>
                        </div>

                        <ContactDetailsCard
                            contactDetails={contactDetails}
                            onChange={handleContactChange}
                            isSaved={isContactSaved}
                            onSave={handleSaveContact}
                            className="relative z-10 w-full shadow-2xl shadow-orange-500/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/5 ring-1 ring-white/50 dark:ring-white/5"
                        />
                    </div>
                ) : (
                    <>
                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* 1. Goal Extraction Mega-Card (Left 2/3) */}
                            <Card className="lg:col-span-8 overflow-hidden border-gray-100/50 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] backdrop-blur-md rounded-[2.5rem] relative group min-h-[550px]">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] to-transparent pointer-events-none" />

                                <CardContent className="p-0 flex flex-col h-full relative z-10">

                                    <AnimatePresence mode="wait">
                                        {status === 'IDLE' || status === 'CALLING' || status === 'RINGING' || status === 'IN_PROGRESS' ? (
                                            <motion.div
                                                key="call-logic"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center h-full p-8 md:p-12 text-center"
                                            >
                                                {/* Siri-style Waveform */}
                                                <div className="mb-12 relative flex items-center justify-center h-32 w-full">
                                                    <LiveWaveform isActive={status === 'IN_PROGRESS' || status === 'CALLING' || status === 'RINGING'} />
                                                </div>

                                                <div className="max-w-md">
                                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                                        {status === 'IDLE' ? "Align with AI Researcher" :
                                                            status === 'CALLING' || status === 'RINGING' ? "Connecting with AI..." : "Extracting Strategic Goals"}
                                                    </h2>
                                                    <div className="text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed space-y-3">
                                                        {status === 'IDLE' ? (
                                                            <>
                                                                <p className="text-base">
                                                                    Our AI agent will call you to extract primary goals and cohorts for your upcoming high-intent customer interviews.
                                                                </p>
                                                                <div className="flex items-center justify-center gap-2 py-2">
                                                                    <span className="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-wide">
                                                                        {contactDetails.phone}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setIsContactSaved(false)}
                                                                        className="inline-flex items-center p-1.5 rounded-lg text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 transition-all"
                                                                        title="Edit contact details"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className="text-base">
                                                                Stay on the line. We're capturing your objectives to build the perfect interview script.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {status === 'IDLE' ? (
                                                        <>
                                                            {/* <Button
                                                            onClick={handleStartInterview}
                                                            size="lg"
                                                            disabled={!isContactReady}
                                                            className={cn(
                                                                "rounded-2xl h-14 px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 enabled:hover:bg-zinc-800 dark:enabled:hover:bg-gray-100 transition-all font-bold text-lg group",
                                                                !isContactReady && "opacity-50 cursor-not-allowed"
                                                            )}
                                                            title={!isContactReady ? "Please provide contact details first" : "Start Interview"}
                                                        >
                                                            Trigger Phone Interview
                                                            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                                        </Button> */}
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-3 px-6 py-3 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 font-bold animate-pulse mb-4">
                                                                <span className="relative flex h-3 w-3">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                                                </span>
                                                                {status === 'CALLING' ? "Calling your number..." :
                                                                    status === 'RINGING' ? "Phone is ringing..." :
                                                                        detailedStatus ?
                                                                            <span className="capitalize">{detailedStatus.replace(/_/g, ' ')}...</span> :
                                                                            "Interview in progress..."}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => setStatus('IDLE')}
                                                                className="text-gray-400 text-xs hover:text-red-500"
                                                            >
                                                                End Session
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>


                                        ) : status === 'COMPLETED' && activeCampaign ? (
                                            <CallAnalysisSummary
                                                campaign={activeCampaign}
                                                onClose={() => setStatus('IDLE')}
                                                onViewCampaign={() => {
                                                    // Scroll to campaigns list
                                                    const campaignsList = document.getElementById('latest-campaigns');
                                                    if (campaignsList) {
                                                        campaignsList.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                    setStatus('IDLE');
                                                }}
                                            />
                                        ) : status === 'ERROR' ? (
                                            <motion.div
                                                key="error-state"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                                                    <X className="w-16 h-16 text-red-500" />
                                                </div>

                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                                    Interview Failed
                                                </h2>

                                                <p className="text-gray-500 dark:text-zinc-400 mb-6 max-w-md text-center">
                                                    {errorMessage || "An error occurred while starting the interview."}
                                                </p>

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setStatus('IDLE')}
                                                        className="rounded-2xl"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleStartInterview}
                                                        className="rounded-2xl bg-orange-500 hover:bg-orange-600 text-white"
                                                    >
                                                        Try Again
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>

                                </CardContent>
                            </Card>

                            {/* 2. Right Column (Calendar & Readiness) */}
                            <div className="lg:col-span-4 space-y-6 flex flex-col">

                                {/* Calendar Sync Card */}
                                <Card className="flex-1 border-gray-100/50 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] backdrop-blur-md rounded-[2.5rem] overflow-hidden group">
                                    <CardContent className="p-8 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "h-6 font-bold border-none",
                                                isCalendarConnected ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50"
                                            )}>
                                                {isCalendarConnected ? "Connected" : "Not Linked"}
                                            </Badge>
                                        </div>

                                        <h3 className="text-xl font-bold dark:text-white mb-2">Calendar Access</h3>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 flex-1 italic">
                                            &quot;Schedule interviews with zero friction by letting us know when you&apos;re busy.&quot;
                                        </p>

                                        {isLoadingInitial || isConnecting || isDisconnecting ? (
                                            <div className="flex-1 flex items-center justify-center py-12">
                                                <MagicLoader text={isConnecting ? "Redirecting to Google..." : isDisconnecting ? "Disconnecting..." : "Syncing Calendar..."} />
                                            </div>
                                        ) : !isCalendarConnected ? (
                                            <Button
                                                onClick={handleConnectCalendar}
                                                className="w-full rounded-2xl h-12 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white font-bold transition-all shadow-sm group-hover:shadow-md"
                                            >
                                                Connect Google Calendar
                                                <ArrowUpRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </Button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-xs font-medium dark:text-emerald-400">Google Calendar</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={handleDisconnectCalendar}
                                                            className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Disconnect Calendar"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest mt-4">Availability: Next 24 Hours</p>

                                                {calendarData?.error && (
                                                    <div className="p-2 mt-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-500 text-center">
                                                        {calendarData.error}
                                                    </div>
                                                )}

                                                <div
                                                    className="grid grid-cols-12 gap-x-1 gap-y-2 mt-3 p-2 bg-black/5 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                                    onClick={() => setIsAvailabilityPopupOpen(true)}
                                                    title="Click to see 7-day availability"
                                                >
                                                    {(() => {
                                                        const now = new Date();
                                                        const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

                                                        const slots = Array.from({ length: 24 }).map((_, i) => {
                                                            const start = new Date(startOfHour.getTime() + i * 1 * 60 * 60 * 1000);
                                                            const end = new Date(startOfHour.getTime() + (i + 1) * 1 * 60 * 60 * 1000);

                                                            const isBusy = (calendarData?.busy_slots || []).some((slot: any) => {
                                                                const s = new Date(slot.start).getTime();
                                                                const e = new Date(slot.end).getTime();
                                                                return (s < end.getTime() && e > start.getTime());
                                                            });

                                                            const h = start.getHours();
                                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                                            const h12 = h % 12 || 12;
                                                            const label = `${h12}${ampm}`;

                                                            return { isBusy, key: i, label, start };
                                                        });

                                                        return slots.map(slot => (
                                                            <div
                                                                key={slot.key}
                                                                className="flex flex-col items-center gap-0.5"
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "w-full h-4 rounded-sm border transition-all duration-300",
                                                                        slot.isBusy
                                                                            ? "bg-red-500 border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                                                            : "bg-emerald-500/30 border-emerald-500/20"
                                                                    )}
                                                                    title={`${slot.label}: ${slot.isBusy ? "Busy" : "Free"}`}
                                                                />
                                                                {slot.key % 6 === 0 && (
                                                                    <span className="text-[6px] text-gray-400 font-bold uppercase tracking-tighter">{slot.label}</span>
                                                                )}
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                                <p className="text-[8px] text-center text-gray-400 mt-2 italic font-medium">Synced: {new Date().toLocaleTimeString()} • 24h Grid</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Readiness Summary Card */}
                                <Card className="border-gray-100/50 dark:border-white/[0.03] bg-zinc-900 dark:bg-[#FF8A4C]/10 rounded-[2.5rem] overflow-hidden text-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShieldCheck className="w-5 h-5 text-orange-400" />
                                            <span className="text-sm font-bold uppercase tracking-wider text-orange-400">Readiness Score</span>
                                        </div>
                                        <div className="text-4xl font-bold mb-2">
                                            {readinessScore}%
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full mb-6 relative overflow-hidden">
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    width: `${readinessScore}%`
                                                }}
                                                className="absolute inset-y-0 left-0 bg-orange-500 rounded-full"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", isContactReady ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-700")} />
                                                <span>Contact: {isContactReady ? "Verified" : "Missing Info"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", status === 'REVIEW' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-700")} />
                                                <span>Strategy: {status === 'REVIEW' ? "Goal Aligned" : "Pending AI Calibration"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", isCalendarConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-700")} />
                                                <span>Logistics: {isCalendarConnected ? "Synced" : "Awaiting Connect"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                        </div>

                        {/* Latest Campaigns Section */}
                        <div id="latest-campaigns" className="mb-20 mt-12">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Latest Campaigns</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Review your past interview strategies and generated contexts.</p>
                                </div>
                                {latestCampaigns.length > 0 && hasMoreCampaigns && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleLoadMore()}
                                        disabled={isLoadingCampaigns}
                                        className="rounded-xl border-gray-200 dark:border-white/10"
                                    >
                                        {isLoadingCampaigns ? "Loading..." : "Load Older Campaigns"}
                                    </Button>
                                )}
                            </div>

                            {latestCampaigns.length === 0 && !isLoadingCampaigns ? (
                                <div className="p-12 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center text-center">
                                    <Sparkles className="w-8 h-8 text-gray-300 mb-4" />
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-1">No campaigns yet</h3>
                                    <p className="text-gray-500 text-sm">Start an interview simulation to generate your first campaign.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
                                    {latestCampaigns.map((campaign, i) => (
                                        <CampaignCard key={campaign.id || i} campaign={campaign} variant="summary" index={i} />
                                    ))}
                                </div>
                            )}

                            {isLoadingCampaigns && (
                                <div className="w-full flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <DisconnectConfirmDialog
                isOpen={isDisconnectDialogOpen}
                onClose={() => setIsDisconnectDialogOpen(false)}
                onConfirm={confirmDisconnect}
                isLoading={isDisconnecting}
            />

            <AvailabilityMagicPopup
                isOpen={isAvailabilityPopupOpen}
                onClose={() => setIsAvailabilityPopupOpen(false)}
                busySlots={calendarData?.busy_slots || []}
            />
        </div >
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border",
            variant === 'outline' ? "border-gray-200 dark:border-white/10" : "",
            className
        )}>
            {children}
        </span>
    );
}
