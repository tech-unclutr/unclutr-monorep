"use client";

import { auth } from "./firebase";

// Use direct backend URL for local dev to avoid Next.js proxy stripping headers/slashes
const API_BASE_URL = "http://localhost:8000/api/v1";

export const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;

        const combinedHeaders = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...((options.headers as any) || {}),
        };

        console.log(`DEBUG: API Request [${options.method || 'GET'} ${endpoint}] Headers:`, JSON.stringify(combinedHeaders));

        // Ensure we don't send "Bearer null" or "Bearer undefined" if logic somehow failed upstream
        if (combinedHeaders.Authorization && combinedHeaders.Authorization.includes("undefined")) {
            console.warn("WARNING: Sending 'Bearer undefined' in headers!");
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
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

    post(endpoint: string, body: any, headers?: any) {
        return this.request(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
            headers,
        });
    },
};
