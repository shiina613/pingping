# Competition Countdown Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the single dashboard countdown with five horizontal countdown rows, one per competition.

**Architecture:** Add a small pure helper module for selecting each competition's next event and decomposing remaining milliseconds. Keep one DOM renderer and one one-second interval in `TeamPortal`, reusing the current competition constants and dashboard styling.

**Tech Stack:** Browser JavaScript ES modules, HTML, CSS, Node test runner, shell contract tests.

---

### Task 1: Pure countdown behavior

**Files:**
- Create: `src/countdown.js`
- Create: `tests/countdown.test.js`

- [x] **Step 1: Write failing tests**

Add tests that import `getCompetitionCountdowns` and `getCountdownParts`, then assert that each competition selects its earliest future event, completed competitions return a null event, invalid dates are ignored, input order is preserved, and durations split into padded day/hour/minute/second strings.

- [x] **Step 2: Verify the tests fail**

Run: `node --test tests/countdown.test.js`

Expected: FAIL because `src/countdown.js` does not exist.

- [x] **Step 3: Implement the minimal helpers**

Create `getCompetitionCountdowns(competitions, now)` using `map`, date validation, future filtering, and ascending sort. Create `getCountdownParts(target, now)` with a zero clamp and fixed unit divisors.

- [x] **Step 4: Verify the tests pass**

Run: `node --test tests/countdown.test.js`

Expected: all countdown tests pass.

### Task 2: Render five countdown rows

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `index.css`
- Modify: `tests/frontend-contract.sh`

- [x] **Step 1: Add a failing frontend contract**

Require `id="competition-countdowns"` in `index.html`, reject legacy IDs `countdown-comp-name`, `cd-days`, `cd-hours`, `cd-minutes`, and `cd-seconds`, and require `getCompetitionCountdowns` usage in `app.js`.

- [x] **Step 2: Verify the contract fails**

Run: `bash tests/frontend-contract.sh`

Expected: FAIL because the new container and helper usage are absent.

- [x] **Step 3: Replace markup and renderer**

Replace the single card with `<div id="competition-countdowns" class="competition-countdowns">`. Import the helper module, cache the container, render one `.countdown-box` per competition, update values via `data-countdown-*` selectors, and rebuild when an event expires.

- [x] **Step 4: Add row styling**

Make `.competition-countdowns` a vertical stack, reduce per-row padding, arrange row header and digits horizontally on desktop, and stack them on narrow screens while retaining a four-column digit grid.

- [x] **Step 5: Verify the contract and unit tests pass**

Run: `bash tests/frontend-contract.sh && node --test tests/countdown.test.js`

Expected: both commands pass.

### Task 3: Full verification

**Files:**
- Verify all changed files.

- [x] **Step 1: Run the full suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [x] **Step 2: Check the patch**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only planned files are modified or added.

### Task 4: Order rows by urgency

**Files:**
- Modify: `src/countdown.js`
- Modify: `tests/countdown.test.js`

- [x] **Step 1: Add a failing ordering test**

Pass competitions in non-chronological order and assert the result puts the nearest future event first, preserves input order for equal timestamps, and places completed competitions last.

- [x] **Step 2: Verify the ordering test fails**

Run: `node --test tests/countdown.test.js`

Expected: FAIL because countdown rows still preserve source order.

- [x] **Step 3: Sort the mapped rows**

Sort active rows by event timestamp and use positive infinity for completed rows. Rely on stable JavaScript sorting to retain source order for ties.

- [x] **Step 4: Verify the full suite passes**

Run: `npm test`

Expected: all tests pass with zero failures.
