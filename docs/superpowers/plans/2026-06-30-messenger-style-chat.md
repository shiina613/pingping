# Messenger-Style Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give PingPing chat the layout, grouping rhythm, and composer behavior of Messenger Web without expanding into reactions, replies, or presence features.

**Architecture:** Add pure message-presentation helpers to derive group positions and time separators, then use that metadata for both initial rendering and incremental appends. Keep the existing Supabase data flow intact while limiting DOM updates to the previous last message and the new message.

**Tech Stack:** Browser ES modules, native DOM/CSS, Node.js test runner, Supabase Realtime.

---

### Task 1: Message grouping metadata

**Files:**
- Modify: `tests/collaboration.test.js`
- Modify: `collaboration-controller.js`

- [ ] Write failing tests for `single`, `first`, `middle`, and `last` positions using the five-minute sender threshold.
- [ ] Run `node --test tests/collaboration.test.js` and confirm the new tests fail for missing helpers.
- [ ] Implement pure `decorateMessages()` and `decorateMessagePair()` helpers, including the 15-minute separator rule.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Group-aware initial and incremental rendering

**Files:**
- Modify: `tests/collaboration.test.js`
- Modify: `collaboration-controller.js`

- [ ] Write failing tests for group classes, conditional sender/avatar markup, accessible timestamps, and last-message reconciliation.
- [ ] Run the focused tests and confirm RED.
- [ ] Render initial messages from decorated metadata.
- [ ] On append, recompute and replace only the previous last article before inserting the new article.
- [ ] Preserve deduplication, near-bottom behavior, and the 15-message query.
- [ ] Run the focused tests and confirm GREEN.

### Task 3: Messenger Web layout and composer

**Files:**
- Modify: `index.html`
- Modify: `index.css`
- Modify: `collaboration-controller.js`
- Modify: `tests/frontend-contract.sh`

- [ ] Write failing frontend contracts for the room avatar/status header, viewport-contained shell, skeleton state, composer pill, textarea autosize, and reduced motion.
- [ ] Run `bash tests/frontend-contract.sh` and confirm RED.
- [ ] Add the header identity markup and accessible icon-button labels.
- [ ] Replace chat CSS with a viewport-contained two-column layout, grouped bubble radii, compact spacing, pill composer, skeleton loading, and mobile fallback.
- [ ] Add textarea autosize up to five lines and reset after successful send.
- [ ] Run `npm test` and confirm GREEN.

### Task 4: Verification and deployment

**Files:**
- Verify: `collaboration-controller.js`
- Verify: `index.html`
- Verify: `index.css`

- [ ] Run `npm test`, `node --check collaboration-controller.js`, and `git diff --check`.
- [ ] Serve locally and inspect desktop/mobile chat using a browser screenshot.
- [ ] Commit the scoped source/test/plan changes without `code.md`.
- [ ] Deploy with `npx vercel deploy --prod --yes`.
- [ ] Inspect the deployment and verify the production alias serves the new assets.
