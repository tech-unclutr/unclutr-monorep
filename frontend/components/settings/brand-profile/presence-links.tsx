"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Globe, Instagram, Link as LinkIcon, Pencil, Trash2, X, Check } from "lucide-react"
import { PresenceLink } from "@/types/company"
import { v4 as uuidv4 } from "uuid"

interface PresenceLinksProps {
    data: PresenceLink[]
    onUpdate: (links: PresenceLink[]) => void
}

const getIcon = (type: string) => {
    switch (type) {
        case 'website': return <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
        case 'instagram': return <Instagram className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
        case 'amazon': return <div className="w-5 h-5 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-xs">A</div>
        case 'nykaa': return <div className="w-5 h-5 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-xs">N</div>
        default: return <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
    }
}

export function PresenceLinks({ data: initialData, onUpdate }: PresenceLinksProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [links, setLinks] = useState<PresenceLink[]>(initialData)

    const handleSave = () => {
        setIsEditing(false)
        onUpdate(links)
    }

    const handleCancel = () => {
        setIsEditing(false)
        setLinks(initialData)
    }

    const addNewLink = () => {
        setLinks([...links, { id: uuidv4(), label: "", url: "", type: "other" }])
    }

    const removeLink = (id: string) => {
        setLinks(links.filter(l => l.id !== id))
    }

    return (
        <div className="p-8 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 flex-wrap">
                <div className="flex-1 mr-2 min-w-0">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">Presence Links</h3>
                        <Badge variant="secondary" className="font-normal text-[10px] tracking-wide uppercase bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all h-5 px-1.5 rounded-md">
                            Optional
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect your digital accounts for unified tracking.</p>
                </div>

                {isEditing ? (
                    <div className="flex gap-2 shrink-0 items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="min-w-[80px]"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setLinks(initialData)
                        setIsEditing(true)
                    }} className="text-muted-foreground hover:text-foreground hover:bg-transparent my-0 shrink-0 transition-colors">
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {links.length === 0 && !isEditing && (
                    <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-xl space-y-2">
                        <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                            <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No links added</p>
                        <p className="text-xs text-gray-400 max-w-[200px]">Add your website, Instagram, and other profiles.</p>
                    </div>
                )}

                {links.map((link, index) => (
                    <div key={link.id} className="flex items-center gap-4 group py-1">
                        <div className="p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl group-hover:bg-gray-100 dark:group-hover:bg-zinc-800 transition-colors shrink-0">
                            {getIcon(link.type)}
                        </div>
                        {isEditing ? (
                            <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
                                <Input
                                    value={link.label}
                                    onChange={(e) => {
                                        const newLinks = [...links]
                                        newLinks[index].label = e.target.value
                                        setLinks(newLinks)
                                    }}
                                    className="sm:w-1/3 h-10 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500 font-medium text-gray-900"
                                    placeholder="Label"
                                />
                                <div className="flex-1 flex gap-2 w-full">
                                    <Input
                                        value={link.url}
                                        onChange={(e) => {
                                            const newLinks = [...links]
                                            newLinks[index].url = e.target.value
                                            // Simple type detection logic
                                            if (e.target.value.includes('instagram.com')) newLinks[index].type = 'instagram'
                                            else if (e.target.value.includes('amazon')) newLinks[index].type = 'amazon'
                                            else if (e.target.value.includes('nykaa')) newLinks[index].type = 'nykaa'
                                            else newLinks[index].type = 'website'

                                            setLinks(newLinks)
                                        }}
                                        className="flex-1 h-10 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm text-gray-600"
                                        placeholder="https://example.com/profile"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                                        onClick={() => removeLink(link.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-medium text-gray-900 dark:text-gray-200 truncate">{link.label || "Untitled"}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 truncate mt-0.5">{link.url || "No URL"}</p>
                            </div>
                        )}
                    </div>
                ))}

                {isEditing && (
                    <Button
                        variant="outline"
                        onClick={addNewLink}
                        className="w-full border-dashed border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-gray-200 h-11 mt-4 transition-all"
                    >
                        + Add Another Link
                    </Button>
                )}
            </div>
        </div>
    )
}
