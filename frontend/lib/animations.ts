
import { Variants } from "framer-motion";

export const springStart = { type: "spring", stiffness: 300, damping: 30 } as const;
export const springSlow = { type: "spring", stiffness: 200, damping: 20 } as const;
export const springBouncy = { type: "spring", stiffness: 400, damping: 15 } as const;

export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1
        }
    }
};

export const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: springSlow
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

export const glowInputVariants: Variants = {
    initial: { scale: 1, boxShadow: "0px 0px 0px rgba(99, 102, 241, 0)" },
    focus: {
        scale: 1.01,
        boxShadow: "0px 4px 20px rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 0.4)",
        transition: springStart
    }
};

export const magicButtonVariants: Variants = {
    initial: { backgroundPosition: "0% 50%" },
    animate: {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "linear"
        }
    },
    hover: {
        scale: 1.05,
        transition: springBouncy
    },
    tap: { scale: 0.95 }
};
