"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, Crosshair, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
    subLabel?: string;
    icon?: React.ReactNode | string;
    tag?: string;
}

export interface SearchableSelectProps {
    label?: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    onClear?: () => void; // New prop for clearing value
    onLocate?: () => void; // New prop for "Locate automatically"
    allowCustomValue?: boolean; // New prop to allow custom values
    usePortal?: boolean; // New prop to control portal usage
    placeholder?: string;
    className?: string;
}

export function SearchableSelect({
    label,
    value,
    options,
    onChange,
    onClear,
    onLocate,
    allowCustomValue,
    usePortal = true, // New prop to control portal usage
    placeholder = "Select...",
    className
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    // We store exact styles for the dropdown (position, dimensions)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    const updatePosition = () => {
        if (usePortal && containerRef.current) {
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
        if (isOpen && usePortal) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, { passive: true });
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, usePortal]);

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

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Slight delay to ensure animation/positioning doesn't conflict
            requestAnimationFrame(() => {
                inputRef.current?.focus({ preventScroll: true });
            });
        }
    }, [isOpen]);

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, scale: 0.95, y: usePortal && dropdownStyle.bottom ? 10 : -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: usePortal && dropdownStyle.bottom ? 10 : -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={usePortal ? dropdownStyle : {}}
                    className={cn(
                        "bg-white dark:bg-zinc-950 rounded-xl shadow-2xl shadow-zinc-500/20 border border-zinc-100 dark:border-zinc-800 overflow-hidden ring-1 ring-black/5 flex flex-col min-w-[200px]",
                        usePortal ? "searchable-select-dropdown" : "absolute top-[calc(100%+8px)] left-0 w-full z-50 max-h-[320px]"
                    )}
                >
                    {/* Search */}
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0 space-y-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (filteredOptions.length > 0) {
                                            onChange(filteredOptions[0].value);
                                            setIsOpen(false);
                                            setSearch('');
                                        } else if (allowCustomValue && search.trim()) {
                                            onChange(search.trim());
                                            setIsOpen(false);
                                            setSearch('');
                                        }
                                    } else if (e.key === 'Escape') {
                                        setIsOpen(false);
                                    }
                                }}
                                placeholder="Type to filter..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent focus:border-orange-500/50 focus:bg-white dark:focus:bg-zinc-900 rounded-lg focus:outline-none transition-all placeholder:text-zinc-400 dark:text-zinc-100"
                            />
                        </div>

                        {onLocate && !search && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLocate();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50/50 hover:bg-orange-50 rounded-lg transition-colors group/locate"
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
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all group border border-transparent ${value === opt.value
                                        ? 'bg-orange-50/50 text-zinc-900 border-orange-100'
                                        : 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg leading-none transition-transform group-hover:scale-110">
                                            {opt.icon}
                                        </span>
                                        <div>
                                            <span className={`font-medium ${value === opt.value ? 'text-zinc-900' : 'text-zinc-600 group-hover:text-zinc-900'}`}>
                                                {opt.label}
                                            </span>
                                            {opt.subLabel && (
                                                <span className="ml-2 text-xs opacity-60 font-normal">{opt.subLabel}</span>
                                            )}
                                            {opt.tag && (
                                                <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider text-orange-600 bg-orange-50 border border-orange-100 rounded-md shadow-sm">
                                                    {opt.tag}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {value === opt.value && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <Check size={14} className="text-orange-600" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))
                        ) : (
                            <>
                                {allowCustomValue && search.trim() ? (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => {
                                            onChange(search);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all group hover:bg-orange-50 bg-orange-50/50 text-orange-600 border border-orange-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Plus size={14} className="text-orange-600" />
                                            <span className="font-semibold">Use "{search}"</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold bg-white px-2 py-0.5 rounded border border-orange-100">Custom</span>
                                    </motion.button>
                                ) : (
                                    <div className="py-6 text-center text-zinc-400 text-xs italic">
                                        No results found
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative group/select">
            {label && (
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block pl-1 group-focus-within/select:text-orange-500 transition-colors">
                    {label}
                </label>
            )}

            <button
                type="button" // Prevent form submission
                ref={containerRef}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearch('');
                }}
                className={cn(
                    "w-full text-left transition-all duration-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm cursor-pointer border",
                    // Default styles (can be overridden by className if we merge properly, but cn handles tailwind merge)
                    "bg-white border-zinc-200 hover:border-zinc-300",
                    isOpen && "bg-white ring-1 ring-zinc-900 border-zinc-900 z-10",
                    // Allow overriding classes to be passed directly to the button if intended?
                    // The 'className' prop usually goes to the container. 
                    // Let's add a separate 'triggerClassName' or just apply 'className' to the button?
                    // Usually 'className' on a custom input component applies to the input element (or trigger).
                    // Let's apply 'className' to the button to allow overriding background/border.
                    className
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedOption?.icon && (
                        <span className="flex-shrink-0 text-lg leading-none transition-all">{selectedOption.icon}</span>
                    )}
                    <span className={cn(
                        "block truncate font-medium transition-colors",
                        // Ensure text color matches input styles
                        selectedOption ? "text-zinc-900 dark:text-zinc-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {selectedOption ? selectedOption.label : (value && allowCustomValue ? value : placeholder)}
                    </span>
                    {selectedOption?.subLabel && (
                        <span className="text-zinc-400 text-xs hidden sm:inline-block pl-1">{selectedOption.subLabel}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {value && onClear && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                                setIsOpen(false);
                            }}
                            className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={cn(
                        "text-zinc-400 flex-shrink-0 transition-transform duration-300",
                        isOpen && "rotate-180 text-orange-500"
                    )} />
                </div>
            </button>

            {/* Portal OR Inline Dropdown */}
            {usePortal && typeof document !== 'undefined'
                ? createPortal(dropdownContent, document.body)
                : dropdownContent
            }
        </div>
    );
}
