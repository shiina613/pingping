# Chat Moderation, Retention, and Tab Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Enforce an atomic 18-message rolling limit with a five-minute mute, retain 36 messages per room, clean orphaned Storage files, and display unread totals in the tab title.

**Architecture:** A locked Postgres RPC is the only anonymous message-write path and returns structured results instead of rolling back moderation events. It queues detached files for a service-role Edge Function that deletes through the Storage API. Pure browser helpers own effective names, countdowns, RPC result mapping, and title text; the controller connects them to Realtime and the existing UI.

**Tech Stack:** PostgreSQL/PLpgSQL, Supabase Data API, Realtime, Storage and Edge Functions, vanilla JavaScript ES modules, Node.js test runner, shell frontend contracts.

---

### Task 1: Database moderation and retention contract

**Files:**
- Create: `supabase/migrations/<generated>_chat_moderation_retention.sql`
- Modify: `tests/schema.test.js`

- [x] **Step 1: Add failing schema contracts**

Assert the migration contains `chat_muted_until`, the `messages.kind` constraint, nullable system senders, private cleanup rows, the `send_chat_message` RPC, a per-member advisory/row lock, a rolling 60-second count across rooms, a five-minute mute, the exact moderation copy, pruning with `row_number() over (partition by room_id`, direct-insert revocation, explicit RPC grants, and a system-message notification guard.

- [x] **Step 2: Run the schema test and verify RED**

Run: `node --test tests/schema.test.js`

Expected: failures naming missing chat moderation migration contracts.

- [x] **Step 3: Generate and implement the migration**

Run `npx --yes supabase migration new chat_moderation_retention`, then implement:

```sql
alter table public.members add column if not exists chat_muted_until timestamptz;
alter table public.messages add column if not exists kind text not null default 'user';
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('user', 'system'));
alter table public.messages alter column sender_id drop not null;

create table if not exists private.attachment_cleanup_queue (
  attachment_id uuid primary key references public.attachments(id) on delete cascade,
  bucket_id text not null default 'chat-files',
  storage_path text not null unique,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

Create `public.send_chat_message(p_member_id text, p_login_code text, p_room_id text, p_text text, p_attachment_id uuid default null)` as `security definer set search_path = ''`. It locks `public.members`, validates the room/text/attachment, returns `muted` without extending an existing mute, returns `rate_limited` after setting `chat_muted_until = clock_timestamp() + interval '5 minutes'` and inserting `Thằng SV <Tên> đã bị khóa mõm 5 phút`, or inserts a `user` message and returns `sent`. It prunes all but the newest 36 rows in the affected room and queues their attachments before deletion.

Revoke direct insert from `anon`, revoke RPC execution from `public`, then grant only the exact RPC signature to `anon`. Update `private.notify_new_message()` to return immediately for `kind <> 'user'`.

- [x] **Step 4: Run schema tests and verify GREEN**

Run: `node --test tests/schema.test.js`

Expected: all schema tests pass.

- [x] **Step 5: Commit the database slice**

```bash
git add tests/schema.test.js supabase/migrations/*_chat_moderation_retention.sql
git commit -m "feat: enforce chat moderation and retention"
```

### Task 2: Pure client moderation and title helpers

**Files:**
- Modify: `collaboration.js`
- Modify: `tests/collaboration.test.js`

- [x] **Step 1: Add failing helper tests**

Test these wished-for APIs:

```js
assert.equal(effectiveMemberName({ name: 'Tùng', chat_muted_until: future }, now), 'Súc vật Tùng');
assert.equal(effectiveMemberName({ name: 'Tùng', chat_muted_until: past }, now), 'Tùng');
assert.equal(formatMuteCountdown(future, now), '04:59');
assert.equal(notificationDocumentTitle(3), '(3) PingPing');
assert.equal(notificationDocumentTitle(0), 'PingPing');
assert.deepEqual(chatSendResult({ status: 'muted', muted_until: future }), {
  accepted: false,
  mutedUntil: future,
  message: 'Đã bị khóa mõm.'
});
```

- [x] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/collaboration.test.js`

Expected: import/export failures for the new helpers.

- [x] **Step 3: Implement minimal pure helpers**

Add exported functions that compare supplied timestamps (never implicit test time), clamp countdowns at zero, generate only `PingPing` title variants, and normalize `sent`, `muted`, and `rate_limited` RPC rows.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/collaboration.test.js`

Expected: all collaboration tests pass.

- [x] **Step 5: Commit the helper slice**

```bash
git add collaboration.js tests/collaboration.test.js
git commit -m "feat: add chat moderation helpers"
```

### Task 3: Controller, Realtime, and UI behavior

**Files:**
- Modify: `collaboration-controller.js`
- Modify: `index.html`
- Modify: `index.css`
- Modify: `tests/collaboration.test.js`
- Modify: `tests/frontend-contract.sh`

- [x] **Step 1: Add failing controller and markup contracts**

Require `kind` and `chat_muted_until` in selects; `this.client.rpc('send_chat_message'`; dedicated `.chat-system-message`; disabled composer controls and `chat-mute-status`; DELETE Realtime handling; `document.title = notificationDocumentTitle(summary.total)`; and expiry timers that call both account/snapshot and composer rendering.

- [x] **Step 2: Run client tests and verify RED**

Run: `node --test tests/collaboration.test.js && bash tests/frontend-contract.sh`

Expected: failures for the absent RPC, mute UI, system markup, delete subscription, and title update.

- [x] **Step 3: Implement message rendering and RPC sends**

Extend `MESSAGE_SELECT` with `kind` and `sender.chat_muted_until`. Render `system` rows as escaped centered text. Replace direct insert with:

```js
const { data, error } = await this.client.rpc('send_chat_message', {
  p_member_id: this.session.member.id,
  p_login_code: this.session.code,
  p_room_id: this.activeRoom,
  p_text: message.text,
  p_attachment_id: attachmentId
}).single();
```

Normalize the RPC result. Fetch and append only a returned accepted `message_id`; preserve the draft on rejection. Remove deleted message IDs from rendered state when Realtime emits DELETE.

- [x] **Step 4: Implement mute state and effective names**

Add `#chat-mute-status` with `aria-live="polite"`. A single controller timer updates the countdown, disables textarea/file/send controls, refreshes effective names, and clears itself after expiry. Use the effective name in account and chat markup without changing `members.name`.

- [x] **Step 5: Implement tab-title unread state**

Set `document.title` in `renderNotifications()` from the aggregate unread total. Reset it during logout and zero-notification states.

- [x] **Step 6: Run client tests and verify GREEN**

Run: `node --test tests/collaboration.test.js && bash tests/frontend-contract.sh`

Expected: both commands pass.

- [x] **Step 7: Commit the browser slice**

```bash
git add collaboration-controller.js index.html index.css tests/collaboration.test.js tests/frontend-contract.sh
git commit -m "feat: connect moderated chat experience"
```

### Task 4: Storage cleanup worker

**Files:**
- Create: `supabase/functions/cleanup-chat-attachments/index.ts`
- Create: `tests/storage-cleanup-contract.test.js`
- Modify: `supabase/migrations/*_chat_moderation_retention.sql`

- [x] **Step 1: Add a failing worker contract test**

Require the function to authenticate a cron secret, create a service-role client from environment variables, claim incomplete queue rows through a private RPC, call `storage.from(bucket_id).remove(paths)`, and mark success or record a bounded error. Require the migration to expose worker-only claim/complete/fail functions and queue unattached attachments older than ten minutes.

- [x] **Step 2: Run the worker test and verify RED**

Run: `node --test tests/storage-cleanup-contract.test.js`

Expected: failure because the Edge Function does not exist.

- [x] **Step 3: Implement the Edge Function and private worker RPCs**

The Deno handler accepts POST only, compares `x-cleanup-secret` using constant-time byte comparison, processes at most 100 rows, removes objects through the Storage API, and returns JSON counts. No service-role or cleanup secret is committed.

Add a `private.queue_orphaned_chat_attachments()` function for attachments older than ten minutes that are not referenced by `messages`, ready for a once-per-minute scheduled invocation alongside the Edge Function.

- [x] **Step 4: Run the worker contract and full local tests**

Run: `node --test tests/storage-cleanup-contract.test.js && npm test`

Expected: all tests pass.

- [x] **Step 5: Commit the worker slice**

```bash
git add supabase/functions/cleanup-chat-attachments/index.ts tests/storage-cleanup-contract.test.js supabase/migrations/*_chat_moderation_retention.sql
git commit -m "feat: clean retired chat attachments"
```

### Task 5: Verification and deployment readiness

**Files:**
- Verify all changed files.

- [x] **Step 1: Run complete static verification**

```bash
npm test
node --check collaboration.js
node --check collaboration-controller.js
node --check app.js
git diff --check HEAD^
```

Expected: every command exits zero.

- [x] **Step 2: Inspect Supabase CLI availability and migration state**

```bash
npx --yes supabase --version
npx --yes supabase migration list --local
```

Expected: CLI version prints and the new migration appears locally. If the project is not linked/authenticated, report deployment as an external blocker rather than exposing or inventing credentials.

- [x] **Step 3: When linked credentials exist, deploy and verify**

Use CLI `--help` before each changing command, apply migrations, set `CLEANUP_SECRET`, deploy `cleanup-chat-attachments`, configure the cron invocation with Vault, query RPC behavior, and run database advisors. Never commit the service role or cleanup secret.

- [x] **Step 4: Browser verification against the migrated backend**

Serve the static app, verify system-message layout, muted composer, name restoration, retention deletes, unread title, and mobile layout with browser automation; confirm no console errors.

- [x] **Step 5: Final commit if verification required fixes**

Stage only scoped files and commit a narrowly named verification fix. Leave the user's pre-existing `app.js`, `code.md`, and `note.md` changes untouched.

### Task 6: Load the full retained room history

**Files:**
- Modify: `tests/collaboration.test.js`
- Modify: `collaboration-controller.js`

- [x] **Step 1: Change the history query contract from 15 to 36**

Rename the controller test to `chat controller loads all 36 retained messages and appends realtime inserts` and require:

```js
assert.match(source, /order\('created_at', \{ ascending: false \}\)\.limit\(36\)/);
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/collaboration.test.js`

Expected: the new 36-message assertion fails while production still contains `.limit(15)`.

- [x] **Step 3: Load all retained messages**

Change the room query in `loadMessages()` to:

```js
.eq('room_id', roomId).order('created_at', { ascending: false }).limit(36);
```

Keep chronological reversal, initial scroll-to-latest behavior, load-token race protection, and Realtime appends unchanged.

- [x] **Step 4: Run focused and complete verification**

Run:

```bash
node --test tests/collaboration.test.js
npm test
node --check collaboration-controller.js
git diff --check
```

Expected: all commands exit zero and the full suite reports 50 passing tests.

- [x] **Step 5: Commit, deploy production, and browser-check**

```bash
git add tests/collaboration.test.js collaboration-controller.js docs/superpowers/plans/2026-07-01-chat-moderation-retention.md
git commit -m "fix: load full retained chat history"
npx --yes vercel@50.28.0 deploy --prod --yes
```

Open the production URL, switch to `general`, and assert that the rendered message count equals the database-retained count, up to 36. Confirm the deployment is `Ready` and the browser has no console or page errors.
