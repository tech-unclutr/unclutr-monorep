"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { handleAuthRedirect, logout as firebaseLogout, syncUserWithBackend } from "@/lib/auth-helpers";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    dbUser: any | null; // UserRead from backend
    loading: boolean;
    isAuthenticated: boolean;
    onboardingCompleted: boolean | null;
    companyId: string | null;
    role: string | null;
    isSyncing: boolean;
    hasSkippedOnboarding: boolean;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
    skipOnboardingSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<any | null>(null);
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);
    const router = useRouter();
    const initialized = useRef(false);
    const syncInProgress = useRef<string | null>(null);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        let isMounted = true;

        const init = async () => {
            console.log("DEBUG: AuthProvider [Init] Starting setup...");
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (e) {
                console.error("DEBUG: AuthProvider [Init] Persistence error:", e);
            }

            console.log("DEBUG: AuthProvider [Init] 2. Checking Redirect Result...");
            try {
                const result = await handleAuthRedirect();
                if (result?.user && isMounted) {
                    console.log("DEBUG: AuthProvider [Init] 2a. Redirect SUCCESS:", result.user.email);
                    setUser(result.user);
                }
            } catch (e) {
                console.error("DEBUG: AuthProvider [Init] Redirect Error:", e);
            }

            console.log("DEBUG: AuthProvider [Init] 3. Attaching onAuthStateChanged...");
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (!isMounted) return;
                console.log("DEBUG: AuthProvider [State] Update:", firebaseUser?.email || "none");

                setUser(firebaseUser);
                if (firebaseUser) {
                    // Prevent concurrent syncs for the same user/token
                    if (syncInProgress.current === firebaseUser.uid) {
                        console.log("DEBUG: AuthProvider [Sync] Sync already in progress for this UID, skipping.");
                        return;
                    }
                    syncInProgress.current = firebaseUser.uid;

                    console.log("DEBUG: AuthProvider [Sync] Starting sync for", firebaseUser.email);
                    setIsSyncing(true);
                    try {
                        const syncData = await syncUserWithBackend(firebaseUser);
                        console.log("DEBUG: AuthProvider [Sync] Data received:", syncData);

                        // Persist to localStorage FIRST, before state updates
                        // This ensures the OpenAPI client can read companyId synchronously when components re-render
                        if (syncData.current_company_id) {
                            localStorage.setItem('unclutr_company_id', syncData.current_company_id);
                        } else {
                            localStorage.removeItem('unclutr_company_id');
                        }

                        if (isMounted) {
                            setOnboardingCompleted(syncData.onboarding_completed);
                            setCompanyId(syncData.current_company_id);
                            setRole(syncData.role || null);
                            setDbUser(syncData);
                        }
                    } catch (e) {
                        console.error("DEBUG: AuthProvider [Sync] Background Error:", e);
                        if (isMounted) {
                            // If sync fails but we ARE authenticated, fallback to false to allow redirection
                            // the Guard or Onboarding page will try again or handle it.
                            setOnboardingCompleted(onboardingCompleted ?? false);
                        }
                    } finally {
                        syncInProgress.current = null;
                        setIsSyncing(false);

                        // Clear loading state AFTER sync completes (success or failure)
                        // This ensures components don't make API calls until companyId is available
                        if (isMounted && loading) {
                            console.log("DEBUG: AuthProvider [Init] Clearing loading state after sync.");
                            setLoading(false);
                        }
                    }
                } else {
                    console.log("DEBUG: AuthProvider [Sync] No user, clearing onboarding status");
                    setOnboardingCompleted(null);
                    setCompanyId(null);
                    setRole(null);
                    setDbUser(null);
                    localStorage.removeItem('unclutr_company_id');
                    syncInProgress.current = null;

                    // Clear loading state when no user
                    if (isMounted && loading) {
                        console.log("DEBUG: AuthProvider [Init] Clearing loading state (no user).");
                        setLoading(false);
                    }
                }
            });

            // Safety: ensure loading is cleared even if observer is slow
            setTimeout(() => {
                if (isMounted && loading) {
                    console.log("DEBUG: AuthProvider [Init] Safety timeout clearing loading (10s reached).");
                    setLoading(false);
                }
            }, 10000);

            return unsubscribe;
        };

        const initPromise = init();

        return () => {
            isMounted = false;
            initPromise.then(unsub => unsub && unsub());
        };
    }, []); // Run once on mount

    const refreshAuth = async () => {
        if (user) {
            setIsSyncing(true);
            try {
                const syncData = await syncUserWithBackend(user);

                // Update local persistence first (matches init flow)
                if (syncData.current_company_id) {
                    localStorage.setItem('unclutr_company_id', syncData.current_company_id);
                } else {
                    localStorage.removeItem('unclutr_company_id');
                }

                // Update all context states to reflect new data
                setOnboardingCompleted(syncData.onboarding_completed);
                setCompanyId(syncData.current_company_id);
                setRole(syncData.role || null);
                setDbUser(syncData);

                // If displayName changed in backend but not firebase (edge case), we might want to reload firebase user?
                // But typically firebase auth token claims are source of truth for name until refresh.
                // We rely on dbUser for UI display anyway.
            } catch (e) {
                console.error("DEBUG: AuthProvider [Refresh] Error:", e);
            } finally {
                setIsSyncing(false);
            }
        }
    };

    const skipOnboardingSession = () => {
        setHasSkippedOnboarding(true);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('unclutr_skip_onboarding', 'true');
        }
    };

    const logout = async () => {
        try {
            await firebaseLogout();
            await firebaseLogout();
            setUser(null);
            setOnboardingCompleted(null);
            setCompanyId(null);
            setCompanyId(null);
            setRole(null);
            setDbUser(null);
            localStorage.removeItem('unclutr_company_id');
            router.push("/login");
        } catch (error) {
            console.error("DEBUG: Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            dbUser,
            loading,
            isAuthenticated: !!user,
            onboardingCompleted,
            companyId,
            role,
            isSyncing,
            hasSkippedOnboarding,
            logout,
            refreshAuth,
            skipOnboardingSession
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
