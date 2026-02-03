"use client";

import React, { useEffect, useState } from 'react';
import {
    listIntegrations,
    connectIntegration,
    syncIntegration,
    disconnectIntegration,
    addManualSource,
    Integration
} from '@/lib/api/integrations';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationDetailDrawer } from '@/components/integrations/IntegrationDetailDrawer';
import { AddSourceDialog } from '@/components/integrations/AddSourceDialog';
import { ShopifySuccessModal } from '@/components/integrations/ShopifySuccessModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Shield, ShieldCheck, Lock, Eye, RefreshCw, AlertCircle, Sparkles, Search, Layers, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyDashboardState } from '@/components/dashboard-new/empty-dashboard-state';
import { useRouter } from "next/navigation";
import { syncOnboardingState } from "@/lib/api/settings";
import { useAuth } from '@/hooks/use-auth';
import { IntegrationsComingSoonState } from '@/components/integrations/IntegrationsComingSoonState';

export default function IntegrationsPage() {
    const router = useRouter();
    const { user, companyId, loading: authLoading } = useAuth();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const searchRef = React.useRef<HTMLInputElement>(null);

    const selectedIntegration = integrations.find(i => i.id === selectedIntegrationId) || null;

    const handleSetupStack = async () => {
        setIsSyncing(true);
        try {
            await syncOnboardingState();
            toast.success("Ready for edits", {
                description: "Opening the stack configuration suite."
            });
            router.push("/onboarding/basics");
        } catch (error) {
            console.error(error);
            toast.error("Couldn't open editor", {
                description: "We hit a snag preparing the onboarding suite. Try again?"
            });
        } finally {
            setIsSyncing(false);
        }
    };
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [shopifySuccessOpen, setShopifySuccessOpen] = useState(false);
    const [shopifyStoreName, setShopifyStoreName] = useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchIntegrations = async (silent = false): Promise<Integration[] | undefined> => {
        if (!companyId || companyId === 'null' || companyId === 'undefined') {
            console.warn("[Integrations] Skipping fetch: No valid companyId in context.", { companyId });
            if (!silent) setLoading(false);
            return;
        }
        try {
            if (!silent) setLoading(true);
            const data = await listIntegrations(companyId);
            setIntegrations(data);
            return data;
        } catch (error: any) {
            console.error("[Integrations] Error fetching integrations:", error);
            if (!silent) {
                const isAuthError = error.message?.toLowerCase().includes('auth') || error.message?.toLowerCase().includes('authorized');
                toast.error(isAuthError ? "Authentication Session Expired" : "Integration Hub Unavailable", {
                    description: isAuthError
                        ? "Please try logging in again to restore your session."
                        : "We couldn't reach the command center. Try refreshing?"
                });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;

        if (user && companyId) {
            fetchIntegrations().then((data) => {
                // Trigger auto-delta sync for any active integration that hasn't been synced in > 1 hour
                if (data && Array.isArray(data)) {
                    data.forEach(async (integration) => {
                        if (integration.status === 'active' || integration.status === 'ACTIVE') {
                            const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : new Date(0);
                            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

                            if (lastSync < oneHourAgo) {
                                try {
                                    console.log(`Triggering auto-delta sync for ${integration.id}`);
                                    await syncIntegration(companyId, integration.id, true);
                                    // Silent update to transition UI to syncing if backend already updated it
                                    fetchIntegrations(true);
                                } catch (e) {
                                    console.error("Auto-sync failed", e);
                                }
                            }
                        }
                    });
                }
            });
        } else {
            // User is authenticated but has no company context, or not logged in.
            // Stop loading to show Empty State / Setup rather than infinite spinner.
            setLoading(false);
        }
    }, [user, authLoading, companyId]);

    // Poll for updates if any integration is syncing
    useEffect(() => {
        const anySyncing = integrations.some(i => i.status === 'syncing');
        let interval: NodeJS.Timeout;

        if (anySyncing) {
            interval = setInterval(() => {
                fetchIntegrations(true);
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [integrations, companyId]);

    // Handle OAuth Callback Feedback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const shop = params.get('shop');
        const error = params.get('error');

        if (success === 'true') {
            setShopifyStoreName(shop || undefined);
            setShopifySuccessOpen(true);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            // Refresh integrations to show the newly connected store
            fetchIntegrations();
        } else if (error) {
            // Handle specific error cases from backend
            let errorTitle = "Connection Failed";
            let errorDescription = "There was an issue linking your Shopify store. Let's try once more?";

            switch (error) {
                case 'hmac_invalid':
                    errorTitle = "Security Verification Failed";
                    errorDescription = "The connection request couldn't be verified. This might be a security issue. Please try again.";
                    break;
                case 'state_invalid':
                    errorTitle = "Session Expired";
                    errorDescription = "Your connection session expired. Please start the connection process again.";
                    break;
                case 'handshake_failed':
                    errorTitle = "Handshake Failed";
                    errorDescription = "We couldn't complete the connection with Shopify. Please check your store settings and try again.";
                    break;
                default:
                    errorTitle = "Connection Slipped";
                    errorDescription = "There was an issue linking your Shopify store. Let's try once more?";
            }

            toast.error(errorTitle, {
                description: errorDescription,
                duration: 6000,
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleConnect = async (slug: string) => {
        if (slug.toLowerCase() === 'shopify') {
            router.push('/integrations/shopify/connect');
            return;
        }
        // Placeholder for future onboarding flow
        toast.info("Flow coming soon", {
            description: "We're currently perfecting this automated connection flow. Stay tuned!"
        });
    };

    const handleSync = async (id: string) => {
        if (!companyId) return;
        try {
            toast.loading("Refreshing Pulse", {
                description: "Recalibrating your data metrics...",
                id: 'sync'
            });
            // Optimistically update the status locally for immediate feedback
            setIntegrations(prev => prev.map(i =>
                i.id === id ? { ...i, status: 'syncing' } : i
            ));

            await syncIntegration(companyId, id);
            toast.success("Sync in Motion", {
                description: "Your dashboard will update with the latest figures shortly.",
                id: 'sync'
            });
            fetchIntegrations(true); // Always silent when triggering from detail drawer
        } catch (error) {
            toast.error("Sync hit a snag", {
                description: "We couldn't refresh the data. Try again in a minute?",
                id: 'sync'
            });
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!companyId) return;
        try {
            toast.loading("Severing Connection", {
                description: "Disconnecting source from your pulse...",
                id: 'disconnect'
            });
            await disconnectIntegration(companyId, id);
            toast.success("Connection Severed", {
                description: "This source is no longer syncing with Unclutr.",
                id: 'disconnect'
            });
            setDrawerOpen(false);
            fetchIntegrations();
        } catch (error) {
            toast.error("Disconnect Failed", {
                description: "We couldn't break the link. Try one more time?",
                id: 'disconnect'
            });
        }
    };

    const handleAddSource = async (slug: string, category: string) => {
        if (!companyId) return;
        try {
            await addManualSource(companyId, slug, category);
            toast.success("Stack Updated", {
                description: `${slug} is now part of your operational stack.`
            });
            setAddDialogOpen(false);
            fetchIntegrations();
        } catch (error) {
            toast.error("Couldn't add source", {
                description: "Try adding this tool to your stack again."
            });
        }
    };

    const handleViewDetails = (integration: Integration) => {
        setSelectedIntegrationId(integration.id);
        setDrawerOpen(true);
    };

    // Keyboard shortcut handler
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const isStackEmpty = integrations.length === 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-[#FF8A4C] animate-spin" />
                    <p className="text-sm font-medium text-gray-400 dark:text-zinc-500">Loading your operational stack...</p>
                </div>
            </div>
        );
    }

    if (isStackEmpty) {
        return (
            <div className="p-8 max-w-6xl mx-auto min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#FF8A4C]/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 w-full max-w-4xl">
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF8A4C] text-xs font-bold uppercase tracking-widest mb-4">
                            <Sparkles className="w-3.5 h-3.5" />
                            Ready for your first pulse
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                            Connect your tools, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A4C] to-orange-600">Unclutr the Magic.</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto">
                            Setup your operational stack to unlock real-time profitability tracking and automated insights.
                        </p>
                    </div>

                    <IntegrationsComingSoonState />

                    <div className="mt-16 flex flex-col items-center gap-6 opacity-60 hover:opacity-100 transition-opacity duration-700">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                            Trusted by 50+ D2C Brands
                        </div>

                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">SOC2 Type II</span>
                            <Badge variant="outline" className="h-4.5 px-1.5 text-[9px] font-bold border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400 tracking-wide uppercase shadow-none ml-1">
                                Coming Soon
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Split integrations correctly:
    // 1. My Datastack = in_stack (from company.stack_summary/channels_summary)
    // 2. Other Datasources = NOT in_stack AND is_implemented == true
    const filteredIntegrations = integrations.filter(i =>
        i.datasource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.datasource.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Split filtered filteredIntegrations
    const myDatastack = filteredIntegrations.filter(i => i.in_stack);
    const otherDatasources = filteredIntegrations.filter(i => !i.in_stack && i.datasource.is_implemented);

    // Active count should be based on TOTAL stack, not filtered stack (metrics shouldn't change on search)
    // But user wants "Quick Grasp". If I filter, maybe I want to see count of filtered?
    // Let's keep Active Count based on FULL stack for stability.
    const fullStack = integrations.filter(i => i.in_stack);
    const connectedCount = fullStack.filter(i => {
        const status = (i.status || '').toLowerCase();
        return ['active', 'syncing', 'error'].includes(status);
    }).length;

    // Further split My Datastack by implementation status
    const implementedStack = myDatastack.filter(i => i.datasource.is_implemented);
    const notImplementedStack = myDatastack.filter(i => !i.datasource.is_implemented);

    // Category mapping helper
    const categorizeByType = (items: Integration[]) => ({
        'Storefront (D2C)': items.filter(i => i.datasource.category === 'selling_channel_d2c' || i.datasource.category === 'Storefront'),
        'Marketplace': items.filter(i => i.datasource.category === 'selling_channel_marketplace' || i.datasource.category === 'Marketplace'),
        'Quick Commerce': items.filter(i => i.datasource.category === 'selling_channel_qcom' || i.datasource.category === 'QuickCommerce'),
        'Payments': items.filter(i => i.datasource.category === 'stack_payments' || i.datasource.category === 'Payment'),
        'Logistics': items.filter(i => i.datasource.category === 'stack_shipping' || i.datasource.category === 'Logistics'),
        'Marketing': items.filter(i => i.datasource.category === 'stack_marketing' || i.datasource.category === 'Marketing'),
        'Analytics & CRM': items.filter(i => i.datasource.category === 'stack_analytics' || i.datasource.category === 'Analytics'),
        'Accounting': items.filter(i => i.datasource.category === 'stack_finance' || i.datasource.category === 'Accounting'),
    });

    const implementedCategories = categorizeByType(implementedStack);
    const notImplementedCategories = categorizeByType(notImplementedStack);
    const otherCategories = categorizeByType(otherDatasources);

    return (
        <div className="p-4 sm:p-8 max-w-[1920px] mx-auto pb-24 space-y-12">
            {/* Header Section - Modern & Floating */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 relative z-10">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-display">Toolkit</h1>
                        <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500 h-6 font-bold px-2.5 rounded-lg">
                            {connectedCount} Active
                        </Badge>
                    </div>
                    <p className="text-gray-500 dark:text-[#71717A] text-sm max-w-md leading-relaxed">
                        Manage your connected apps and integrations.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#FF8A4C] transition-colors" />
                        </div>
                        <Input
                            ref={searchRef}
                            placeholder="Find an app..."
                            className="pl-10 pr-12 h-11 bg-white/40 dark:bg-black/20 backdrop-blur-md border-gray-200/50 dark:border-white/5 rounded-xl focus:ring-4 focus:ring-[#FF8A4C]/10 focus:border-[#FF8A4C]/50 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <AnimatePresence>
                                {searchQuery && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => setSearchQuery('')}
                                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-zinc-500 opacity-100 group-focus-within:opacity-0 transition-opacity">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            className="bg-gradient-to-br from-[#FF8A4C] to-[#F97316] hover:from-[#ff9e6b] hover:to-[#fb923c] text-white font-bold h-11 px-6 rounded-xl shadow-[0_8px_16px_-6px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_20px_-8px_rgba(249,115,22,0.4)] transition-all flex items-center gap-2 border-0"
                            onClick={() => setAddDialogOpen(true)}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden md:inline">Add Source</span>
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* My Datastack Section */}
            <div className="space-y-8">


                {myDatastack.length === 0 ? (
                    <div className="mt-4">
                        <div
                            onClick={!isSyncing ? handleSetupStack : undefined}
                            className="group relative overflow-hidden rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30 p-12 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-orange-500/30 dark:hover:border-orange-500/30 cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out">
                                <Layers className="w-8 h-8 text-gray-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors duration-300" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white border-2 border-white dark:border-zinc-800 shadow-sm">
                                    <Plus className="w-3.5 h-3.5 font-bold" />
                                </div>
                            </div>

                            <h3 className="relative z-10 text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                Start building your Toolkit
                            </h3>

                            <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-8">
                                Connect your sales channels and tech stack to unify your business data.
                            </p>

                            <Button
                                variant="outline"
                                size="sm"
                                className="relative z-10 h-10 px-6 text-xs font-bold border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 transition-all border-dashed rounded-xl"
                                disabled={isSyncing}
                            >
                                {isSyncing ? "Loading..." : "Setup Stack"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Implemented datasources in My Datastack */}
                        {implementedStack.length > 0 && (
                            <div className="space-y-10">
                                {Object.entries(implementedCategories).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={category} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                                                <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{category}</h3>
                                            </div>
                                            <motion.div
                                                layout
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                                            >
                                                <AnimatePresence mode="popLayout">
                                                    {items.map((integration) => (
                                                        <motion.div
                                                            key={integration.id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <IntegrationCard
                                                                integration={integration}
                                                                onConnect={handleConnect}
                                                                onViewDetails={handleViewDetails}
                                                                onAdd={handleAddSource}
                                                                onRemove={handleDisconnect}
                                                                onRefresh={() => fetchIntegrations(true)}
                                                                onSync={handleSync}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Not yet implemented datasources in My Datastack */}
                        {notImplementedStack.length > 0 && (
                            <div className="space-y-8 pt-8 border-t border-dashed border-gray-200 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400">Coming Soon</h3>
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 h-5 text-[10px] font-bold rounded-md">
                                        Not Yet Implemented
                                    </Badge>
                                </div>
                                <div className="space-y-10 opacity-75 grayscale-[0.5] hover:grayscale-0 transition-all duration-500">
                                    {Object.entries(notImplementedCategories).map(([category, items]) => {
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={category} className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-1">{category}</h3>
                                                <motion.div
                                                    layout
                                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                                                >
                                                    <AnimatePresence mode="popLayout">
                                                        {items.map((integration) => (
                                                            <motion.div
                                                                key={integration.id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <IntegrationCard
                                                                    integration={integration}
                                                                    onConnect={handleConnect}
                                                                    onViewDetails={handleViewDetails}
                                                                />
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Other Datasources Section */}
            {
                otherDatasources.length > 0 && (
                    <div className="space-y-8 pt-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-zinc-800/50">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Available Integrations</h2>
                            <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 h-6 font-bold px-2 rounded-lg">
                                {otherDatasources.length}
                            </Badge>
                        </div>

                        {otherDatasources.length > 0 ? (
                            <div className="space-y-10">
                                {Object.entries(otherCategories).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={category} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{category}</h3>
                                            </div>
                                            <motion.div
                                                layout
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                                            >
                                                <AnimatePresence mode="popLayout">
                                                    {items.map((integration) => (
                                                        <motion.div
                                                            key={integration.id || (integration.datasource && integration.datasource.id)}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <IntegrationCard
                                                                integration={integration}
                                                                onConnect={handleConnect}
                                                                onViewDetails={handleViewDetails}
                                                                onAdd={handleAddSource}
                                                                onRemove={handleDisconnect}
                                                                onRefresh={() => fetchIntegrations(true)}
                                                                onSync={handleSync}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                <Search className="w-8 h-8 text-gray-300 dark:text-zinc-600 mb-2" />
                                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No integrations found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                )
            }

            {
                searchQuery && filteredIntegrations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
                        <Search className="w-12 h-12 text-gray-200 dark:text-zinc-800 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No matches found</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            We couldn't find any integration matching "{searchQuery}"
                        </p>
                        <Button
                            variant="link"
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-[#FF8A4C]"
                        >
                            Clear Search
                        </Button>
                    </div>
                )
            }

            <IntegrationDetailDrawer
                integration={selectedIntegration}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onSync={handleSync}
                onDisconnect={handleDisconnect}
                onConnect={handleConnect}
                onRefresh={() => fetchIntegrations(true)}
            />

            <AddSourceDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onAdd={handleAddSource}
            />

            <ShopifySuccessModal
                isOpen={shopifySuccessOpen}
                onClose={() => {
                    setShopifySuccessOpen(false);
                    fetchIntegrations(); // Refresh integrations after success
                }}
                shopName={shopifyStoreName}
            />
        </div >
    );
}
