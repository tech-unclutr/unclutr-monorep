---
description: Synchronize frontend API clients with backend OpenAPI specification.
---
1. Ensure the backend server is running and accessible at `http://localhost:8000/openapi.json`.
2. Fetch the latest OpenAPI schema.
// turbo
3. curl -o frontend/openapi.json http://localhost:8000/openapi.json
4. Regenerate the TypeScript client.
// turbo
5. cd frontend && npx openapi-typescript-codegen --input openapi.json --output ./src/api/generated --client fetch
