"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
    subLabel?: string;
    icon?: React.ReactNode | string;
}

interface SearchableSelectProps {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    onLocate?: () => void; // New prop for "Locate automatically"
    placeholder?: string;
}

export function SearchableSelect({
    label,
    value,
    options,
    onChange,
    onLocate,
    placeholder = "Select..."
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    // We store exact styles for the dropdown (position, dimensions)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const DROPDOWN_MAX_HEIGHT = 320;
            const BUFFER = 16;

            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            const newStyle: React.CSSProperties = {
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            };

            // Decision: Flip UP if not enough space below AND there is more space above
            const shouldFlipUp = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

            if (shouldFlipUp) {
                // Position above
                newStyle.bottom = viewportHeight - rect.top + 8; // 8px gap
                newStyle.top = 'auto';
                newStyle.maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove - BUFFER);
                newStyle.transformOrigin = 'bottom center';
            } else {
                // Position below (default)
                newStyle.top = rect.bottom + 8; // 8px gap
                newStyle.bottom = 'auto';
                newStyle.maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - BUFFER);
                newStyle.transformOrigin = 'top center';
            }

            setDropdownStyle(newStyle);
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, { passive: true });
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Click outside listener that handles the portal
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative group/select">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block pl-1 group-focus-within/select:text-indigo-500 transition-colors">
                {label}
            </label>

            <button
                ref={containerRef}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearch('');
                }}
                className={cn(
                    "w-full text-left transition-all duration-300 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm text-sm cursor-pointer border",
                    isOpen
                        ? "bg-white ring-4 ring-indigo-500/10 border-indigo-500 z-10"
                        : "bg-zinc-50/50 border-zinc-200 hover:bg-white hover:border-indigo-300 hover:ring-4 hover:ring-indigo-50/50 hover:shadow-md"
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.icon && (
                        <span className="flex-shrink-0 text-lg leading-none transition-all">{selectedOption.icon}</span>
                    )}
                    <span className={cn(
                        "block truncate font-medium transition-colors",
                        selectedOption ? "text-zinc-900" : "text-zinc-500"
                    )}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.subLabel && (
                        <span className="text-zinc-400 text-xs hidden sm:inline-block pl-1">{selectedOption.subLabel}</span>
                    )}
                </div>
                <ChevronDown size={14} className={cn(
                    "text-zinc-400 flex-shrink-0 transition-transform duration-300",
                    isOpen && "rotate-180 text-indigo-500"
                )} />
            </button>

            {/* Portal for the Dropdown */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, scale: 0.95, y: dropdownStyle.bottom ? 10 : -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: dropdownStyle.bottom ? 10 : -10 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} // smooth apple-like ease
                            style={dropdownStyle}
                            className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl shadow-indigo-900/10 border border-zinc-100/50 overflow-hidden ring-1 ring-black/5 flex flex-col"
                        >
                            {/* Search */}
                            <div className="p-2 border-b border-zinc-50 shrink-0 space-y-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        autoFocus
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Type to filter..."
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50/50 hover:bg-zinc-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-lg focus:outline-none transition-all placeholder:text-zinc-400"
                                    />
                                </div>

                                {onLocate && !search && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLocate();
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-colors group/locate"
                                    >
                                        <span>Locate automatically</span>
                                        <Crosshair size={14} className="group-hover/locate:rotate-45 transition-transform duration-300" />
                                    </button>
                                )}
                            </div>

                            {/* Options */}
                            <div className="overflow-y-auto p-1.5 custom-scrollbar flex-1">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((opt, i) => (
                                        <motion.button
                                            key={opt.value}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02, duration: 0.2 }}
                                            onClick={() => {
                                                onChange(opt.value);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all group ${value === opt.value
                                                ? 'bg-zinc-100 text-zinc-900'
                                                : 'hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900' // Base state is muted/grey, hover becomes dark
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg leading-none transition-transform group-hover:scale-110">
                                                    {opt.icon}
                                                </span>
                                                <div>
                                                    <span className={`font-medium ${value === opt.value ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'}`}>
                                                        {opt.label}
                                                    </span>
                                                    {opt.subLabel && (
                                                        <span className="ml-2 text-xs opacity-60 font-normal">{opt.subLabel}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {value === opt.value && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <Check size={14} className="text-zinc-900" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-zinc-400 text-xs italic">
                                        No results found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
