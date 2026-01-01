"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Zap, LayoutDashboard, Users, Activity as ActivityIcon, Workflow } from "lucide-react";
import { logout } from "@/lib/auth-helpers";
import { useRouter } from "next/navigation";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { CustomersList } from "@/components/dashboard/customers-list";
import { ActivityStream } from "@/components/dashboard/activity-stream";
import { SystemHealth } from "@/components/dashboard/system-health";
import { Tabs, TabsContent } from "@/components/dashboard/tabs";

export default function ControlTower() {
    const [activeTab, setActiveTab] = useState("overview");
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoggingOut(false);
        }
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "customers", label: "Customers", icon: <Users className="w-4 h-4" /> },
        { id: "product", label: "Product Health", icon: <ActivityIcon className="w-4 h-4" /> },
        { id: "integrations", label: "Integrations", icon: <Workflow className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <header className="max-w-[1600px] mx-auto w-full flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Control Tower</h1>
                        <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">Unclutr System Operations</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">System Operational</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <Button onClick={handleLogout} disabled={loggingOut} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto w-full grid grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Main Content Area */}
                <div className="col-span-12 lg:col-span-9 flex flex-col gap-8 min-h-0 overflow-y-auto pr-2 scrollbar-hide pb-10">

                    {/* Top Stats */}
                    <OverviewMetrics />

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 min-h-[400px]">
                        <TabsContent id="overview" activeTab={activeTab} className="space-y-6">
                            <SystemHealth />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Placeholders for charts */}
                                <div className="h-64 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/20 text-sm">
                                    Revenue Chart (Coming Soon)
                                </div>
                                <div className="h-64 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/20 text-sm">
                                    User Growth Chart (Coming Soon)
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent id="customers" activeTab={activeTab}>
                            <CustomersList />
                        </TabsContent>

                        <TabsContent id="product" activeTab={activeTab}>
                            <div className="p-12 text-center border border-white/5 rounded-xl bg-white/[0.02]">
                                <ActivityIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white/50">Product Health Metrics</h3>
                                <p className="text-sm text-white/30 mt-2">Detailed charts for engagement, retention, and feature usage coming in Phase 4.1</p>
                            </div>
                        </TabsContent>

                        <TabsContent id="integrations" activeTab={activeTab}>
                            <div className="p-12 text-center border border-white/5 rounded-xl bg-white/[0.02]">
                                <Workflow className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white/50">Integration Status</h3>
                                <p className="text-sm text-white/30 mt-2">Sync health, error rates, and API performance metrics coming in Phase 4.1</p>
                            </div>
                        </TabsContent>
                    </div>
                </div>

                {/* Right Column: Activity Stream */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <ActivityStream />
                </div>
            </main>
        </div>
    );
}
