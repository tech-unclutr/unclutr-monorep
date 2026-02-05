"use client";

import { auth } from "./firebase";

// Use direct backend URL for local dev to avoid Next.js proxy stripping headers/slashes
// Use dynamic base URL: prioritize env var, then current origin, fallback to localhost
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
    return "/api/v1";
};

const API_BASE_URL = getBaseUrl();

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;

        const companyId = typeof window !== 'undefined' ? localStorage.getItem('unclutr_company_id') : null;
        const combinedHeaders: any = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(companyId ? { "X-Company-ID": companyId } : {}),
            ...((options.headers as any) || {}),
        };

        if (!companyId && endpoint.startsWith('/execution')) {
            console.warn(`DEBUG: API Request to ${endpoint} missing X-Company-ID. LocalStorage 'unclutr_company_id' is:`, companyId);
        }

        const fullUrl = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(fullUrl, {
            ...options,
            cache: 'no-store', // Disable caching to fetch fresh data
            headers: combinedHeaders,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
            console.error("DEBUG: API Error", { url: fullUrl, status: response.status, errorData });
            throw new ApiError(errorData.detail || response.statusText, response.status, errorData);
        }

        return response.json();
    },

    get(endpoint: string, headers?: any) {
        return this.request(endpoint, { method: "GET", headers });
    },

    post(endpoint: string, body: any = {}, headers?: any) {
        return this.request(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
            headers,
        });
    },

    patch(endpoint: string, body: any = {}, headers?: any) {
        return this.request(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
            headers,
        });
    },

    put(endpoint: string, body: any = {}, headers?: any) {
        return this.request(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
            headers,
        });
    },

    delete(endpoint: string, headers?: any) {
        return this.request(endpoint, { method: "DELETE", headers });
    },
};
