"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers rendering children until the placeholder is within `rootMargin` of the viewport.
 * Use to defer heavy below-fold sections so their JS doesn't parse on initial load.
 *
 * Once mounted, stays mounted (no flicker on scroll-up).
 */
export default function LazyMount({
  children,
  rootMargin = "600px 0px",
  minHeight,
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: number | string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const node = ref.current;
    if (!node) return;

    // Graceful fallback: if IntersectionObserver isn't available, mount immediately.
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [show, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={minHeight !== undefined ? { minHeight } : undefined}
    >
      {show ? children : null}
    </div>
  );
}
