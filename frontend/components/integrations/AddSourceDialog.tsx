"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Search, Check, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Datasource {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    website_url?: string | null;
    category: string;
    description: string | null;
    is_implemented: boolean;
    is_coming_soon: boolean;
}

const getSafeLogoUrl = (datasource: Datasource): string | null => {
    if (!datasource.logo_url) return null;

    // valid local or existing good url
    if (datasource.logo_url.startsWith('/') || datasource.logo_url.startsWith('logos/')) {
        return datasource.logo_url;
    }

    // specific fix for clearbit failing
    if (datasource.logo_url.includes('logo.clearbit.com')) {
        // Try to construct a better one if we have a website, or just return it and let onError handle it (but onError is flaky for this specific error sometimes)
        if (datasource.website_url) {
            try {
                const domain = new URL(datasource.website_url).hostname.replace('www.', '');
                return `https://cdn.brandfetch.io/${domain}/symbol.svg?c=1id0mlmgxmrC1sPyh2v`;
            } catch (e) {
                // invalid url, fall through
            }
        }
    }

    return datasource.logo_url;
};

interface AddSourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (slug: string, category: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
    'selling_channel_d2c': 'Storefront (D2C)',
    'selling_channel_marketplace': 'Marketplace',
    'selling_channel_qcom': 'Quick Commerce',
    'stack_payments': 'Payments',
    'stack_shipping': 'Logistics',
    'stack_marketing': 'Marketing',
    'stack_analytics': 'Analytics & CRM',
    'stack_finance': 'Accounting',
};

export const AddSourceDialog: React.FC<AddSourceDialogProps> = ({
    open,
    onOpenChange,
    onAdd,
}) => {
    const { companyId } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [datasources, setDatasources] = useState<Record<string, Datasource[]>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(new Set());
    const [showCloseAlert, setShowCloseAlert] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && companyId) {
            fetchDatasources();
        }
    }, [open, companyId]);

    const fetchDatasources = async () => {
        try {
            setLoading(true);

            // Get auth token
            const user = (await import('@/lib/firebase')).auth.currentUser;
            if (!user) {
                toast.error('Sign-in Required', {
                    description: 'Please log in to continue configuring your business stack.'
                });
                return;
            }
            const token = await user.getIdToken();

            // Fetch all datasources
            console.log('[AddSourceDialog] Fetching datasources from /api/v1/datasources/all');
            const response = await fetch('/api/v1/datasources/all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Company-ID': companyId!,
                },
            });

            console.log('[AddSourceDialog] Datasources response status:', response.status, response.statusText);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[AddSourceDialog] Datasources fetch failed:', errorText);
                throw new Error('Failed to fetch datasources');
            }
            const categorized = await response.json();
            console.log('[AddSourceDialog] Datasources received:', categorized);
            setDatasources(categorized);

            // Fetch company to get current stack
            const companyResponse = await fetch(`/api/v1/company/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Company-ID': companyId!,
                },
            });

            if (companyResponse.ok) {
                const company = await companyResponse.json();
                console.log('[AddSourceDialog] Company data:', company);

                let stackData = company.stack_data;
                let channelsData = company.channels_data;

                // FALLBACK: If company stack is empty, try pulling from onboarding state
                const isStackEmpty = !stackData || (Object.keys(stackData.stack || {}).length === 0 && (stackData.selectedTools || []).length === 0);
                const isChannelsEmpty = !channelsData || (Object.keys(channelsData.channels || {}).length === 0);

                if (isStackEmpty && isChannelsEmpty) {
                    console.log('[AddSourceDialog] Production stack is empty, checking onboarding state...');
                    try {
                        const onboardingRes = await fetch(`/api/v1/onboarding/state`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (onboardingRes.ok) {
                            const onboarding = await onboardingRes.json();
                            console.log('[AddSourceDialog] Onboarding data found:', onboarding);
                            stackData = onboarding.stack_data;
                            channelsData = onboarding.channels_data;
                        }
                    } catch (e) {
                        console.error('[AddSourceDialog] Failed to fetch onboarding fallback:', e);
                    }
                }

                console.log('[AddSourceDialog] Using Stack data:', stackData);
                console.log('[AddSourceDialog] Using Channels data:', channelsData);

                const selected = new Set<string>();

                // Extract IDs from stackData
                if (stackData) {
                    const stack = stackData.stack || {};
                    Object.values(stack).forEach((items: any) => {
                        if (Array.isArray(items)) {
                            items.forEach(id => selected.add(String(id).toLowerCase()));
                        }
                    });

                    const selectedTools = stackData.selectedTools || [];
                    selectedTools.forEach((id: string) => selected.add(String(id).toLowerCase()));
                }

                // Extract IDs from channelsData
                if (channelsData) {
                    const channels = channelsData.channels || {};
                    Object.values(channels).forEach((items: any) => {
                        if (Array.isArray(items)) {
                            items.forEach(id => selected.add(String(id).toLowerCase()));
                        }
                    });
                }

                console.log('[AddSourceDialog] Final selected IDs:', Array.from(selected));
                setSelectedIds(selected);
                setInitialSelectedIds(new Set(selected));
            }
        } catch (error) {
            console.error('Error fetching datasources:', error);
            toast.error('The catalog is playing hide and seek', {
                description: 'We couldn’t fetch the available tools. Try reloading the page?'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleDatasource = (datasource: Datasource) => {
        const dsId = datasource.id.toLowerCase();
        const newSelected = new Set(selectedIds);

        if (newSelected.has(dsId)) {
            newSelected.delete(dsId);
        } else {
            newSelected.add(dsId);
        }

        setSelectedIds(newSelected);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Get auth token
            const user = (await import('@/lib/firebase')).auth.currentUser;
            if (!user) {
                toast.error('Sign-in Required', {
                    description: 'Please log in to save your business stack selections.'
                });
                return;
            }
            const token = await user.getIdToken();

            // Send the list of selected datasource IDs to backend
            // Backend will handle proper categorization
            const selectedDatasourceIds = Array.from(selectedIds);

            // Update company stack
            const response = await fetch('/api/v1/datasources/company/stack', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Company-ID': companyId!,
                },
                body: JSON.stringify({
                    datasource_ids: selectedDatasourceIds,
                }),
            });

            if (!response.ok) throw new Error('Failed to update stack');

            toast.success('Stack Unified', {
                description: 'Your business tools are now synchronized with your datastack.'
            });
            onOpenChange(false);

            // Refresh the integrations page
            window.location.reload();
        } catch (error) {
            console.error('Error updating stack:', error);
            toast.error('Sync hit a snag', {
                description: 'We couldn’t save your selections. Let’s try once more?'
            });
        } finally {
            setSaving(false);
        }
    };

    // Filter datasources based on search
    const filteredDatasources = Object.entries(datasources).reduce((acc, [category, items]) => {
        const filtered = items.filter(ds =>
            ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ds.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {} as Record<string, Datasource[]>);

    const handleClose = () => {
        // Check for unsaved changes
        const hasChanges =
            selectedIds.size !== initialSelectedIds.size ||
            Array.from(selectedIds).some(id => !initialSelectedIds.has(id));

        if (hasChanges) {
            setShowCloseAlert(true);
        } else {
            onOpenChange(false);
        }
    };

    const confirmClose = () => {
        setShowCloseAlert(false);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(open) => {
                if (!open) handleClose();
            }}>
                <DialogContent className="sm:max-w-[900px] h-[85vh] border-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-0 overflow-hidden flex flex-col shadow-2xl">
                    <DialogHeader className="relative p-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-white via-orange-50/30 to-white dark:from-zinc-900 dark:via-orange-950/20 dark:to-zinc-900 z-10 shrink-0">
                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5 pointer-events-none" />

                        <DialogTitle className="relative text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-zinc-900 via-orange-600 to-zinc-900 dark:from-zinc-50 dark:via-orange-400 dark:to-zinc-50 bg-clip-text text-transparent">
                            Manage Toolkit
                        </DialogTitle>
                        <DialogDescription className="relative text-zinc-600 dark:text-zinc-400 font-medium">
                            Select the operational tools that power your business.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF8A4C] transition-colors duration-300" />
                            <Input
                                placeholder="Search apps (e.g. Shopify, Razorpay)..."
                                className="pl-10 h-11 bg-gray-50/80 dark:bg-zinc-800/80 backdrop-blur-sm border-gray-200/50 dark:border-zinc-700/50 focus:bg-white dark:focus:bg-zinc-950 rounded-xl focus:ring-2 focus:ring-[#FF8A4C]/30 focus:border-[#FF8A4C] transition-all duration-300 shadow-sm focus:shadow-lg focus:shadow-orange-500/10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-zinc-950">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-[#FF8A4C] opacity-50" />
                            </div>
                        ) : Object.keys(filteredDatasources).length > 0 ? (
                            <div className="space-y-10 pb-10">
                                {Object.entries(filteredDatasources).map(([category, items]) => (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-3 sticky top-0 bg-gradient-to-r from-gray-50/95 via-white/95 to-gray-50/95 dark:from-zinc-950/95 dark:via-zinc-900/95 dark:to-zinc-950/95 backdrop-blur-md py-3 z-10 border-b border-orange-100/30 dark:border-orange-900/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50" />
                                            <h3 className="text-xs font-bold text-transparent bg-gradient-to-r from-gray-700 to-gray-500 dark:from-zinc-300 dark:to-zinc-500 bg-clip-text uppercase tracking-widest">
                                                {CATEGORY_LABELS[category] || category}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {items.map(datasource => {
                                                const isSelected = selectedIds.has(datasource.id.toLowerCase());
                                                return (
                                                    <button
                                                        key={datasource.id}
                                                        onClick={() => toggleDatasource(datasource)}
                                                        className={cn(
                                                            "group relative flex flex-col items-start gap-4 p-4 rounded-2xl border transition-all duration-300 text-left h-full overflow-hidden",
                                                            isSelected
                                                                ? "border-transparent bg-gradient-to-br from-white via-orange-50/50 to-white dark:from-zinc-900 dark:via-orange-950/30 dark:to-zinc-900 shadow-[0_0_0_2px_#FF8A4C,0_8px_24px_-4px_rgba(255,138,76,0.3)] scale-[1.02]"
                                                                : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-[0_8px_32px_-8px_rgba(255,138,76,0.2)] hover:-translate-y-1 hover:scale-[1.01]"
                                                        )}
                                                    >
                                                        {/* Gradient overlay on hover */}
                                                        <div className={cn(
                                                            "absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/0 opacity-0 transition-opacity duration-500 pointer-events-none",
                                                            isSelected ? "from-orange-500/5 via-orange-500/5 to-orange-500/5 opacity-100" : "group-hover:opacity-100 group-hover:from-orange-500/3 group-hover:via-orange-500/3 group-hover:to-orange-500/3"
                                                        )} />

                                                        <div className="flex items-start justify-between w-full relative z-10">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border flex items-center justify-center p-2 overflow-hidden transition-all duration-300",
                                                                isSelected
                                                                    ? "border-orange-200 dark:border-orange-900/50 shadow-lg shadow-orange-500/20"
                                                                    : "border-gray-100 dark:border-zinc-700 group-hover:border-orange-100 dark:group-hover:border-orange-900/30 group-hover:shadow-md"
                                                            )}>
                                                                {(() => {
                                                                    const safeUrl = getSafeLogoUrl(datasource);
                                                                    const isValidUrl = safeUrl &&
                                                                        !safeUrl.includes('default.png') &&
                                                                        (safeUrl.startsWith('/') || safeUrl.startsWith('http'));

                                                                    if (isValidUrl) {
                                                                        return (
                                                                            <img
                                                                                src={safeUrl!}
                                                                                alt={datasource.name}
                                                                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                                    if (fallback) fallback.style.display = 'flex';
                                                                                }}
                                                                            />
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                                <div className="text-lg font-bold text-gray-400 hidden w-full h-full items-center justify-center" style={{
                                                                    display: (() => {
                                                                        const safeUrl = getSafeLogoUrl(datasource);
                                                                        const isValidUrl = safeUrl && !safeUrl.includes('default.png') && (safeUrl.startsWith('/') || safeUrl.startsWith('http'));
                                                                        return isValidUrl ? 'none' : 'flex';
                                                                    })()
                                                                }}>
                                                                    {datasource.name[0]}
                                                                </div>
                                                            </div>
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                                                isSelected
                                                                    ? "border-[#FF8A4C] bg-gradient-to-br from-[#FF8A4C] to-orange-600 scale-100 shadow-lg shadow-orange-500/30"
                                                                    : "border-gray-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                                            )}>
                                                                {isSelected && <Check className="w-3.5 h-3.5 text-white animate-in zoom-in duration-200" strokeWidth={3} />}
                                                            </div>
                                                        </div>

                                                        <div className="w-full relative z-10">
                                                            <div className={cn(
                                                                "font-bold text-gray-900 dark:text-zinc-100 mb-0.5 transition-all duration-300",
                                                                isSelected
                                                                    ? "text-[#FF8A4C] dark:text-orange-400"
                                                                    : "group-hover:text-[#FF8A4C] dark:group-hover:text-orange-400"
                                                            )}>
                                                                {datasource.name}
                                                            </div>
                                                            {datasource.is_coming_soon ? (
                                                                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-md w-fit mt-1">
                                                                    Soon
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                                                                    {datasource.description || "Integration available"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                                <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">No apps found</h3>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                                        We couldn't find any results for "{searchQuery}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gradient-to-r from-white via-orange-50/20 to-white dark:from-zinc-900 dark:via-orange-950/10 dark:to-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0 z-20 shadow-[0_-8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-900/20 text-[#FF8A4C] text-sm font-bold shadow-lg shadow-orange-500/20 animate-pulse">
                                {selectedIds.size}
                            </div>
                            <span className="font-semibold">apps selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onOpenChange(false)}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-2.5 bg-gradient-to-r from-[#FF8A4C] to-orange-600 hover:from-[#FF8A4C]/90 hover:to-orange-600/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Syncing Stack...
                                    </>
                                ) : (
                                    'Update Stack'
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={showCloseAlert} onOpenChange={setShowCloseAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes in your stack selection. Are you sure you want to close without saving? Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmClose} className="bg-orange-500 hover:bg-orange-600 text-white">
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
