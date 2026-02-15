"use client";

import { useState, useEffect, useCallback } from "react";
import { Company, CompanyUpdate } from "@/types/company";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

// Simple in-memory cache to avoid refetching on every mount if not needed, 
// or we could use SWR/React Query. For now, standard fetch.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useCompany() {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { onboardingCompleted } = useAuth();

    const fetchCompany = useCallback(async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                // If auth is handled by a wrapper, maybe wait? 
                // For now, assume if this hook runs, we might be authenticated or waiting.
                // Let's optimize: if no user, check if we are waiting for auth state?
                // Actually auth.onAuthStateChanged is better but for a simple fetch, 
                // we can assume the parent ensures auth or we wait a bit.
                // Better pattern: Listener or just check current user if we are sure it's loaded.
                // Given settings/page.tsx waits for auth, we should be good? 
                // But auth.currentUser might be null on initial render until firebase inits.
                // Let's revert to a simple check and retry or assume parent handles 'loading' auth.
                // Ideally, use an AuthContext but we'll try direct access for now.

                // If no user immediately, maybe return?
                // But the page waits for auth. Let's just create a promise wrapper or use the token if available.
            }

            // Wait for auth to be ready if needed? 
            // Better: use an Observer or just assume the page ensures it.
            // Let's just try to get token.

            if (onboardingCompleted === false) {
                console.log("useCompany: Skipping fetch because onboarding is not completed");
                setLoading(false);
                return;
            }

            const token = await user?.getIdToken();
            if (!token) {
                console.log("useCompany: No token found for user");
                setLoading(false);
                return;
            }
            console.log("useCompany: Fetching with token length:", token.length);

            const res = await fetch(`${API_URL}/api/v1/company/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                if (res.status === 404) {
                    // Maybe user has no company? 
                    setCompany(null);
                    return;
                }
                throw new Error("Failed to fetch company data");
            }

            const data = await res.json();
            setCompany(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [onboardingCompleted]); // Added onboardingCompleted dependency


    useEffect(() => {
        if (onboardingCompleted === true) {
            fetchCompany();
        } else if (onboardingCompleted === false) {
            // If onboarding is explicitly false, we won't find a company
            setLoading(false);
        }
        // If onboardingCompleted is null, we stay in loading state as Auth is still initting/syncing
    }, [fetchCompany, onboardingCompleted]);

    const updateCompany = async (updates: CompanyUpdate) => {
        // Optimistic update
        const previousCompany = company;
        if (company) {
            // merge updates (careful with nested or array fields if not replacing)
            // Backend replaces provided fields. 
            // For simple top levels it's fine. For arrays like tags, we likely replace whole array.
            setCompany({ ...company, ...updates } as Company);
        }

        try {
            const user = auth.currentUser;
            const token = await user?.getIdToken();
            if (!token) throw new Error("Not authenticated");

            const res = await fetch(`${API_URL}/api/v1/company/me`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updates)
            });

            if (!res.ok) {
                throw new Error("Failed to update settings");
            }

            const updatedData = await res.json();
            setCompany(updatedData);

            toast.success("Settings Updated", {
                description: "Your changes have been saved successfully.",
            });
            return updatedData;
        } catch (err: any) {
            // Revert
            setCompany(previousCompany);
            toast.error("Update failed", {
                description: err.message || "We couldn't save your settings. Try again?",
            });
            throw err;
        }
    };

    return {
        company,
        loading,
        error,
        updateCompany,
        refresh: fetchCompany
    };
}
