#!/bin/bash

# Test script to verify designation auto-population
# This script calls the /users/me endpoint and checks if designation is populated

echo "=== Testing Designation Auto-Population ==="
echo ""

# You'll need to replace this with a valid Firebase token
# For now, this is just a template to show how to test

echo "To test manually:"
echo "1. Open the browser DevTools (F12)"
echo "2. Go to the Application/Storage tab"
echo "3. Find the Firebase auth token"
echo "4. Run this command:"
echo ""
echo 'curl -X GET "http://localhost:8000/api/v1/users/me" \'
echo '  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \'
echo '  -H "X-Company-ID: YOUR_COMPANY_ID" | jq'
echo ""
echo "Expected result: designation field should be 'Founder' (from most recent campaign)"
