"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Search, Plus, Check, ArrowLeft, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { trackOnboardingEvent } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';

// Type compatible with API
export interface APIDataSource {
    id: string;
    name: string;
    slug: string;
    category: string;
    logo_url?: string;
    display_name?: string;
    is_common: boolean;
}

interface AddSourceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (source: APIDataSource) => void;
    alreadySelectedIds: string[];
    datasources: APIDataSource[];
    isLoading?: boolean;
    priorityCategory?: string;
    drawerVariant?: 'channels' | 'stack';
}

type CategoryKey = 'all' | 'popular' | string;

export function AddSourceDrawer({
    isOpen,
    onClose,
    onSelect,
    alreadySelectedIds,
    datasources,
    isLoading,
    priorityCategory,
    drawerVariant = 'channels'
}: AddSourceDrawerProps) {
    const { user } = useAuth();
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebouncedValue(searchInput, 150);
    const [isRequestMode, setIsRequestMode] = useState(false);
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
    const scrollRef = useRef<HTMLDivElement>(null);
    const drawerRef = useFocusTrap<HTMLDivElement>(isOpen);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);

    // Request Form State
    const [requestName, setRequestName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);

    // Reset state on close, set priority category on open
    useEffect(() => {
        if (!isOpen) {
            setSearchInput("");
            setIsRequestMode(false);
            setRequestName("");
            setRequestSuccess(false);
            setRequestError(null);
            setActiveCategory('all');
            setSelectedItemIndex(0);
        } else {
            // Set active category to priority category if provided
            if (priorityCategory) {
                setActiveCategory(priorityCategory);
            }
            // Track drawer opened
            trackOnboardingEvent('drawer_opened', { variant: drawerVariant, priorityCategory });
        }
    }, [isOpen, drawerVariant, priorityCategory]);

    // Category definitions
    const categories = useMemo(() => {
        if (drawerVariant === 'stack') {
            return {
                all: { label: 'All', key: 'all' },
                popular: { label: 'Popular', key: 'popular' },
                divider: true,
                logistics: { label: 'Logistics & Returns', key: 'Logistics', backendCategories: ['Logistics'] },
                payments: { label: 'Payments & Settlements', key: 'Payment', backendCategories: ['Payment', 'Payouts'] },
                marketing: { label: 'Growth & Marketing', key: 'Marketing', backendCategories: ['Marketing'] },
                analytics: { label: 'Analytics', key: 'Analytics', backendCategories: ['Analytics'] },
                crm: { label: 'CRM & Retention', key: 'Retention', backendCategories: ['Retention'] },
                communication: { label: 'Support & Communication', key: 'Communication', backendCategories: ['Communication'] },
                accounting: { label: 'Accounting & Compliance', key: 'Accounting', backendCategories: ['Accounting'] },
            };
        } else {
            return {
                all: { label: 'All', key: 'all' },
                popular: { label: 'Popular', key: 'popular' },
                divider: true,
                storefronts: { label: 'Storefronts', key: 'Storefront', backendCategories: ['Storefront'] },
                marketplaces: { label: 'Marketplaces', key: 'Marketplace', backendCategories: ['Marketplace'] },
                quickcommerce: { label: 'Quick Commerce', key: 'QuickCommerce', backendCategories: ['QuickCommerce'] },
                other: { label: 'Other Channels', key: 'Other', backendCategories: ['Network', 'SocialCommerce'] },
            };
        }
    }, [drawerVariant]);

    // Filter and group datasources
    const filteredGroups = useMemo(() => {
        const lowerQuery = debouncedSearch.toLowerCase();
        const sourceList = datasources || [];

        // Filter by search
        let filtered = sourceList.filter(ds =>
            (
                (ds.name && ds.name.toLowerCase().includes(lowerQuery)) ||
                (ds.category && ds.category.toLowerCase().includes(lowerQuery)) ||
                (ds.display_name && ds.display_name.toLowerCase().includes(lowerQuery))
            ) && !ds.slug.includes('not_applicable')
        );

        // Filter by category
        if (activeCategory === 'popular') {
            filtered = filtered.filter(ds => ds.is_common);
        } else if (activeCategory !== 'all') {
            const categoryDef = Object.values(categories).find(c => c.key === activeCategory);
            if (categoryDef && 'backendCategories' in categoryDef) {
                filtered = filtered.filter(ds => categoryDef.backendCategories?.includes(ds.category));
            }
        }

        // Group by category
        const groups: Record<string, typeof filtered> = {};

        if (activeCategory === 'all' || activeCategory === 'popular') {
            // Show all categories
            Object.entries(categories).forEach(([key, cat]) => {
                if (key === 'all' || key === 'popular' || key === 'divider' || !('backendCategories' in cat)) return;

                const items = filtered.filter(ds => cat.backendCategories?.includes(ds.category));
                if (items.length > 0) {
                    groups[cat.label] = items;
                }
            });
        } else {
            // Show single category
            const categoryDef = Object.values(categories).find(c => c.key === activeCategory);
            if (categoryDef && 'label' in categoryDef) {
                groups[categoryDef.label] = filtered;
            }
        }

        return groups;
    }, [datasources, debouncedSearch, activeCategory, categories, drawerVariant]);

    const hasResults = Object.values(filteredGroups).some(g => g.length > 0);

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestName.trim()) return;

        setIsSubmitting(true);
        setRequestError(null);
        try {
            const token = user ? await user.getIdToken() : null;
            await api.post('/datasources/request', {
                name: requestName
            }, {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            });

            // Track integration request
            trackOnboardingEvent('integration_requested', {
                datasourceName: requestName,
                variant: drawerVariant,
            });

            setRequestSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error(error);
            setRequestError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Track search usage
    useEffect(() => {
        if (debouncedSearch && isOpen) {
            trackOnboardingEvent('drawer_search_used', {
                searchQuery: debouncedSearch,
                variant: drawerVariant,
            });
        }
    }, [debouncedSearch, isOpen, drawerVariant]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen || isRequestMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Get all visible items
            const allItems = Object.values(filteredGroups).flat();
            if (allItems.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedItemIndex(prev => Math.min(prev + 1, allItems.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedItemIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation(); // Prevent page-level Enter handler from firing
                    const selectedItem = allItems[selectedItemIndex];
                    if (selectedItem) {
                        // Check if item is already selected
                        const isAlreadySelected = alreadySelectedIds.includes(selectedItem.id);

                        if (isAlreadySelected) {
                            // If already selected, close drawer (confirm selection)
                            onClose();
                        } else {
                            // If not selected, select it
                            onSelect(selectedItem);
                            trackOnboardingEvent('datasource_selected', {
                                datasourceId: selectedItem.id,
                                datasourceName: selectedItem.name,
                                variant: drawerVariant,
                            });
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isRequestMode, filteredGroups, selectedItemIndex, onSelect, onClose, drawerVariant]);

    const drawerTitle = isRequestMode
        ? "Request Integration"
        : (drawerVariant === 'stack' ? "Your Ops Stack" : "Add Sales Channel");

    const drawerDescription = isRequestMode
        ? "Tell us what we're missing."
        : (drawerVariant === 'stack'
            ? "Find the tools you use to run your business."
            : "Search storefronts and marketplaces.");

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={drawerTitle}
            description={drawerDescription}
            headerAction={
                !isRequestMode ? (
                    <button
                        onClick={() => {
                            setIsRequestMode(true);
                            if (searchInput) setRequestName(searchInput);
                        }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                        title="Request a new integration"
                    >
                        <Plus size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => setIsRequestMode(false)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                        title="Back to search"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )
            }
        >
            {isRequestMode ? (
                requestSuccess ? (
                    <SuccessView />
                ) : (
                    <RequestForm
                        requestName={requestName}
                        setRequestName={setRequestName}
                        isSubmitting={isSubmitting}
                        requestError={requestError}
                        onSubmit={handleRequestSubmit}
                    />
                )
            ) : (
                <div ref={drawerRef} className="flex flex-col h-full">
                    {/* Search Bar - Sticky */}
                    <div className="sticky top-0 bg-white px-6 py-3 border-b border-zinc-50 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                            <input
                                placeholder="Search..."
                                className="w-full bg-white border border-zinc-100 rounded-lg py-2.5 pl-9 pr-4 
                                         focus:outline-none focus:border-zinc-200 
                                         placeholder:text-zinc-300 text-sm transition-all"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Category Navigation - Horizontal Chips */}
                    <div className="sticky top-[57px] bg-white px-6 py-2.5 border-b border-zinc-50 overflow-x-auto z-10">
                        <div className="flex gap-2 pb-0.5">
                            {Object.entries(categories).map(([key, cat]) => {
                                if (key === 'divider') return null;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setActiveCategory(cat.key);
                                            trackOnboardingEvent('drawer_category_clicked', {
                                                category: cat.label,
                                                variant: drawerVariant,
                                            });
                                        }}
                                        className={cn(
                                            "px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all",
                                            activeCategory === cat.key
                                                ? "bg-zinc-900 text-white shadow-sm"
                                                : "border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Results List */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-3">
                            {isLoading ? (
                                <LoadingSkeleton />
                            ) : !hasResults ? (
                                <EmptyState
                                    searchQuery={searchInput}
                                    onRequestClick={() => {
                                        setIsRequestMode(true);
                                        setRequestName(searchInput);
                                    }}
                                />
                            ) : (
                                <div className="space-y-6 pb-12">
                                    {Object.entries(filteredGroups).map(([title, items]) => (
                                        items.length > 0 && (
                                            <div key={title}>
                                                {/* Only show headers in "All" view */}
                                                {(activeCategory === 'all' || activeCategory === 'popular') && (
                                                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-0.5">
                                                        {title}
                                                    </h3>
                                                )}
                                                <div className="space-y-1">
                                                    <AnimatePresence mode="popLayout">
                                                        {items.map(source => {
                                                            const isSelected = alreadySelectedIds.includes(source.id);
                                                            return (
                                                                <motion.button
                                                                    key={source.id}
                                                                    initial={{ opacity: 0, y: 4 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -4 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    onClick={() => {
                                                                        // Update keyboard navigation index to match clicked item
                                                                        const allItems = Object.values(filteredGroups).flat();
                                                                        const clickedIndex = allItems.findIndex(item => item.id === source.id);
                                                                        if (clickedIndex !== -1) {
                                                                            setSelectedItemIndex(clickedIndex);
                                                                        }
                                                                        // Toggle selection
                                                                        onSelect(source);
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center gap-3 p-2.5 pr-3 rounded-lg transition-all w-full text-left",
                                                                        isSelected
                                                                            ? "bg-zinc-50 border border-zinc-200"
                                                                            : "border border-transparent hover:bg-zinc-50"
                                                                    )}
                                                                >
                                                                    {/* Logo */}
                                                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white rounded-md border border-zinc-100 p-1">
                                                                        {source.logo_url ? (
                                                                            <img src={source.logo_url} alt="" className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <span className="text-xs font-semibold text-zinc-300">{source.name[0]}</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Name */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-medium text-zinc-700 truncate">
                                                                            {source.display_name || source.name}
                                                                        </div>
                                                                    </div>

                                                                    {/* Selection Indicator - Checkmark */}
                                                                    <AnimatePresence>
                                                                        {isSelected && (
                                                                            <motion.div
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                exit={{ scale: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                                                                className="flex items-center justify-center flex-shrink-0"
                                                                            >
                                                                                <Check size={16} className="text-zinc-600" strokeWidth={2.5} />
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer - Sticky */}
                    <div className="sticky bottom-0 bg-white border-t border-zinc-50 px-6 py-2.5">
                        <button
                            onClick={() => setIsRequestMode(true)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1.5 mx-auto transition-colors"
                        >
                            <Plus size={14} />
                            Can't find it? Request here
                        </button>
                    </div>
                </div>
            )}
        </Drawer>
    );
}

// Sub-components
function SuccessView() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Request Sent!</h3>
            <p className="text-zinc-500 mt-2 max-w-xs mx-auto">
                We'll look into adding this integration properly.
            </p>
        </div>
    );
}

function RequestForm({
    requestName,
    setRequestName,
    isSubmitting,
    requestError,
    onSubmit
}: {
    requestName: string;
    setRequestName: (name: string) => void;
    isSubmitting: boolean;
    requestError: string | null;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-6 pt-2">
            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Platform Name</label>
                <input
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 
                             focus:ring-2 focus:ring-black/5 focus:border-zinc-400 outline-none transition-all"
                    placeholder="e.g. Hulu Commerce"
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="bg-zinc-50 rounded-xl p-4 text-sm text-zinc-600 border border-zinc-100">
                We usually build new integrations within 3-5 days. You'll be notified when it's ready.
            </div>

            {requestError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    {requestError}
                </div>
            )}

            <button
                type="submit"
                disabled={!requestName.trim() || isSubmitting}
                className="w-full bg-zinc-900 text-white font-medium py-3.5 rounded-xl 
                         hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSubmitting ? "Sending..." : "Send Request"}
            </button>
        </form>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-14 bg-zinc-50 rounded-xl animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ searchQuery, onRequestClick }: { searchQuery: string; onRequestClick: () => void }) {
    return (
        <div className="text-center py-12">
            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="text-zinc-400" />
            </div>
            <p className="text-zinc-900 font-medium">
                {searchQuery ? `No matches for "${searchQuery}"` : 'No results found'}
            </p>
            {searchQuery && (
                <button
                    onClick={onRequestClick}
                    className="text-sm text-orange-600 font-medium mt-2 hover:underline"
                >
                    Request "{searchQuery}" here
                </button>
            )}
        </div>
    );
}
