"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { handleAuthRedirect, logout as firebaseLogout, syncUserWithBackend } from "@/lib/auth-helpers";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    onboardingCompleted: boolean | null;
    isSyncing: boolean;
    hasSkippedOnboarding: boolean;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
    skipOnboardingSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
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
                        if (isMounted) {
                            setOnboardingCompleted(syncData.onboarding_completed);
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
                    }
                } else {
                    console.log("DEBUG: AuthProvider [Sync] No user, clearing onboarding status");
                    setOnboardingCompleted(null);
                    syncInProgress.current = null;
                }

                // Once the first state change fires, we are "initialized"
                if (isMounted && loading) {
                    console.log("DEBUG: AuthProvider [Init] Clearing loading state.");
                    setLoading(false);
                }
            });

            // Safety: ensure loading is cleared even if observer is slow
            setTimeout(() => {
                if (isMounted && loading) {
                    console.log("DEBUG: AuthProvider [Init] Safety timeout clearing loading.");
                    setLoading(false);
                }
            }, 3000);

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
                setOnboardingCompleted(syncData.onboarding_completed);
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
            setUser(null);
            setOnboardingCompleted(null);
            router.push("/login");
        } catch (error) {
            console.error("DEBUG: Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            onboardingCompleted,
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
