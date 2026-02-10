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
    const loadingRef = useRef(true);

    // Wrapper to keep ref in sync with state
    const updateLoading = (val: boolean) => {
        setLoading(val);
        loadingRef.current = val;
    };
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
            const startTime = performance.now();

            // 1. Force persistence immediately (Non-blocking as much as possible)
            setPersistence(auth, browserLocalPersistence).catch(e => {
                console.error("DEBUG: AuthProvider [Init] Persistence error:", e);
            });

            // 2. Attach onAuthStateChanged observer IMMEDIATELY.
            // This is the primary source of truth for the session.
            console.log("DEBUG: AuthProvider [Init] Attaching onAuthStateChanged observer...");
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (!isMounted) return;
                const stateTime = performance.now();
                console.log(`DEBUG: AuthProvider [State] Update triggered at ${Math.round(stateTime - startTime)}ms. User:`, firebaseUser?.email || "none");

                setUser(firebaseUser);

                if (firebaseUser) {
                    // Prevent concurrent syncs for the same user
                    if (syncInProgress.current === firebaseUser.uid) {
                        console.log("DEBUG: AuthProvider [Sync] Sync already in progress, skipping.");
                        return;
                    }
                    syncInProgress.current = firebaseUser.uid;

                    // Debounce Sync: Check if we just synced this user (prevents HMR spam)
                    const lastSyncKey = `unclutr_last_sync_${firebaseUser.uid}`;
                    const lastSyncTime = sessionStorage.getItem(lastSyncKey);
                    const now = Date.now();

                    if (lastSyncTime && (now - parseInt(lastSyncTime)) < 2000) {
                        console.log("DEBUG: AuthProvider [Sync] Debounced (HMR protection). Skipping.");
                        setIsSyncing(false);
                        if (isMounted && loadingRef.current) {
                            console.log(`DEBUG: AuthProvider [Init] Clearing loading (Debounced Sync) at ${Math.round(performance.now() - startTime)}ms`);
                            updateLoading(false);
                        }
                        return;
                    }

                    // Update timestamp immediately to block concurrent HMR triggers
                    sessionStorage.setItem(lastSyncKey, now.toString());

                    console.log("DEBUG: AuthProvider [Sync] Starting background sync for", firebaseUser.email);
                    setIsSyncing(true);
                    try {
                        const syncData = await syncUserWithBackend(firebaseUser);
                        const syncEndTime = performance.now();
                        console.log(`DEBUG: AuthProvider [Sync] Completed in ${Math.round(syncEndTime - stateTime)}ms`);
                        console.log("DEBUG: AuthProvider [Sync] Response Data:", JSON.stringify(syncData, null, 2));
                        console.log("DEBUG: AuthProvider [Sync] current_company_id:", syncData.current_company_id);

                        // Handle both snake_case (Python) and camelCase (JS) just in case
                        const syncedCompanyId = syncData.current_company_id || syncData.currentCompanyId;

                        if (syncedCompanyId) {
                            localStorage.setItem('unclutr_company_id', syncedCompanyId);
                        } else {
                            localStorage.removeItem('unclutr_company_id');
                        }

                        if (isMounted) {
                            setOnboardingCompleted(syncData.onboarding_completed);
                            setCompanyId(syncedCompanyId);
                            setRole(syncData.role || null);
                            setDbUser(syncData);
                        }
                    } catch (e) {
                        console.error("DEBUG: AuthProvider [Sync] Background Error:", e);
                        if (isMounted) {
                            setOnboardingCompleted(onboardingCompleted ?? false);
                        }
                    } finally {
                        syncInProgress.current = null;
                        setIsSyncing(false);

                        // Clear loading state AFTER sync completes if it was the first load
                        if (isMounted && loadingRef.current) {
                            console.log("DEBUG: AuthProvider [Init] Clearing loading state after sync.");
                            updateLoading(false);
                        }
                    }
                } else {
                    console.log("DEBUG: AuthProvider [Sync] No user, clearing context.");
                    setOnboardingCompleted(null);
                    setCompanyId(null);
                    setRole(null);
                    setDbUser(null);
                    localStorage.removeItem('unclutr_company_id');
                    syncInProgress.current = null;

                    if (isMounted && loadingRef.current) {
                        console.log(`DEBUG: AuthProvider [Init] Clearing loading (No Session) at ${Math.round(performance.now() - startTime)}ms`);
                        updateLoading(false);
                    }
                }
            });

            // 3. Handle Redirect Result in background (With its own timeout)
            (async () => {
                console.log("DEBUG: AuthProvider [Init] Checking Redirect Result...");
                const redirectStart = performance.now();

                // Race the redirect result against a 5s timeout to ensure it doesn't hang the init
                const redirectPromise = handleAuthRedirect();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Redirect Timeout")), 5000));

                try {
                    const result = await Promise.race([redirectPromise, timeoutPromise]) as any;
                    const redirectEnd = performance.now();
                    console.log(`DEBUG: AuthProvider [Init] Redirect check finished in ${Math.round(redirectEnd - redirectStart)}ms`);

                    if (result?.user && isMounted) {
                        console.log("DEBUG: AuthProvider [Init] Redirect Success:", result.user.email);
                        setUser(result.user);
                    }
                } catch (e) {
                    console.warn("DEBUG: AuthProvider [Init] Redirect handled (or timed out):", e);
                }
            })();

            // Safety timeout: Increased to 15s to allow for slower backend cold starts
            const safetyTimer = setTimeout(() => {
                if (isMounted && loadingRef.current) {
                    console.warn("DEBUG: AuthProvider [Init] Safety timeout clearing loading (15s). Context may be inconsistent.");
                    updateLoading(false);
                }
            }, 15000);

            return () => {
                unsubscribe();
                clearTimeout(safetyTimer);
            };
        };

        const initCleanupPromise = init();

        return () => {
            isMounted = false;
            initCleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []); // Run once on mount

    const refreshAuth = async () => {
        if (user) {
            setIsSyncing(true);
            try {
                const syncData = await syncUserWithBackend(user);

                // Update local persistence first (matches init flow)
                const syncedCompanyId = syncData.current_company_id || syncData.currentCompanyId;

                if (syncedCompanyId) {
                    localStorage.setItem('unclutr_company_id', syncedCompanyId);
                } else {
                    localStorage.removeItem('unclutr_company_id');
                }

                // Update all context states to reflect new data
                setOnboardingCompleted(syncData.onboarding_completed);
                setCompanyId(syncedCompanyId);
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

            // Clear Customer Intelligence persistent states to ensure a fresh session
            if (typeof window !== 'undefined') {
                // Clear localStorage patterns
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('csv_upload_') || key.startsWith('campaign_composer_')) {
                        localStorage.removeItem(key);
                    }
                });
                // Clear sessionStorage patterns
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('csv_upload_') || key.startsWith('campaign_composer_')) {
                        sessionStorage.removeItem(key);
                    }
                });

                // Also clear onboarding related session flags
                sessionStorage.removeItem('unclutr_skip_onboarding');
            }

            setUser(null);
            setOnboardingCompleted(null);
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
