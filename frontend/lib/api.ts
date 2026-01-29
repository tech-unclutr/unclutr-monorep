"use client";

import { auth } from "./firebase";

// Use direct backend URL for local dev to avoid Next.js proxy stripping headers/slashes
// Use dynamic base URL: prioritize env var, then current origin, fallback to localhost
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // If on ngrok or other, use the same domain for API (assumes proxy or standard setup)
            // But here we know backend is usually on :8000
            return `http://${hostname}:8000/api/v1`;
        }
    }
    return "http://localhost:8000/api/v1";
};

const API_BASE_URL = getBaseUrl();

export const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;

        console.log(`DEBUG: api.ts request to ${endpoint}`);
        console.log(`DEBUG: auth.currentUser exists? ${!!user}`);
        console.log(`DEBUG: token retrieved: ${token ? token.slice(0, 10) + '...' : 'null'}`);
        if ((options.headers as any)?.Authorization) {
            console.log(`DEBUG: explicit Authorization header present`);
        }

        const companyId = typeof window !== 'undefined' ? localStorage.getItem('unclutr_company_id') : null;
        const combinedHeaders: any = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(companyId ? { "X-Company-ID": companyId } : {}),
            ...((options.headers as any) || {}),
        };

        // If explicit header overrides auto-token, it's fine, but let's log it.
        console.log(`DEBUG: Final Authorization Header: ${(combinedHeaders.Authorization || '').slice(0, 20)}...`);

        console.log(`DEBUG: API Request [${options.method || 'GET'} ${endpoint}] Headers:`, JSON.stringify(combinedHeaders));

        // Ensure we don't send "Bearer null" or "Bearer undefined" if logic somehow failed upstream
        if (combinedHeaders.Authorization && (combinedHeaders.Authorization.includes("undefined") || combinedHeaders.Authorization === "Bearer null")) {
            console.warn("WARNING: Sending 'Bearer undefined' or 'Bearer null' in headers!");
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            cache: 'no-store', // Disable caching to fetch fresh data
            headers: combinedHeaders,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(error.detail || response.statusText);
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
