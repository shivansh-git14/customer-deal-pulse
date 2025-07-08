# Sales RCA Dashboard: Implementation Plan

This document is the single source of truth for our development tasks. All progress will be tracked here to ensure clarity and consistency.

## I. Current Tasks

### Task 1: Fix "Avg. Activity / Rep" Metric

**Status:** `Not Started`

**Goal:** The "Avg. Activity / Rep" metric currently shows "N/A". This task is to diagnose the root cause in the backend and implement a fix.

**Plan:**
- [ ] **1.1: Investigate Backend Function.**
  - **Action:** Review the Supabase Edge Function at `supabase/functions/dashboard-overview/index.ts`.
  - **Goal:** Identify why the `avgActivitiesPerRep` value is not being calculated or returned in the API response.
- [ ] **1.2: Propose & Implement Fix.**
  - **Action:** Modify the backend function to correctly calculate the average activities based on active filters (date range, sales manager) and include it in the JSON response.
- [ ] **1.3: Verify on Frontend.**
  - **Action:** Confirm the metric displays the correct value on the dashboard and updates when filters are changed.

### Task 2: Restore Critical Alerts Section

**Status:** `Not Started`

**Goal:** Revert the "New Deal Alerts" card back to a unified "Critical Alerts" card, while keeping the "Repeat Deal Alerts" card separate.

**Plan:**
- [ ] **2.1: Analyze Frontend Component.**
  - **Action:** Review the `src/components/dashboard/CriticalAlerts.tsx` component.
  - **Goal:** Understand the current logic for splitting alerts.
- [ ] **2.2: Modify Component Logic.**
  - **Action:**
    - Change the first card's title back to "Critical Alerts".
    - Update its data source to display all alerts from the `criticalAlerts` array.
    - Ensure its modal also displays the complete, unfiltered list of critical alerts.
  - **Goal:** Restore the original, unified alerts view in the first card.
- [ ] **2.3: Verify on Frontend.**
  - **Action:** Confirm the "Critical Alerts" and "Repeat Deal Alerts" cards display the correct information.

## II. Completed Tasks
- [x] **Fix `OverviewMetrics.tsx` component**: Resolved all TypeScript errors and implemented the 2x2 grid layout.
- [x] **Add `avgActivitiesPerRep` to backend**: Initial implementation was added to the Supabase function. (Note: Currently requires debugging as per Task 1).
- [x] **Split Critical Alerts**: Initially split into "New Deal" and "Repeat Deal" cards. (Note: Being partially reverted as per Task 2).
