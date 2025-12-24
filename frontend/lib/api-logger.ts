/**
 * API Logger - Intercepts and logs all fetch requests and responses
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch with logging
    window.fetch = async (...args) => {
        const [resource, config] = args;

        // Log request
        console.log('\n' + '='.repeat(80));
        console.log('🔵 API REQUEST');
        console.log('='.repeat(80));
        console.log('URL:', resource);
        console.log('Method:', config?.method || 'GET');
        console.log('Headers:', config?.headers || {});
        if (config?.body) {
            if (typeof config.body === 'string') {
                try {
                    console.log('Body:', JSON.parse(config.body));
                } catch {
                    console.log('Body:', config.body);
                }
            } else {
                console.log('Body:', config.body);
            }
        }
        console.log('='.repeat(80) + '\n');

        const startTime = performance.now();

        try {
            // Make actual request
            const response = await originalFetch(...args);
            const duration = performance.now() - startTime;

            // Clone response to read body without consuming it
            const clonedResponse = response.clone();
            let responseBody;

            try {
                responseBody = await clonedResponse.json();
            } catch {
                responseBody = await clonedResponse.text();
            }

            // Log response
            console.log('\n' + '='.repeat(80));
            console.log('🟢 API RESPONSE');
            console.log('='.repeat(80));
            console.log('URL:', resource);
            console.log('Status:', response.status, response.statusText);
            console.log('Duration:', `${duration.toFixed(2)}ms`);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            console.log('Body:', responseBody);
            console.log('='.repeat(80) + '\n');

            return response;
        } catch (error) {
            const duration = performance.now() - startTime;

            // Log error
            console.log('\n' + '='.repeat(80));
            console.log('🔴 API ERROR');
            console.log('='.repeat(80));
            console.log('URL:', resource);
            console.log('Duration:', `${duration.toFixed(2)}ms`);
            console.log('Error:', error);
            console.log('='.repeat(80) + '\n');

            throw error;
        }
    };

    console.log('✅ API and SDK logging enabled');
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
