
"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { regions } from '@/data/regions';
import { Button } from '@/components/ui/button';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function PhoneInput({ value, onChange, className, placeholder = "12345 67890" }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Parse initial value
    // Assuming format: "+91 9876543210" or just "9876543210"
    const parseValue = (val: string) => {
        const parts = val.split(' ');
        if (parts.length > 1 && parts[0].startsWith('+')) {
            const code = parts[0];
            const num = parts.slice(1).join(' '); // Rejoin rest in case of spaces
            const region = regions.find(r => r.dialCode === code);
            return {
                countryCode: code,
                number: num,
                flag: region?.flag || '🌍'
            };
        }
        return {
            countryCode: '+91', // Default
            number: val,
            flag: '🇮🇳'
        };
    };

    const [localState, setLocalState] = useState(parseValue(value));

    // Sync from props if value changes externally
    useEffect(() => {
        if (value) {
            const parsed = parseValue(value);
            // Only update if different to avoid cursor jumps or loops (basic check)
            if (parsed.countryCode !== localState.countryCode || parsed.number !== localState.number) {
                setLocalState(parsed);
            }
        }
    }, [value]);

    const handleCountrySelect = (region: typeof regions[0]) => {
        const newState = { ...localState, countryCode: region.dialCode, flag: region.flag };
        setLocalState(newState);
        onChange(`${newState.countryCode} ${newState.number}`);
        setIsOpen(false);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value.replace(/[^0-9\s]/g, ''); // Allow digits and spaces
        const newState = { ...localState, number: newNumber };
        setLocalState(newState);
        onChange(`${newState.countryCode} ${newNumber}`);
    };

    const filteredRegions = regions.filter(r =>
        r.country.toLowerCase().includes(search.toLowerCase()) ||
        r.dialCode.includes(search)
    );

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-[100px] justify-between px-3 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-lg leading-none">{localState.flag}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{localState.countryCode}</span>
                        </span>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10" align="start">
                    <div className="p-2 border-b border-gray-100 dark:border-white/10">
                        <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-md border border-gray-200 dark:border-white/10">
                            <Search className="h-4 w-4 text-gray-400 mr-2" />
                            <input
                                className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-900 dark:text-white placeholder:text-gray-400"
                                placeholder="Search country..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredRegions.map((region) => (
                            <button
                                key={region.country}
                                onClick={() => handleCountrySelect(region)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-900 dark:text-white",
                                    localState.countryCode === region.dialCode && "bg-gray-50 dark:bg-white/5 font-medium"
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-xl leading-none">{region.flag}</span>
                                    <span>{region.country}</span>
                                </span>
                                <span className="text-gray-400 font-mono text-xs">{region.dialCode}</span>
                            </button>
                        ))}
                        {filteredRegions.length === 0 && (
                            <p className="p-4 text-center text-xs text-gray-400">No country found.</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <input
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-gray-900 dark:text-white",
                    className
                )}
                placeholder={placeholder}
                value={localState.number}
                onChange={handleNumberChange}
            />
        </div>
    );
}
