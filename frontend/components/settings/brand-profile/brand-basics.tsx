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
        <div className="p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:border-zinc-300/80 dark:hover:border-zinc-700 group">
            <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Brand Basics</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
                        Set your public brand profile and industry benchmarking.
                    </p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={handleCancel} className="rounded-lg text-zinc-500 hover:text-zinc-900">Cancel</Button>
                        <Button size="sm" onClick={handleSave} className="rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm">Save Changes</Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setData(initialData)
                        setIsEditing(true)
                    }} className="rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100">
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12 mb-10">
                {/* Brand Name */}
                <div className="space-y-3 group/field">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Brand Name</label>
                    {isEditing ? (
                        <Input
                            value={data.brand_name}
                            onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all font-medium text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                            placeholder="Brand Name"
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{initialData.brand_name}</p>
                    )}
                </div>

                {/* Legal Name */}
                <div className="space-y-3 group/field">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Legal Name</label>
                    {isEditing ? (
                        <Input
                            value={data.legal_name || ""}
                            onChange={(e) => setData({ ...data, legal_name: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                            placeholder="Legal Entity Name"
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                            {initialData.legal_name || <span className="text-zinc-400 italic font-normal">Not set</span>}
                        </p>
                    )}
                </div>

                {/* Founded Year */}
                <div className="space-y-3 group/field">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Founded Year</label>
                    {isEditing ? (
                        <Input
                            value={data.founded_year || ""}
                            onChange={(e) => setData({ ...data, founded_year: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                            placeholder="YYYY"
                            maxLength={4}
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                            {initialData.founded_year || <span className="text-zinc-400 italic font-normal">Not set</span>}
                        </p>
                    )}
                </div>

                {/* Primary Category */}
                <div className="space-y-3 group/field relative">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Primary Category</label>
                    {isEditing ? (
                        <SearchableSelect
                            value={data.industry || ""}
                            options={d2cCategories.map(c => ({ label: c, value: c }))}
                            onChange={(val) => setData({ ...data, industry: val })}
                            placeholder="Select category..."
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 focus:border-zinc-900 dark:focus:border-zinc-100 rounded-xl h-11"
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                            {initialData.industry || <span className="text-zinc-400 italic font-normal">Not set</span>}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Tags</label>

                {isEditing ? (
                    <div
                        className="flex flex-wrap gap-2 p-3 min-h-[52px] rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-900/5 cursor-text transition-all"
                        onClick={() => tagInputRef.current?.focus()}
                    >
                        {(data.tags || []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-2.5 py-1.5 font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 shadow-sm rounded-lg">
                                {tag}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTag(tag);
                                    }}
                                    className="text-zinc-400 hover:text-red-500 focus:outline-none transition-colors"
                                >
                                    <X size={14} />
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
                            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder={(data.tags || []).length === 0 ? "Add tags..." : ""}
                        />
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {initialData.tags && initialData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-3 py-1.5 font-medium bg-zinc-100/80 text-zinc-700 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-700 rounded-md">
                                {tag}
                            </Badge>
                        ))}
                        {(!initialData.tags || initialData.tags.length === 0) && (
                            <span className="text-zinc-400 italic text-sm">No tags added</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
