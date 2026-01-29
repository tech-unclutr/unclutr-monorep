"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, LayoutGrid, Pause, Play, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InsightCard, InsightObject } from "./InsightCard"
import { MorningBriefingCard } from "./MorningBriefingCard"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { ResolutionDrawer } from "./ResolutionDrawer"

// Extended type to include briefing
type DeckItem = InsightObject | { id: 'briefing', type: 'briefing', content: string }

interface InsightDeckProps {
    brandId: string | null
    companyId: string | null
    fallbackDetail?: any
    initialDeck?: DeckItem[]
}

export function InsightDeck({ brandId, companyId, fallbackDetail, initialDeck }: InsightDeckProps) {
    const [deck, setDeck] = useState<DeckItem[]>([])
    const [originalDeck, setOriginalDeck] = useState<InsightObject[]>([]) // Keep track of pure insights
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [health, setHealth] = useState<string | null>(null)

    // Fetch Deck
    const fetchDeck = async () => {
        if (!brandId || !companyId) return

        try {
            setLoading(true)
            const token = await auth.currentUser?.getIdToken()

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/intelligence/deck/${brandId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Company-ID': companyId || ''
                }
            })

            if (res.ok) {
                const data = await res.json()

                let deckItems: DeckItem[] = []

                // 1. Add Morning Briefing if exists
                if (data.briefing) {
                    deckItems.push({
                        id: 'briefing',
                        type: 'briefing',
                        content: data.briefing
                    })
                }

                // 2. Add Insights
                if (data.insights && Array.isArray(data.insights)) {
                    deckItems = [...deckItems, ...data.insights]
                    setOriginalDeck(data.insights)
                    setDeck(deckItems)
                    setLastUpdated(new Date())
                }

                // Handle System Health
                if (data.system_health) {
                    setHealth(data.system_health.status);
                }

            } else {
                console.error("Failed to fetch deck:", res.status)
                setError("Failed to load insights")
            }
        } catch (err) {
            console.error("Deck fetch error:", err)
            setError("Connection error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDeck()
    }, [brandId, companyId])

    // Auto-play Logic
    useEffect(() => {
        if (!autoPlay || deck.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % deck.length)
        }, 5000) // 5 seconds per card

        return () => clearInterval(interval)
    }, [autoPlay, deck.length, currentIndex])

    // Track Impression (Fire & Forget)
    // Track Impression (Fire & Forget)
    useEffect(() => {
        if (deck.length > 0 && deck[currentIndex]) {
            const currentItem = deck[currentIndex];

            // Skip tracking for briefing card
            if ('type' in currentItem && currentItem.type === 'briefing') return;

            const trackImpression = async () => {
                if (!brandId || !companyId) return
                try {
                    const token = await auth.currentUser?.getIdToken()
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/intelligence/impression`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                            'X-Company-ID': companyId || ''
                        },
                        body: JSON.stringify({
                            brand_id: brandId,
                            insight_id: (currentItem as InsightObject).id,
                            clicked: false,
                            dismissed: false
                        })
                    })
                } catch (e) {
                    // Ignore tracking errors
                }
            }
            trackImpression()
        }
    }, [currentIndex, deck, brandId, companyId])




    // Handlers
    const nextCard = () => {
        setAutoPlay(false)
        setCurrentIndex((prev) => (prev + 1) % deck.length)
    }

    const prevCard = () => {
        setAutoPlay(false)
        setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length)
    }

    const toggleAutoPlay = () => setAutoPlay(!autoPlay)

    // Resolution Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [activeInsight, setActiveInsight] = useState<InsightObject | null>(null)

    const handleAction = (insight: InsightObject) => {
        setAutoPlay(false) // Pause deck
        setActiveInsight(insight)
        setDrawerOpen(true)
    }

    const handleFeedback = async (status: 'ACCEPTED' | 'REJECTED', comment?: string) => {
        if (!brandId || !companyId || !activeInsight) return

        try {
            const token = await auth.currentUser?.getIdToken()
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/intelligence/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'X-Company-ID': companyId
                },
                body: JSON.stringify({
                    insight_id: activeInsight.id,
                    brand_id: brandId,
                    status: status,
                    user_comment: comment,
                    // Assume positive intent for ACCEPTED for now
                    verification_intent: status === 'ACCEPTED' ? { type: 'manual_fix_check', insight_id: activeInsight.id } : null
                })
            })

            // Remove from deck instantly (Optimistic UI)
            if (status === 'ACCEPTED' || status === 'REJECTED') {
                const newDeck = deck.filter(item => {
                    if ('id' in item) return item.id !== activeInsight.id
                    return true
                })
                setDeck(newDeck)
                if (currentIndex >= newDeck.length) setCurrentIndex(Math.max(0, newDeck.length - 1))
            }

        } catch (e) {
            console.error("Feedback failed", e)
        }
    }


    // ------------------------------------------------------------------
    // Loading State
    // ------------------------------------------------------------------
    if (loading && deck.length === 0) {
        return (
            <div className="h-full min-h-[200px] flex items-center justify-center p-6 bg-white/5 rounded-xl border border-white/5 animate-pulse">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="space-y-2 w-full max-w-[200px]">
                        <div className="h-3 bg-white/10 rounded w-full" />
                        <div className="h-3 bg-white/10 rounded w-2/3 mx-auto" />
                    </div>
                </div>
            </div>
        )
    }

    // ------------------------------------------------------------------
    // Empty State
    // ------------------------------------------------------------------
    if (deck.length === 0) {
        return (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <LayoutGrid className="h-5 w-5 text-white/20" />
                </div>
                <h3 className="text-sm font-medium text-white/50">No critical insights found</h3>
                <p className="text-xs text-white/30 mt-1 max-w-[200px]">
                    Your metrics look stable. We'll alert you if anomalies are detected.
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-xs text-white/40 hover:text-white"
                    onClick={fetchDeck}
                >
                    <RefreshCw className="h-3 w-3 mr-2" /> Refresh
                </Button>
            </div>
        )
    }

    // ------------------------------------------------------------------
    // Carousel UI
    // ------------------------------------------------------------------
    return (
        <div className="relative h-full flex flex-col">
            <ResolutionDrawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false)
                    setAutoPlay(true)
                }}
                insight={activeInsight}
                companyId={companyId}
                brandId={brandId}
                onFeedback={handleFeedback}
            />

            {/* The Card */}
            <div className="flex-1 relative min-h-[220px] overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x; // positive = right, negative = left

                            if (swipe < -50) {
                                // Swiped Left -> Next
                                nextCard();
                            } else if (swipe > 50) {
                                // Swiped Right -> Prev
                                prevCard();
                            }
                        }}
                        className="h-full touch-pan-y cursor-grab active:cursor-grabbing"
                    >
                        {deck[currentIndex] && (
                            'type' in deck[currentIndex] && deck[currentIndex].type === 'briefing' ? (
                                <MorningBriefingCard
                                    briefing={(deck[currentIndex] as any).content}
                                    isActive={true}
                                />
                            ) : (
                                <InsightCard
                                    insight={deck[currentIndex] as InsightObject}
                                    isActive={true}
                                    onAction={handleAction}
                                />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>



            {/* Progress Bar */}
            {
                autoPlay && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-10">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                            className="h-full bg-white/30"
                        />
                    </div>
                )
            }

            {/* Controls */}
            <div className="mt-4 flex items-center justify-between px-2">
                {/* Pagination Dots */}
                <div className="flex items-center gap-1.5">
                    {deck.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setAutoPlay(false)
                                setCurrentIndex(idx)
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                ? "w-6 bg-white"
                                : "w-1.5 bg-white/20 hover:bg-white/40"
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
                        onClick={toggleAutoPlay}
                        title={autoPlay ? "Pause Auto-play" : "Resume Auto-play"}
                    >
                        {autoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>

                    <div className="w-px h-3 bg-white/10 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
                        onClick={prevCard}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
                        onClick={nextCard}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div >
    )
}
