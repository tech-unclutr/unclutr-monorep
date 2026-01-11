import { auth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Integration {
    id: string;
    status: string;
    in_stack: boolean;
    last_sync_at: string | null;
    error_message: string | null;
    metadata_info?: {
        sync_stats?: {
            current_step?: string;
            message?: string;
            progress?: number;
            orders_count?: number;
            total_count?: number;
            processed_count?: number;
            eta_seconds?: number;
            [key: string]: any;
        };
        [key: string]: any;
    };
    datasource: {
        id: string;
        name: string;
        slug: string;
        logo_url: string;
        category: string;
        description: string;
        is_implemented: boolean;
        stats: {
            records_count: number;
            sync_success_rate: number;
            health: 'healthy' | 'warning' | 'error';
        };
    };
}

const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }
    return await user.getIdToken();
};

export const listIntegrations = async (companyId: string): Promise<Integration[]> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to fetch integrations");
    return response.json();
};

export const getIntegration = async (companyId: string, id: string): Promise<Integration> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/${id}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to fetch integration");
    return response.json();
};

export const connectIntegration = async (companyId: string, slug: string): Promise<{ status: string; integration_id: string }> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/connect/${slug}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to connect integration");
    return response.json();
};

export const syncIntegration = async (companyId: string, id: string, delta: boolean = false): Promise<{ status: string }> => {
    const token = await getAuthToken();
    const url = new URL(`${API_URL}/api/v1/integrations/sync/${id}`);
    if (delta) url.searchParams.append('delta', 'true');

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to trigger sync");
    return response.json();
};

export const disconnectIntegration = async (companyId: string, id: string): Promise<{ status: string }> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/disconnect/${id}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to disconnect integration");
    return response.json();
};

export const addManualSource = async (companyId: string, slug: string, category: string): Promise<{ status: string }> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/add-manual-source`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Company-ID": companyId
        },
        body: JSON.stringify({ slug, category })
    });
    if (!response.ok) throw new Error("Failed to add manual source");
    return response.json();
};
