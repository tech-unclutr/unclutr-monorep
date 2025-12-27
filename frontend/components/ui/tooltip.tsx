"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const TooltipContext = React.createContext<{
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    triggerRef: React.RefObject<HTMLElement | null>;
} | null>(null);

export const TooltipProvider = ({
    children,
    delayDuration = 200
}: {
    children: React.ReactNode;
    delayDuration?: number;
}) => {
    // We can use context to pass delay if needed, but for this simple version we'll just render children
    return <>{children}</>;
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLElement>(null);

    return (
        <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
            <div className="relative inline-block" onMouseLeave={() => setIsOpen(false)}>
                {children}
            </div>
        </TooltipContext.Provider>
    );
};

export const TooltipTrigger = ({
    children,
    asChild = false,
}: {
    children: React.ReactNode;
    asChild?: boolean;
}) => {
    const context = React.useContext(TooltipContext);
    if (!context) throw new Error("TooltipTrigger must be used within a Tooltip");

    const child = React.Children.only(children) as React.ReactElement;

    // Clone element to attach refs and events if it's a valid element
    if (React.isValidElement(child)) {
        return React.cloneElement(child, {
            // @ts-ignore
            ref: (node: HTMLElement) => {
                // Handle both refs: our internal one and any existing ref on the child
                // @ts-ignore
                context.triggerRef.current = node;
                // @ts-ignore
                const { ref } = child;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            },
            onMouseEnter: (e: React.MouseEvent) => {
                context.setIsOpen(true);
                child.props.onMouseEnter?.(e);
            },
            onFocus: (e: React.FocusEvent) => {
                context.setIsOpen(true);
                child.props.onFocus?.(e);
            },
            onBlur: (e: React.FocusEvent) => {
                context.setIsOpen(false);
                child.props.onBlur?.(e);
            }
        });
    }

    return (
        <span
            ref={context.triggerRef}
            onMouseEnter={() => context.setIsOpen(true)}
        >
            {children}
        </span>
    );
};

export const TooltipContent = ({
    children,
    className = "",
    side = "top",
}: {
    children: React.ReactNode;
    className?: string;
    side?: "top" | "bottom" | "left" | "right";
}) => {
    const context = React.useContext(TooltipContext);
    if (!context) throw new Error("TooltipContent must be used within a Tooltip");

    const [position, setPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

    React.useEffect(() => {
        if (context.isOpen && context.triggerRef.current) {
            const rect = context.triggerRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;
            const GAP = 8;

            switch (side) {
                case "top":
                    top = rect.top - GAP;
                    left = rect.left + rect.width / 2;
                    break;
                case "bottom":
                    top = rect.bottom + GAP;
                    left = rect.left + rect.width / 2;
                    break;
                case "left":
                    top = rect.top + rect.height / 2;
                    left = rect.left - GAP;
                    break;
                case "right":
                    top = rect.top + rect.height / 2;
                    left = rect.right + GAP;
                    break;
            }

            // Adjust for scroll? Fixed position handles viewport, but top/left are relative to viewport
            setPosition({ top, left });
        }
    }, [context.isOpen, side]);

    if (!context.isOpen) return null;

    const initial = { opacity: 0, scale: 0.9 };
    const animate = { opacity: 1, scale: 1 };

    // Transform origin based on side
    let transformOrigin = "bottom center";
    if (side === "bottom") transformOrigin = "top center";
    if (side === "left") transformOrigin = "center right";
    if (side === "right") transformOrigin = "center left";

    // Centering logic needs translation
    let translateX = "-50%";
    let translateY = "-100%"; // default for top

    if (side === "bottom") translateY = "0%";
    if (side === "left") { translateX = "-100%"; translateY = "-50%"; }
    if (side === "right") { translateX = "0%"; translateY = "-50%"; }

    const content = (
        <AnimatePresence>
            <motion.div
                initial={initial}
                animate={animate}
                exit={initial}
                transition={{ duration: 0.15 }}
                className={`fixed z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
                style={{
                    top: position.top,
                    left: position.left,
                    transform: `translate(${translateX}, ${translateY})`,
                    // Note: framer motion overrides transform, so we use x/y instead? 
                    // Actually let's just use standard style transform for positioning if we can, or use x/y in motion props.
                    // To be safe with framer, let's just use wrapper style.
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );

    // Using Portal to ensure it's on top
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
};
