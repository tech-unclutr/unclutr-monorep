"use client";

import React from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { datasourceCatalog } from '@/data/datasourceCatalog';

interface ReviewSummaryRowProps {
    label: string;
    editPath: string;
    selectedIds: string[] | string | null;
    category?: string;
}

export function ReviewSummaryRow({
    label,
    editPath,
    selectedIds,
    category
}: ReviewSummaryRowProps) {
    // Normalize to array
    const ids = Array.isArray(selectedIds)
        ? selectedIds
        : selectedIds ? [selectedIds] : [];

    const getSourceDetails = (id: string) => {
        return datasourceCatalog.find(s => s.id === id);
    };

    const getLogos = () => {
        return ids.map(id => {
            const source = getSourceDetails(id);
            if (!source) return null;
            return (
                <div key={id} className="relative group/logo">
                    <div className="w-8 h-8 rounded-lg border border-zinc-100 p-1 flex items-center justify-center bg-white shadow-sm">
                        {source.logoUrl ? (
                            <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-[10px] font-bold text-zinc-500">{source.displayName.substring(0, 2)}</span>
                        )}
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/logo:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {source.displayName}
                    </div>
                </div>
            );
        }).filter(Boolean);
    };

    const hasSelection = ids.length > 0;

    return (
        <div className="flex items-start justify-between py-6 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors -mx-4 px-4 rounded-xl">
            <div className="space-y-1">
                <h4 className="font-medium text-zinc-900">{label}</h4>
                {!hasSelection && (
                    <p className="text-sm text-zinc-400 italic">No selection</p>
                )}
                {hasSelection && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {getLogos()}
                    </div>
                )}
            </div>

            <Link href={editPath} passHref>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full h-8 w-8 p-0">
                    <Edit2 size={14} />
                </Button>
            </Link>
        </div>
    );
}
