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
    if (typeof window === 'undefined') return;

    console.log('\n' + '='.repeat(80));
    console.log('🔥 FIREBASE SDK');
    console.log('='.repeat(80));
    console.log('Operation:', operation);
    if (data) {
        console.log('Data:', data);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.log('='.repeat(80) + '\n');
};

export const logFirebaseError = (operation: string, error: any) => {
    if (typeof window === 'undefined') return;

    console.log('\n' + '='.repeat(80));
    console.log('🔴 FIREBASE ERROR');
    console.log('='.repeat(80));
    console.log('Operation:', operation);
    console.log('Error:', error);
    console.log('Error Code:', error?.code);
    console.log('Error Message:', error?.message);
    console.log('Timestamp:', new Date().toISOString());
    console.log('='.repeat(80) + '\n');
};
