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
import { Plus, Shield, ShieldCheck, Lock, Eye, RefreshCw, AlertCircle, Sparkles, Search, Layers, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyDashboardState } from '@/components/dashboard-new/empty-dashboard-state';
import { useRouter } from "next/navigation";
import { syncOnboardingState } from "@/lib/api/settings";
import { useAuth } from '@/hooks/use-auth';

export default function IntegrationsPage() {
    const router = useRouter();
    const { user, companyId, loading: authLoading } = useAuth();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
        if (!companyId) return;
        try {
            if (!silent) setLoading(true);
            const data = await listIntegrations(companyId);
            setIntegrations(data);
            return data;
        } catch (error) {
            console.error("Error fetching integrations:", error);
            if (!silent) {
                toast.error("Integration Hub Unavailable", {
                    description: "We couldn't reach the command center. Try refreshing?"
                });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user && companyId) {
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

                    <div className="relative group">
                        {/* Blurred Dashboard Preview */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent z-20 pointer-events-none" />
                        <div className="relative rounded-[2.5rem] border border-gray-100 dark:border-white/[0.05] overflow-hidden shadow-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                            <div className="p-8 filter blur-[8px] opacity-40 select-none grayscale-[0.5]">
                                <div className="grid grid-cols-3 gap-6 mb-8">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-zinc-800" />
                                    ))}
                                </div>
                                <div className="h-64 rounded-2xl bg-gray-100 dark:bg-zinc-800 w-full" />
                            </div>

                            {/* Centered CTA */}
                            <div className="absolute inset-0 flex items-center justify-center z-30">
                                <Button
                                    className="bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white font-bold h-14 px-10 rounded-2xl shadow-2xl shadow-orange-500/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
                                    onClick={() => setAddDialogOpen(true)}
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Define Your Business Stack
                                </Button>
                            </div>
                        </div>
                    </div>

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
    const connectedCount = fullStack.filter(i => i.status === 'active').length;

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
        <div className="p-8 max-w-7xl mx-auto pb-24 space-y-16">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-display">Integrations</h1>
                        <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500 h-6 font-bold">
                            {connectedCount}/{fullStack.length} Active
                        </Badge>
                    </div>
                    <p className="text-gray-400 dark:text-[#71717A] text-sm">Your operational command center</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search integrations..."
                            className="pl-10 h-11 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-[#FF8A4C]/20 focus:border-[#FF8A4C]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        className="bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2"
                        onClick={() => setAddDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add Source</span>
                    </Button>
                </div>
            </div>

            {/* Compact Privacy Trust Bar */}
            <div className="flex items-center gap-4 py-2 px-5 bg-emerald-500/5 border border-emerald-500/10 rounded-full text-xs text-zinc-500 dark:text-zinc-400 w-fit">
                <div className="flex items-center gap-2 font-bold text-emerald-600 uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Privacy Promise
                </div>
                <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-4 text-[10px] font-medium">
                    <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-orange-400" /> AES-256 Encrypted</span>
                    <span className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-emerald-400" /> Read-Only Access</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-blue-400" /> SOC 2 Type II</span>
                </div>
            </div>

            {/* My Datastack Section */}

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Datastack</h2>
                    {myDatastack.length > 0 && (
                        <Badge variant="outline" className="bg-[#FF8A4C]/5 border-[#FF8A4C]/20 text-[#FF8A4C] h-6 font-bold">
                            {myDatastack.length} Tools
                        </Badge>
                    )}
                </div>

                {myDatastack.length === 0 ? (
                    <div className="mt-4">
                        <div
                            onClick={!isSyncing ? handleSetupStack : undefined}
                            className="group relative overflow-hidden rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 p-12 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-orange-500/30 dark:hover:border-orange-500/30 cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                                <Layers className="w-8 h-8 text-gray-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors duration-300" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white border-2 border-white dark:border-zinc-800">
                                    <Plus className="w-3.5 h-3.5 font-bold" />
                                </div>
                            </div>

                            <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                Start building your Datastack
                            </h3>

                            <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-8">
                                Connect your sales channels and tech stack to unify your business data.
                            </p>

                            <Button
                                variant="outline"
                                size="sm"
                                className="relative z-10 h-9 px-6 text-xs font-medium border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 transition-all border-dashed"
                                disabled={isSyncing}
                            >
                                {isSyncing ? "Loading..." : "Setup Stack"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Implemented datasources in My Datastack */}
                        {implementedStack.length > 0 && (
                            <div className="space-y-12">
                                {Object.entries(implementedCategories).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={category} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{category}</h3>
                                                <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800/50" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {items.map((integration) => (
                                                    <IntegrationCard
                                                        key={integration.id}
                                                        integration={integration}
                                                        onConnect={handleConnect}
                                                        onViewDetails={handleViewDetails}
                                                        onAdd={handleAddSource}
                                                        onRemove={handleDisconnect}
                                                        onRefresh={() => fetchIntegrations(true)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Not yet implemented datasources in My Datastack */}
                        {notImplementedStack.length > 0 && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Coming Soon</h3>
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 h-5 text-[10px] font-bold">
                                        Not Yet Implemented
                                    </Badge>
                                </div>
                                <div className="space-y-12 opacity-60">
                                    {Object.entries(notImplementedCategories).map(([category, items]) => {
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={category} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{category}</h3>
                                                    <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800/50" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                    {items.map((integration) => (
                                                        <IntegrationCard
                                                            key={integration.id}
                                                            integration={integration}
                                                            onConnect={handleConnect}
                                                            onViewDetails={handleViewDetails}
                                                        />
                                                    ))}
                                                </div>
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
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Other Datasources</h2>
                                <Badge variant="outline" className="bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 h-6 font-bold">
                                    {otherDatasources.length} Available
                                </Badge>
                            </div>
                        </div>

                        {otherDatasources.length > 0 ? (
                            <div className="space-y-12">
                                {Object.entries(otherCategories).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={category} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{category}</h3>
                                                <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800/50" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {items.map((integration) => (
                                                    <IntegrationCard
                                                        key={integration.id || integration.datasource.id}
                                                        integration={integration}
                                                        onConnect={handleConnect}
                                                        onViewDetails={handleViewDetails}
                                                        onAdd={handleAddSource}
                                                        onRemove={handleDisconnect}
                                                        onRefresh={() => fetchIntegrations(true)}
                                                    />
                                                ))}
                                            </div>
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
