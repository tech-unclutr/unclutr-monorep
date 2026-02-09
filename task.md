# Tasks

- [/] Investigate and fix "Disconnected" status display <!-- id: 0 -->
    - [x] Locate the component rendering the status (likely `CampaignActivityLog` or `UserActionPanel`)
    - [x] Determine why it shows "Disconnected" always
    - [x] Fix the logic to show correct status (Backend fix applied)
    - [ ] **Run Healer Script for Existing Data**
- [/] Investigate and fix Lead Transfer Logic (Agreed High -> User Action Panel) <!-- id: 1 -->
    - [x] Analyze backend logic for promoting leads to User Queue
    - [x] Identify why "Agreed (High)" leads remain in history
    - [x] Check edge cases (e.g., retries, existing queue items, concurrency)
    - [x] Implement fixes for missing transfers (Backend fix applied)
    - [ ] **Verify promotion of healed leads**
- [x] Fix "All Caught Up" UI <!-- id: 2 -->
    - [x] Locate the "All Caught Up" state in `UserActionPanel`
    - [x] Add header/indication that this is the User Action Panel
