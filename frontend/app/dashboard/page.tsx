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
import { useSearchParams, useRouter } from 'next/navigation';
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
import { FEATURE_FLAGS } from "@/lib/feature-flags";

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
    const router = useRouter();

    // Campaign History State
    const [latestCampaigns, setLatestCampaigns] = useState<any[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [campaignOffset, setCampaignOffset] = useState(0);
    const [hasMoreCampaigns, setHasMoreCampaigns] = useState(true);
    // Derived state for readiness - Single Source of Truth is now the LATEST CAMPAIGN or User Settings
    const latestCampaign = latestCampaigns.length > 0 ? latestCampaigns[0] : null;
    const isContactReady = !!(
        dbUser?.full_name &&
        dbUser?.contact_number &&
        dbUser?.designation &&
        dbUser?.team &&
        dbUser?.linkedin_profile
    );

    const [isSuccessSequence, setIsSuccessSequence] = useState(false); // [NEW] Explicit success flow tracking

    // Countdown State
    const [countdown, setCountdown] = useState(3);

    // Quick Glance Effect: If data is ready, ensure we move to dashboard
    useEffect(() => {
        // Guard: Only run if contact is ready
        if (!isContactReady) return;

        // CASE 1: User just completed the form (Success Sequence)
        // We want to show the glance/countdown.
        if (isSuccessSequence) {
            setCountdown(3);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setShowGlance(false); // End glance after countdown
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }

        // CASE 2: User loaded page and is ALREADY ready (Initial Load)
        // We want to skip glance immediately.
        // (Unless we decide to show a quick "Welcome Back" - but valid requirement is usually instant access)
        setShowGlance(false);

    }, [isContactReady, isSuccessSequence]); // Re-run if ready changes or if we enter success sequence

    const CAMPAIGNS_PER_PAGE = 3;

    const fetchCampaigns = async (offset = 0, append = false, limit = CAMPAIGNS_PER_PAGE, skipContactSync = false) => {
        // Guard: Wait for auth to be ready and companyId to be present
        if (isAuthLoading || !companyId) return;

        try {
            setIsLoadingCampaigns(true);
            const data = await api.get(`/intelligence/campaigns?limit=${limit}&offset=${offset}`);

            if (append) {
                setLatestCampaigns(prev => [...prev, ...data.campaigns]);
            } else {
                setLatestCampaigns(data.campaigns);

                // [NEW] Robust Prefilling Logic
                // 1. Determine Initial Contact state
                const latest = data.campaigns.length > 0 ? data.campaigns[0] : null;

                // Prefill from user profile as baseline
                const baseline = {
                    name: dbUser?.full_name || '',
                    phone: dbUser?.contact_number || '',
                    role: dbUser?.designation || '',
                    department: dbUser?.team || '',
                    linkedin: dbUser?.linkedin_profile || ''
                };

                // Override with latest user profile state
                if (!skipContactSync) {
                    setContactDetails({
                        name: baseline.name,
                        phone: baseline.phone,
                        role: baseline.role,
                        department: baseline.department,
                        linkedin: baseline.linkedin
                    });

                    if (baseline.name && baseline.phone && baseline.role && baseline.department && baseline.linkedin) {
                        setIsContactSaved(true);
                    }
                }
            }

            // Robust hasMore check: if we got exactly what we asked for, there might be more.
            // If we got less, we definitely hit the end.
            setHasMoreCampaigns(data.campaigns.length >= limit);

            // Update offset based on the actual number of items fetched or the limit requested
            // If we are appending, we move the offset forward by the number of new items
            // If we are refreshing (offset 0), we set the offset to the total count
            const newCount = data.campaigns.length;
            if (append) {
                setCampaignOffset(prev => prev + newCount);
            } else {
                setCampaignOffset(newCount);
            }

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

    // Polling for fresh campaign data
    useEffect(() => {
        if (!isAuthLoading && companyId) {
            const pollInterval = setInterval(() => {
                // Only poll if window is visible to save resources
                if (document.visibilityState === 'visible') {
                    // Fetch all currently visible campaigns to maintain "Load More" state
                    const currentCount = latestCampaigns.length;
                    const limit = currentCount > 0 ? currentCount : CAMPAIGNS_PER_PAGE;
                    fetchCampaigns(0, false, limit, true);
                }
            }, 15000); // 15 seconds

            return () => clearInterval(pollInterval);
        }
    }, [isAuthLoading, companyId, latestCampaigns.length]);

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

    const handleArchiveCampaign = async (campaignId: string) => {
        try {
            await api.post(`/intelligence/campaigns/${campaignId}/archive`, {});

            // 1. Remove from active list
            setLatestCampaigns(prev => prev.filter(c => c.id !== campaignId));

            // 2. If it was expanded, collapse it
            if (expandedCampaignId === campaignId) {
                setExpandedCampaignId(null);
            }

            toast.success("Campaign archived successfully");
        } catch (error: any) {
            console.error("[Dashboard] Failed to archive campaign:", error);
            toast.error(error.message || "Failed to archive campaign");
            throw error;
        }
    };



    // Refresh campaigns when an interview completes
    useEffect(() => {
        if (status === 'COMPLETED' && activeCampaign) {
            fetchCampaigns(0, false, latestCampaigns.length + 1);
        }
    }, [status, activeCampaign]);

    // [NEW] Auto-scroll to expanded campaign
    useEffect(() => {
        if (expandedCampaignId) {
            setTimeout(() => {
                const element = document.getElementById(`campaign-card-${expandedCampaignId}`);
                const container = document.getElementById('customer-intelligence-scroll-container');

                if (element && container) {
                    const elementTop = element.getBoundingClientRect().top;
                    const containerTop = container.getBoundingClientRect().top;
                    const scrollTop = container.scrollTop;
                    const yOffset = -20; // Top padding offset

                    container.scrollTo({ top: scrollTop + (elementTop - containerTop) + yOffset, behavior: 'smooth' });
                } else if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [expandedCampaignId]);


    // Fetch Calendar Status
    const fetchCalendarStatus = async () => {
        if (isAuthLoading || !companyId) return;

        try {
            const data = await api.get("/intelligence/calendar/status");
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
            setIsSuccessSequence(true); // [NEW] Trigger countdown sequence
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
                fetchCampaigns(0, false, latestCampaigns.length + 1);
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
                await fetchCampaigns(0, false, Math.max(latestCampaigns.length, CAMPAIGNS_PER_PAGE));
                if (activeCampaign?.id === targetId) {
                    setActiveCampaign(null);
                }
            } else {
                toast.error(error.message || "Failed to save execution window");
            }
        }
    };

    return (
        <div id="customer-intelligence-scroll-container" className="p-6 md:p-8 h-[calc(100vh-4rem)] flex flex-col overflow-y-auto scrollbar-hide">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
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
                                isSaved={isContactSaved}
                                isLoading={isSaveLoading}
                                onSave={handleSaveContact}
                                className="relative z-10 w-full"
                            />

                            {/* Redirect Countdown - Only show when successful */}
                            {isContactReady && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="relative z-10 mt-6 text-center"
                                >
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-white/50 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 inline-flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                                        Redirecting to Dashboard in <span className="text-emerald-500 font-mono text-xs">{countdown}</span>s
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full space-y-12"
                        >
                            {/* Hero Header - Minimalist & Premium */}
                            <div className="text-center space-y-3 py-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06]">
                                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intelligence Engine</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                    Customer Intelligence Lab
                                </h1>
                                <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                                    Upload your leads, and watch our AI conduct personalized discovery calls.
                                    Get deep customer insights and tailored campaign strategies—automatically.
                                </p>
                            </div>

                            {/* Main Interactive Row - Hero Panel (75%) and Quick Check (25%) */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">

                                {/* 1. CSV Upload Card - Dominant Hero (75% on desktop) */}
                                <div className="lg:col-span-3">
                                    <CsvUploadCard
                                        className="h-full min-h-[400px] shadow-sm border-gray-200/80 dark:border-white/[0.08]"
                                        onSuccess={() => {
                                            fetchCampaigns(0, false, latestCampaigns.length + 1);
                                        }}
                                        isMagicUI={FEATURE_FLAGS.IS_MAGIC_AI_ENABLED}
                                    />

                                </div>

                                {/* 2. Calendar Sync Card - Subtle Quick Check (25% on desktop) */}
                                <div className="relative group rounded-[2.5rem] overflow-hidden flex flex-col h-auto self-start">
                                    <div className="absolute inset-0 bg-white dark:bg-zinc-900/50 border border-gray-200/80 dark:border-white/[0.08] transition-all duration-200 group-hover:border-gray-300 dark:group-hover:border-white/[0.12] rounded-[2.5rem]" />

                                    <div className="relative p-6 flex flex-col h-full z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 mt-0.5">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 leading-none">Calendar Access</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0 leading-relaxed max-w-[140px]">
                                                        Sync schedule to block execution windows.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shrink-0",
                                                isCalendarConnected
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                    : "bg-gray-50 text-gray-400 border-gray-200/50 dark:bg-white/[0.03] dark:border-white/[0.06]"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", isCalendarConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                                                {isCalendarConnected ? "ACTIVE" : "OFFLINE"}
                                            </div>
                                        </div>

                                        {isLoadingInitial || isConnecting || isDisconnecting ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <MagicLoader text={isConnecting ? "Connecting..." : "Syncing..."} />
                                            </div>
                                        ) : !isCalendarConnected ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <Button
                                                    onClick={handleConnectCalendar}
                                                    className="w-full rounded-2xl h-10 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold transition-all shadow-lg"
                                                >
                                                    Connect Google
                                                    <ArrowUpRight className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col flex-1 space-y-6">
                                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Google Calendar</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={handleDisconnectCalendar}
                                                        className="w-6 h-6 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>

                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">24H Availability</span>
                                                        <button
                                                            onClick={() => setIsAvailabilityPopupOpen(true)}
                                                            className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold"
                                                        >
                                                            View Week
                                                        </button>
                                                    </div>

                                                    <div
                                                        className="grid grid-cols-8 gap-1 p-2.5 bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-gray-200/50 dark:border-white/[0.06] cursor-pointer hover:border-gray-300 dark:hover:border-white/[0.1] transition-colors"
                                                        onClick={() => setIsAvailabilityPopupOpen(true)}
                                                        title="View Full Week"
                                                    >{(() => {
                                                        const now = new Date();
                                                        const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
                                                        const slots = Array.from({ length: 18 }).map((_, i) => {
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
                                                                    "aspect-square rounded-full transition-all duration-300",
                                                                    slot.isBusy
                                                                        ? "bg-rose-500/70"
                                                                        : "bg-emerald-500/20"
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
                            </div>

                            {/* Latest Campaigns Section */}
                            <div id="latest-campaigns" className="pt-8 border-t border-gray-100 dark:border-white/[0.05]">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest campaigns</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Monitor and manage your active intelligence campaigns.</p>
                                    </div>
                                    {latestCampaigns.length > 0 && hasMoreCampaigns && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleLoadMore()}
                                            disabled={isLoadingCampaigns}
                                            className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white h-8"
                                        >
                                            {isLoadingCampaigns ? "Loading..." : "View More"}
                                        </Button>
                                    )}
                                </div>

                                {latestCampaigns.length === 0 && !isLoadingCampaigns ? (
                                    <div className="py-20 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
                                            <Sparkles className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No campaigns yet</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed">Your generated interview strategies will appear here.</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        layout
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        <AnimatePresence>
                                            {Array.from(new Map(latestCampaigns.map(c => [c.id, c])).values()).map((campaign, i) => {
                                                const isExpanded = expandedCampaignId === campaign.id;
                                                return (
                                                    <motion.div
                                                        layout
                                                        transition={{ layout: { duration: 0.5, type: "spring", stiffness: 100, damping: 20 } }}
                                                        id={`campaign-card-${campaign.id}`}
                                                        key={campaign.id || i}
                                                        className={cn(
                                                            isExpanded ? "col-span-1 md:col-span-2 lg:col-span-3 order-first" : "col-span-1"
                                                        )}
                                                    >
                                                        <CampaignCard
                                                            campaign={campaign}
                                                            variant="summary"
                                                            isExpanded={isExpanded}
                                                            onToggleExpand={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                                                            onDelete={handleDeleteCampaign}
                                                            onArchive={handleArchiveCampaign}
                                                            onEditClick={(id) => {
                                                                setEditingCampaignId(id);
                                                                setComposerView('composer');
                                                                setIsComposerOpen(true);
                                                            }}
                                                            onClick={() => !isExpanded && setExpandedCampaignId(campaign.id)}
                                                            onStartCampaign={() => {
                                                                window.location.href = `/dashboard-new/customer-intelligence/campaign/${campaign.id}`;
                                                            }}
                                                        />
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {isLoadingCampaigns && (
                                    <div className="w-full flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Goal Extraction Section (Hidden but present for functionality if toggled) */}
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
                                                        <div className="mb-12 relative flex items-center justify-center h-32 w-full">
                                                            <LiveWaveform isActive={status === 'IN_PROGRESS' || status === 'CALLING' || status === 'RINGING'} />
                                                        </div>

                                                        <div className="max-w-md">
                                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                                                {status === 'IDLE' ? "Align with AI Researcher" :
                                                                    status === 'CALLING' || status === 'RINGING' ? "Connecting with AI..." : "Extracting Strategic Goals"}
                                                            </h2>
                                                            <div className="text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
                                                                {status === 'IDLE' ? (
                                                                    <p className="text-base">
                                                                        Our AI agent will call you to extract primary goals and cohorts for your upcoming high-intent customer interviews.
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-base">
                                                                        Stay on the line. We're capturing your objectives to build the perfect interview script.
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {status === 'IDLE' && (
                                                                <Button
                                                                    onClick={handleStartInterview}
                                                                    size="lg"
                                                                    disabled={!isContactReady}
                                                                    className={cn(
                                                                        "rounded-2xl h-14 px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 transition-all font-bold text-lg",
                                                                        !isContactReady && "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    Trigger Phone Interview
                                                                    <ChevronRight className="w-5 h-5 ml-2" />
                                                                </Button>
                                                            )}
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
                                className="w-full max-w-4xl"
                            >
                                {composerView === 'leads' ? (
                                    <CsvUploadCard
                                        mode="edit"
                                        campaignId={editingCampaignId!}
                                        onLeadsUpdated={() => {
                                            fetchCampaigns(0, false, latestCampaigns.length + 1);
                                            setComposerView('composer');
                                        }}
                                        onCancel={() => setIsComposerOpen(false)}
                                        className="h-full shadow-2xl"
                                    />
                                ) : (
                                    <CampaignComposer
                                        key={`composer-${editingCampaignId}-${composerView}`}
                                        campaignId={editingCampaignId!}
                                        isMagicUI={FEATURE_FLAGS.IS_MAGIC_AI_ENABLED}
                                        onComplete={() => {
                                            fetchCampaigns(0, false, latestCampaigns.length + 1);
                                            setIsComposerOpen(false);
                                        }}
                                        onBack={() => {
                                            fetchCampaigns(0, false, Math.max(latestCampaigns.length, CAMPAIGNS_PER_PAGE));
                                            setIsComposerOpen(false);
                                        }}
                                        onEditLeads={() => setComposerView('leads')}
                                        className="h-full shadow-2xl"
                                    />
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
