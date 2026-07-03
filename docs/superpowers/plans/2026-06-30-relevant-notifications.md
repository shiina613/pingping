# Relevant Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable unread badges and opt-in browser notifications for messages and team updates that relate to the logged-in member.

**Architecture:** Postgres triggers create small recipient-specific notification rows for messages, assigned tasks, allocation membership changes, and profile edits. The browser loads unread rows, subscribes to inserts filtered by recipient, renders a notification center and room badges, and mirrors new rows to the Notifications API only while the document is hidden.

**Tech Stack:** PostgreSQL triggers/RLS, Supabase Postgres Changes, browser Notifications API, vanilla ES modules, Node.js tests.

---

### Task 1: Notification schema and trigger contracts

**Files:**
- Create: `supabase/migrations/<timestamp>_relevant_notifications.sql`
- Modify: `tests/schema.test.js`

- [ ] Add failing schema tests for `notifications`, `updated_by`, relevant-event trigger functions, RLS, grants, and realtime publication.
- [ ] Run `node --test tests/schema.test.js` and confirm RED.
- [ ] Generate the migration using `supabase migration new relevant_notifications`.
- [ ] Define notification rows with recipient, actor, kind, title, body, target tab/room, read timestamp, and creation timestamp.
- [ ] Add idempotent triggers for messages, task assignment/status, allocation membership changes, and member profile edits; exclude the actor.
- [ ] Run schema tests and confirm GREEN.

### Task 2: Client notification model

**Files:**
- Modify: `collaboration.js`
- Modify: `tests/collaboration.test.js`

- [ ] Add failing tests for unread totals, per-room counts, safe browser notification copy, and permission-state helpers.
- [ ] Run focused tests and confirm RED.
- [ ] Implement pure notification aggregation and formatting helpers.
- [ ] Run focused tests and confirm GREEN.

### Task 3: Notification center and unread badges

**Files:**
- Modify: `index.html`
- Modify: `index.css`
- Modify: `collaboration-controller.js`
- Modify: `tests/frontend-contract.sh`

- [ ] Add failing frontend contracts for the bell, unread badges, dropdown, mark-all-read action, and browser notification setting.
- [ ] Run the frontend contract and confirm RED.
- [ ] Add accessible notification-center markup and room/tab badge placeholders.
- [ ] Load unread notifications after session restoration, subscribe with `recipient_id=eq.<member>`, and update counts incrementally.
- [ ] Navigate to the target tab/room when a notification is selected and mark it read.
- [ ] Add “mark all read” behavior and states for empty/loading/error.
- [ ] Run `npm test` and confirm GREEN.

### Task 4: Browser notifications

**Files:**
- Modify: `collaboration-controller.js`
- Modify: `index.html`
- Modify: `tests/collaboration.test.js`

- [ ] Add failing tests/contracts for explicit permission requests, hidden-tab gating, and click targets.
- [ ] Request permission only from the Settings toggle.
- [ ] Show a system notification only for new rows from other actors while `document.hidden` is true.
- [ ] Focus the app and navigate to the stored target when the notification is clicked.
- [ ] Run `npm test` and confirm GREEN.

### Task 5: Apply, verify, commit, and deploy

**Files:**
- Verify all scoped files.

- [ ] Apply the migration to Supabase and query the created table/functions/policies.
- [ ] Run Supabase security and performance advisors and review new findings.
- [ ] Run `npm test`, syntax checks, and `git diff --check`.
- [ ] Verify desktop/mobile notification UI in a browser.
- [ ] Commit without `code.md`, deploy production to Vercel, and inspect READY status.
