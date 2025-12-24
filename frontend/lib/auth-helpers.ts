import { User, GoogleAuthProvider, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail, signOut, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";
import { logFirebaseOperation, logFirebaseError } from "./api-logger";

/**
 * Translates technical Firebase error codes into human-friendly messages 
 * that match the Unclutr voice.
 */
export const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || "";

    switch (code) {
        case "auth/popup-closed-by-user":
            return "The sign-in window was closed before finishing. Give it another shot!";
        case "auth/network-request-failed":
            return "A network hiccup occurred. Please check your connection and try again.";
        case "auth/invalid-email":
            return "That doesn't look like a valid email. Double-check for typos?";
        case "auth/user-disabled":
            return "This account has been disabled. Please reach out to our support team.";
        case "auth/too-many-requests":
            return "System's a bit busy. Please wait a moment before trying again.";
        case "auth/expired-action-code":
            return "This login link has expired. Let's send you a fresh one.";
        case "auth/invalid-action-code":
            return "This login link isn't valid. Please request a new one below.";
        case "auth/popup-blocked":
            return "The login popup was blocked by your browser. Please allow popups for Unclutr.";
        case "auth/operation-not-allowed":
            return "This sign-in method isn't enabled yet. We're looking into it.";
        default:
            // Fallback for unknown errors but keep it human
            return error?.message?.includes("network")
                ? "Connection lost. Please try again."
                : "Something went wrong on our end. Please try again in a moment.";
    }
};

export const syncUserWithBackend = async (user: User) => {
    const logPrefix = `[Sync:${user.email?.split('@')[0]}]`;
    logFirebaseOperation(`${logPrefix} Starting sync...`);

    try {
        const token = await user.getIdToken(); // Use cached token by default for speed
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        console.log(`${logPrefix} Fetching ${apiUrl}/api/v1/auth/sync`);
        const res = await fetch(`${apiUrl}/api/v1/auth/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`${logPrefix} Sync failed with status ${res.status}:`, errorText);
            throw new Error(`Sync failed: ${res.status}`);
        }

        const data = await res.json();
        logFirebaseOperation(`${logPrefix} Sync Success`, data);
        return data;
    } catch (error) {
        logFirebaseError(`${logPrefix} Sync Error`, error);
        throw error;
    }
}

export const signInWithGoogle = async () => {
    const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
        logFirebaseOperation("signInWithGoogle - Using Popup (Localhost Optimization)");
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);

            if (result.user) {
                console.log("DEBUG: Popup Success, forcing immediate redirect to /dashboard");
                // Using window.location.assign for an absolute, infallible navigation
                window.location.assign("/dashboard");
            }
            return result;
        } catch (error) {
            logFirebaseError("signInWithGoogle (Popup)", error);
            throw error;
        }
    }

    logFirebaseOperation("signInWithGoogle - Starting (Redirect)");
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(auth, provider);
    } catch (error) {
        logFirebaseError("signInWithGoogle", error);
        throw error;
    }
}

// Handle redirect result after user returns from Google sign-in
export const handleAuthRedirect = async () => {
    console.log("DEBUG: handleAuthRedirect - Awaiting Firebase getRedirectResult()...");
    try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
            logFirebaseOperation("handleAuthRedirect - Found Result", {
                uid: result.user.uid,
                email: result.user.email
            });
            return result;
        } else {
            console.log("DEBUG: handleAuthRedirect - No result found in this load.");
            return null;
        }
    } catch (error) {
        logFirebaseError("handleAuthRedirect", error);
        throw error;
    }
}

export const sendEmailSignInLink = async (email: string) => {
    logFirebaseOperation("sendEmailSignInLink", { email });

    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/auth/verify`,
            handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        logFirebaseOperation("sendEmailSignInLink - Success", { email });
    } catch (error) {
        logFirebaseError("sendEmailSignInLink", error);
        throw error;
    }
}

export const logout = async () => {
    logFirebaseOperation("logout - Starting");
    try {
        await signOut(auth);
        window.localStorage.removeItem('emailForSignIn');
        logFirebaseOperation("logout - Success");
    } catch (error) {
        logFirebaseError("logout", error);
        throw error;
    }
}
