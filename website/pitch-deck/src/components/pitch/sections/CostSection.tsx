import { useScrollAnimation } from "@/lib/useScrollAnimation";
import type { SlideMode } from "@/lib/slides";
import { AlertTriangle, Activity, Zap, Target, TrendingDown } from "lucide-react";

export default function CostSection({ mode = "detailed", revealStep }: { mode?: SlideMode; revealStep?: number }) {
  const isPresenter = mode === "presenter";
  const isDownload = mode === "download";
  const isPresenterLike = isPresenter || isDownload;
  const { ref, revealed } = useScrollAnimation(0.15, isPresenterLike);

  // Presenter reveal logic (mirrors HeroSection pattern)
  const step = isPresenterLike ? (revealStep ?? 0) : 999;
  const atStep = (n: number) => step >= n;

  const revealClass = (n: number) =>
    isPresenterLike
      ? `transition-all duration-500 ease-out ${atStep(n) ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-6 blur-[6px]"}`
      : `transition-all duration-1000 ease-out ${revealed ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-8 blur-[8px]"}`;

  const punchClass = (n: number) =>
    isPresenterLike
      ? `reveal-step-punch ${atStep(n) ? "revealed" : ""}`
      : `transition-all duration-1000 ease-out ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

  // For internal stagger within a single step — kept very fast
  const stagger = (stepN: number, idx: number, baseMs = 0, gapMs = 100) => {
    if (isDownload) return { transitionDelay: "0ms" };
    if (isPresenter) return { transitionDelay: atStep(stepN) ? `${baseMs + idx * gapMs}ms` : "0ms" };
    return { transitionDelay: `${baseMs + idx * 200}ms` };
  };

  return (
    <section
      id="cost"
      className={`relative w-full flex flex-col justify-center ${isPresenter ? "h-screen px-16 py-12" : "h-[100dvh] py-0 px-6 sm:px-12 md:px-16"}`}
    >
      {/* Ambient warm top-glow — Apple signature */}
      <div className="absolute inset-0 sq-warm-radial" />

      {/* Cinematic Aurora Background - Theme Aware */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-80 transition-opacity duration-1000">
        <div
          className="absolute rounded-full animate-mesh-drift"
          style={{
            width: "90vw",
            height: "90vw",
            left: "-25%",
            top: "-35%",
            background: "radial-gradient(circle, hsl(16 85% 52% / 0.15) 0%, transparent 55%)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute rounded-full animate-mesh-drift"
          style={{
            width: "70vw",
            height: "70vw",
            right: "-15%",
            bottom: "-25%",
            background: "radial-gradient(circle, hsl(32 95% 62% / 0.1) 0%, transparent 60%)",
            filter: "blur(100px)",
            animationDelay: "-15s"
          }}
        />
        <div className="absolute inset-0 sq-hero-grid opacity-[0.03] dark:opacity-[0.07]" />
      </div>

      <div className={`max-w-[1400px] mx-auto w-full relative z-10 flex-1 flex flex-col justify-center ${isPresenter ? "py-4" : "py-8 md:py-10"}`} ref={ref}>

        {/* ─── PRESENTER MODE LAYOUT ─── */}
        {isPresenter && (
          <div className="flex flex-col h-full w-full justify-center max-w-6xl mx-auto relative">

            {/* ── STEP 1: Headline + Subtitle ── */}
            <div className={`mb-8 ${revealClass(1)}`}>
              <div className="flex items-center gap-5 mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_30px_rgba(255,59,48,0.2)] border border-[#FF3B30]/30 bg-[#FF3B30]/10 text-[#FF3B30] relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 blur-md rounded-full mix-blend-overlay" />
                  <AlertTriangle size={28} className="relative z-10" />
                </div>
                <h2 className="font-display font-black tracking-tighter leading-[1.02] text-[clamp(3.5rem,6vw,5.5rem)] text-foreground text-balance drop-shadow-sm">
                  The Illusion of{" "}
                  <span className="text-muted-foreground opacity-80">Certainty</span>
                </h2>
              </div>
              <p className="text-lg md:text-xl font-medium tracking-tight text-muted-foreground/70 max-w-2xl text-balance leading-relaxed ml-[4.75rem]">
                A ₹3.3Cr post-mortem from a leading D2C personal care brand
              </p>
            </div>

            {/* ── Two-Column Body ── */}
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-14 items-start flex-1 min-h-0">

              {/* ── STEP 2: Left Column — Sunk Cost Widgets ── */}
              <div className={`flex flex-col justify-center gap-6 ${revealClass(2)}`}>

                {/* Widget 1: Inventory */}
                <div
                  className="flex items-center gap-6 p-6 rounded-[24px] border border-white/60 dark:border-white/10 bg-white/45 dark:bg-black/40 backdrop-blur-[64px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06),0_12px_24px_-8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-[420px] transition-all duration-700 relative overflow-hidden group hover:-translate-y-1"
                  style={stagger(2, 0)}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] shrink-0">
                    <Zap size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70 mb-1">Locked in Inventory</div>
                    <div className="text-4xl font-black text-foreground tracking-tighter line-through decoration-[#FF3B30]/60 decoration-2 drop-shadow-sm">₹2.5Cr</div>
                  </div>
                </div>

                {/* Widget 2: Marketing */}
                <div
                  className="flex items-center gap-6 p-6 rounded-[24px] border border-white/60 dark:border-white/10 bg-white/45 dark:bg-black/40 backdrop-blur-[64px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06),0_12px_24px_-8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-[420px] ml-16 transition-all duration-700 relative overflow-hidden group hover:-translate-y-1"
                  style={stagger(2, 1)}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500] shrink-0">
                    <Target size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70 mb-1">Launch Marketing</div>
                    <div className="text-4xl font-black text-foreground tracking-tighter line-through decoration-[#FF9500]/60 decoration-2 drop-shadow-sm">₹80L</div>
                  </div>
                </div>

                {/* Bottom Line Card */}
                <div
                  className={`mt-6 transition-all duration-700 ${revealClass(4)}`}
                  style={stagger(4, 0, 0, 150)}
                >
                  <div className="rounded-[28px] p-7 md:p-8 border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/30 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-2xl relative overflow-hidden max-w-[480px]">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4 text-[#FF3B30] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF3B30] shadow-[0_0_12px_rgba(255,59,48,0.8)] animate-[pulse_3s_ease-in-out_infinite]" />
                      The Bottom Line
                    </p>
                    <p className="text-[1.75rem] lg:text-[2rem] font-semibold tracking-tight text-foreground/90 mb-1 leading-tight">
                      Customer understanding shouldn't
                    </p>
                    <p className="text-[2rem] lg:text-[2.5rem] font-black bg-clip-text text-transparent inline-block leading-tight drop-shadow-sm pb-1" style={{ background: 'linear-gradient(135deg, hsl(10 90% 42%), hsl(18 90% 55%) 45%, hsl(34 90% 65%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      cost you ₹3.3Cr
                    </p>
                  </div>
                </div>
              </div>

              {/* ── STEP 3: Right Column — Timeline Card ── */}
              <div className={`relative w-full flex flex-col justify-center ${revealClass(3)}`}>

                {/* Ambient back-glow */}
                <div className="absolute inset-0 blur-[80px] opacity-60 rounded-[32px] -z-10" style={{ background: 'radial-gradient(ellipse at 30% 50%, hsl(16 85% 52% / 0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, hsl(32 95% 62% / 0.12) 0%, transparent 55%)' }} />

                <div className="rounded-[28px] p-7 lg:p-9 border border-white/50 dark:border-white/10 bg-white/48 dark:bg-[#060606]/40 backdrop-blur-[60px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.07),0_16px_32px_-10px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden relative">

                  {/* Internal glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3B30]/10 blur-[100px] rounded-full pointer-events-none" />

                  <div className="relative z-10">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] mb-7 text-muted-foreground/80 flex items-center gap-2">
                      <Activity size={16} /> Chronology of a Miss
                    </h3>

                    {/* Vertical Narrative Timeline */}
                    <div className="relative ml-6 border-l-[1.5px] border-border/40 space-y-6 pb-2">
                      {[
                        {
                          phase: "Q1",
                          title: "The False Peak",
                          desc: "Customer interviews completed. External trackers signed off.",
                          highlight: "Confidence is at 100%.",
                          icon: <Target size={16} className="text-[hsl(var(--sq-gold-leaf))]" />,
                        },
                        {
                          phase: "Launch",
                          title: "The Trap",
                          desc: "₹2.5Cr locked in inventory. ₹80L committed to launch marketing.",
                          highlight: "The decision is now largely irreversible.",
                          icon: <Zap size={16} className="text-[hsl(var(--sq-ember))]" />,
                        },
                        {
                          phase: "Q3",
                          title: "The Reality Check",
                          desc: "CAC spikes 3x. Repeat purchases flatline. Retail partners threaten to drop SKUs.",
                          icon: <TrendingDown size={16} className="text-red-500" />,
                        },
                        {
                          phase: "Post-Mortem",
                          title: "The Blind Spot",
                          desc: "The price-pack architecture was flawed—a crucial nuance missed entirely in static reports.",
                          isRed: true,
                          icon: <AlertTriangle size={16} className="text-white drop-shadow-md" />,
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="relative pl-7 transition-all duration-400 ease-out"
                          style={{
                            ...stagger(3, idx, 100, 120),
                            opacity: atStep(3) ? 1 : 0,
                            transform: atStep(3) ? 'translateX(0)' : 'translateX(16px)',
                          }}
                        >
                          {/* Glowing Node */}
                          <div className={`absolute -left-[19px] top-1 w-9 h-9 rounded-full flex flex-shrink-0 items-center justify-center bg-card border-[1.5px] z-10 ${item.isRed ? 'border-[#FF3B30] bg-white dark:bg-black shadow-[0_0_24px_rgba(255,59,48,0.4),inset_0_0_10px_rgba(255,59,48,0.1)]' : 'border-border shadow-sm'}`}>
                            {item.isRed ? <AlertTriangle size={15} className="text-[#FF3B30] drop-shadow-sm" /> : item.icon}
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{item.phase}</span>
                            <h4 className={`text-xl font-black tracking-tighter ${item.isRed ? 'text-[#FF3B30]' : 'text-foreground/90'}`}>{item.title}</h4>
                            <p className="text-[13px] font-medium text-muted-foreground leading-snug mt-1 max-w-sm">{item.desc}</p>
                            {item.highlight && (
                              <p className={`text-xs font-bold tracking-wide mt-1.5 ${idx === 0 ? "text-[hsl(var(--sq-gold-leaf))]" : "text-[#FF3B30]"}`}>
                                {item.highlight}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Where It Broke Down */}
                      <div
                        className="relative pl-7 mt-6 pt-5 border-t border-border/40 transition-all duration-400 ease-out"
                        style={{
                          ...stagger(3, 4, 100, 120),
                          opacity: atStep(3) ? 1 : 0,
                          transform: atStep(3) ? 'translateY(0)' : 'translateY(16px)',
                        }}
                      >
                        <h5 className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 text-[#FF3B30] opacity-90">Where It Broke Down</h5>
                        <ul className="space-y-3">
                          {[
                            <><strong className="text-foreground/90 font-black">Spreadsheets over Humans:</strong> Nuance was lost in static tracking reports.</>,
                            <><strong className="text-foreground/90 font-black">Broken Handoffs:</strong> The raw insight got lost before the final build.</>,
                            <><strong className="text-foreground/90 font-black">Blind Bets:</strong> Risked ₹3.3Cr without a final reality check.</>,
                          ].map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 transition-all duration-300"
                              style={{
                                ...stagger(3, idx + 5, 100, 80),
                                opacity: atStep(3) ? 1 : 0,
                                transform: atStep(3) ? 'translateX(0)' : 'translateX(10px)',
                              }}
                            >
                              <div className="mt-[3px] w-4 h-4 rounded-full flex flex-shrink-0 items-center justify-center bg-[#FF3B30]/5 text-[#FF3B30] border border-[#FF3B30]/20 text-[8px] font-black">✕</div>
                              <span className="text-[13px] text-foreground/70 font-medium leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>


          </div>
        )}

        {/* ─── DETAILED MODE LAYOUT ─── */}
        {!isPresenter && (
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-12 items-center flex-1">
            
            {/* Left Column: The Punchline */}
             <div className="flex flex-col justify-center gap-5">
               <div className={`transition-all duration-1000 ease-out ${revealed ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-8 blur-[8px]"}`}>
                 <div className="inline-flex items-center justify-center w-12 h-12 mb-6 rounded-full shadow-[0_0_30px_rgba(255,59,48,0.2)] border border-[#FF3B30]/30 bg-[#FF3B30]/10 text-[#FF3B30] relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/20 blur-md rounded-full mix-blend-overlay" />
                   <AlertTriangle size={24} className="relative z-10" />
                 </div>
                  <h2 className="font-display font-black tracking-tighter leading-[1.02] mb-4 text-[3.5rem] md:text-[4rem] text-foreground text-balance drop-shadow-sm">
                    The Illusion of <br className="hidden md:block" />
                    <span className="text-muted-foreground opacity-80">Certainty</span>
                  </h2>
                  <p className="text-base md:text-lg font-medium tracking-tight text-muted-foreground/70 mb-4 max-w-lg text-balance leading-relaxed">
                    A ₹3.3Cr post-mortem from a leading D2C personal care brand
                  </p>
               </div>

               {/* Concept A: "Sunk Cost" UI Widgets (Apple-Premium Data Driven) */}
                <div className={`relative w-full flex flex-col gap-3 transition-all duration-[1.5s] ${revealed ? 'opacity-100 filter-none translate-x-0' : 'opacity-0 blur-md -translate-x-8'}`} style={{ transitionDelay: '800ms' }}>
                 
                 {/* Widget 1: Inventory */}
                  <div className="flex items-center gap-5 p-4 rounded-[20px] border border-white/50 dark:border-white/10 bg-white/45 dark:bg-black/40 backdrop-blur-[60px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06),0_12px_24px_-8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-[360px] group hover:-translate-y-1 hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF3B30]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    {/* Inner glowing edge */}
                    <div className="absolute top-0 left-0 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 blur-sm mix-blend-overlay group-hover:bg-white/40 transition-colors duration-500" />
                       <Zap size={18} className="relative z-10" />
                    </div>
                    <div className="relative z-10">
                       <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Locked in Inventory</div>
                       <div className="text-2xl font-black text-foreground tracking-tighter line-through decoration-[#FF3B30]/60 decoration-2 drop-shadow-sm">₹2.5Cr</div>
                    </div>
                 </div>

                 {/* Widget 2: Marketing */}
                  <div className="flex items-center gap-5 p-4 rounded-[20px] border border-white/50 dark:border-white/10 bg-white/45 dark:bg-black/40 backdrop-blur-[60px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06),0_12px_24px_-8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] max-w-[360px] ml-10 group hover:-translate-y-1 hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF9500]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500] shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 blur-sm mix-blend-overlay group-hover:bg-white/40 transition-colors duration-500" />
                       <Target size={18} className="relative z-10" />
                    </div>
                    <div className="relative z-10">
                       <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Launch Marketing</div>
                       <div className="text-2xl font-black text-foreground tracking-tighter line-through decoration-[#FF9500]/60 decoration-2 drop-shadow-sm">₹80L</div>
                    </div>
                 </div>

               </div>

               {/* The Bottom Line */}
                <div className={`transition-all duration-1000 ease-out ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: '600ms' }}>
                   <div className="rounded-[24px] p-6 md:p-8 border border-white/30 dark:border-white/10 bg-white/50 dark:bg-black/30 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-2xl group hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5 transition-all duration-700 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3B30]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     <p className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] mb-3 text-[#FF3B30] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shadow-[0_0_10px_rgba(255,59,48,0.8)] animate-[pulse_3s_ease-in-out_infinite]"></span>
                        The Bottom Line
                      </p>
                       <p className="relative z-10 text-[1.5rem] lg:text-[1.75rem] font-semibold tracking-tight text-foreground mb-1">
                         Customer understanding shouldn't
                       </p>
                       <p className="relative z-10 text-[1.75rem] lg:text-[2rem] font-black bg-clip-text text-transparent inline-block leading-tight drop-shadow-sm pb-1" style={{ background: 'linear-gradient(135deg, hsl(10 90% 42%), hsl(16 85% 54%) 45%, hsl(22 95% 65%) 75%, hsl(32 95% 62%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          cost you ₹3.3Cr.
                       </p>
                   </div>
               </div>
            </div>

            {/* Right Column: Narrative Timeline (Premium Glass Card) */}
             <div className={`relative w-full flex flex-col justify-center transition-all duration-1000 ease-out ${revealed ? "opacity-100 translate-y-0 slide-enter-active" : "opacity-0 translate-y-12 slide-enter"}`} style={{ transitionDelay: '400ms' }}>
               
               {/* Ambient back-glow for the card */}
               <div className="absolute inset-0 blur-[80px] opacity-60 rounded-[32px] -z-10" style={{ background: 'radial-gradient(ellipse at 30% 50%, hsl(16 85% 52% / 0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, hsl(32 95% 62% / 0.12) 0%, transparent 55%)' }} />
               
               <div className="rounded-[28px] p-7 lg:p-9 border border-white/50 dark:border-white/10 bg-white/48 dark:bg-[#0a0a0a] backdrop-blur-[60px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.07),0_16px_32px_-10px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden relative group">
                  
                  {/* Custom Glare effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-[2.5s] ease-in-out pointer-events-none" />
                  
                  {/* Internal top highlight specular */}
                  <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.5)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Internal subtle glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF3B30]/10 blur-[100px] rounded-full pointer-events-none" />
                  
                  <div className="relative z-10">
                     <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 text-muted-foreground/80 flex items-center gap-2">
                        <Activity size={16} /> Chronology of a Miss
                     </h3>
                     
                     {/* Vertical Narrative Timeline */}
                     <div className="relative ml-6 border-l-[1.5px] border-border/40 space-y-7 pb-2">
                        
                        {[
                          { 
                            phase: "Q1", 
                            title: "The False Peak", 
                            desc: "Customer interviews completed. External trackers signed off.",
                            highlight: "Confidence is at 100%.", 
                            icon: <Target size={16} className="text-[hsl(var(--sq-gold-leaf))]" /> 
                          },
                          { 
                            phase: "Launch", 
                            title: "The Trap", 
                            desc: "₹2.5Cr locked in inventory. ₹80L committed to launch marketing.",
                            highlight: "The decision is now largely irreversible.", 
                            icon: <Zap size={16} className="text-[hsl(var(--sq-ember))]" /> 
                          },
                          { 
                            phase: "Q3", 
                            title: "The Reality Check", 
                            desc: "CAC spikes 3x. Repeat purchases flatline. Retail partners threaten to drop SKUs.",
                            icon: <TrendingDown size={16} className="text-red-500" /> 
                          },
                          { 
                            phase: "Post-Mortem", 
                            title: "The Blind Spot", 
                            desc: "The price-pack architecture was flawed—a crucial nuance missed entirely in static reports.",
                            isRed: true,
                            icon: <AlertTriangle size={16} className="text-white drop-shadow-md" /> 
                          }
                        ].map((item, idx) => (
                           <div key={idx} className={`relative pl-7 transition-all duration-700 ease-out group`} style={{ transitionDelay: `${800 + idx*200}ms`, opacity: revealed ? 1 : 0, transform: revealed ? 'translateX(0)' : 'translateX(16px)' }}>
                              
                              {/* Glowing Node */}
                              <div className={`absolute -left-[19px] top-1 w-9 h-9 rounded-full flex flex-shrink-0 items-center justify-center bg-card border-[1.5px] z-10 transition-all duration-500 ease-out group-hover:scale-110 ${item.isRed ? 'border-[#FF3B30] bg-white dark:bg-black shadow-[0_0_24px_rgba(255,59,48,0.4),inset_0_0_10px_rgba(255,59,48,0.1)]' : 'border-border shadow-sm group-hover:border-foreground/30 group-hover:shadow-md'}`}>
                                 {item.isRed ? <AlertTriangle size={15} className="text-[#FF3B30] drop-shadow-sm" /> : item.icon}
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">{item.phase}</span>
                                <h4 className={`text-xl font-black tracking-tighter transition-colors ${item.isRed ? 'text-[#FF3B30]' : 'text-foreground/90 group-hover:text-foreground'}`}>{item.title}</h4>
                                 <p className="text-[13px] font-medium text-foreground/75 dark:text-foreground/80 leading-snug mt-1 max-w-sm">
                                  {item.desc}
                                </p>
                                {item.highlight && (
                                   <p className={`text-xs font-bold tracking-wide mt-1.5 ${idx === 0 ? "text-[hsl(var(--sq-gold-leaf))]" : "text-[#FF3B30]"}`}>
                                     {item.highlight}
                                   </p>
                                )}
                              </div>
                           </div>
                        ))}

                        {/* What Broke - Attached to the bottom of the timeline as the conclusion */}
                        <div className={`relative pl-7 mt-8 pt-6 border-t border-border/40 transition-all duration-[1.2s] ease-out`} style={{ transitionDelay: '1400ms', opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0)' : 'translateY(24px)' }}>
                           <h5 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-[#FF3B30] line-clamp-1 opacity-90">Where It Broke Down</h5>
                           <ul className="space-y-3.5">
                              {[
                                <><strong className="text-foreground/90 font-black">Spreadsheets over Humans:</strong> Nuance was lost in static tracking reports.</>,
                                <><strong className="text-foreground/90 font-black">Broken Handoffs:</strong> The raw insight got lost before the final build.</>,
                                <><strong className="text-foreground/90 font-black">Blind Bets:</strong> Risked ₹3.3Cr without a final reality check.</>,
                              ].map((point, idx) => (
                                <li key={idx} className="flex items-start gap-4 group/item">
                                  <div className="mt-[3px] w-4 h-4 rounded-full flex flex-shrink-0 items-center justify-center bg-[#FF3B30]/5 text-[#FF3B30] border border-[#FF3B30]/20 text-[8px] font-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] group-hover/item:bg-[#FF3B30]/10 transition-colors duration-300">✕</div>
                                  <span className="text-[13px] text-foreground/70 font-medium leading-relaxed group-hover/item:text-foreground/90 transition-colors duration-300">{point}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                     </div>

                  </div>
               </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
