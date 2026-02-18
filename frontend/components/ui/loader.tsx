import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

export function Loader({ className, size = 'md' }: LoaderProps) {
    let px = 24;

    if (typeof size === 'number') {
        px = size;
    } else {
        switch (size) {
            case 'sm': px = 16; break;
            case 'md': px = 24; break;
            case 'lg': px = 48; break;
            case 'xl': px = 64; break;
        }
    }

    return (
        <div
            className={cn('relative flex items-center justify-center', className)}
            style={{ width: px, height: px }}
        >
            {/* Shape 1 — pulses outward */}
            <motion.img
                src="/brand/icon.svg"
                alt=""
                width={px}
                height={px}
                className="absolute inset-0 object-contain"
                animate={{ scale: [1, 1.15, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: 'center' }}
            />
            {/* Shape 2 — counter-pulse with delay for a "breathing" effect */}
            <motion.img
                src="/brand/icon.svg"
                alt=""
                width={px}
                height={px}
                className="absolute inset-0 object-contain"
                animate={{ scale: [1.15, 1, 1.15], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: 'center' }}
            />
        </div>
    );
}
