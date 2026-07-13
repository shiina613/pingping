# X-O Test Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tung-only test-mode simulation action that completes the X-O release gate without requiring multiple member logins.

**Architecture:** Add one Supabase migration with a public RPC that validates Tung, test mode, and test scope, then completes matches through the existing private tournament progression helpers. Add a thin API method and host UI button that call the RPC.

**Tech Stack:** Supabase Postgres PL/pgSQL, supabase-js RPC client, vanilla JavaScript UI, node:test, pgTAP.

## Global Constraints

- The simulation is allowed only for Tung.
- The simulation is allowed only while `release_mode = 'test'`.
- The simulation must never complete a live-scope tournament.
- Test simulation must not mutate live wallets or live ratings.

---

### Task 1: Add Frontend Contract Tests

**Files:**
- Modify: `tests/xo-api.test.js`
- Modify: `tests/xo-arena.test.js`

**Interfaces:**
- Produces: `XoApi.simulateTestTournament()`
- Produces: UI click action `data-xo-action="simulate-test"`

- [ ] **Step 1: Write failing API test**

Add a test that calls `simulateTestTournament()` and expects RPC `xo_simulate_test_tournament` with credentials and a request id.

- [ ] **Step 2: Write failing UI test**

Add a DOM test that renders host controls and expects a `Hoàn tất test` button with `data-xo-action="simulate-test"`.

- [ ] **Step 3: Run tests and verify they fail**

Run: `node --test tests/xo-api.test.js tests/xo-arena.test.js`
Expected: failures because method/button do not exist.

### Task 2: Add Supabase Contract Test

**Files:**
- Modify: `supabase/tests/xo_tournament.test.sql`

**Interfaces:**
- Consumes: `public.xo_simulate_test_tournament(text, text, uuid)`

- [ ] **Step 1: Write failing pgTAP assertions**

Assert that Tung can simulate a test tournament, at least one test tournament is completed, and `xo_set_release_mode(..., 'live')` succeeds after simulation.

- [ ] **Step 2: Run schema SQL checks that can fail fast**

Run the text/schema tests locally before implementation.

### Task 3: Implement RPC Migration

**Files:**
- Create: `supabase/migrations/<timestamp>_xo_test_simulation.sql`

**Interfaces:**
- Produces: `public.xo_simulate_test_tournament(p_member_id text, p_login_code text, p_request_id uuid) returns jsonb`

- [ ] **Step 1: Create migration with Supabase CLI**

Run: `npx supabase migration new xo_test_simulation`

- [ ] **Step 2: Implement the RPC**

The RPC validates Tung, validates test mode, creates a test tournament if needed, loops over pending/active/scheduled matches, sets winner scores to target wins, completes active games, calls `private.xo_complete_match`, and returns `{ tournamentId, status, championId }`.

- [ ] **Step 3: Grant anon execute and reload PostgREST schema**

Revoke default execute, grant intended execute, and `notify pgrst, 'reload schema';`.

### Task 4: Implement Frontend Button and API

**Files:**
- Modify: `src/xo-api.js`
- Modify: `src/xo-arena.js`
- Modify: `src/xo.js`

**Interfaces:**
- Consumes: `public.xo_simulate_test_tournament`

- [ ] **Step 1: Add API method**

Add `simulateTestTournament()` using `mutate('simulate_test_tournament', {})`.

- [ ] **Step 2: Add host button**

Render `Hoàn tất test` only for host in test mode.

- [ ] **Step 3: Wire click handler**

Confirm with the user, call `api.simulateTestTournament()`, refresh snapshot.

### Task 5: Verify and Deploy

**Files:**
- Modify only files from earlier tasks.

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/xo-api.test.js tests/xo-arena.test.js`

- [ ] **Step 2: Run release tests**

Run: `npm test`

- [ ] **Step 3: Push migration and deploy production**

Run Supabase migration push, then Vercel production deploy, then verify the production button/RPC.
