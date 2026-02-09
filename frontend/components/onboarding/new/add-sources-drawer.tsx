"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Terminal, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { datasourceCatalog } from '@/data/datasourceCatalog';
import { useOnboarding } from '@/store/onboarding-context';

interface AddSourcesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    onSelect: (id: string) => void;
    selectedIds: string[];
}

export function AddSourcesDrawer({
    isOpen,
    onClose,
    category,
    onSelect,
    selectedIds
}: AddSourcesDrawerProps) {
    const [search, setSearch] = useState('');
    const [requested, setRequested] = useState(false);
    const { addIntegrationRequest } = useOnboarding();

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const allFiltered = datasourceCatalog.filter(source =>
        source.type === 'integration' &&
        source.categories.includes(category as any) &&
        (source.displayName.toLowerCase().includes(search.toLowerCase()) ||
            source.aliases.some(a => a.toLowerCase().includes(search.toLowerCase())))
    );

    const handleRequest = () => {
        addIntegrationRequest(search, category);
        setRequested(true);
        setTimeout(() => {
            setRequested(false);
            setSearch('');
        }, 2000);
    };

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        }
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);


    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-[99999]"
                    />

                    {/* Right Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.6 }} // Snappy yet smooth
                        className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-white shadow-2xl z-[100000] flex flex-col border-l border-zinc-200 rounded-l-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-50 flex items-start justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Add sources</h2>
                                <p className="text-sm text-zinc-500 mt-1">Add long-tail channels without cluttering your setup.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full -mr-2 hover:bg-zinc-100 text-zinc-400 hover:text-black transition-colors">
                                <X size={24} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <Input
                                    autoFocus
                                    placeholder="Search specific tools..."
                                    value={search}
                                    onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearch(e.target.value)}
                                    className="pl-11 h-12 bg-zinc-50 border-zinc-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all rounded-xl text-base shadow-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Results</h3>
                                {allFiltered.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {allFiltered.map((source, i) => (
                                            <motion.button
                                                key={source.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => {
                                                    onSelect(source.id);
                                                    onClose();
                                                }}
                                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all group text-left w-full active:scale-[0.99]"
                                            >
                                                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-zinc-100 shadow-sm p-2 shrink-0 group-hover:scale-105 transition-transform">
                                                    {source.logoUrl ? (
                                                        <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span className="text-sm font-bold text-zinc-600">{source.displayName[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-zinc-900 truncate text-base">{source.displayName}</p>
                                                    <p className="text-xs text-zinc-400 group-hover:text-zinc-500 transition-colors">Tap to add</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 group-hover:bg-black transition-colors">
                                                    <Plus size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center text-center px-4">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                                            <Terminal size={24} className="text-zinc-300" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-1 text-zinc-900">
                                            {requested ? "Request received!" : "Don't see yours?"}
                                        </h3>
                                        <p className="text-sm text-zinc-500 max-w-xs mb-8">
                                            {requested
                                                ? "We've logged this request. Thanks for helping us improve."
                                                : "Request it regardless — we prioritize integrations based on your feedback."
                                            }
                                        </p>

                                        {!requested && (
                                            <Button
                                                onClick={handleRequest}
                                                variant="outline"
                                                className="h-10 px-6 rounded-full text-sm border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-transparent transition-colors"
                                            >
                                                Request "{search}" integration
                                            </Button>
                                        )}

                                        {requested && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-full text-sm"
                                            >
                                                <ThumbsUp size={16} />
                                                Logged successfully
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-500 backdrop-blur-md">
                            <span className="font-medium">{allFiltered.length} integration{allFiltered.length !== 1 && 's'} available</span>
                            <Button onClick={onClose} className="bg-black text-white hover:bg-zinc-800 rounded-lg h-9 px-6 text-sm font-medium shadow-lg shadow-black/5">
                                Done
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
