"use client";

import { auth } from "./firebase";

// Use direct backend URL for local dev to avoid Next.js proxy stripping headers/slashes
// Use dynamic base URL: prioritize env var, then current origin, fallback to localhost
const getBaseUrl = () => {
    // Robust fallback for localhost development:
    // If we are on localhost and the env var is either missing OR relative (e.g. "/api"), 
    // force direct connection to Python backend on port 8000.
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        if (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.startsWith('/')) {
            console.log("DEBUG: api.ts - Localhost detected. Defaulting API to http://127.0.0.1:8000/api/v1");
            return "http://127.0.0.1:8000/api/v1";
        }
    }

    if (process.env.NEXT_PUBLIC_API_URL) return `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
    if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // If on ngrok or other, use the same domain for API (assumes proxy or standard setup)
            // But here we know backend is usually on :8000
            return `http://${hostname}:8000/api/v1`;
        }
    }
    return "http://127.0.0.1:8000/api/v1";
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

        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log(`DEBUG: API fetching FULL URL: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            ...options,
            cache: 'no-store', // Disable caching to fetch fresh data
            headers: combinedHeaders,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
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
