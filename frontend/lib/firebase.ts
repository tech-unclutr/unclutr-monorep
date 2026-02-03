import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { getStorage } from "firebase/storage";

// Hardcoded config to bypass persistent EPERM/Env issues
const firebaseConfig = {
    apiKey: "AIzaSyBV4-x1knQDLxrUw0A5gJCqpDkGYWtxiQ0",
    authDomain: "unclutr-monorep.firebaseapp.com",
    projectId: "unclutr-monorep",
    storageBucket: "unclutr-monorep.firebasestorage.app",
    messagingSenderId: "527397315020",
    appId: "1:527397315020:web:fb9ccca0b949751fa5bd69",
    measurementId: "G-Y6S6ESHRFN"
};

console.log("Firebase Config Loaded (Hardcoded Backup)");



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
