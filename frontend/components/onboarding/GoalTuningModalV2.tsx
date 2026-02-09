"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, TrendingUp, DollarSign, ShieldAlert, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
// import { updateUserSettings } from "@/lib/api" // Mocking for now

import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface GoalTuningModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (goal: string) => void
}

const CARDS = [
    {
        id: "cashflow",
        icon: DollarSign,
        title: "Cashflow Hunter",
        desc: "Find dead stock & unlock trapped cash.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    },
    {
        id: "profit",
        icon: ShieldAlert,
        title: "Profit Guardian",
        desc: "Stop bleeding on Returns & Ad Waste.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        id: "growth",
        icon: Rocket,
        title: "Growth Hacker",
        desc: "Scale my best VIPs & Channels.",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20"
    }
]

export function GoalTuningModalV2({ open, onOpenChange, onSave }: GoalTuningModalProps) {
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!selected) return
        setLoading(true)
        // Simulate API call
        await new Promise(r => setTimeout(r, 800))
        onSave(selected)
        setLoading(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#09090B] border-white/10 text-white">
                <VisuallyHidden>
                    <DialogTitle>Goal Tuning</DialogTitle>
                    <DialogDescription>
                        Select your primary objective for the month to calibrate our AI insights.
                    </DialogDescription>
                </VisuallyHidden>
                <DialogHeader className="mb-4">
                    <h2 className="text-2xl text-center font-bold">What is your North Star this month?</h2>
                    <p className="text-center text-muted-foreground text-lg">
                        SquareUp will re-calibrate its AI to find the insights that matter most to you.
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    {CARDS.map((card) => (
                        <div
                            key={card.id}
                            onClick={() => setSelected(card.id)}
                            className={cn(
                                "cursor-pointer rounded-xl border p-6 flex flex-col items-center text-center transition-all duration-200 relative overflow-hidden group",
                                selected === card.id
                                    ? `${card.bg} ${card.border} ring-2 ring-offset-2 ring-offset-black ${card.color.replace('text', 'ring')}`
                                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:scale-105"
                            )}
                        >
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-colors", card.bg, card.color)}>
                                <card.icon className="h-6 w-6" />
                            </div>
                            <h3 className={cn("font-bold text-lg mb-2", selected === card.id ? "text-white" : "text-white/80")}>
                                {card.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {card.desc}
                            </p>

                            {selected === card.id && (
                                <div className="absolute top-3 right-3">
                                    <div className="bg-white/10 rounded-full p-1">
                                        <Check className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-4">
                    <Button
                        size="lg"
                        className="w-full md:w-1/3 text-lg font-semibold"
                        onClick={handleSave}
                        disabled={!selected || loading}
                    >
                        {loading ? "Calibrating..." : "Start Engine"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
