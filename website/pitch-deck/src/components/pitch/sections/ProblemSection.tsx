import { useState, useEffect, useCallback } from "react";
import type { SlideMode } from "@/lib/slides";
import { AlertCircle, EyeOff, Brain, RotateCcw, GitBranch } from "lucide-react";

const problemBuckets = [
  { icon: EyeOff, title: "Lack of Transparency", desc: "Be it with an agency or your own employees — you have no transparency into the quality of interviews, screening of candidates, or the actual conversations happening. You're trusting a black box." },
  { icon: Brain, title: "Human Hallucination", desc: "Controlling quality of calls is nearly impossible. Human bias, recency bias, interviewer ability — every call is a variable. The 'insights' you get are filtered through someone else's interpretation." },
  { icon: RotateCcw, title: "Lost Context", desc: "Every conversation is the first conversation. No context building, no memory, no incremental value. Study after study starts from zero." },
  { icon: GitBranch, title: "Siloed Intelligence", desc: "Customer conversations never compound. A 50-interview growth study surfaces 2 ops insights — but they never reach the ops team. Intelligence stays locked in the team that commissioned it." },
];
export default function ProblemSection({ mode = "detailed" }: { mode?: SlideMode }) {
  const isPresenter = mode === "presenter";
  const [revealIndex, setRevealIndex] = useState(isPresenter ? 0 : problemBuckets.length);

  const advanceReveal = useCallback(() => {
    setRevealIndex(prev => Math.min(prev + 1, problemBuckets.length));
  }, []);

  useEffect(() => {
    if (!isPresenter) { setRevealIndex(problemBuckets.length); return; }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        if (revealIndex < problemBuckets.length) { e.preventDefault(); e.stopPropagation(); advanceReveal(); }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [isPresenter, revealIndex, advanceReveal]);

  return (
    <section
      id="problem"
      className={`relative overflow-hidden ${isPresenter ? "min-h-screen flex items-center px-16 py-8" : "py-32 px-8 sm:px-16"}`}
      style={{ background: "hsl(var(--sq-card))" }}
    >
      {/* Subtle warm glow */}
      <div
        className="absolute bottom-0 right-0 w-[480px] h-[480px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom right, hsl(var(--sq-orange) / 0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full mx-auto" style={{ maxWidth: 1100 }}>

        {/* HEADLINE */}
        <div className={isPresenter ? "mb-8" : "mb-4"}>
          <p
            className="animate-fade-up mb-2 font-bold uppercase tracking-[0.2em]"
            style={{ color: "hsl(var(--sq-orange))", fontSize: "11px", animationDelay: "0ms" }}
          >
            The Breakdown
          </p>
          <h2
            className="animate-fade-up font-black tracking-tight leading-[1.05]"
            style={{
              color: "hsl(var(--sq-text))",
              fontSize: isPresenter ? "2.4rem" : "clamp(1.6rem, 2.5vw, 2.2rem)",
              animationDelay: "50ms",
            }}
          >
            The issue is not lack of intent <br />
            <span style={{ color: "hsl(var(--sq-orange))", textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "hsl(var(--sq-orange) / 0.35)", textUnderlineOffset: "5px", textDecorationThickness: "2px" }}>
              Customer understanding is structurally broken
            </span>
          </h2>
        </div>

        {/* MAIN GRID */}
        <div className={`grid ${isPresenter ? "grid-cols-12 gap-10" : "lg:grid-cols-12 gap-4 lg:gap-6"} items-start`}>

          {/* LEFT COLUMN (7/12) - The Breakdown */}
          <div className={`${isPresenter ? "col-span-7" : "lg:col-span-12 xl:col-span-7"} flex flex-col gap-${isPresenter ? "3" : "2"}`}>
            <p className={`font-bold ${isPresenter ? "text-xs" : "text-xs"} tracking-widest uppercase mb-0.5`} style={{ color: "hsl(var(--sq-text))" }}>
              Four ways the current system fails
            </p>

            <div className="animate-fade-up flex flex-col gap-2" style={{ animationDelay: "150ms" }}>
              {problemBuckets.map((item, i) => (
                <div key={i} className={`flex items-start gap-3 ${isPresenter ? "p-4" : "p-3"} rounded-xl border transition-all duration-300 ${isPresenter && i >= revealIndex ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"} hover:bg-[hsl(var(--sq-orange)/0.02)]`} style={{ borderColor: "hsl(var(--sq-subtle))" }}>
                  <div className={`${isPresenter ? "w-10 h-10" : "w-9 h-9"} rounded-lg flex items-center justify-center bg-[hsl(var(--sq-card))] border border-[hsl(var(--sq-subtle))] shadow-sm flex-shrink-0`}>
                    <item.icon size={isPresenter ? 18 : 18} style={{ color: "hsl(var(--sq-text))" }} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isPresenter ? "text-base" : "text-sm"} mb-0.5`} style={{ color: "hsl(var(--sq-text))" }}>{item.title}</h4>
                    <p className={`${isPresenter ? "text-xs" : "text-xs"} font-medium leading-snug`} style={{ color: "hsl(var(--sq-muted))" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN (5/12) - The Proof */}
          <div className={`${isPresenter ? "col-span-5" : "lg:col-span-12 xl:col-span-5"} flex flex-col gap-${isPresenter ? "4" : "3"}`}>

            <div className={`animate-fade-up rounded-2xl ${isPresenter ? "p-6" : "p-5"}`} style={{ background: "#1A1A1A", animationDelay: "200ms" }}>
              <div className={`flex items-center gap-3 ${isPresenter ? "mb-4" : "mb-3"}`}>
                <AlertCircle className="text-red-400" size={isPresenter ? 20 : 20} />
                <h3 className="font-bold text-white tracking-wide uppercase text-xs">The Fallout</h3>
              </div>

              <div className={`space-y-${isPresenter ? "4" : "3"}`}>
                {/* Data point 1 */}
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`${isPresenter ? "text-4xl" : "text-3xl"} font-black text-red-500`}>{">"}80%</span>
                  </div>
                  <p className="text-xs font-medium text-white/60 leading-snug">
                    of product launches fail within the fast-moving FMCG sector.
                  </p>
                  <p className="text-[10px] font-bold text-white/30 mt-0.5 tracking-widest uppercase">— Source: NielsenIQ</p>
                </div>

                <div className="w-full h-px bg-white/10" />

                {/* Data point 2 */}
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`${isPresenter ? "text-4xl" : "text-3xl"} font-black text-red-500`}>75%</span>
                  </div>
                  <p className="text-xs font-medium text-white/60 leading-snug">
                    of all CPG innovations fail, despite executives calling innovation their #1 growth lever.
                  </p>
                  <p className="text-[10px] font-bold text-white/30 mt-0.5 tracking-widest uppercase">— Source: McKinsey & Company</p>
                </div>
              </div>
            </div>

            <div className="animate-fade-up p-3 rounded-2xl border" style={{ borderColor: "hsl(var(--sq-subtle))", animationDelay: "300ms", background: "hsl(var(--sq-card))" }}>
              <p className="text-xs font-semibold leading-snug" style={{ color: "hsl(var(--sq-text))" }}>
                Consumer brands make these decisions <span style={{ color: "hsl(var(--sq-orange))" }}>constantly</span>:
              </p>
              <ul className="mt-1.5 text-xs font-medium space-y-1" style={{ color: "hsl(var(--sq-muted))" }}>
                <li>· Is the pack-price architecture right?</li>
                <li>· Which cohort is this really for?</li>
                <li>· Why did this campaign not convert?</li>
                <li>· What should growth and product do next?</li>
              </ul>
            </div>

            {/* Frequency callout — merged from DecisionVolume */}
            <div className="animate-fade-up rounded-2xl p-3 border-2 border-dashed" style={{ borderColor: "hsl(var(--sq-orange) / 0.3)", background: "hsl(var(--sq-orange) / 0.04)", animationDelay: "400ms" }}>
              <p className={`font-black ${isPresenter ? "text-lg" : "text-base"} leading-tight`} style={{ color: "hsl(var(--sq-text))" }}>
                This isn't an annual research problem.
              </p>
              <p className={`${isPresenter ? "text-xs" : "text-xs"} font-medium mt-1 leading-snug`} style={{ color: "hsl(var(--sq-muted))" }}>
                Brands face <span className="font-bold" style={{ color: "hsl(var(--sq-orange))" }}>10–30 high-stakes customer decisions per quarter</span> across product, pricing, growth, and CX. Most deserve fast validation. Very few get it.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
