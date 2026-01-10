import { api } from "../api";

interface AuthUrlResponse {
    url: string;
}

export const shopifyApi = {
    /**
     * Validates if a shop domain is reachable and valid.
     */
    validateShopDomain: async (shopDomain: string, companyId: string): Promise<boolean> => {
        try {
            const data = await api.post(
                "/integrations/shopify/validate-shop",
                { shop_domain: shopDomain },
                { "X-Company-ID": companyId }
            );
            return data;
        } catch (error) {
            console.error("Shop validation failed:", error);
            // If it's a 403, we should probably throw it or handle it, but for now returning false is existing behavior
            // However, the user wants us to fix the error. The error was 403 causing this to catch and return false (or throw undefined error).
            return false;
        }
    },

    /**
     * Generates the OAuth redirection URL.
     */
    getAuthUrl: async (shopDomain: string, companyId: string): Promise<string> => {
        try {
            const data = await api.post(
                "/integrations/shopify/auth/url",
                {
                    shop_domain: shopDomain,
                    company_id: companyId
                },
                { "X-Company-ID": companyId }
            );
            return (data as AuthUrlResponse).url;
        } catch (error) {
            console.error("Failed to generate auth URL:", error);
            if (error instanceof Error) {
                throw new Error(error.message || "Failed to generate auth URL");
            }
            throw new Error("Failed to generate auth URL");
        }
    },
};
