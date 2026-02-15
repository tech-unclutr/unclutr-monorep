import { auth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export enum RequestType {
    DATASOURCE = "DATASOURCE",
    WORKSPACE_DELETION = "WORKSPACE_DELETION"
}

export interface CreateRequestParams {
    name: string;
    category?: string;
    request_type?: RequestType;
    payload?: Record<string, any>;
}

export interface UserRequest {
    id: string;
    user_id: string;
    name: string;
    request_type: RequestType;
    status: string;
    created_at: string;
}

export const createUserRequest = async (params: CreateRequestParams): Promise<UserRequest> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/api/v1/datasources/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create request: ${response.status} ${errorText}`);
    }

    return response.json();
};

export const getUserRequests = async (): Promise<UserRequest[]> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/api/v1/datasources/requests`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch requests: ${response.status} ${errorText}`);
    }

    return response.json();
};

export const cancelUserRequest = async (requestId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/api/v1/datasources/requests/${requestId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        throw new Error(`Failed to cancel request: ${response.status} ${errorText}`);
    }
    // 204 or 404 is success/idempotent
};
