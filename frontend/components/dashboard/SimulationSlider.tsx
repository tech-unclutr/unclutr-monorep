"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface SimulationSliderProps {
    label: string
    min: number
    max: number
    defaultValue: number
    unit?: string
    step?: number
    onChange: (val: number) => void
    impactFactor: number // Multiplier for simulation (e.g. revenue change per unit)
    impactLabel: string
}

export function SimulationSlider({
    label, min, max, defaultValue, unit = "", step = 1,
    onChange, impactFactor, impactLabel
}: SimulationSliderProps) {
    const [value, setValue] = useState([defaultValue])
    const [impact, setImpact] = useState(0)

    useEffect(() => {
        setImpact(value[0] * impactFactor)
        onChange(value[0])
    }, [value])

    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-white/80">{label}</label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50 bg-black/20 px-2 py-1 rounded">
                        {value[0]}{unit}
                    </span>
                </div>
            </div>

            <Slider
                defaultValue={[defaultValue]}
                max={max}
                min={min}
                step={step}
                onValueChange={setValue}
                className="py-2"
            />

            <motion.div
                key={impact}
                initial={{ opacity: 0.5, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between text-xs"
            >
                <span className="text-white/40">Projected Impact</span>
                <Badge variant="outline" className={`border-none ${impact > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {impact > 0 ? "+" : ""}{impact.toLocaleString(undefined, { maximumFractionDigits: 0 })} {impactLabel}
                </Badge>
            </motion.div>
        </div>
    )
}
