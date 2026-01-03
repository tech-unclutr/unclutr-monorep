import { auth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RegionSettings {
    country: string | null;
    currency: string;
    timezone: string;
}

export interface ChannelSettings {
    d2c: string[];
    marketplaces: string[];
    qcom: string[];
    others: string[];
}

export interface StackSettings {
    orders: string[];
    payments: string[];
    shipping: string[];
    payouts: string[];
    marketing: string[];
    analytics: string[];
    finance: string[];
    others: string[];
}

export interface OnboardingSettingsResponse {
    companyName: string;
    brandName: string;
    category: string | null;
    region: RegionSettings;
    channels: ChannelSettings;
    stack: StackSettings;
}

export const getOnboardingSettings = async (): Promise<OnboardingSettingsResponse> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/api/v1/settings/onboarding`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch settings: ${response.status} ${errorText}`);
    }

    return response.json();
};

export const syncOnboardingState = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/api/v1/onboarding/sync`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync onboarding state: ${response.status} ${errorText}`);
    }
};
