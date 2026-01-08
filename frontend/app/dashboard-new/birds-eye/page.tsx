import { EmptyDashboardState } from "@/components/dashboard-new/empty-dashboard-state";

export default function BirdsEyePage() {
    return (
        <div className="p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col gap-0.5 mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-display">Bird's Eye View</h1>
                    <p className="text-gray-400 dark:text-[#71717A] text-sm">High-level overview of your business</p>
                </div>

                <div className="relative">
                    {/* Decorative background element */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-[#FF8A4C]/5 to-transparent blur-2xl opacity-50 pointer-events-none" />

                    <div className="relative bg-white/40 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/[0.03] rounded-[2rem] backdrop-blur-md min-h-[500px] flex items-center justify-center transition-all duration-500 hover:border-[#FF8A4C]/20">
                        <EmptyDashboardState
                            title="The Big Picture"
                            description="Setup your operational stack to see a unified view of your business performance across all channels."
                            image="/images/birds-eye-empty.png"
                            lightImage="/images/birds-eye-empty-light.png"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

