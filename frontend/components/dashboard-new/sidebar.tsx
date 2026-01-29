"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
    Leaf,
    PanelLeftClose,
    Users,
    DollarSign,
    Compass,
    GitCompare,
    Plug,
    RotateCw,
    HelpCircle,
    Moon,
    Sun,
    PanelLeftOpen,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { client } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { user, companyId, logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [companyName, setCompanyName] = useState<string>("Your Brand");

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (companyId) {
            // Try to get from local storage for instant flash
            const cachedName = localStorage.getItem(`company_name_${companyId}`);
            if (cachedName) setCompanyName(cachedName);

            client.companies.readCompany(companyId)
                .then((company: any) => {
                    // Prefer Brand Name if available (since User wants Brand Name visible)
                    const display = (company.brands && company.brands.length > 0)
                        ? company.brands[0].name
                        : company.name;

                    setCompanyName(display || "Your Brand");
                    localStorage.setItem(`company_name_${companyId}`, display || "Your Brand");
                })
                .catch(err => {
                    console.error("Failed to fetch company details:", err);
                    // Fallback or keep "Your Brand"
                });
        }
    }, [companyId]);

    // Derive initials from Company Name
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const isActive = (path: string) => {
        if (path === "/dashboard-new" && pathname === "/dashboard-new") return true;
        if (path !== "/dashboard-new" && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <aside
            className={cn(
                "h-screen bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-xl border-r border-gray-100 dark:border-[#27272A] flex flex-col fixed left-0 top-0 overflow-hidden z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
                isCollapsed ? "w-[80px]" : "w-[240px]"
            )}
        >
            {/* Header */}
            <div className={cn("flex px-6 items-center", isCollapsed ? "justify-center pt-8 pb-4" : "justify-between pt-6 pb-2")}>
                <div className={cn("flex items-center gap-2", isCollapsed ? "mb-4" : "mb-6")}>
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-[#FF8A4C] rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/20">
                        <Leaf className="w-5 h-5 fill-white" />
                    </div>
                    <div className={cn("flex flex-col transition-opacity duration-200", isCollapsed ? "hidden opacity-0 w-0" : "flex opacity-100")}>
                        <span className="font-bold text-gray-900 dark:text-[#E4E4E7] text-base leading-tight whitespace-nowrap font-display">GrowEase</span>
                        <span className="text-gray-400 dark:text-[#71717A] text-[10px] whitespace-nowrap">Analytics Platform</span>
                    </div>
                </div>
            </div>

            {!isCollapsed && (
                <div className="px-6">
                    <button
                        onClick={toggleCollapse}
                        className="flex items-center gap-2.5 text-gray-400 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-[#E4E4E7] transition-colors py-1.5 mb-4 w-full"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                        <span className="text-xs font-medium whitespace-nowrap">Collapse</span>
                    </button>
                </div>
            )}

            {isCollapsed && (
                <div className="flex justify-center mb-6">
                    <button
                        onClick={toggleCollapse}
                        className="text-gray-500 dark:text-[#A1A1AA] hover:text-gray-900 dark:hover:text-[#E4E4E7] transition-colors"
                    >
                        <PanelLeftOpen className="w-5 h-5" />
                    </button>
                </div>
            )}


            <div className="flex-1 px-4 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {/* Agents Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[11px] font-bold text-gray-400 dark:text-[#52525B] uppercase tracking-wider mb-3 px-3 whitespace-nowrap transition-opacity duration-300 delay-100">
                            Agents
                        </h3>
                    )}
                    <div className="space-y-1">
                        {/*                         <Link
                            href="/dashboard-new/birds-eye"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group relative",
                                isActive("/dashboard-new/birds-eye")
                                    ? "bg-[#FF8A4C] text-white shadow-[0_0_15px_rgba(255,138,76,0.25)]"
                                    : "text-gray-400 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-[#E4E4E7] hover:bg-gray-50/50 dark:hover:bg-[#27272A]/50",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? "Bird's Eye View" : ""}
                        >
                            <Eye className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">Bird's Eye View</span>}
                        </Link> */}

                        <Link
                            href="/dashboard-new"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group relative",
                                isActive("/dashboard-new") && pathname === "/dashboard-new"
                                    ? "bg-[#FF8A4C] text-white shadow-[0_0_15px_rgba(255,138,76,0.25)]"
                                    : "text-gray-400 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-[#E4E4E7] hover:bg-gray-50/50 dark:hover:bg-[#27272A]/50",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? "Cash Compass" : ""}
                        >
                            <Compass className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">Cash Compass</span>}
                        </Link>

                        <Link
                            href="/dashboard-new/customer-intelligence"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group relative",
                                isActive("/dashboard-new/customer-intelligence")
                                    ? "bg-[#FF8A4C] text-white shadow-[0_0_15px_rgba(255,138,76,0.25)]"
                                    : "text-gray-400 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-[#E4E4E7] hover:bg-gray-50/50 dark:hover:bg-[#27272A]/50",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? "Customer Intelligence" : ""}
                        >
                            <Users className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">Customer Intelligence</span>}
                        </Link>

                    </div>
                </div>

                {/* Reconciliation Section */}
                <div className="pt-2">
                    <div className={cn(
                        "flex items-center px-3 py-2.5 text-gray-300 dark:text-[#3F3F46] cursor-not-allowed group relative",
                        isCollapsed ? "justify-center" : "justify-between"
                    )}>
                        <div className="flex items-center gap-3">
                            <GitCompare className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span className="font-medium text-[15px] decoration-slice whitespace-nowrap transition-opacity duration-200">Reconciliation</span>}
                        </div>
                        {!isCollapsed && (
                            <span className="text-[10px] font-medium bg-gray-50 dark:bg-[#27272A] text-gray-400 dark:text-[#71717A] px-2 py-0.5 rounded border border-gray-100 dark:border-[#3F3F46] whitespace-nowrap">
                                Soon
                            </span>
                        )}
                    </div>
                </div>

                {/* Setup Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[11px] font-bold text-gray-400 dark:text-[#52525B] uppercase tracking-wider mb-3 px-3 whitespace-nowrap transition-opacity duration-300 delay-100">
                            Setup
                        </h3>
                    )}
                    <Link
                        href="/dashboard-new/integrations"
                        className={cn(
                            "flex items-center px-3 py-2.5 rounded-lg transition-colors group relative",
                            isActive("/dashboard-new/integrations")
                                ? "bg-[#FF8A4C] text-white shadow-[0_0_20px_rgba(255,138,76,0.3)]"
                                : "text-gray-500 dark:text-[#A1A1AA] hover:text-gray-900 dark:hover:text-[#E4E4E7] hover:bg-gray-50/50 dark:hover:bg-[#27272A]/50",
                            isCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={isCollapsed ? "Integrations" : ""}
                    >
                        <div className="flex items-center gap-2.5">
                            <Plug className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">Integrations</span>}
                        </div>
                        {!isCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>}
                        {isCollapsed && <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>}
                    </Link>
                </div>

                {/* Status Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[11px] font-bold text-gray-400 dark:text-[#52525B] uppercase tracking-wider mb-3 px-3 whitespace-nowrap transition-opacity duration-300 delay-100">
                            Status
                        </h3>
                    )}
                    <div className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 text-gray-400 dark:text-[#71717A] relative",
                        isCollapsed ? "justify-center" : ""
                    )}
                        title={isCollapsed ? "Not connected" : ""}
                    >
                        <RotateCw className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">Not connected</span>}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={cn("border-t border-gray-100 dark:border-[#27272A] bg-white dark:bg-[#18181B] transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
                <Link
                    href="#"
                    className={cn(
                        "flex items-center gap-2.5 px-2 py-2 text-gray-400 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-[#E4E4E7] transition-colors mb-1",
                        isCollapsed ? "justify-center" : ""
                    )}
                    title={isCollapsed ? "Help & Support" : ""}
                >
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">Help & Support</span>}
                </Link>

                {mounted && (
                    <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className={cn(
                            "flex items-center gap-2.5 px-2 py-2 text-gray-400 dark:text-[#71717A] hover:text-gray-900 dark:hover:text-[#E4E4E7] transition-colors mb-3 w-full",
                            isCollapsed ? "justify-center" : ""
                        )}
                        title={isCollapsed ? (resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode') : ""}
                    >
                        {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                        {!isCollapsed && <span className="font-medium text-[13.5px] whitespace-nowrap transition-opacity duration-200">
                            {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>}
                    </button>
                )}

                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex items-center hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors outline-none group",
                                isCollapsed
                                    ? "justify-center rounded-full w-8 h-8 p-0"
                                    : "gap-2 px-2 py-1.5 w-full text-left rounded-lg"
                            )}>
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700">
                                    <img
                                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(companyName)}&backgroundColor=ffdfbf,c0aede,d1d4f9,b6e3f4&backgroundType=solid,gradientLinear`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex flex-col overflow-hidden transition-opacity duration-200">
                                        <span className="font-bold text-gray-900 dark:text-[#E4E4E7] text-[13px] truncate font-display">{companyName}</span>
                                        <span className="text-gray-400 dark:text-[#71717A] text-[10px] truncate">{user?.email}</span>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-64 rounded-xl p-0 overflow-hidden bg-white dark:bg-[#18181B] border border-gray-100 dark:border-[#27272A] shadow-xl shadow-gray-200/50 dark:shadow-black/50 z-[100]"
                            align={isCollapsed ? "center" : "end"}
                            side="right"
                            sideOffset={isCollapsed ? 12 : -12}
                        >
                            <div className="px-3 py-2 bg-white dark:bg-[#18181B]">
                                <p className="font-bold text-xs text-gray-900 dark:text-[#E4E4E7] font-display">{companyName}</p>
                                <p className="text-[10px] text-gray-400 dark:text-[#71717A] truncate">{user?.email}</p>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-[#27272A]"></div>
                            <div className="p-1">

                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard-new/my-account/settings" className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-700 dark:text-[#E4E4E7] hover:bg-gray-50 dark:hover:bg-[#27272A] cursor-pointer rounded-md outline-none">
                                        <Settings className="w-3.5 h-3.5" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-[#27272A]"></div>
                            <div className="p-1">
                                <DropdownMenuItem
                                    onClick={logout}
                                    className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer rounded-md"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button className={cn(
                        "flex items-center hover:bg-gray-50 dark:hover:bg-[#27272A] transition-colors outline-none group",
                        isCollapsed
                            ? "justify-center rounded-full w-10 h-10 p-0"
                            : "gap-3 px-2 py-2 w-full text-left rounded-lg"
                    )}>
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700">
                            <img
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(companyName)}&backgroundColor=ffdfbf,c0aede,d1d4f9,b6e3f4&backgroundType=solid,gradientLinear`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden transition-opacity duration-200">
                                <span className="font-semibold text-gray-900 dark:text-[#E4E4E7] text-sm truncate">{companyName}</span>
                                <span className="text-gray-400 dark:text-[#A1A1AA] text-xs truncate">{user?.email}</span>
                            </div>
                        )}
                    </button>
                )}
            </div>
        </aside>
    );
}
