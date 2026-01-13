import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (Singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Explicitly set persistence to LOCAL to ensure redirect reliability on localhost
if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
}
export const storage = getStorage(app);

// Initialize Analytics & Performance (Client-side only)
if (typeof window !== "undefined") {
    const isDev = process.env.NODE_ENV === "development";
    const shouldSkipLive = isDev && !localStorage.getItem('ENABLE_GA_IN_DEV');

    // Analytics
    if (!shouldSkipLive) {
        isSupported().then((supported) => {
            if (supported) {
                try {
                    getAnalytics(app);
                } catch (err) {
                    if (isDev) console.warn("[Firebase] Analytics initialization failed (likely blocked).");
                }
            }
        });
    }

    // Performance
    try {
        getPerformance(app);
    } catch (err) {
        if (isDev) console.warn("[Firebase] Performance monitoring initialization failed.");
    }
}

// Remote Config Helper
export const initRemoteConfig = async () => {
    if (typeof window !== "undefined") {
        const remoteConfig = getRemoteConfig(app);

        // Development: Fetch every few seconds
        // Production: Default is 12 hours
        remoteConfig.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 10000 : 3600000;

        try {
            await fetchAndActivate(remoteConfig);
        } catch (err) {
            console.error("Remote Config fetch failed", err);
        }
        return remoteConfig;
    }
    return null;
};
