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
    Phone,
    Loader2
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CsvUploadCard } from "@/components/customer-intelligence/CsvUploadCard";
import { CampaignComposer } from "@/components/customer-intelligence/CampaignComposer";

import { useAuth } from "@/context/auth-context"; // [NEW]

// Types for Mock State
type ExtractionStatus = 'IDLE' | 'CALLING' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW' | 'ERROR';

export default function CustomerIntelligencePage() {
    const { loading: isAuthLoading, companyId, dbUser, refreshAuth } = useAuth(); // [NEW] Using context to prevent race conditions
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
    const [contactDetails, setContactDetails] = useState({ name: '', phone: '', linkedin: '', role: '', department: '' }); // [NEW]
    const [isContactSaved, setIsContactSaved] = useState(false); // [NEW]
    const [isSaveLoading, setIsSaveLoading] = useState(false); // [NEW] Loading state for contact save
    const [isLoadingUser, setIsLoadingUser] = useState(true); // [NEW]
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
    const [composerView, setComposerView] = useState<'composer' | 'leads'>('composer');
    const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null); // [NEW] Track expanded card
    const [showGlance, setShowGlance] = useState(true); // [NEW] Start true to prevent flash
    const [glanceStarted, setGlanceStarted] = useState(false); // [NEW] Prevent re-triggering glance
    const searchParams = useSearchParams();

    // Campaign History State
    const [latestCampaigns, setLatestCampaigns] = useState<any[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [campaignOffset, setCampaignOffset] = useState(0);
    const [hasMoreCampaigns, setHasMoreCampaigns] = useState(true);
    // Derived state for readiness - Single Source of Truth is now the LATEST CAMPAIGN or User Settings
    const latestCampaign = latestCampaigns.length > 0 ? latestCampaigns[0] : null;
    const isContactReady = !!(
        (latestCampaign && latestCampaign.phone_number && latestCampaign.team_member_role && latestCampaign.team_member_department) ||
        (dbUser?.settings?.intelligence_unlocked)
    );

    // Quick Glance Effect: If data is ready, ensure we move to dashboard
    useEffect(() => {
        if (isContactReady) {
            // [NEW] If already unlocked in settings AND not a fresh save in this session, skip glance entirely
            if (dbUser?.settings?.intelligence_unlocked && !isContactSaved) {
                setShowGlance(false);
                return;
            }

            // Fresh save OR first time seeing it: show for 1.5s as a "Success Screen"
            const timer = setTimeout(() => {
                setShowGlance(false);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isContactReady, dbUser?.settings?.intelligence_unlocked, isContactSaved]);

    const CAMPAIGNS_PER_PAGE = 3;

    const fetchCampaigns = async (offset = 0, append = false) => {
        // Guard: Wait for auth to be ready and companyId to be present
        if (isAuthLoading || !companyId) return;

        try {
            setIsLoadingCampaigns(true);
            const data = await api.get(`/intelligence/campaigns?limit=${CAMPAIGNS_PER_PAGE}&offset=${offset}`);

            if (append) {
                setLatestCampaigns(prev => [...prev, ...data.campaigns]);
            } else {
                setLatestCampaigns(data.campaigns);
                // Sync local contact state with latest campaign if available
                if (data.campaigns.length > 0) {
                    const latest = data.campaigns[0];
                    setContactDetails({
                        name: dbUser?.full_name || '', // Always use user's full_name from dbUser
                        phone: latest.phone_number || '',
                        role: latest.team_member_role || '',
                        department: latest.team_member_department || '',
                        linkedin: dbUser?.linkedin_profile || '' // Also prefill linkedin from user profile
                    });

                    if (latest.phone_number && latest.team_member_role && latest.team_member_department) {
                        setIsContactSaved(true);
                    }
                } else if (dbUser) {
                    // Prefill from User Profile if no campaigns exist
                    setContactDetails({
                        name: dbUser.full_name || '',
                        phone: dbUser.contact_number || '',
                        role: dbUser.designation || '',
                        department: dbUser.team || '',
                        linkedin: dbUser.linkedin_profile || ''
                    });
                }
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
            setIsLoadingUser(false); // Treat user loading as done when campaigns are loaded
        }
    };

    // Initial load of campaigns - Depends on Auth
    useEffect(() => {
        if (!isAuthLoading && companyId) {
            fetchCampaigns();
        }
    }, [isAuthLoading, companyId]);

    const handleLoadMore = () => {
        fetchCampaigns(campaignOffset, true);
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        try {
            await api.delete(`/intelligence/campaigns/${campaignId}`);
            // Remove from local state after successful deletion
            setLatestCampaigns(prev => prev.filter(c => c.id !== campaignId));
            toast.success("Campaign deleted successfully");
        } catch (error: any) {
            console.error("Failed to delete campaign:", error);
            toast.error(error.message || "Failed to delete campaign");
            throw error; // Re-throw so CampaignCard can handle loading state
        }
    };



    // Refresh campaigns when an interview completes
    useEffect(() => {
        if (status === 'COMPLETED' && activeCampaign) {
            fetchCampaigns(0, false);
        }
    }, [status, activeCampaign]);


    // Fetch Calendar Status
    const fetchCalendarStatus = async () => {
        if (isAuthLoading || !companyId) return;

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

    // Replace fetchUserProfile with a simpler check if needed, or rely on campaigns
    // We can keep it to pre-fill the form if campaign is missing?
    // Let's rely purely on campaigns for the "Blocking" state to be consistent.

    useEffect(() => {
        if (!isAuthLoading && companyId) {
            fetchCalendarStatus();
            // fetchUserProfile(); // Removed in favor of campaign source of truth
        }
    }, [isAuthLoading, companyId]);

    // Polling also needs to respect the guard, but simpler to just let it call the safe function
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isAuthLoading && companyId) {
                fetchCalendarStatus();
            }
        }, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [isAuthLoading, companyId]);

    // If redirected back from Google, refresh status
    useEffect(() => {
        if (searchParams?.get('calendar_connected') === 'true' && !isAuthLoading && companyId) {
            fetchCalendarStatus();
        }
    }, [searchParams, isAuthLoading, companyId]);

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

    const handleContactChange = (field: 'name' | 'phone' | 'linkedin' | 'role' | 'department', value: string) => {
        setContactDetails(prev => ({ ...prev, [field]: value }));
    };

    const [originalContactDetails, setOriginalContactDetails] = useState({ name: '', phone: '', linkedin: '', role: '', department: '' });

    const handleSaveContact = async (shouldSave: boolean = true) => {
        // If switched to edit mode (shouldSave=false), just update state
        if (shouldSave === false) {
            setIsContactSaved(false);
            return;
        }

        // Validate before saving is done inside component now mostly, but good to have safety
        if (!contactDetails.name.trim() || contactDetails.role.trim().length < 2 || contactDetails.department.trim().length < 2) {
            // Basic fail safe, though UI handles it
            setIsContactSaved(false);
            return;
        }

        try {
            setIsSaveLoading(true);
            // New Endpoint: Save to Campaign Onboarding
            const response = await api.post('/intelligence/campaigns/onboarding', {
                name: contactDetails.name,
                phone_number: contactDetails.phone,
                linkedin: contactDetails.linkedin,
                team_member_role: contactDetails.role,
                team_member_department: contactDetails.department
            });

            // Success!
            setIsContactSaved(true);
            setOriginalContactDetails({ ...contactDetails });
            toast.success("Identity Verified. Customer Intelligence Unlocked.");

            // [NEW] Refresh auth context to update user profile everywhere
            try {
                await refreshAuth();
            } catch (refreshErr) {
                console.warn("Failed to refresh auth after contact save:", refreshErr);
            }

            // Refresh campaigns to update the view immediately
            // Small delay to allow animation to play out?
            setTimeout(() => {
                fetchCampaigns(0, false);
            }, 1000);

        } catch (error: any) {
            console.error("Failed to save contact details:", error);

            // Reset the saved state to allow retry
            setIsContactSaved(false);

            // Show detailed error message if available
            const errorMessage = error?.message || error?.data?.detail || "Failed to save contact details. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSaveLoading(false);
        }
    };

    const handleCancelEdit = () => {
        // Restore original values
        setContactDetails({ ...originalContactDetails });
    };

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


    const handleSaveWindow = async (window: { day: string; start: string; end: string }) => {
        // If no active campaign, we can't save. Ideally we should have one active or create one.
        // For now, let's assume activeCampaign or use latestCampaigns[0] if available?
        // Or create a new one?
        // Requirement: "save that slot in campaigns table properly"
        // Let's rely on activeCampaign state, or find the latest one.
        let targetId = activeCampaign?.id;

        if (!targetId && latestCampaigns.length > 0) {
            targetId = latestCampaigns[0].id; // Fallback to latest
        }

        if (!targetId) {
            toast.error("No active campaign found. Please start a campaign first.");
            return;
        }

        try {
            await api.post(`/intelligence/campaigns/${targetId}/windows`, window);
            toast.success("Execution window blocked & synced to calendar!");

            // Refresh campaign to update UI
            const updated = await api.get(`/intelligence/campaigns/${targetId}`);
            setActiveCampaign(updated);

            // Optionally refresh calendar availability
            fetchCalendarStatus();
        } catch (error: any) {
            console.error("Failed to save window:", error);

            // Handle 404 specifically - Campaign might have been deleted elsewhere
            if (error.response?.status === 404 || error.status === 404 || (error.message && error.message.includes("not found"))) {
                toast.error("Campaign not found. Refreshing your list...");
                // Refresh list and clear stale state
                await fetchCampaigns(0, false);
                if (activeCampaign?.id === targetId) {
                    setActiveCampaign(null);
                }
            } else {
                toast.error(error.message || "Failed to save execution window");
            }
        }
    };

    return (
        <div className="p-6 md:p-8 h-[calc(100vh-4rem)] flex flex-col overflow-y-auto scrollbar-hide">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                {/* Header Section - Only show when not in blocking state */}
                {(isLoadingUser || isContactReady) && (
                    <div className="flex flex-col gap-3 mb-12">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-sans">
                                Customer Intelligence Lab
                            </h1>
                            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
                                Transform your outreach with AI-powered customer insights. Upload your leads, let our AI conduct discovery calls, and receive personalized campaign strategies tailored to each prospect.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                SYSTEM ONLINE
                            </span>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {isLoadingUser ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex items-center justify-center min-h-[400px]"
                        >
                            <MagicLoader text="Establishing Secure Connection..." />
                        </motion.div>
                    ) : (!isContactReady || showGlance) ? (
                        // BLOCKING STATE: Contact Details Required OR Quick Glance
                        <motion.div
                            key="verification"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            onClick={() => setShowGlance(false)} // Allow click to dismiss
                            className="flex-1 relative flex flex-col items-center justify-center max-w-lg mx-auto w-full min-h-[60vh] cursor-pointer"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-orange-500/10 via-transparent to-transparent blur-[120px] pointer-events-none transition-opacity duration-1000" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-emerald-500/5 via-transparent to-transparent blur-[80px] pointer-events-none transition-opacity duration-1000" />

                            <div className="relative z-10 text-center mb-8 space-y-4">
                                <motion.div
                                    initial={{ y: 0 }}
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                    className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-black text-gray-900 dark:text-white shadow-2xl shadow-orange-500/20 mb-6 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-white/10 relative"
                                >
                                    {/* Light mode inner glow */}
                                    <div className="absolute inset-0 bg-white/40 dark:bg-white/5 rounded-[2.5rem] animate-pulse" />
                                    <ShieldCheck className="w-10 h-10 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] relative z-10" />
                                </motion.div>
                                <div>
                                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:to-gray-400 tracking-tighter mb-2">
                                        Identity Verification
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-md mx-auto font-medium">
                                        Before granting access to the Intelligence Engine, please verify your identity and operational role.
                                    </p>
                                </div>
                            </div>

                            <ContactDetailsCard
                                contactDetails={contactDetails}
                                onChange={handleContactChange}
                                isSaved={isContactSaved || !!dbUser?.settings?.intelligence_unlocked}
                                isLoading={isSaveLoading}
                                onSave={handleSaveContact}
                                className="relative z-10 w-full"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full"
                        >
                            {/* Bento Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                {/* 1. CSV Upload Mega-Card (Left 3/4) */}
                                <CsvUploadCard
                                    className="lg:col-span-9"
                                    onSuccess={() => fetchCampaigns(0, false)}
                                />

                                {/* 2. Right Column (Calendar & Readiness) */}
                                <div className="lg:col-span-3 space-y-4 flex flex-col">

                                    {/* Calendar Sync Card */}
                                    <div className="relative group rounded-[2.5rem] overflow-hidden">
                                        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 transition-all duration-300 group-hover:bg-white/70 dark:group-hover:bg-black/50" />

                                        <div className="relative p-6 flex flex-col h-full z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5",
                                                    isCalendarConnected
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                                        : "bg-zinc-100/50 text-zinc-400 border-zinc-200/50 dark:bg-white/5 dark:border-white/5"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isCalendarConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                                                    {isCalendarConnected ? "SYNC ACTIVE" : "OFFLINE"}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Calendar Access</h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-medium leading-relaxed">
                                                Sync your schedule to automatically block execution windows.
                                            </p>

                                            {isLoadingInitial || isConnecting || isDisconnecting ? (
                                                <div className="flex-1 flex items-center justify-center py-8">
                                                    <MagicLoader text={isConnecting ? "Connecting..." : "Syncing..."} />
                                                </div>
                                            ) : !isCalendarConnected ? (
                                                <Button
                                                    onClick={handleConnectCalendar}
                                                    className="w-full rounded-2xl h-11 bg-zinc-900 dark:bg-white/10 hover:bg-zinc-800 dark:hover:bg-white/20 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                                                >
                                                    Connect Google Calendar
                                                    <ArrowUpRight className="w-4 h-4 ml-2 opacity-60" />
                                                </Button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Google Calendar</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={handleDisconnectCalendar}
                                                            className="w-6 h-6 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
                                                            title="Disconnect"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>

                                                    <div className="relative">
                                                        {/* Label */}
                                                        <div className="flex items-center justify-between mb-2 px-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">24H Availability</span>
                                                        </div>

                                                        {/* Heatmap Grid */}
                                                        <div
                                                            className="grid grid-cols-8 gap-1.5 p-3 bg-white/50 dark:bg-black/20 rounded-[1.5rem] border border-zinc-100 dark:border-white/5 cursor-pointer hover:border-indigo-500/20 transition-colors"
                                                            onClick={() => setIsAvailabilityPopupOpen(true)}
                                                            title="View Full Week"
                                                        >
                                                            {(() => {
                                                                const now = new Date();
                                                                const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
                                                                // Show next 24 hours (first 16 for cleaner grid? 2 rows of 8)
                                                                // Let's do 16 slots for cleaner visual in the small card
                                                                const slots = Array.from({ length: 16 }).map((_, i) => {
                                                                    const start = new Date(startOfHour.getTime() + i * 1 * 60 * 60 * 1000);
                                                                    const end = new Date(startOfHour.getTime() + (i + 1) * 1 * 60 * 60 * 1000);
                                                                    const isBusy = (calendarData?.busy_slots || []).some((slot: any) => {
                                                                        const s = new Date(slot.start).getTime();
                                                                        const e = new Date(slot.end).getTime();
                                                                        return (s < end.getTime() && e > start.getTime());
                                                                    });
                                                                    return { isBusy, key: i };
                                                                });

                                                                return slots.map(slot => (
                                                                    <div
                                                                        key={slot.key}
                                                                        className={cn(
                                                                            "aspect-square rounded-full transition-all duration-500",
                                                                            slot.isBusy
                                                                                ? "bg-rose-500/80 shadow-sm shadow-rose-500/20"
                                                                                : "bg-emerald-500/20 scale-75"
                                                                        )}
                                                                    />
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Minimalist Animation Card */}
                                    <div className="relative group rounded-[2.5rem] overflow-hidden min-h-[400px]">
                                        {/* Transparent Background */}
                                        <div className="absolute inset-0 bg-transparent transition-all duration-300" />

                                        {/* Floating Orbs Animation - Ambient Projection */}
                                        <div className="relative p-6 flex flex-col h-full z-10">
                                            {/* Subtle background tint for visibility/separation */}
                                            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] bg-zinc-50/30 dark:bg-zinc-900/20">
                                                {/* Orb 1 - Orange (Subtle & Flowing) */}
                                                <motion.div
                                                    animate={{
                                                        x: [0, 80, -40, 0],
                                                        y: [0, -60, 40, 0],
                                                        scale: [1, 1.2, 0.9, 1],
                                                        opacity: [0.2, 0.35, 0.2],
                                                    }}
                                                    transition={{
                                                        duration: 20,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="absolute top-1/4 left-1/4 w-40 h-40 bg-orange-500/25 rounded-full blur-[60px]"
                                                />

                                                {/* Orb 2 - Emerald (Balancing) */}
                                                <motion.div
                                                    animate={{
                                                        x: [0, -70, 30, 0],
                                                        y: [0, 80, -20, 0],
                                                        scale: [1, 1.3, 0.95, 1],
                                                        opacity: [0.15, 0.3, 0.15],
                                                    }}
                                                    transition={{
                                                        duration: 22,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                        delay: 2,
                                                    }}
                                                    className="absolute top-1/2 right-1/4 w-48 h-48 bg-emerald-500/20 rounded-full blur-[70px]"
                                                />

                                                {/* Orb 3 - Indigo (Deep Ambient) */}
                                                <motion.div
                                                    animate={{
                                                        x: [0, 50, -30, 0],
                                                        y: [0, -50, 30, 0],
                                                        scale: [1, 1.15, 1.05, 1],
                                                        opacity: [0.12, 0.25, 0.12],
                                                    }}
                                                    transition={{
                                                        duration: 25,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                        delay: 4,
                                                    }}
                                                    className="absolute bottom-1/4 left-1/3 w-44 h-44 bg-indigo-500/15 rounded-full blur-[65px]"
                                                />

                                                {/* Floating Dust Particles - Noticeworthy Detail */}
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{
                                                            y: [0, -100, 0],
                                                            x: [0, (i % 2 === 0 ? 15 : -15), 0],
                                                            opacity: [0.2, 0.6, 0.2],
                                                            scale: [1, 1.2, 1],
                                                        }}
                                                        transition={{
                                                            duration: 12 + i * 1,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                            delay: i * 0.8,
                                                        }}
                                                        className="absolute w-1 h-1 bg-zinc-600/40 dark:bg-white/30 rounded-full"
                                                        style={{
                                                            left: `${15 + (i * 7)}%`,
                                                            top: `${20 + (i % 4) * 20}%`,
                                                        }}
                                                    />
                                                ))}

                                                {/* Thin Geometric Rings - Elegant Structure */}
                                                <motion.div
                                                    animate={{
                                                        rotate: [0, 360],
                                                        opacity: [0.15, 0.3, 0.15],
                                                    }}
                                                    transition={{
                                                        duration: 40,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[1px] border-orange-500/15 dark:border-white/10 rounded-full"
                                                />
                                                <motion.div
                                                    animate={{
                                                        rotate: [360, 0],
                                                        opacity: [0.15, 0.3, 0.15],
                                                    }}
                                                    transition={{
                                                        duration: 45,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-[1px] border-emerald-500/15 dark:border-white/10 rounded-full border-dashed"
                                                />

                                                {/* Very Subtle Gradient Wash */}
                                                <motion.div
                                                    animate={{
                                                        opacity: [0.15, 0.3, 0.15],
                                                    }}
                                                    transition={{
                                                        duration: 10,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent"
                                                />
                                            </div>

                                            {/* Central Focal Point - Minimalist */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                {/* Ambient Glow */}
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.1, 1],
                                                        opacity: [0.1, 0.25, 0.1],
                                                    }}
                                                    transition={{
                                                        duration: 8,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="w-56 h-56 bg-gradient-radial from-orange-400/15 to-transparent rounded-full blur-2xl"
                                                />

                                                {/* Geometric Core */}
                                                <motion.div
                                                    animate={{
                                                        rotate: [0, 45, 0, -45, 0],
                                                        opacity: [0.3, 0.6, 0.3],
                                                    }}
                                                    transition={{
                                                        duration: 20,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="w-12 h-12 border border-white/20 dark:border-white/10 rounded-xl transform rotate-45"
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                        {latestCampaigns.map((campaign, i) => {
                                            const isExpanded = expandedCampaignId === campaign.id;
                                            return (
                                                <div
                                                    key={campaign.id || i}
                                                    className={cn(
                                                        "transition-all duration-500 ease-in-out",
                                                        isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3" : "col-span-1"
                                                    )}
                                                >
                                                    <CampaignCard
                                                        campaign={campaign}
                                                        variant="summary"
                                                        isExpanded={isExpanded}
                                                        onToggleExpand={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                                                        onDelete={handleDeleteCampaign}
                                                        onEditClick={(id) => {
                                                            setEditingCampaignId(id);
                                                            setComposerView('composer');
                                                            setIsComposerOpen(true);
                                                        }}
                                                        onClick={() => !isExpanded && setExpandedCampaignId(campaign.id)}
                                                        onStartCampaign={() => {
                                                            setEditingCampaignId(null);
                                                            setComposerView('composer');
                                                            setIsComposerOpen(true);
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {isLoadingCampaigns && (
                                    <div className="w-full flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Goal Extraction Section (Moved) - HIDDEN */}
                            {false && (
                                <div id="ai-alignment-section" className="mt-20 border-t border-gray-100/50 dark:border-white/[0.03] pt-20">
                                    <div className="flex flex-col gap-0.5 mb-10">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">AI Goal Alignment</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Align with our AI researcher to tune your interview strategy.</p>
                                    </div>

                                    <Card className="overflow-hidden border-gray-100/50 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] backdrop-blur-md rounded-[2.5rem] relative group min-h-[550px] max-w-4xl">
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
                                                                        <ContactDetailsInline
                                                                            contactDetails={contactDetails}
                                                                            onChange={handleContactChange}
                                                                            onSave={() => handleSaveContact(true)}
                                                                            onCancel={handleCancelEdit}
                                                                            className="justify-center py-2"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <p className="text-base">
                                                                        Stay on the line. We're capturing your objectives to build the perfect interview script.
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {status === 'IDLE' ? (
                                                                <>
                                                                    <Button
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
                                                                    </Button>
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
                                                            // Scroll to campaigns list with enhanced behavior
                                                            setStatus('IDLE');

                                                            // Small delay to ensure DOM updates complete
                                                            setTimeout(() => {
                                                                const campaignsList = document.getElementById('latest-campaigns');
                                                                if (campaignsList) {
                                                                    // Scroll with offset for better visibility
                                                                    const yOffset = -80; // Offset from top for better visibility
                                                                    const y = campaignsList.getBoundingClientRect().top + window.pageYOffset + yOffset;

                                                                    window.scrollTo({
                                                                        top: y,
                                                                        behavior: 'smooth'
                                                                    });
                                                                }
                                                            }, 100);
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
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
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
                activeCampaign={activeCampaign || (latestCampaigns.length > 0 ? latestCampaigns[0] : null)}
                onSaveWindow={handleSaveWindow}
            />

            <AnimatePresence>
                {isComposerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-5xl"
                        >
                            {composerView === 'leads' ? (
                                <CsvUploadCard
                                    mode="edit"
                                    campaignId={editingCampaignId!}
                                    onLeadsUpdated={() => {
                                        fetchCampaigns(0, false);
                                        setComposerView('composer');
                                    }}
                                    onCancel={() => setIsComposerOpen(false)}
                                    className="h-full shadow-2xl"
                                />
                            ) : (
                                <CampaignComposer
                                    campaignId={editingCampaignId!}
                                    onComplete={() => setIsComposerOpen(false)}
                                    onBack={() => setIsComposerOpen(false)}
                                    onEditLeads={() => setComposerView('leads')}
                                    className="h-full shadow-2xl"
                                />
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}


