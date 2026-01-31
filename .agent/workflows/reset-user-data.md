---
description: Reset all user data (Users, Companies, activity) effectively starting fresh. Preserves configuration.
---

1. Run the reset user data script.
// turbo
2. python3 backend/scripts/reset_user_data.py

3. Seed datasources.
// turbo
4. python3 backend/scripts/seed_datasources.py

5. Seed development fixtures (Permissions, Modules).
// turbo
6. python3 backend/scripts/seed_dev.py
