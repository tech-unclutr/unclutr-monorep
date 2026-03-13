import { useRef, useEffect, useState } from "react";

interface Particle {
    x: number;
    y: number;
    vy: number;
    vx: number;
    size: number;
    color: string;
    alpha: number;
}

interface AmbientParticlesProps {
    height?: number;
    fullHeight?: boolean;
    particleCount?: number;
    direction?: "down" | "up" | "ambient";
    opacity?: number;
}

/**
 * Ambient particle effect for light/peach background sections.
 * Uses warm terracotta/coral tones that complement the peach background.
 * Ported from the main website's AmbientParticles component.
 */
export default function AmbientParticles({
    height: fixedHeight = 400,
    fullHeight = false,
    particleCount = 80,
    direction = "ambient",
    opacity = 0.6,
}: AmbientParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const [containerHeight, setContainerHeight] = useState(fixedHeight);

    const height = fullHeight ? containerHeight : fixedHeight;

    // Observe parent container height when fullHeight is enabled
    useEffect(() => {
        if (!fullHeight) return;
        const canvas = canvasRef.current;
        if (!canvas?.parentElement) return;

        const parent = canvas.parentElement;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });
        ro.observe(parent);
        setContainerHeight(parent.getBoundingClientRect().height);

        return () => ro.disconnect();
    }, [fullHeight]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || height < 10) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Warm burnt orange/sienna tones - visible on peach background
        const colors = ["#A85D3B", "#9E5535", "#B86B45", "#C47A55"];
        const highlightColors = ["#D4582A", "#E86830"];
        const particles: Particle[] = [];

        const effectiveCount = width < 768 ? Math.min(particleCount, 30) : particleCount;
        for (let i = 0; i < effectiveCount; i++) {
            const isHighlight = Math.random() > 0.85;
            const spreadX = Math.random() * width;
            const spreadY = Math.random() * height;

            let vy: number, vx: number;
            if (direction === "down") {
                vy = Math.random() * 0.5 + 0.25;
                vx = (Math.random() - 0.5) * 0.12;
            } else if (direction === "up") {
                vy = -(Math.random() * 0.5 + 0.25);
                vx = (Math.random() - 0.5) * 0.12;
            } else {
                // Ambient - gentle random drift
                vy = (Math.random() - 0.5) * 0.25;
                vx = (Math.random() - 0.5) * 0.18;
            }

            particles.push({
                x: spreadX,
                y: spreadY,
                vy,
                vx,
                size: isHighlight ? Math.random() * 2.8 + 1.8 : Math.random() * 2 + 0.6,
                color: isHighlight
                    ? highlightColors[Math.floor(Math.random() * highlightColors.length)]
                    : colors[Math.floor(Math.random() * colors.length)],
                alpha: isHighlight ? 0.45 : Math.random() * 0.25 + 0.12,
            });
        }
        particlesRef.current = particles;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        // Visibility gating — fully pause RAF when offscreen or tab hidden
        const isVisibleRef = { current: true };
        const resumeRaf = () => {
            if (isVisibleRef.current && !document.hidden) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(render);
            }
        };
        const observer = new IntersectionObserver(([entry]) => {
            isVisibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting) resumeRaf();
        }, { threshold: 0 });
        observer.observe(canvas);
        const onVisChange = () => { if (!document.hidden) resumeRaf(); };
        document.addEventListener("visibilitychange", onVisChange);

        const render = () => {
            if (!isVisibleRef.current || document.hidden) {
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particlesRef.current) {
                p.y += p.vy;
                p.x += p.vx;

                // Gentle organic drift
                p.vx += (Math.random() - 0.5) * 0.01;
                p.vy += (Math.random() - 0.5) * 0.008;

                // Clamp velocities
                p.vx = Math.max(-0.4, Math.min(0.4, p.vx));
                p.vy = Math.max(-0.6, Math.min(0.6, p.vy));

                // Edge fade
                let alpha = p.alpha;
                const edgeFade = 50;
                if (p.y < edgeFade) {
                    alpha *= p.y / edgeFade;
                } else if (p.y > height - edgeFade) {
                    alpha *= (height - p.y) / edgeFade;
                }
                if (p.x < edgeFade) {
                    alpha *= p.x / edgeFade;
                } else if (p.x > width - edgeFade) {
                    alpha *= (width - p.x) / edgeFade;
                }

                // Wrap around
                if (p.y > height + 20) p.y = -20;
                if (p.y < -20) p.y = height + 20;
                if (p.x > width + 20) p.x = -20;
                if (p.x < -20) p.x = width + 20;

                ctx.beginPath();
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, alpha);

                if (p.size < 1.5) {
                    ctx.fillRect(p.x * dpr, p.y * dpr, p.size * dpr, p.size * dpr);
                } else {
                    ctx.arc(p.x * dpr, p.y * dpr, p.size * dpr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            const newWidth = window.innerWidth;
            canvas.width = newWidth * dpr;
            canvas.height = height * dpr;
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
            document.removeEventListener("visibilitychange", onVisChange);
            window.removeEventListener("resize", handleResize);
        };
    }, [height, particleCount, direction]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: fullHeight ? "100%" : `${fixedHeight}px`,
                zIndex: 1,
                opacity,
                pointerEvents: "none",
            }}
        />
    );
}
