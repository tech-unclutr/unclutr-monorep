"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "lucide-react"
import { Company, CompanyUpdate } from "@/types/company"

interface BrandHeaderProps {
    data: Company
    onUpdate: (updates: CompanyUpdate) => void
}

export function BrandHeader({ data: initialData, onUpdate }: BrandHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [data, setData] = useState(initialData)

    // Sync local state when prop changes
    useEffect(() => {
        setData(initialData)
    }, [initialData])

    const handleSave = () => {
        setIsEditing(false)
        onUpdate({
            brand_name: data.brand_name,
            tagline: data.tagline
        })
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700">
            <div className="flex items-center gap-6 w-full">
                <div className="h-24 w-24 rounded-2xl bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700">
                    <img
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(isEditing ? data.brand_name : initialData.brand_name)}&backgroundColor=ffdfbf,c0aede,d1d4f9,b6e3f4&backgroundType=solid,gradientLinear`}
                        alt={isEditing ? data.brand_name : initialData.brand_name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="space-y-1 w-full max-w-lg">
                    {isEditing ? (
                        <div className="space-y-3">
                            <Input
                                value={data.brand_name}
                                onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                                className="text-lg font-semibold h-11 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
                                placeholder="Brand Name"
                                autoFocus
                            />
                            <Input
                                value={data.tagline || ""}
                                onChange={(e) => setData({ ...data, tagline: e.target.value })}
                                className="text-base h-10 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
                                placeholder="Add a tagline..."
                            />
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight min-h-[32px]">
                                {initialData.brand_name}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg min-h-[28px]">
                                {initialData.tagline || "No tagline set"}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="shrink-0 flex gap-2">
                {isEditing ? (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Check className="w-4 h-4 mr-2" /> Save
                        </Button>
                    </>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setData(initialData)
                        setIsEditing(true)
                    }} className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors">
                        <Pencil className="w-4 h-4 mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                )}
            </div>
        </div>
    )
}
