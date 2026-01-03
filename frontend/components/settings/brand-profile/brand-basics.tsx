"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, X } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { d2cCategories } from "@/data/categories"
import { Company, CompanyUpdate } from "@/types/company"

interface BrandBasicsProps {
    data: Company
    onUpdate: (updates: CompanyUpdate) => void
}

export function BrandBasics({ data: initialData, onUpdate }: BrandBasicsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [data, setData] = useState(initialData)

    // Tag state
    const [isAddingTag, setIsAddingTag] = useState(false)
    const [newTag, setNewTag] = useState("")
    const tagInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setData(initialData)
    }, [initialData])

    const handleSave = () => {
        setIsEditing(false)
        onUpdate({
            brand_name: data.brand_name,
            legal_name: data.legal_name,
            founded_year: data.founded_year,
            industry: data.industry,
            tags: data.tags
        })
    }

    const handleCancel = () => {
        setIsEditing(false)
        setData(initialData)
        setIsAddingTag(false)
        setNewTag("")
    }

    const handleAddTag = () => {
        if (newTag.trim()) {
            setData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }))
            setNewTag("")
            setIsAddingTag(false)
        } else {
            setIsAddingTag(false)
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    // Focus tag input when adding
    useEffect(() => {
        if (isAddingTag && tagInputRef.current) {
            tagInputRef.current.focus()
        }
    }, [isAddingTag])

    return (
        <div className="p-8 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700">
            <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brand Basics</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                        Set your public brand profile and industry benchmarking.
                    </p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save</Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setData(initialData)
                        setIsEditing(true)
                    }} className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors">
                        <Pencil className="w-4 h-4 mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 mb-8">
                {/* Brand Name */}
                <div className="space-y-6 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Brand Name</label>
                    {isEditing ? (
                        <Input
                            value={data.brand_name}
                            onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium text-gray-900 dark:text-gray-100"
                            placeholder="Brand Name"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">{initialData.brand_name}</p>
                    )}
                </div>

                {/* Legal Name */}
                <div className="space-y-6 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Legal Name</label>
                    {isEditing ? (
                        <Input
                            value={data.legal_name || ""}
                            onChange={(e) => setData({ ...data, legal_name: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 transition-all text-gray-900 dark:text-gray-100"
                            placeholder="Legal Entity Name"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">
                            {initialData.legal_name || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>

                {/* Founded Year */}
                <div className="space-y-6 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Founded Year</label>
                    {isEditing ? (
                        <Input
                            value={data.founded_year || ""}
                            onChange={(e) => setData({ ...data, founded_year: e.target.value })}
                            className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 transition-all text-gray-900 dark:text-gray-100"
                            placeholder="YYYY"
                            maxLength={4}
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">
                            {initialData.founded_year || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>

                {/* Primary Category */}
                <div className="space-y-6 group relative">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Primary Category</label>
                    {isEditing ? (
                        <SearchableSelect
                            value={data.industry || ""}
                            options={d2cCategories.map(c => ({ label: c, value: c }))}
                            onChange={(val) => setData({ ...data, industry: val })}
                            placeholder="Select category..."
                            className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-transparent"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">
                            {initialData.industry || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</label>

                {isEditing ? (
                    <div
                        className="flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-transparent focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 cursor-text transition-all"
                        onClick={() => tagInputRef.current?.focus()}
                    >
                        {(data.tags || []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-2 py-1 font-normal bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 shadow-sm">
                                {tag}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTag(tag);
                                    }}
                                    className="ml-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 focus:outline-none rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 p-0.5 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </Badge>
                        ))}
                        <input
                            ref={tagInputRef}
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddTag()
                                } else if (e.key === 'Backspace' && newTag === '' && (data.tags || []).length > 0) {
                                    handleRemoveTag((data.tags || [])[(data.tags || []).length - 1])
                                }
                            }}
                            onBlur={handleAddTag}
                            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                            placeholder={(data.tags || []).length === 0 ? "Add tags like SaaS, B2B..." : ""}
                        />
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {initialData.tags && initialData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-3 py-1 font-normal bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700">
                                {tag}
                            </Badge>
                        ))}
                        {(!initialData.tags || initialData.tags.length === 0) && (
                            <span className="text-gray-400 italic text-sm">No tags added</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
