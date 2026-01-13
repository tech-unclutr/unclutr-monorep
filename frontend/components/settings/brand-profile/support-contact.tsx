"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "lucide-react"
import { Company, CompanyUpdate } from "@/types/company"
import { PhoneInput } from "@/components/ui/phone-input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { majorCities } from "@/data/cities"

interface SupportContactProps {
    data: Company
    onUpdate: (updates: CompanyUpdate) => void
}

export function SupportContact({ data: initialData, onUpdate }: SupportContactProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [data, setData] = useState(initialData)

    useEffect(() => {
        setData(initialData)
    }, [initialData])

    const handleSave = () => {
        setIsEditing(false)
        onUpdate({
            support_email: data.support_email,
            support_phone: data.support_phone,
            support_hours: data.support_hours,
            hq_city: data.hq_city
        })
    }

    const handleCancel = () => {
        setIsEditing(false)
        setData(initialData)
    }

    return (
        <div className="p-8 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700">
            <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Support & Contact</h3>
                        <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md shadow-sm">
                            Recommended
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                        Public contact info for invoices and help centers.
                    </p>
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
                        setData(initialData)
                        setIsEditing(true)
                    }} className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors">
                        <Pencil className="w-4 h-4 mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="space-y-3 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Support Email</label>
                    {isEditing ? (
                        <Input
                            value={data.support_email || ""}
                            onChange={(e) => setData({ ...data, support_email: e.target.value })}
                            className="bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all text-gray-900"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px] truncate">
                            {data.support_email || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>

                <div className="space-y-3 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Phone</label>
                    {isEditing ? (
                        <PhoneInput
                            value={data.support_phone || ""}
                            onChange={(val) => setData({ ...data, support_phone: val })}
                            className="bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all text-gray-900"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">
                            {data.support_phone || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>

                <div className="space-y-3 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Support Hours</label>
                    {isEditing ? (
                        <SearchableSelect
                            value={data.support_hours || ""}
                            options={[
                                { label: "Mon-Fri, 9am - 5pm", value: "Mon-Fri, 9am - 5pm" },
                                { label: "Mon-Sat, 10am - 7pm", value: "Mon-Sat, 10am - 7pm" },
                                { label: "24/7 Support", value: "24/7 Support" },
                                { label: "Weekdays 10am - 6pm", value: "Weekdays 10am - 6pm" },
                                { label: "Everyday 9am - 9pm", value: "Everyday 9am - 9pm" },
                            ]}
                            onChange={(val) => setData({ ...data, support_hours: val })}
                            placeholder="Select hours"
                            className="bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all text-gray-900"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">
                            {data.support_hours || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>

                <div className="space-y-3 group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">HQ City</label>
                    {isEditing ? (
                        <SearchableSelect
                            value={data.hq_city || ""}
                            options={majorCities}
                            onChange={(val) => setData({ ...data, hq_city: val })}
                            placeholder="Search city..."
                            allowCustomValue={true}
                            className="bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all text-gray-900"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">
                            {data.hq_city || <span className="text-gray-400 italic">Not set</span>}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
