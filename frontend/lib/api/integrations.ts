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

const validateCompanyId = (companyId: string | null | undefined): string => {
    if (!companyId) {
        throw new Error("Missing Company ID. Please select a company first.");
    }
    // Handle edge case where "null" or "undefined" string is passed from state
    if (companyId === "null" || companyId === "undefined") {
        throw new Error("Invalid Company ID format. Session may be corrupted.");
    }
    return companyId;
};

export const listIntegrations = async (companyId: string): Promise<Integration[]> => {
    try {
        const validatedId = validateCompanyId(companyId);
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/api/v1/integrations/`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Company-ID": validatedId
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch integrations: ${response.status}`);
        }
        return response.json();
    } catch (error: any) {
        console.error(`[API:listIntegrations] Failure:`, {
            url: `${API_URL}/api/v1/integrations/`,
            companyId,
            error: error.message
        });
        throw error;
    }
};

export const getIntegration = async (companyId: string, id: string): Promise<Integration> => {
    try {
        const validatedId = validateCompanyId(companyId);
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/api/v1/integrations/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Company-ID": validatedId
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch integration: ${response.status}`);
        }
        return response.json();
    } catch (error: any) {
        console.error(`[API:getIntegration] Failure:`, { id, companyId, error: error.message });
        throw error;
    }
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

// --- Unified Analytics (Module 6 Refactored) ---

export interface IntegrationDailyMetric {
    id: string;
    snapshot_date: string;
    metric_type: string;
    total_sales: number;
    net_sales: number;
    gross_sales: number;
    count_primary: number; // e.g. Order count
    count_secondary: number; // e.g. New customer count
    total_discounts: number;
    total_refunds: number;
    total_tax: number;
    total_shipping: number;
    average_value: number;
    currency: string;
    meta_data: any;
}

export interface IntegrationOverview {
    metrics_30d: IntegrationDailyMetric[];
    summary: {
        total_sales_30d: number;
        growth_pct: number;
        order_count_30d: number;
    };
}

export const getIntegrationDailyMetrics = async (companyId: string, integrationId: string, days: number = 30): Promise<IntegrationDailyMetric[]> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/analytics/daily/${integrationId}?days=${days}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to fetch daily metrics");
    return response.json();
};

export const getIntegrationOverview = async (companyId: string, integrationId: string): Promise<IntegrationOverview> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/analytics/overview/${integrationId}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) throw new Error("Failed to fetch overview metrics");
    return response.json();
};
export const triggerShopifyReconciliation = async (companyId: string, integrationId: string): Promise<void> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/shopify/integrations/${integrationId}/reconcile`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Failed to trigger reconciliation" }));
        throw new Error(err.detail || "Failed to trigger reconciliation");
    }
};

export const verifyIntegrationIntegrity = async (companyId: string, integrationId: string): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/integrations/verify-integrity/${integrationId}`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Company-ID": companyId
        }
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Failed to verify integrity" }));
        throw new Error(err.detail || "Failed to verify integrity");
    }
    return response.json();
};
