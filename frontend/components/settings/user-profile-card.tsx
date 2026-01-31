"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Pencil, Check, X, User, Phone } from "lucide-react"

import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "firebase/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function UserProfileCard() {
    const { user, dbUser, role, refreshAuth } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(dbUser?.full_name || user?.displayName || "");
    const [designation, setDesignation] = useState(dbUser?.designation || "");
    const [team, setTeam] = useState(dbUser?.team || "");
    const [contactNumber, setContactNumber] = useState(dbUser?.contact_number || "");
    const [linkedinProfile, setLinkedinProfile] = useState(dbUser?.linkedin_profile || "");

    useEffect(() => {
        if (dbUser?.full_name) {
            setFullName(dbUser.full_name);
            setDesignation(dbUser.designation || "");
            setTeam(dbUser.team || "");
            setContactNumber(dbUser.contact_number || "");
            setLinkedinProfile(dbUser.linkedin_profile || "");
        } else if (user?.displayName) {
            setFullName(user.displayName);
        }
    }, [dbUser, user?.displayName]);

    const handleSave = async () => {
        if (!user) return;

        try {
            // 1. Update Firebase Auth Profile
            if (user.displayName !== fullName) {
                await updateProfile(user, { displayName: fullName });
            }

            // 2. Update Backend Database
            await api.patch("/users/me", {
                full_name: fullName,
                designation: designation,
                team: team,
                contact_number: contactNumber,
                linkedin_profile: linkedinProfile
            });

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
        <div className="p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:border-zinc-300/80 dark:hover:border-zinc-700 group">
            <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile Details</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
                        Your personal details and workspace access role.
                    </p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg text-zinc-500 hover:text-zinc-900">Cancel</Button>
                        <Button size="sm" onClick={handleSave} className="rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm">Save</Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100">
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                <div className="flex flex-col gap-3 group/field">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Full Name</label>
                    {isEditing ? (
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 min-h-[24px]">{fullName || "No Name Set"}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Designation</label>
                    {isEditing ? (
                        <Input
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Senior Developer"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 min-h-[24px]">{designation || "Not Set"}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Team</label>
                    {isEditing ? (
                        <Input
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            placeholder="e.g. Engineering"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                        />
                    ) : (
                        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 min-h-[24px]">{team || "Not Set"}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Contact Number</label>
                    {isEditing ? (
                        <Input
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                        />
                    ) : (
                        <div>
                            {contactNumber ? (
                                <a
                                    href={`tel:${contactNumber.replace(/\s+/g, '')}`}
                                    className="text-lg text-zinc-900 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 min-h-[24px] font-medium pt-1 flex items-center gap-2 transition-colors"
                                >
                                    <Phone className="w-4 h-4 opacity-50" />
                                    {contactNumber}
                                </a>
                            ) : (
                                <p className="text-lg text-zinc-900 dark:text-zinc-200 min-h-[24px] font-medium pt-1">Not Set</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">LinkedIn Profile</label>
                    {isEditing ? (
                        <Input
                            value={linkedinProfile}
                            onChange={(e) => setLinkedinProfile(e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-11"
                        />
                    ) : (
                        <div>
                            {linkedinProfile ? (
                                <a
                                    href={linkedinProfile.startsWith('http') ? linkedinProfile : `https://${linkedinProfile}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-lg text-blue-600 dark:text-blue-400 hover:underline min-h-[24px] font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    {linkedinProfile.replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                                </a>
                            ) : (
                                <p className="text-lg text-zinc-900 dark:text-zinc-200 min-h-[24px] font-medium">Not Set</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500">Role</label>
                    <div>
                        <p className="text-lg text-zinc-900 dark:text-zinc-200 min-h-[24px] capitalize font-medium">{role || "Member"}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 opacity-60 md:col-span-2">
                    <label className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500">Email Address</label>
                    <div className="flex items-center gap-2 min-w-0">
                        <p className="text-lg text-zinc-900 dark:text-zinc-200 truncate min-w-0 flex-1 font-medium">{user.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
