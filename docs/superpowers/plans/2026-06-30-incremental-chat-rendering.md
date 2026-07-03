# Incremental Chat Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render avatars safely and update chat incrementally while loading only the 15 newest messages when a room opens.

**Architecture:** Keep initial room loading separate from incremental message insertion. Extract pure helpers for avatar rendering, ordering, duplicate detection, and scroll decisions so the behavior is testable without a browser; let `CollaborationController` own DOM insertion and Supabase fetching.

**Tech Stack:** Browser ES modules, Node.js test runner, Supabase JS Realtime, HTML/CSS.

---

### Task 1: Test chat rendering helpers

**Files:**
- Modify: `tests/collaboration.test.js`
- Modify: `collaboration-controller.js`

- [ ] **Step 1: Write failing tests**

Add tests asserting that Data URL avatars produce an `img`, emoji avatars remain escaped text, initial rows reverse from newest-first to chronological order, duplicate IDs are rejected, and scroll decisions use a bottom-distance threshold.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/collaboration.test.js`

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Add minimal pure helpers**

Export `avatarMarkup(member, className)`, `chronologicalMessages(rows)`, `shouldAppendMessage(renderedIds, message)`, and `isNearBottom(element, threshold)` from `collaboration-controller.js`.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/collaboration.test.js`

Expected: all collaboration tests pass.

### Task 2: Implement initial 15-message load and incremental append

**Files:**
- Modify: `tests/collaboration.test.js`
- Modify: `collaboration-controller.js`

- [ ] **Step 1: Write failing source-contract tests**

Assert that the initial query uses descending `created_at` with `.limit(15)`, message IDs are tracked, realtime calls a single-message fetch/append path, and `sendMessage()` does not call `loadMessages()`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/collaboration.test.js`

Expected: FAIL against the current full-reload implementation.

- [ ] **Step 3: Implement the controller flow**

Add room request tokens, a `renderedMessageIds` set, `fetchMessage(id)`, `appendMessage(message, options)`, and `scrollToLatest()`. Make initial load fetch 15 newest rows, reverse them, and render once. Make realtime fetch/append only its inserted ID. Make send select and append the inserted row instead of reloading history.

- [ ] **Step 4: Preserve failed drafts**

Only clear text/file/status after the message has been inserted and appended successfully.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/collaboration.test.js`

Expected: all collaboration tests pass.

### Task 3: Add avatar containment and new-message UI

**Files:**
- Modify: `index.html`
- Modify: `index.css`
- Modify: `collaboration-controller.js`
- Modify: `tests/frontend-contract.sh`

- [ ] **Step 1: Write failing frontend contracts**

Require `chat-new-message-btn`, the hidden-state selector, contained avatar images, and the controller's scroll listener.

- [ ] **Step 2: Verify RED**

Run: `bash tests/frontend-contract.sh`

Expected: FAIL because the new-message button and styles do not exist.

- [ ] **Step 3: Add minimal markup and styles**

Place a hidden “Có tin nhắn mới ↓” button over the lower message-list edge. Ensure `.chat-message-avatar` clips overflow and its `img` fills the circle with `object-fit: cover`.

- [ ] **Step 4: Wire scroll behavior**

Show the button only when a remote message arrives while the reader is away from the bottom. Hide it after click, manual return to bottom, room switch, or initial load. Always scroll after the user's own successful send.

- [ ] **Step 5: Verify GREEN**

Run: `npm test`

Expected: all Node and frontend contract tests pass.

### Task 4: End-to-end verification

**Files:**
- Verify: `collaboration-controller.js`
- Verify: `index.html`
- Verify: `index.css`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: exit 0 with no failures.

- [ ] **Step 2: Serve and inspect the page**

Run a local static server, open the chat tab with browser automation, verify the page is nonblank, the chat shell is contained, avatar Data URLs render as images, and no error overlay appears.

- [ ] **Step 3: Review the diff**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; only scoped source, tests, and documentation changes appear.
