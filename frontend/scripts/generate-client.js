const { generate } = require('openapi-typescript-codegen');
const path = require('path');

// Run this script to regenerate the API client from the running backend
// Usage: node scripts/generate-client.js

async function run() {
    console.log('Generating API client...');

    try {
        await generate({
            input: path.resolve(__dirname, '../openapi.json'),
            output: path.resolve(__dirname, '../lib/api/generated'),
            clientName: 'UnclutrClient',
            useOptions: true,
            useUnionTypes: true,
            serviceResponse: 'body', // We generally want the body, but can check 'response' if we need headers
        });
        console.log('API client generated successfully in lib/api/generated');
    } catch (error) {
        console.error('Error generating API client:', error);
        console.error('Make sure the backend is running at http://127.0.0.1:8000');
        process.exit(1);
    }
}

run();
