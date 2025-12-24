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
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        let isMounted = true;

        const init = async () => {
            console.log("DEBUG: AuthProvider [Init] Starting setup...");
            try {
                // Ensure persistence is set BEFORE any other auth calls
                // Using setPersistence once is enough
                if (!initialized.current) {
                    await setPersistence(auth, browserLocalPersistence);
                }
            } catch (e) {
                console.error("DEBUG: AuthProvider [Init] Persistence error:", e);
            }

            console.log("DEBUG: AuthProvider [Init] 2. Checking Redirect Result...");
            try {
                // handleAuthRedirect internally calls getRedirectResult(auth)
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
                    syncUserWithBackend(firebaseUser).catch(e => {
                        console.error("DEBUG: AuthProvider [Sync] Background Error:", e);
                    });
                }

                // Once the first state change fires, we are "initialized"
                if (loading) setLoading(false);
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

    const logout = async () => {
        try {
            await firebaseLogout();
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("DEBUG: Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
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
