"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"

import { Pencil, Check, X, User, Phone } from "lucide-react"

import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "firebase/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UserProfileCardProps {
    workspaceName?: string;
}

export function UserProfileCard({ workspaceName }: UserProfileCardProps) {
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
        <div className="p-10 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_-15px_rgba(0,0,0,0.1)] hover:border-zinc-300 dark:hover:border-zinc-700 group relative">
            <div className="flex items-start justify-between mb-10">
                <div className="space-y-1.5">
                    <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile Details</h3>
                    <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                        Your personal details and workspace access role.
                    </p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl h-10 px-5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</Button>
                        <Button size="sm" onClick={handleSave} className="rounded-xl h-10 px-6 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm font-semibold">Save</Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl h-10 px-5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                        <Pencil className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-12">
                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Full Name</label>
                    {isEditing ? (
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-12 text-base"
                        />
                    ) : (
                        <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 min-h-[28px]">{fullName || "No Name Set"}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Designation</label>
                    {isEditing ? (
                        <Input
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Senior Developer"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-12 text-base"
                        />
                    ) : (
                        <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 min-h-[28px]">{designation || <span className="text-zinc-400 font-normal italic">Not Set</span>}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Team / Department</label>
                    {isEditing ? (
                        <Input
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            placeholder="e.g. Engineering"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-12 text-base"
                        />
                    ) : (
                        <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 min-h-[28px]">{team || <span className="text-zinc-400 font-normal italic">Not Set</span>}</p>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Contact Number</label>
                    {isEditing ? (
                        <PhoneInput
                            value={contactNumber}
                            onChange={setContactNumber}
                            placeholder="12345 67890"
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 focus-within:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-12 text-base"
                        />
                    ) : (
                        <div className="pt-0.5">
                            {contactNumber ? (
                                <a
                                    href={`tel:${contactNumber.replace(/\s+/g, '')}`}
                                    className="text-xl text-zinc-950 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-300 min-h-[28px] font-semibold flex items-center gap-2.5 transition-colors"
                                    title={contactNumber}
                                >
                                    <Phone className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                    <span>{contactNumber}</span>
                                </a>
                            ) : (
                                <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 min-h-[28px]"><span className="text-zinc-400 font-normal italic">Not Set</span></p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">LinkedIn Profile</label>
                    {isEditing ? (
                        <Input
                            value={linkedinProfile}
                            onChange={(e) => setLinkedinProfile(e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-zinc-900/10 transition-all text-zinc-900 dark:text-zinc-100 rounded-xl h-12 text-base"
                        />
                    ) : (
                        <div className="pt-0.5">
                            {linkedinProfile ? (
                                <a
                                    href={linkedinProfile.startsWith('http') ? linkedinProfile : `https://${linkedinProfile}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xl text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 min-h-[28px] font-semibold flex items-center gap-2.5 transition-all group/link"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 group-hover/link:bg-blue-100 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    </div>
                                    <span className="truncate">{linkedinProfile.replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}</span>
                                </a>
                            ) : (
                                <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 min-h-[28px]"><span className="text-zinc-400 font-normal italic">Not Set</span></p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Access Role</label>
                    <div className="pt-0.5">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                            {role || "Member"}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 group/field">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 transition-colors group-hover/field:text-zinc-800 dark:group-hover/field:text-zinc-300">Current Workspace</label>
                    <div className="pt-0.5">
                        <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 truncate">{workspaceName || "Unclutr HQ"}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 opacity-60 md:col-span-2 lg:col-span-2">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500">Registered Email</label>
                    <div className="flex items-center gap-2 min-w-0 pt-0.5">
                        <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 truncate min-w-0 flex-1">{user.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
