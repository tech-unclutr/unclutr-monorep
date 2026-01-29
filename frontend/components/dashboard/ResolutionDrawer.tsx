"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, ExternalLink, ArrowRight, BookOpen, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InsightObject } from "./InsightCard"
import { SimulationSlider } from "./SimulationSlider"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResolutionDrawerProps {
    insight: InsightObject | null
    isOpen: boolean
    onClose: () => void
    onFeedback: (status: 'ACCEPTED' | 'REJECTED', comment?: string) => void
    companyId: string | null
    brandId: string | null
}

interface PlaybookStep {
    id: string
    text: string
    type: string
    link?: string
    action_label?: string
}

interface Playbook {
    title: string
    steps: PlaybookStep[]
    simulation_params?: any
}

export function ResolutionDrawer({ insight, isOpen, onClose, onFeedback, companyId, brandId }: ResolutionDrawerProps) {
    const [playbook, setPlaybook] = useState<Playbook | null>(null)
    const [loading, setLoading] = useState(false)
    const [stepProgress, setStepProgress] = useState<Set<string>>(new Set())
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
    const [isChatting, setIsChatting] = useState(false)

    useEffect(() => {
        if (insight && isOpen) {
            fetchPlaybook()
        }
    }, [insight, isOpen])

    const fetchPlaybook = async () => {
        if (!insight || !brandId) return
        setLoading(true)
        try {
            // Determine insight type from ID or meta
            const type = insight.id.includes("slow_mover") ? "slow_movers"
                : insight.id.includes("ad_waste") ? "ad_waste_proxy_returns"
                    : "generic"

            const productId = insight.meta?.product_id || insight.meta?.shopify_product_id || ""

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/intelligence/playbook/${type}?product_id=${productId}`, {
                headers: { 'X-Company-ID': companyId || '' }
            })
            if (res.ok) {
                setPlaybook(await res.json())
            }
        } catch (e) {
            console.error("Failed to fetch playbook", e)
        } finally {
            setLoading(false)
        }
    }

    const toggleStep = (id: string) => {
        const next = new Set(stepProgress)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setStepProgress(next)
    }

    if (!isOpen || !insight) return null

    const simConfig = playbook?.simulation_params?.ui_config || {}

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl pointer-events-auto flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-slate-900 z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[10px] px-2 py-0.5">
                                STRATEGIC ADVISOR
                            </Badge>
                            <span className="text-white/40 text-xs">AI-Generated Playbook</span>
                        </div>
                        <h2 className="text-xl font-bold text-white leading-tight">
                            {playbook?.title || insight.title}
                        </h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8">
                        {/* 1. Context */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                                The Situation
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed">
                                {insight.description}
                            </p>
                        </div>

                        {/* 2. Simulation (If applicable) */}
                        {playbook?.simulation_params && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    Simulation
                                </h4>
                                <SimulationSlider
                                    label={simConfig.label || "Discount Rate"}
                                    min={simConfig.min || 0}
                                    max={simConfig.max || 100}
                                    defaultValue={simConfig.default || 20}
                                    unit={simConfig.unit || "%"}
                                    onChange={() => { }}
                                    impactFactor={simConfig.impact_factor || 150}
                                    impactLabel={simConfig.impact_label || "Estimated Impact"}
                                />
                            </div>
                        )}

                        {/* 3. Steps */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Action Plan
                            </h4>

                            {loading ? (
                                <div className="text-center py-8 text-white/30 text-sm animate-pulse">Generating Strategy...</div>
                            ) : (
                                <div className="space-y-3">
                                    {playbook?.steps.map((step, idx) => (
                                        <div
                                            key={step.id}
                                            onClick={() => toggleStep(step.id)}
                                            className={`
                                                group relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                                                ${stepProgress.has(step.id)
                                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}
                                            `}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`
                                                    mt-0.5 h-5 w-5 rounded-full flex items-center justify-center border transition-colors
                                                    ${stepProgress.has(step.id)
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "border-white/30 text-transparent"}
                                                `}>
                                                    <CheckCircle className="h-3 w-3" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium transition-colors ${stepProgress.has(step.id) ? "text-emerald-200" : "text-white/90"}`}>
                                                        {step.text}
                                                    </p>
                                                    {step.link && (
                                                        <a
                                                            href={step.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {step.action_label || "Open Link"} <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* 4. Chat Advisor */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="bg-indigo-500/20 text-indigo-400 p-1 rounded">
                                    AI
                                </span>
                                Ask Unclutr
                            </h4>

                            <div className="bg-black/20 rounded-lg p-3 min-h-[100px] text-xs text-white/70 space-y-3">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-white/10 text-white/80'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isChatting && <div className="text-white/30 animate-pulse text-[10px]">Thinking...</div>}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                    placeholder="Ask 'Why is this happening?'..."
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value) {
                                            const txt = e.currentTarget.value
                                            e.currentTarget.value = ""
                                            setChatHistory(prev => [...prev, { role: 'user', content: txt }])
                                            setIsChatting(true)
                                            try {
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/intelligence/chat`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId || '' },
                                                    body: JSON.stringify({ insight, message: txt })
                                                })
                                                const data = await res.json()
                                                setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }])
                                            } catch (err) {
                                                setChatHistory(prev => [...prev, { role: 'assistant', content: "Connection error." }])
                                            } finally {
                                                setIsChatting(false)
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur top-auto bottom-0 z-20">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-white/5 text-white/60"
                            onClick={() => {
                                onFeedback('REJECTED', "Not relevant right now")
                                onClose()
                            }}
                        >
                            Not Now
                        </Button>
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={() => {
                                onFeedback('ACCEPTED', "I followed the steps")
                                onClose()
                            }}
                        >
                            Mark as Resolved
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function Badge({ children, className, variant }: any) {
    return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}
