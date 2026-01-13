"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Pencil, Check, X, User } from "lucide-react"

import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "firebase/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function UserProfileCard() {
    const { user, dbUser, role, refreshAuth } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(dbUser?.full_name || user?.displayName || "");

    useEffect(() => {
        if (dbUser?.full_name) {
            setFullName(dbUser.full_name);
        } else if (user?.displayName) {
            setFullName(user.displayName);
        }
    }, [dbUser?.full_name, user?.displayName]);

    const handleSave = async () => {
        if (!user) return;

        try {
            // 1. Update Firebase Auth Profile
            if (user.displayName !== fullName) {
                await updateProfile(user, { displayName: fullName });
            }

            // 2. Update Backend Database
            await api.patch("/users/me", { full_name: fullName });

            // 3. Refresh Auth Context to update UI immediately
            await refreshAuth();

            toast.success("Profile Updated", {
                description: "Looking good! Your changes are saved."
            });
            setIsEditing(false);
        } catch (error: any) {
            console.error("Failed to update profile", error);
            toast.error("Changes didn't stick", {
                description: error.message || "We couldn't save your profile updates. Try again?"
            });
        }
    };

    if (!user) return null;

    return (
        <div className="p-8 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700">
            <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                        Your personal details and workspace access role.
                    </p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save</Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors">
                        <Pencil className="w-4 h-4 mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="flex flex-col gap-5 group">
                    <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400 transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-300">Full Name</label>
                    {isEditing ? (
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all text-gray-900"
                        />
                    ) : (
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px]">{fullName || "No Name Set"}</p>
                    )}
                </div>

                <div className="flex flex-col gap-5">
                    <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Role</label>
                    <div>
                        <p className="text-base text-gray-900 dark:text-gray-200 min-h-[24px] capitalize">{role || "Member"}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-5 opacity-60 md:col-span-2">
                    <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Email Address</label>
                    <div className="flex items-center gap-2 min-w-0">
                        <p className="text-base text-gray-900 dark:text-gray-200 truncate min-w-0 flex-1">{user.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
