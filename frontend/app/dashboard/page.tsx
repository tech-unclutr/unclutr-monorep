"use client";

import { LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-helpers";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { motion } from "framer-motion";

export default function DashboardPage() {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8"
        >
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                            U
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    </div>
                    <Button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        variant="destructive"
                        className="shadow-sm"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {loggingOut ? "Logging out..." : "Logout"}
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5 text-primary" />
                                Welcome to Unclutr
                            </CardTitle>
                            <CardDescription>
                                Your decision layer is currently being assembled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                    <LayoutDashboard className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Project Under Construction</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        We are building the Command Center for your brand. Check back soon for your live insights.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/dashboard/dev")}
                                >
                                    View Developer Diagnostics
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}
