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

        <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:border-zinc-300/80 dark:hover:border-zinc-700">
            <div className="flex items-center gap-8 w-full">
                <div className="relative h-28 w-28 rounded-3xl shrink-0 border border-zinc-100 dark:border-zinc-700 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <img
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(isEditing ? data.brand_name : initialData.brand_name)}`}
                        alt={isEditing ? data.brand_name : initialData.brand_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-3xl" />
                </div>

                <div className="space-y-2 w-full max-w-lg">
                    {isEditing ? (
                        <div className="space-y-4">
                            <Input
                                value={data.brand_name}
                                onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                                className="text-xl font-bold h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 rounded-xl shadow-sm"
                                placeholder="Brand Name"
                                autoFocus
                            />
                            <Input
                                value={data.tagline || ""}
                                onChange={(e) => setData({ ...data, tagline: e.target.value })}
                                className="text-base h-11 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 rounded-xl"
                                placeholder="Add a tagline..."
                            />
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                                {initialData.brand_name}
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                                {initialData.tagline || "No tagline set"}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="shrink-0 flex gap-3">
                {isEditing ? (
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900">
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} className="rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm hover:shadow-md transition-all">
                            <Check className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setData(initialData)
                        setIsEditing(true)
                    }} className="rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                        <Pencil className="w-4 h-4 mr-2" /> Edit content
                    </Button>
                )}
            </div>
        </div>
    )
}
