/**
 * API Logger - Intercepts and logs all fetch requests and responses
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
    // Store original fetch
    const originalFetch = window.fetch;

    /*
    // Override fetch with logging
    window.fetch = async (...args) => {
        const [resource, config] = args;

        let url = "";
        let method = "GET";
        let headers = {};
        
        // ... (Logger Disabled for Stability)
        
        try {
            const response = await originalFetch(...args);
            return response;
        } catch (error) {
            throw error;
        }
    };
    console.log('✅ API and SDK logging enabled');
    */
}

/**
 * Firebase SDK Logger - Logs Firebase operations
 */
export const logFirebaseOperation = (operation: string, data?: any) => {
    // Disabled for production cleanup
};

export const logFirebaseError = (operation: string, error: any) => {
    // Only log actual errors in console for visibility during dev if needed, 
    // but for this cleanup we'll make it a standard console.error if not disabled.
    console.error(`[Firebase Error] ${operation}:`, error);
};
