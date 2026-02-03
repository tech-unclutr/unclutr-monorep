#!/bin/bash

# Test the company/me endpoint
# First, we need to get a Firebase token. For testing, let's just check if the endpoint responds.

echo "Testing /api/v1/company/me endpoint..."
echo ""

# Test without auth (should get 401 or 403)
echo "1. Testing without auth:"
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8000/api/v1/company/me
echo ""
echo "---"
echo ""

# Check if the endpoint is registered
echo "2. Checking OpenAPI docs for /company/me:"
curl -s http://localhost:8000/openapi.json | grep -A 5 "/company/me" | head -20
echo ""
echo "---"
echo ""

# List all registered routes
echo "3. All /company routes:"
curl -s http://localhost:8000/openapi.json | grep '"/api/v1/company' | head -10
