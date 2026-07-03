# PingPing Realtime Collaboration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared realtime data, code-only member sessions, simple room chat, and 25 MB file attachments while remaining on Supabase Free and Vercel Hobby.

**Architecture:** Keep the current vanilla frontend and add small Vercel Node Functions. Supabase Postgres is the source of truth, Realtime broadcasts row changes, and Supabase Storage holds public chat files. Browser reads are public; authenticated writes use a raw session token validated by Vercel Functions.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Node.js 22, Vercel Functions, Supabase JavaScript SDK, Postgres SQL, Node test runner, Bash contract tests

---

## File Map

- Create `package.json`: ESM runtime, dependencies, and test scripts.
- Create `server/config.js`: required environment lookup.
- Create `server/supabase.js`: admin Supabase client.
- Create `server/auth.js`: session extraction and validation.
- Create `server/validation.js`: code, message, and file validation.
- Create `api/config.js`: expose only the public Supabase URL and anon key to the static frontend.
- Create `api/login.js`, `api/session.js`, `api/change-code.js`, `api/logout.js`: code-only authentication.
- Create `api/data.js`: public snapshot reads and authenticated member/allocation/task writes.
- Create `api/messages.js`: public message reads and authenticated sends.
- Create `api/upload-token.js`: authenticated signed upload creation.
- Create `supabase/migrations/001_realtime_collaboration.sql`: tables, seed members, RLS, Realtime, and Storage bucket.
- Create `tests/server/*.test.js`: unit tests for validation and session behavior.
- Create `tests/api-contract.sh`: endpoint and schema contract checks.
- Modify `index.html`: login dialog, account control, chat tab, Supabase browser SDK.
- Modify `index.css`: login, account, connection, chat, and upload states.
- Modify `app.js`: remote repository, auth controller, realtime subscriptions, chat, and removal of settings-based JSON sync.
- Modify `tests/frontend-contract.sh`: preserve old UI contracts and require the new collaboration UI.
- Modify `.gitignore`: ignore local environment files and Vercel state.

### Task 1: Establish the Node/Test Foundation

**Files:**
- Create: `package.json`
- Create: `server/validation.js`
- Create: `tests/server/validation.test.js`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize version control if `.git` is absent**

Run: `test -d .git || git init`

Expected: repository initialized or existing repository retained.

- [ ] **Step 2: Write the failing validation tests**

```js
// tests/server/validation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCode, validateMessage, validateFile } from '../../server/validation.js';

test('accepts a simple member code', () => assert.equal(validateCode('PP-TUNG-2026'), 'PP-TUNG-2026'));
test('rejects empty and oversized codes', () => {
  assert.throws(() => validateCode(''));
  assert.throws(() => validateCode('x'.repeat(65)));
});
test('requires message text or an attachment', () => {
  assert.throws(() => validateMessage({ text: ' ', attachmentId: null }));
  assert.deepEqual(validateMessage({ text: ' hello ', attachmentId: null }), { text: 'hello', attachmentId: null });
});
test('accepts allowed files up to 25 MB', () => {
  assert.equal(validateFile({ name: 'brief.pdf', type: 'application/pdf', size: 25 * 1024 * 1024 }).name, 'brief.pdf');
  assert.throws(() => validateFile({ name: 'app.exe', type: 'application/octet-stream', size: 10 }));
  assert.throws(() => validateFile({ name: 'large.pdf', type: 'application/pdf', size: 25 * 1024 * 1024 + 1 }));
});
```

- [ ] **Step 3: Create package metadata and run the test red**

```json
{
  "name": "pingping-portal",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "node --test tests/server/*.test.js && bash tests/frontend-contract.sh && bash tests/api-contract.sh"
  },
  "dependencies": { "@supabase/supabase-js": "^2.57.4" }
}
```

Run: `npm install && node --test tests/server/validation.test.js`

Expected: FAIL because `server/validation.js` does not exist.

- [ ] **Step 4: Implement minimal validation**

```js
// server/validation.js
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(png|jpe?g|gif|webp|pdf|docx?|xlsx?|pptx?|zip)$/i;

export function validateCode(value) {
  const code = String(value || '').trim();
  if (!code || code.length > 64) throw new Error('Mã đăng nhập không hợp lệ.');
  return code;
}

export function validateMessage({ text, attachmentId }) {
  const cleanText = String(text || '').trim();
  const cleanAttachmentId = attachmentId || null;
  if (!cleanText && !cleanAttachmentId) throw new Error('Tin nhắn không được để trống.');
  if (cleanText.length > 4000) throw new Error('Tin nhắn tối đa 4.000 ký tự.');
  return { text: cleanText, attachmentId: cleanAttachmentId };
}

export function validateFile({ name, type, size }) {
  const cleanName = String(name || '').replace(/[^a-zA-Z0-9._ -]/g, '_');
  if (!ALLOWED_EXTENSIONS.test(cleanName)) throw new Error('Định dạng file không được hỗ trợ.');
  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) throw new Error('File phải nhỏ hơn hoặc bằng 25 MB.');
  return { name: cleanName, type: String(type || 'application/octet-stream'), size };
}
```

- [ ] **Step 5: Verify and commit**

Run: `node --test tests/server/validation.test.js`

Expected: 4 tests pass.

Run: `git add package.json package-lock.json server/validation.js tests/server/validation.test.js .gitignore && git commit -m "chore: add collaboration server foundation"`

### Task 2: Create the Supabase Schema and Seed Members

**Files:**
- Create: `supabase/migrations/001_realtime_collaboration.sql`
- Create: `tests/api-contract.sh`

- [ ] **Step 1: Write a failing schema contract**

```bash
#!/usr/bin/env bash
set -euo pipefail
schema=supabase/migrations/001_realtime_collaboration.sql
for table in members sessions allocations tasks messages attachments; do
  grep -qi "create table.*$table" "$schema"
done
grep -q "chat-files" "$schema"
grep -q "supabase_realtime" "$schema"
for endpoint in config login session change-code logout data messages upload-token; do
  test -f "api/$endpoint.js"
done
```

Run: `bash tests/api-contract.sh`

Expected: FAIL because the migration and endpoints are absent.

- [ ] **Step 2: Create the migration**

The migration must create UUID-enabled tables with these exact columns:

```sql
create extension if not exists pgcrypto;
create table if not exists members (
  id text primary key, name text not null, role text not null default '', skills text not null default '',
  color text not null default '#2563eb', avatar text not null default '', login_code text not null unique, updated_at timestamptz not null default now()
);
create table if not exists sessions (
  token text primary key, member_id text not null references members(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists allocations (
  competition_id text not null, team_type text not null, member_id text not null references members(id) on delete cascade,
  position integer not null default 0, updated_at timestamptz not null default now(),
  primary key (competition_id, team_type, member_id)
);
create table if not exists tasks (
  id text primary key, competition_id text not null, title text not null, description text not null default '',
  assignee_id text references members(id), column_id text not null, updated_at timestamptz not null default now()
);
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(), sender_id text not null references members(id),
  name text not null, mime_type text not null, size_bytes integer not null, storage_path text not null, public_url text not null,
  created_at timestamptz not null default now()
);
create table if not exists messages (
  id uuid primary key default gen_random_uuid(), room_id text not null, sender_id text not null references members(id),
  text text not null default '', attachment_id uuid references attachments(id), created_at timestamptz not null default now()
);
```

Seed the seven existing IDs (`tung`, `tunganh`, `hau`, `tuantran`, `hung`, `duyanh`, `thach`) with their current profile values and unique initial raw codes `PP-TUNG-2026`, `PP-TUNGANH-2026`, `PP-HAU-2026`, `PP-TUANTRAN-2026`, `PP-HUNG-2026`, `PP-DUYANH-2026`, and `PP-THACH-2026` using `insert ... on conflict (id) do nothing`.

Enable RLS. Grant anonymous `select` on members, allocations, tasks, messages, and attachments; do not grant browser writes. This intentionally makes raw member codes readable to someone inspecting Supabase traffic, matching the accepted temporary-security constraint. Add allocations, tasks, messages, and members to `supabase_realtime`. Insert a public `chat-files` bucket with a 25 MB size limit and allowed MIME types matching Task 1.

- [ ] **Step 3: Apply schema in Supabase**

Run: `npx supabase link --project-ref "$SUPABASE_PROJECT_REF" && npx supabase db push`

Expected: migration applies without SQL errors and all six tables exist.

- [ ] **Step 4: Commit**

Run: `git add supabase tests/api-contract.sh && git commit -m "feat: add realtime collaboration schema"`

### Task 3: Add Server Configuration and Session Authentication

**Files:**
- Create: `server/config.js`
- Create: `server/supabase.js`
- Create: `server/auth.js`
- Create: `tests/server/auth.test.js`

- [ ] **Step 1: Write failing auth tests**

Test `readBearerToken({ headers: { authorization: 'Bearer abc' } }) === 'abc'`, rejection of a missing bearer token, and `publicMember()` excluding `login_code`.

- [ ] **Step 2: Run red**

Run: `node --test tests/server/auth.test.js`

Expected: FAIL because `server/auth.js` is absent.

- [ ] **Step 3: Implement the helpers**

`server/config.js` exports `requireEnv(name)` and throws when missing. `server/supabase.js` creates one lazy `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })`. `server/auth.js` exports:

```js
export function readBearerToken(request) {
  const value = request.headers.authorization || '';
  if (!value.startsWith('Bearer ') || value.length <= 7) throw Object.assign(new Error('Chưa đăng nhập.'), { status: 401 });
  return value.slice(7);
}
export function publicMember({ login_code, ...member }) { return member; }
export async function requireSession(request, admin) {
  const token = readBearerToken(request);
  const { data, error } = await admin.from('sessions').select('token, member:members(*)').eq('token', token).maybeSingle();
  if (error || !data?.member) throw Object.assign(new Error('Phiên đăng nhập không hợp lệ.'), { status: 401 });
  return { token, member: data.member };
}
```

- [ ] **Step 4: Run green and commit**

Run: `node --test tests/server/auth.test.js`

Expected: all auth tests pass.

Run: `git add server tests/server/auth.test.js && git commit -m "feat: add raw-code session helpers"`

### Task 4: Implement Public Config, Login, Session, Code Change, and Logout APIs

**Files:**
- Create: `api/config.js`
- Create: `api/login.js`
- Create: `api/session.js`
- Create: `api/change-code.js`
- Create: `api/logout.js`
- Create: `server/http.js`

- [ ] **Step 1: Add request/response helpers**

`server/http.js` exports `json(response, status, body)`, `readJson(request)`, `method(request, allowed)`, and `fail(response, error)`; `fail` returns `{ error: error.message }` with `error.status || 500` and never returns stack traces.

- [ ] **Step 2: Implement public browser configuration**

`GET /api/config` returns `{ supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY }`. It never returns `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 3: Implement login**

`POST /api/login` validates `{ code }`, selects a member with `.eq('login_code', code).maybeSingle()`, creates `crypto.randomUUID()`, inserts it into sessions, and returns `{ token, member: publicMember(member) }`. Wrong codes return 401 with `Mã đăng nhập không đúng.`.

- [ ] **Step 4: Implement session and logout**

`GET /api/session` calls `requireSession` and returns the public member. `POST /api/logout` deletes the current token from sessions and returns `{ ok: true }`.

- [ ] **Step 5: Implement code change**

`POST /api/change-code` requires a session, validates `{ code }`, rejects duplicate codes with 409, and updates only the signed-in member's `login_code`. Delete all that member's other sessions so changed codes invalidate other devices.

- [ ] **Step 6: Verify endpoint contracts and commit**

Run: `node --check api/config.js && node --check api/login.js && node --check api/session.js && node --check api/change-code.js && node --check api/logout.js`

Expected: every command exits 0.

Run: `git add api server/http.js && git commit -m "feat: add member code login APIs"`

### Task 5: Implement Shared Data and Message APIs

**Files:**
- Create: `api/data.js`
- Create: `api/messages.js`
- Create: `api/upload-token.js`

- [ ] **Step 1: Implement the public snapshot**

`GET /api/data` returns `{ members, allocations, tasks }`; it selects explicit public member columns and never includes `login_code`, orders allocations by position, and orders tasks by id.

- [ ] **Step 2: Implement authenticated mutations**

`POST /api/data` requires a session and accepts only these operations: `member.update`, `allocations.replace`, `task.create`, `task.update`, and `task.delete`. Use a `switch` with an explicit allowed-field object for every operation; never pass arbitrary request objects to Supabase. Return the changed data.

- [ ] **Step 3: Implement messages**

`GET /api/messages?room_id=<id>&before=<iso>` returns the latest 100 messages with sender and attachment, ordered ascending for display. `POST /api/messages` requires a session, allows only `general`, `onevoice`, `thucchien`, `aichallenge`, `buildhub`, or `viettel`, validates text/attachment, inserts, and returns the joined message.

- [ ] **Step 4: Implement signed upload creation**

`POST /api/upload-token` requires a session, validates file metadata, creates path `${member.id}/${crypto.randomUUID()}-${safeName}`, calls `admin.storage.from('chat-files').createSignedUploadUrl(path)`, obtains `public_url` with `getPublicUrl(path)`, inserts an attachment row, and returns `{ attachment, path, token }`. If client upload fails, the unused metadata may remain; this is acceptable for the temporary system.

- [ ] **Step 5: Verify and commit**

Run: `bash tests/api-contract.sh && node --check api/data.js && node --check api/messages.js && node --check api/upload-token.js`

Expected: contract passes and all files parse.

Run: `git add api tests/api-contract.sh && git commit -m "feat: add collaboration data and chat APIs"`

### Task 6: Add Login and Account UI

**Files:**
- Modify: `index.html`
- Modify: `index.css`
- Modify: `app.js`
- Modify: `tests/frontend-contract.sh`

- [ ] **Step 1: Extend the failing frontend contract**

Require IDs `login-modal`, `login-code`, `login-submit`, `account-menu`, `change-code`, and `logout-btn`; require `pp_session` in `app.js`; require `.auth-modal` and `.account-menu` in CSS.

Run: `bash tests/frontend-contract.sh`

Expected: FAIL on missing collaboration UI.

- [ ] **Step 2: Add accessible markup**

Add a login dialog with one password input, submit button, inline error, and no registration flow. Public viewing remains usable while logged out. Add a header account button showing the signed-in member plus a small menu containing đổi mã and đăng xuất. Include the Supabase v2 browser UMD script before `app.js`.

- [ ] **Step 3: Add `AuthController`**

Implement `login(code)`, `restore()`, `changeCode(code)`, `logout()`, and `authorizedFetch(url, options)` around `/api/*`. Persist only `{ token, member }` under `pp_session`. Fetch `/api/config` once and initialize the browser Supabase client from its public values. Show the login dialog only when an attempted write needs authentication or the user explicitly opens login; public viewing remains available.

- [ ] **Step 4: Style and verify**

Use existing tokens and component patterns. Add mobile-safe dialog width, visible focus, inline error, loading/disabled states, and account dropdown positioning.

Run: `bash tests/frontend-contract.sh`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add index.html index.css app.js tests/frontend-contract.sh && git commit -m "feat: add simple member login UI"`

### Task 7: Replace Local JSON Sync with Record-Level Realtime Data

**Files:**
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Add a `RemoteRepository` boundary**

Implement methods `loadSnapshot`, `updateMember`, `replaceAllocations`, `createTask`, `updateTask`, `deleteTask`, `subscribe`, and `unsubscribe`. Reads call `/api/data`; writes use `AuthController.authorizedFetch`; subscriptions listen to Supabase `postgres_changes` on members, allocations, and tasks and trigger a debounced `loadSnapshot()`.

- [ ] **Step 2: Map database rows to current UI shapes**

Convert `description` to current task `desc`, `column_id` to `column`, and group allocation rows into the existing object keyed by competition. Keep current competition constants and render methods unchanged.

- [ ] **Step 3: Replace mutation call sites**

Change profile save, quick assignment, drag/drop allocation, Kanban create/move/delete to await repository writes. On failure, reload the snapshot and show a concise inline/toast error. Remove `supabaseConfig`, `syncWithSupabase`, the settings credential inputs, and local persistence for shared data.

- [ ] **Step 4: Verify existing contracts**

Run: `npm test`

Expected: unit and static contract tests pass.

- [ ] **Step 5: Commit**

Run: `git add app.js index.html && git commit -m "feat: sync portal records in realtime"`

### Task 8: Add Simple Room Chat and File Upload

**Files:**
- Modify: `index.html`
- Modify: `index.css`
- Modify: `app.js`
- Modify: `tests/frontend-contract.sh`

- [ ] **Step 1: Add failing chat contracts**

Require `data-tab="chat"`, `tab-chat`, `chat-room-list`, `chat-message-list`, `chat-compose-form`, `chat-message-input`, `chat-file-input`, and `chat-send-btn`.

Run: `bash tests/frontend-contract.sh`

Expected: FAIL on the absent chat elements.

- [ ] **Step 2: Add chat markup and styles**

Create a two-column desktop layout and stacked mobile layout. The room list contains the six approved room IDs. The composer contains a textarea, one file input with `accept` matching allowed types, upload status, and send button. Add empty, loading, connection-lost, and failed-send states.

- [ ] **Step 3: Implement chat loading and realtime**

Add `ChatController` with `openRoom(roomId)`, `loadMessages()`, `subscribe()`, `render()`, and `send()`. Fetch the latest 100 messages. Subscribe to message inserts, filtering the active room, and append without duplicates.

- [ ] **Step 4: Implement attachment upload**

Validate client file with the same extension and 25 MB limit. Request `/api/upload-token`, call `supabase.storage.from('chat-files').uploadToSignedUrl(path, token, file)`, then post the message with `attachmentId`. Disable the composer while sending and preserve the draft on failure for retry.

- [ ] **Step 5: Verify and commit**

Run: `npm test`

Expected: all tests pass.

Run: `git add index.html index.css app.js tests/frontend-contract.sh && git commit -m "feat: add realtime room chat and files"`

### Task 9: Provision Free Services and Deploy

**Files:**
- Modify: Vercel project environment (external)
- Modify: Supabase project (external)

- [ ] **Step 1: Provision Supabase Free**

Create/link one Supabase Free project, apply Task 2 migration, and capture project URL, anon key, service-role key, and project ref. Do not commit keys.

- [ ] **Step 2: Configure Vercel environments**

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and sensitive `SUPABASE_SERVICE_ROLE_KEY` for Production, Preview, and Development using `vercel env add`. Pull development values to `.env.local` and confirm `.env.local` is ignored.

- [ ] **Step 3: Build and deploy preview**

Run: `vercel pull --yes --environment=preview && vercel build && vercel deploy --prebuilt`

Expected: preview deployment reaches READY.

- [ ] **Step 4: Promote after browser verification**

Verify preview, then run `vercel promote <preview-url>`.

Expected: production alias points to the verified deployment.

### Task 10: End-to-End Verification

**Files:**
- No source changes unless verification finds a defect.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: zero failed tests.

- [ ] **Step 2: Verify two browser sessions**

Use two isolated browser sessions. Confirm public read works, login persists after reload, wrong codes fail, each initial member code identifies the correct member, code change works, and logout clears the session.

- [ ] **Step 3: Verify shared records**

In session A edit a member, allocation, and task. Confirm session B updates without reload. Simultaneously edit one task and confirm last write wins without corrupting other tasks.

- [ ] **Step 4: Verify chat and files**

Send text in general and one competition room. Confirm messages appear only in the correct room in session B. Upload an image/PDF under 25 MB, open its link, and confirm `.exe` and files over 25 MB are blocked before upload.

- [ ] **Step 5: Verify failure behavior and production health**

Block the network, attempt a write, and confirm the UI reports failure. Restore network and confirm snapshot/realtime recovery. Run `vercel inspect <production-url>`, HTTP checks for `/`, CSS, JS, and `/api/data`, plus `vercel logs <production-url> --since 1h --level error`.

Expected: deployment READY, page/assets/API return successful responses, and no unexpected runtime errors.

- [ ] **Step 6: Record initial codes for handoff**

Provide the seven initial codes privately to the project owner with the warning that codes and sessions are stored raw and the site must not contain sensitive information.
