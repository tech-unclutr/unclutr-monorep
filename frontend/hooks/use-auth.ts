"use client";

import { useAuth as useAuthContext } from "@/context/auth-context";

/**
 * Custom hook to access the authentication context.
 * Provides user, loading state, isAuthenticated, and logout function.
 */
export const useAuth = () => {
    return useAuthContext();
};
