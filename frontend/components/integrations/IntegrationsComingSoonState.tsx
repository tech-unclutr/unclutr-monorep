import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plug, Link as LinkIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IntegrationsComingSoonState() {
    return (
        <div className="relative group w-full max-w-2xl mx-auto">
            {/* Background Decoration - subtle gradient wash behind the card */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/5 blur-[40px] rounded-[32px] transform scale-95 opacity-50 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none" />

            {/* Main Card */}
            <div className="relative rounded-[24px] border border-gray-100 dark:border-white/[0.08] bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden p-8 sm:p-12 text-center flex flex-col items-center justify-center">

                {/* Subtle grid pattern for texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none" />

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col items-center gap-6">

                    {/* Icon Container */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 shadow-lg border border-white/50 dark:border-white/10 flex items-center justify-center">
                            <Plug className="w-8 h-8 text-orange-500 transform -rotate-45" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Badge */}
                    <Badge
                        variant="outline"
                        className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold tracking-widest text-[10px] px-3 py-1 uppercase rounded-full"
                    >
                        Coming Soon
                    </Badge>

                    {/* Text Content */}
                    <div className="space-y-3 max-w-md">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Integrations
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed font-medium">
                            We’re polishing secure connectors for your business stack. You’ll see them here soon.
                        </p>
                    </div>

                    {/* Minimalist Visual Element: Connector Nodes */}
                    {/* Non-interactive skeleton to hint at structure without noise */}
                    <div className="flex items-center gap-3 mt-4 opacity-50 grayscale select-none pointer-events-none">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-md bg-gray-200 dark:bg-zinc-700" />
                        </div>
                        <div className="w-8 h-[1px] bg-gradient-to-r from-gray-300 to-gray-300 dark:from-zinc-700 dark:to-zinc-700" />
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                            <Lock className="w-4 h-4 text-gray-400 dark:text-zinc-600" />
                        </div>
                        <div className="w-8 h-[1px] bg-gradient-to-r from-gray-300 to-gray-300 dark:from-zinc-700 dark:to-zinc-700" />
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-md bg-gray-200 dark:bg-zinc-700" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
