"use client";

import { useEffect, RefObject } from "react";
import { SectionTargetsEvent, ParticleTarget } from "./types";

/**
 * Hook to register particle targets (anchors) within a section.
 * Finds elements by selector and dispatches their viewport coordinates
 * to the global ParticleNarrativeController.
 */
export function useRegisterParticleTargets(
    sectionName: string,
    containerRef: RefObject<HTMLElement>,
    selectors: string[],
    active: boolean = true
) {
    useEffect(() => {
        if (!active) return;

        const updateTargets = () => {
            const container = containerRef.current;
            if (!container) return;

            const targets: ParticleTarget[] = [];

            selectors.forEach((selector) => {
                const elements = container.querySelectorAll(selector);
                elements.forEach((el, i) => {
                    const rect = el.getBoundingClientRect();
                    targets.push({
                        id: `${selector}-${i}`,
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                    });
                });
            });

            if (targets.length > 0) {
                window.dispatchEvent(
                    new CustomEvent("register-particle-targets", {
                        detail: { sectionName, targets } as SectionTargetsEvent,
                    })
                );
            }
        };

        // Throttle scroll/resize updates to once per animation frame
        let rafId = 0;
        const throttledUpdate = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                updateTargets();
                rafId = 0;
            });
        };

        window.addEventListener("scroll", throttledUpdate, { passive: true });
        window.addEventListener("resize", throttledUpdate);

        // Initial update
        updateTargets();

        return () => {
            window.removeEventListener("scroll", throttledUpdate);
            window.removeEventListener("resize", throttledUpdate);
            cancelAnimationFrame(rafId);
        };
    }, [sectionName, containerRef, selectors, active]);
}
