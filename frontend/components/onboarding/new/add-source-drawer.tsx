"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Search, Plus, Filter, Check, ArrowLeft, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

// Type compatible with API
export interface APIDataSource {
    id: string; // uuid
    name: string;
    slug: string;
    category: string; // Storefront, Marketplace, etc.
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
}

export function AddSourceDrawer({ isOpen, onClose, onSelect, alreadySelectedIds, datasources, isLoading, priorityCategory }: AddSourceDrawerProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isRequestMode, setIsRequestMode] = useState(false);

    // Request Form State
    const [requestName, setRequestName] = useState("");
    const [requestCategory, setRequestCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setIsRequestMode(false);
            setRequestName("");
            setRequestSuccess(false);
            setRequestError(null);
        }
    }, [isOpen]);

    // Categorize
    const filteredGroups = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const sourceList = datasources || [];

        const filtered = sourceList.filter(ds =>
            (ds.name && ds.name.toLowerCase().includes(lowerQuery)) ||
            (ds.category && ds.category.toLowerCase().includes(lowerQuery)) ||
            (ds.display_name && ds.display_name.toLowerCase().includes(lowerQuery))
        );

        // Define groups
        const groups: Record<string, typeof filtered> = {
            "Your Storefronts": filtered.filter(d => d.category === 'Storefront'),
            "Marketplaces": filtered.filter(d => d.category === 'Marketplace'),
            "Quick Commerce": filtered.filter(d => d.category === 'QuickCommerce'),
            "Other Channels": filtered.filter(d => ['Network', 'SocialCommerce'].includes(d.category)),
        };

        // Sort keys based on priority
        const map: Record<string, string> = {
            'Storefront': "Your Storefronts",
            'Marketplace': "Marketplaces",
            'QuickCommerce': "Quick Commerce"
        };

        const priorityTitle = priorityCategory ? map[priorityCategory] : null;

        if (priorityTitle) {
            const ordered: typeof groups = { [priorityTitle]: groups[priorityTitle] };
            Object.keys(groups).forEach(key => {
                if (key !== priorityTitle) ordered[key] = groups[key];
            });
            return ordered;
        }

        return groups;
    }, [datasources, searchQuery, priorityCategory]);

    const hasResults = Object.values(filteredGroups).some(g => g.length > 0);

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestName.trim()) return;

        setIsSubmitting(true);
        setRequestError(null);
        try {
            console.log("DEBUG: AddSourceDrawer - Fetching token...");
            const token = user ? await user.getIdToken() : null;
            console.log("DEBUG: AddSourceDrawer - Token retrieved:", token ? "Yes" : "No");

            await api.post('/datasources/request', {
                name: requestName
                // Category is optional/inferred by backend or admin review
            }, {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            });

            setRequestSuccess(true);
            setTimeout(() => {
                onClose(); // Close drawer after humble success
            }, 1500);
        } catch (error) {
            console.error(error);
            setRequestError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Header Action: Request Button (+)
    const headerAction = !isRequestMode ? (
        <button
            onClick={() => {
                setIsRequestMode(true);
                // Pre-fill if they searched
                if (searchQuery) setRequestName(searchQuery);
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
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={isRequestMode ? "Request Integration" : "Add Sales Channel"}
            description={isRequestMode ? "Tell us what we're missing." : "Search platforms clearly."}
            headerAction={headerAction}
        >
            {isRequestMode ? (
                successView(requestSuccess) || (
                    <form onSubmit={handleRequestSubmit} className="space-y-6 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Platform Name</label>
                            <input
                                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black/5 focus:border-zinc-400 outline-none transition-all"
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
                            className="w-full bg-zinc-900 text-white font-medium py-3.5 rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {isSubmitting ? "Sending..." : "Send Request"}
                        </button>
                    </form>
                )
            ) : (
                <>
                    {/* Search Bar - Sticky? No, simple. */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            placeholder="Find channels..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 placeholder:text-zinc-400 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-zinc-50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : !hasResults ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="text-zinc-400" />
                            </div>
                            <p className="text-zinc-900 font-medium">No matches found</p>
                            <button
                                onClick={() => {
                                    setIsRequestMode(true);
                                    setRequestName(searchQuery);
                                }}
                                className="text-sm text-indigo-600 font-medium mt-2 hover:underline"
                            >
                                Request "{searchQuery}" here
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-12">
                            {Object.entries(filteredGroups).map(([title, items]) => (
                                items.length > 0 && (
                                    <div key={title}>
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 px-1">{title}</h3>
                                        {/* Row Layout - Less Clutter */}
                                        <div className="grid grid-cols-1 gap-2">
                                            {items.map(source => {
                                                const isSelected = alreadySelectedIds.includes(source.id);
                                                return (
                                                    <button
                                                        key={source.id}
                                                        onClick={() => onSelect(source)}
                                                        className={cn(
                                                            "flex items-center gap-4 p-3 rounded-xl transition-all w-full text-left border relative group",
                                                            isSelected
                                                                ? "bg-white border-zinc-800 shadow-sm"
                                                                : "bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-200"
                                                        )}
                                                    >
                                                        {/* Logo / Icon */}
                                                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-lg border border-zinc-100 p-1">
                                                            {source.logo_url ? (
                                                                <img src={source.logo_url} alt="" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-sm font-bold text-zinc-400">{source.name[0]}</span>
                                                            )}
                                                        </div>

                                                        {/* Text */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-zinc-900 truncate">{source.display_name || source.name}</div>
                                                            {/* Optional desc if needed, keeping it clean for now */}
                                                        </div>

                                                        {/* Selection State */}
                                                        {isSelected && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 flex-shrink-0 mr-1" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </>
            )}
        </Drawer>
    );
}

function successView(show: boolean) {
    if (!show) return null;
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
