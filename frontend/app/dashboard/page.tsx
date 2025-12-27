"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 flex flex-col items-center justify-center">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h1 className="text-4xl font-light tracking-tight mb-2">
                        Welcome to <span className="font-medium text-indigo-400">Unclutr</span>
                    </h1>
                    <p className="text-white/40 text-sm">
                        Your central command for financial clarity.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-8">
                    <Link
                        href="/dashboard/dev"
                        className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                        <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                        <span className="font-medium">Developer Dashboard</span>
                    </Link>

                    <button
                        onClick={() => logout()}
                        className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group"
                    >
                        <LogOut className="w-5 h-5 text-red-400" />
                        <span className="font-medium text-red-400">Sign Out</span>
                    </button>
                </div>

                <div className="text-[10px] uppercase tracking-[0.3em] text-white/10 pt-12">
                    Financial Control Layer • v0.1.0
                </div>
            </div>
        </div>
    );
}
