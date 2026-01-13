# Updating the Shopify App Version

The app version is now automatically read from the `VERSION` file.

## How to Update the Version

1. Edit the `backend/VERSION` file:
   ```bash
   echo "v1.3.0-new-feature" > backend/VERSION
   ```

2. The server will automatically reload (if using `--reload` flag)

3. Refresh the Shopify app page to see the new version

## Current Version
The version is displayed in:
- Shopify admin app page (embedded view)
- `/health` endpoint
- Swagger API docs

## Version Format
Use semantic versioning with optional suffix:
- `v1.2.0` - Standard release
- `v1.2.0-beta` - Beta release
- `v1.2.0-zero-drift` - Custom suffix
