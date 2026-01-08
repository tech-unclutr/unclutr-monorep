import { EmptyDashboardState } from "@/components/dashboard-new/empty-dashboard-state";

export default function CashCompassPage() {
    return (
        <div className="p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col gap-0.5 mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#E4E4E7] tracking-tight font-display">Cash Compass</h1>
                    <p className="text-gray-400 dark:text-[#71717A] text-sm">P&L at a glance for Jalsaa</p>
                </div>

                <div className="relative">
                    {/* Decorative background element to add depth without overflow issues */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-[#FF8A4C]/5 to-transparent blur-2xl opacity-50 pointer-events-none" />

                    <div className="relative bg-white/40 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/[0.03] rounded-[2rem] backdrop-blur-md min-h-[500px] flex items-center justify-center transition-all duration-500 hover:border-[#FF8A4C]/20">
                        <EmptyDashboardState
                            title="Connect Your Financials"
                            description="Visualize your revenue, burn, and runway by connecting your bank accounts and accounting software."
                            image="/images/cash-compass-empty.png"
                            lightImage="/images/cash-compass-empty-light.png"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

