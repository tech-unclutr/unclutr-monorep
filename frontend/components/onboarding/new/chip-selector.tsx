"use client";

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { LogoChip } from './logo-chip';
import { AddSourceDrawer } from './add-source-drawer';
import { motion, AnimatePresence } from 'framer-motion';

interface ChipSelectorProps {
    category: string; // Used for context or Drawer title if needed
    commonSources: any[]; // Dynamic list
    allSources?: any[]; // For the drawer
    isLoading?: boolean;
    selectedIds: string[];
    globalSelectedIds?: string[]; // ALL selected IDs across all categories
    priorityCategory?: string; // Which category to show on top in drawer
    onToggle: (id: string, isSingleSelect: boolean) => void;
    onGlobalSelect?: (source: any) => void;
    singleSelect?: boolean;
    maxItems?: number;
    maxError?: string;
    showSearch?: boolean;
    drawerVariant?: 'channels' | 'stack'; // New prop
}

export function ChipSelector({
    category,
    commonSources = [],
    allSources = [],
    isLoading = false,
    selectedIds = [],
    globalSelectedIds,
    priorityCategory,
    onToggle,
    onGlobalSelect,
    singleSelect = false,
    maxItems,
    maxError,
    showSearch = true,
    drawerVariant = 'channels',
}: ChipSelectorProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Filter logic for the inline search (searching within the provided common set)
    // If inline search is active, we search in allSources to find specific obscure ones if user types name?
    // OR we just search commonSources? 
    // Let's search allSources if available, falling back to commonSources.
    const searchTarget = (allSources && allSources.length > 0) ? allSources : commonSources;

    // BUT we should respect the category filter if `allSources` is mixed?
    // User requested "Add More" drawer to have "categorised" data.
    // ChipSelector is usually specific to a VerticalStep (e.g. D2C).
    // If I search "Amazon" in D2C step... should I find it?
    // CURRENT UX: "Add More" button is the main way to access full catalog.
    // Inline search is usually for "Common" items or quick filtering.
    // Let's keep it searching `commonSources` for simplicity to avoid showing inappropriate results for the category.
    // Actually, `commonSources` might be limited to 8.
    // If I type "Woocommerce" and it's not in top 8, I should find it if it exists in category.
    // So better to filter `allSources` by `category` if we can.
    // `commonSources` passed in are already filtered by category and is_common.
    // Let's try to filter `allSources` by matching category if possible?
    // `ChipSelector` doesn't know the exact category string to match against backend 'Storefront' etc unless `category` prop matches backend strings.
    // `category` prop is "selling_channel_d2c". Backend is "Storefront".
    // I don't want to map strings here.
    // Let's just search `commonSources` for now. If not found, "Add More" is right there.

    // Unified source list for display resolution
    const sourcePool = (allSources && allSources.length > 0) ? allSources : commonSources;

    // Stable List Logic: Prevents grid from jumping when selecting/deselecting

    // 1. Identify items currently selected but NOT in the common list (e.g. added via drawer)
    const extraSelectedItems = (allSources || []).filter(s =>
        selectedIds.includes(s.id) &&
        !commonSources.find(c => c.id === s.id)
    );

    // 2. Combine Common + Extra. 
    // We do NOT bring selected items to top anymore, preserving the grid layout.
    const combinedPool = [...commonSources, ...extraSelectedItems];

    const chipsToShow = searchTerm
        ? sourcePool.filter(s =>
            (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.display_name && s.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 5) // Limit search results
        : combinedPool;

    // 3. Ensure "Not Applicable" is always last
    const displayChips = chipsToShow.sort((a, b) => {
        if (a.name.includes("Not Applicable")) return 1;
        if (b.name.includes("Not Applicable")) return -1;
        return 0;
    });

    // Toggle handler
    const handleToggle = (id: string) => {
        if (maxItems && !selectedIds.includes(id) && selectedIds.length >= maxItems) {
            return;
        }
        onToggle(id, singleSelect);
    };

    return (
        <div className="space-y-6">
            {/* Soft Search Input */}
            {showSearch && (
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search popular..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-zinc-50 hover:bg-zinc-100 focus:bg-white border text-sm border-transparent focus:border-zinc-200 rounded-xl transition-all outline-none placeholder:text-zinc-400 text-zinc-900 shadow-sm focus:shadow-md"
                    />
                </div>
            )}

            {/* Grid of Chips */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-6 gap-x-2">
                <AnimatePresence mode="popLayout">
                    {displayChips.map(source => (
                        <motion.div
                            key={source.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <LogoChip
                                id={source.id}
                                name={source.name.includes("Not Applicable") ? "Not Applicable" : (source.display_name || source.name)}
                                logoUrl={source.logo_url}
                                selected={selectedIds.includes(source.id)}
                                onToggle={handleToggle}
                            />
                        </motion.div>
                    ))}

                    {/* Add More Button (Always at end of grid) */}
                    {!searchTerm && (
                        <motion.button
                            layout
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDrawerOpen(true)}
                            className="flex flex-col items-center gap-3 p-2 group"
                        >
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white border border-dashed border-zinc-300 group-hover:border-zinc-400 group-hover:bg-zinc-50 transition-all">
                                <Plus size={24} className="text-zinc-400 group-hover:text-zinc-600" />
                            </div>
                            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-600">Add more</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Helper / Error Message */}
            {maxItems && selectedIds.length >= maxItems && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-block">
                    {maxError || `Maximum ${maxItems} selected.`}
                </p>
            )}

            {/* Drawer */}
            <AddSourceDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                alreadySelectedIds={globalSelectedIds || selectedIds}
                onSelect={(source) => {
                    if (onGlobalSelect) {
                        onGlobalSelect(source);
                    } else {
                        handleToggle(source.id);
                    }
                }}
                datasources={allSources}
                isLoading={isLoading}
                priorityCategory={priorityCategory}
                drawerVariant={drawerVariant}
            />
        </div>
    );
}
