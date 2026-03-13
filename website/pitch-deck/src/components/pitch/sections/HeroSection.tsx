import { ArrowRight, Play } from "lucide-react";
import type { SlideMode } from "@/lib/slides";
import avatarHero from "@/assets/avatar-hero-strategist.png";
import iconSvg from "@/assets/icon.svg";
import wordmarkBlack from "@/assets/wordmark-black.svg";
import wordmarkWhite from "@/assets/wordmark-white.svg";
import viditAatrey from "@/assets/vidit-aatrey.webp";
import MagneticButton from "@/components/ui/MagneticButton";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";

interface HeroSectionProps {
  mode?: SlideMode;
  revealStep?: number;
}

interface QuoteDef {
  text: string;
  name: string;
  title: string;
  avatar: string | null;
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  scale: number;
  rotate: string;
  parallaxMultiplier: number;
  delay: string;
  zIndex: number;
}

const QUOTES: QuoteDef[] = [
  {
    text: "Either we listen to our customers, or we wilt away.",
    name: "Vidit Aatrey",
    title: "Founder, Meesho",
    avatar: viditAatrey,
    pos: { bottom: "clamp(32px, 8vh, 100px)", right: "clamp(32px, 5vw, 100px)" },
    scale: 0.85,
    rotate: "1.5deg",
    parallaxMultiplier: 25,
    delay: "1200ms",
    zIndex: 20,
  },
  {
    text: "Talk to users — real voices spark real insight.",
    name: "Kunal Shah",
    title: "Founder, CRED",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kunal_Shah_in_FreeCharge_T-Shirt_%28cropped%29.jpg/500px-Kunal_Shah_in_FreeCharge_T-Shirt_%28cropped%29.jpg",
    pos: { bottom: "clamp(48px, 12vh, 140px)", left: "clamp(32px, 6vw, 120px)" },
    scale: 1,
    rotate: "-3deg",
    parallaxMultiplier: 15,
    delay: "1350ms",
    zIndex: 15,
  },
  {
    text: "Get closer than ever to your customers.",
    name: "Steve Jobs",
    title: "Co-founder, Apple",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Steve_Jobs_Headshot_2010-CROP2.jpg",
    pos: { top: "clamp(100px, 15vh, 200px)", left: "clamp(24px, 4vw, 80px)" },
    scale: 0.95,
    rotate: "4deg",
    parallaxMultiplier: -18,
    delay: "1500ms",
    zIndex: 10,
  },
  {
    text: "If you don't listen to your customers, someone else will.",
    name: "Sam Walton",
    title: "Founder, Walmart",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Sam_Walton_%281992_2%29.jpg/500px-Sam_Walton_%281992_2%29.jpg",
    pos: { top: "clamp(120px, 18vh, 240px)", right: "clamp(24px, 5vw, 90px)" },
    scale: 0.9,
    rotate: "-5deg",
    parallaxMultiplier: -24,
    delay: "1650ms",
    zIndex: 5,
  },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("");
}

function TestimonialCard({ quote, mousePos }: { quote: QuoteDef; mousePos: { x: number; y: number } }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [localMouse, setLocalMouse] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!cardRef.current || !isHovered) return;
    const rect = cardRef.current.getBoundingClientRect();
    setLocalMouse({
      x: (mousePos.x * window.innerWidth - rect.left) / rect.width,
      y: (mousePos.y * window.innerHeight - rect.top) / rect.height,
    });
  }, [mousePos, isHovered]);

  const tiltX = isHovered ? (localMouse.y - 0.5) * -12 : 0;
  const tiltY = isHovered ? (localMouse.x - 0.5) * 12 : 0;

  const isRightAligned = !!quote.pos.right;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setLocalMouse({ x: 0.5, y: 0.5 });
      }}
      className={`relative rounded-[32px] group sq-glass-premium mt-12 ${isRightAligned ? "text-right" : "text-left"}`}
      style={{
        padding: "28px 24px 24px 24px", 
        width: "320px",
        transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.05 : 1})`,
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* ─── Avatar Break-out (Massive, Anchor depends on side) ─── */}
      <div 
        className="absolute w-[90px] h-[90px] rounded-full overflow-hidden border-[4px] border-white/20 dark:border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.3)] bg-background/80 backdrop-blur-md"
        style={{ 
          top: "-35px", 
          left: isRightAligned ? "auto" : "-16px",
          right: isRightAligned ? "-16px" : "auto",
          transform: "translateZ(50px)", 
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" 
        }}
      >
        {quote.avatar ? (
          <img
            src={quote.avatar}
            alt={quote.name}
            className="w-full h-full object-cover object-[center_20%]"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full font-bold text-[28px] text-foreground/70 tracking-widest">{getInitials(quote.name)}</span>
        )}
      </div>

      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-[32px]"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle 280px at ${localMouse.x * 100}% ${localMouse.y * 100}%, rgba(255,255,255,0.12) 0%, transparent 100%)`,
        }}
      />

      <div style={{ transform: "translateZ(30px)", position: "relative", zIndex: 10 }}>
        {/* Header: Name and Title placed next to the avatar instead of stacked below */}
        <div className="flex flex-col justify-center" style={{ minHeight: "42px", marginLeft: isRightAligned ? "0" : "78px", marginRight: isRightAligned ? "88px" : "0" }}>
          <p className="font-bold tracking-tight" style={{ fontSize: "17px", color: "var(--hero-text)", lineHeight: 1.1 }}>
            {quote.name}
          </p>
          <p className="font-medium" style={{ fontSize: "13px", color: "var(--hero-text)", opacity: 0.5, marginTop: "2px" }}>
            {quote.title}
          </p>
        </div>

        {/* Decorative Quote Mark */}
        {isRightAligned ? (
          <div className="absolute text-foreground select-none pointer-events-none" style={{ opacity: 0.04, fontSize: "100px", lineHeight: 1, top: "-10px", left: "-10px", fontFamily: "Georgia, serif" }}>
            &ldquo;
          </div>
        ) : (
          <div className="absolute text-foreground select-none pointer-events-none" style={{ opacity: 0.04, fontSize: "100px", lineHeight: 1, top: "-10px", right: "-10px", fontFamily: "Georgia, serif" }}>
            &rdquo;
          </div>
        )}

        {/* Quote text below the lockup */}
        <div className="mt-6 relative z-10">
          <p
            className="font-medium leading-relaxed tracking-tight"
            style={{ fontSize: "16px", color: "var(--hero-text)", opacity: 0.9, textWrap: "pretty" }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ mode = "detailed", revealStep }: HeroSectionProps) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    let rafId: number;
    let targetX = 0.5;
    let targetY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth;
      targetY = e.clientY / window.innerHeight;
    };

    const smoothParallax = () => {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      setMousePos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(smoothParallax);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(smoothParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const isPresenter = mode === "presenter";
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";
  const isDownload = mode === "download";
  const isPresenterLike = isPresenter || isDownload;

  const step = isPresenterLike ? (revealStep ?? 0) : 999;
  const revealed = (n: number) => step >= n;

  const revealClass = (n: number) =>
    isPresenterLike
      ? `reveal-step ${revealed(n) ? "revealed" : ""}`
      : "animate-hero-cinematic-up opacity-100";

  const revealPunchClass = (n: number) =>
    isPresenterLike
      ? `reveal-step-punch ${revealed(n) ? "revealed" : ""}`
      : "animate-hero-text-punch opacity-100";

  const getDelay = (presMs: number, normMs: string) => {
    if (isDownload) return { transitionDelay: "0ms" };
    if (isPresenter) return { transitionDelay: revealed(2) ? `${presMs}ms` : "0ms" };
    return { animationDelay: normMs };
  };

  const mx = mousePos.x - 0.5;
  const my = mousePos.y - 0.5;
  const bgShift = `translate(${mx * -20}px, ${my * -15}px)`;

  return (
    <section
      id="hero"
      className="relative overflow-hidden flex flex-col items-center justify-center selection:bg-orange-500/30"
      style={{
        background: "var(--hero-bg)",
        height: "100vh",
        maxHeight: "100vh",
      }}
    >
      {/* Grain */}
      <div className="sq-grain" />

      {/* Living background meshes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ transform: bgShift }}>
        <div
          className="absolute rounded-full"
          style={{
            width: "min(900px, 70vw)",
            height: "min(900px, 70vw)",
            right: "-10%",
            top: "-15%",
            background: "radial-gradient(circle, hsl(var(--sq-ember) / 0.09) 0%, hsl(var(--sq-ember-dark) / 0.03) 40%, transparent 65%)",
            filter: "blur(80px)",
            animation: "hero-gradient-breathe 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "min(700px, 55vw)",
            height: "min(700px, 55vw)",
            left: "-5%",
            bottom: "-10%",
            background: "radial-gradient(circle, hsl(var(--sq-gold-leaf) / 0.06) 0%, transparent 65%)",
            filter: "blur(80px)",
            animation: "hero-gradient-breathe 16s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="absolute inset-0 sq-hero-grid pointer-events-none opacity-15" />

      {/* ─── Resting State (Step 1) ─── */}
      {isPresenterLike && (
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 z-50 pointer-events-none ${step > 1 ? "opacity-0 scale-105 blur-[4px]" : "opacity-100 scale-100 blur-0"}`}
        >
          <div className="flex flex-col items-center gap-10">
            <div className="flex items-center">
              <img 
                src={isDark ? wordmarkWhite : wordmarkBlack} 
                alt="SquareUp" 
                className="h-[100px] w-auto animate-pulse-logo" 
              />
            </div>
            <p className="font-bold tracking-[0.25em] text-[15px] uppercase" style={{ color: "var(--hero-text-muted)" }}>
              Your Customer Understanding Department
            </p>
          </div>
        </div>
      )}

      {/* ─── Center-Stage Content ─── */}
      <div 
        className="relative z-10 flex flex-col items-center text-center px-6 md:px-12 max-w-[900px] mt-10 lg:mt-0"
      >
        {/* Badge */}
        <div
          className={revealClass(2)}
          style={getDelay(800, "100ms")}
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-foreground/8 bg-foreground/[0.02] mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
            <span className="font-bold tracking-[0.25em] uppercase text-[9px] text-foreground/50">
              Pre-Seed · 2026
            </span>
          </div>
        </div>

        {/* Setup headline */}
        <div
          className={revealClass(2)}
          style={{ ...getDelay(1000, "250ms"), maxWidth: isPresenter ? "820px" : "860px", margin: "0 auto" }}
        >
          <h1
            className="font-display font-semibold tracking-[-0.03em]"
            style={{
              fontSize: isPresenter ? "clamp(38px, 5vw, 60px)" : "clamp(32px, 3.8vw, 48px)",
              lineHeight: 1.15,
              color: "var(--hero-text)",
              textWrap: "balance",
            }}
          >
            What separates great consumer companies from the rest
          </h1>
        </div>

        {/* THE gradient punch — the magnetic center */}
        <div
          className={revealPunchClass(2)}
          style={{
            marginTop: "10px",
            ...getDelay(2200, "500ms"),
          }}
        >
          <p
            className="font-display font-black sq-gradient-text sq-hero-shimmer tracking-[-0.04em]"
            style={{
              fontSize: isPresenter ? "clamp(48px, 6.5vw, 84px)" : "clamp(48px, 6.5vw, 88px)",
              lineHeight: 1.05,
              paddingBottom: "8px",
            }}
          >
            They talk to their customers
          </p>
        </div>

        {/* Subtext */}
        <div
          className={revealClass(2)}
          style={{
            marginTop: "28px",
            ...getDelay(3200, "700ms"),
          }}
        >
          <p
            className="font-normal tracking-tight"
            style={{
              fontSize: isPresenter ? "24px" : "clamp(17px, 1.6vw, 20px)",
              color: "var(--hero-text-muted)",
              lineHeight: 1.5,
            }}
          >
            Everyone else guesses
          </p>
        </div>

        {/* CTAs */}
        {!isPresenterLike && (
          <div
            className="flex flex-wrap justify-center items-center gap-6 animate-hero-cinematic-up opacity-100"
            style={{ marginTop: "40px", animationDelay: "900ms", position: "relative", zIndex: 50 }}
          >
            <MagneticButton strength={0.15}>
              <a
                href="mailto:hello@joinsquareup.com"
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-foreground text-background font-bold tracking-wide cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  fontSize: "14px",
                  padding: "16px 36px",
                  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.2)",
                }}
              >
                <span className="relative z-10">Start Listening</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </MagneticButton>

            <a
              href="https://almost.joinsquareup.com"
              target="_blank"
              className="group flex items-center gap-2.5 font-semibold tracking-wide cursor-pointer transition-colors"
              style={{ fontSize: "14px", color: "var(--hero-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--hero-text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--hero-text-muted)")}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full border border-foreground/10 transition-colors group-hover:bg-foreground/[0.06]"
              >
                <Play className="w-3.5 h-3.5 ml-0.5 fill-current opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              Watch Demo
            </a>
          </div>
        )}
      </div>

      {/* ─── Floating Testimonial Cards (Spatial Layout) ─── */}
      {!isDownload && (
        <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 20 }}>
          {QUOTES.map((quote, idx) => {
            const pX = mx * quote.parallaxMultiplier;
            const pY = my * (quote.parallaxMultiplier * 0.7);
            const t = !isPresenterLike ? `translate(${pX}px, ${pY}px) scale(${quote.scale}) rotate(${quote.rotate})` : `scale(${quote.scale}) rotate(${quote.rotate})`;
            const presDelay = 3200 + (idx * 200);

            return (
              <div
                key={idx}
                className={`absolute pointer-events-auto ${revealClass(2)} hover:z-[90]`}
                style={{
                  ...quote.pos,
                  zIndex: quote.zIndex,
                  transform: t,
                  transformOrigin: "center",
                  ...getDelay(presDelay, quote.delay),
                }}
              >
                <div className="relative">
                  {/* Subtle glow behind the card */}
                  <div className="absolute inset-0 bg-orange-500/5 blur-[50px] rounded-full scale-110" />
                  <TestimonialCard quote={quote} mousePos={mousePos} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Presenter bottom label */}
      {isPresenterLike && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${revealClass(2)}`}
          style={{ bottom: "28px", ...getDelay(4000, "0ms") }}
        >
          <span
            className="font-bold uppercase tracking-[0.4em]"
            style={{ fontSize: "9px", color: "var(--hero-text-muted)" }}
          >
            SquareUp · 2026
          </span>
        </div>
      )}

      {/* Scroll indicator */}
      {!isPresenterLike && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-hero-cinematic-up opacity-100"
          style={{ animationDelay: "1600ms" }}
        >
          <div className="w-[1px] h-10 bg-gradient-to-b from-foreground/15 to-transparent" />
        </div>
      )}
    </section>
  );
}
