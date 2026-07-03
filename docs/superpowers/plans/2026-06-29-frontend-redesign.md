# PingPing Portal Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the portal's cyberpunk glass styling with a premium light-first operational workspace and a complete dark theme while preserving every existing workflow and data contract.

**Architecture:** Keep the current vanilla HTML, CSS, and JavaScript application. Introduce semantic theme tokens and component-level CSS, make only targeted markup and theme-controller changes, and verify stable DOM hooks with a dependency-free shell test.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Bash static checks, browser verification when runtime support is available

---

## File Map

- `index.html`: document metadata, semantic/accessibility attributes, stable application structure.
- `index.css`: complete token and component visual system, light/dark themes, responsive rules, reduced motion.
- `app.js`: theme initialization and generated state markup only; existing data and workflows remain intact.
- `tests/frontend-contract.sh`: dependency-free regression checks for stable tabs, theme tokens, accessibility, responsive and reduced-motion rules.

### Task 1: Add the frontend contract test

**Files:**
- Create: `tests/frontend-contract.sh`

- [ ] **Step 1: Write the failing contract test**

```bash
#!/usr/bin/env bash
set -euo pipefail

for tab in dashboard competitions planner timeline kanban directory settings; do
  grep -q "id=\"tab-$tab\"" index.html
  grep -q "data-tab=\"$tab\"" index.html
done

grep -q 'data-theme=' index.html
grep -q -- '--color-accent:' index.css
grep -q 'prefers-color-scheme: dark' index.css
grep -q 'prefers-reduced-motion: reduce' index.css
grep -q 'min-height: 100dvh' index.css
grep -q ':focus-visible' index.css
! grep -q 'fonts.googleapis.com' index.css
! grep -q 'gradient-title' index.html
```

- [ ] **Step 2: Run the test and confirm the current frontend fails**

Run: `bash tests/frontend-contract.sh`

Expected: non-zero exit because semantic theme tokens and new markup are not present.

- [ ] **Step 3: Make the test executable**

Run: `chmod +x tests/frontend-contract.sh`

Expected: the script has executable permissions.

### Task 2: Establish semantic theme behavior

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `index.css`
- Test: `tests/frontend-contract.sh`

- [ ] **Step 1: Add an early theme bootstrap and accessible toggle markup**

Add `data-theme="light"` to `<html>`, execute an inline bootstrap before paint that reads `pp_theme` or `matchMedia('(prefers-color-scheme: dark)')`, and give the toggle `aria-label`, `aria-pressed`, and a hidden text label.

- [ ] **Step 2: Replace class-only theme application**

Update `applyTheme()` and the toggle handler to set `document.documentElement.dataset.theme`, synchronize `aria-pressed`, and continue writing the existing `pp_theme` key.

- [ ] **Step 3: Define the semantic token pair**

Create light tokens in `:root` and matching dark tokens under `@media (prefers-color-scheme: dark)` plus `html[data-theme="dark"]`. Use graphite neutrals, cobalt accent, semantic success/warning/danger colors, 12px surfaces, and 8px controls.

- [ ] **Step 4: Run the contract test**

Run: `bash tests/frontend-contract.sh`

Expected: it may still fail on component cleanup, but tab and theme assertions pass.

### Task 3: Rebuild the shared shell and dashboard

**Files:**
- Modify: `index.html`
- Modify: `index.css`
- Test: `tests/frontend-contract.sh`

- [ ] **Step 1: Clean shared markup classes**

Replace `gradient-title` with `section-title`, remove presentation-only inline color styles from dashboard summary elements, and preserve all IDs and `data-tab` attributes.

- [ ] **Step 2: Restyle the application shell**

Implement a 72px maximum sticky header, one-line desktop tab rail, horizontally scrollable compact navigation on small screens, a bounded 1440px workspace, and visible `:focus-visible` outlines.

- [ ] **Step 3: Restyle dashboard hierarchy**

Build compact four-column metrics, a high-priority deadline panel, a two-column operations area, tabular numerals, and explicit one-column collapse below 900px. Remove universal backdrop blur, glow, and gradient text.

- [ ] **Step 4: Verify the dashboard contract**

Run: `bash tests/frontend-contract.sh`

Expected: all assertions pass.

### Task 4: Normalize all operational views

**Files:**
- Modify: `index.css`
- Modify: `app.js`
- Test: `tests/frontend-contract.sh`

- [ ] **Step 1: Normalize generated competition and allocation content**

Map existing generated classes to semantic surfaces, status chips, metadata groups, and toolbars. Retain competition colors only as identity markers.

- [ ] **Step 2: Normalize planner, timeline, Kanban, directory, settings, and modal styles**

Use the same token system, radius rules, form labels, focus states, button hierarchy, empty-state spacing, and responsive collapse behavior in every view.

- [ ] **Step 3: Add reduced-motion and mobile safeguards**

Under `@media (prefers-reduced-motion: reduce)`, remove animations and smooth transitions. Use `min-height: 100dvh`, 44px minimum interactive targets on touch widths, and explicit grid collapse rules.

- [ ] **Step 4: Run static verification**

Run: `bash tests/frontend-contract.sh && grep -RIn '[—–]' index.html app.js || true`

Expected: contract test passes and no new visible dash characters are introduced in markup-generated copy.

### Task 5: Full verification and handoff

**Files:**
- Test: `tests/frontend-contract.sh`

- [ ] **Step 1: Run syntax and contract checks**

Run: `bash -n tests/frontend-contract.sh && bash tests/frontend-contract.sh`

Expected: both commands exit zero.

- [ ] **Step 2: Serve the portal for browser review**

Run: `python3 -m http.server 8000`

Expected: the portal is available at `http://localhost:8000`.

- [ ] **Step 3: Verify core workflows manually**

Check all seven tabs, light/dark persistence, modal open/close, allocation save, Kanban task movement, calendar export, mobile navigation, keyboard focus, and reduced motion.

- [ ] **Step 4: Document limitations**

Record any workflow that cannot be exercised without external Supabase credentials. Do not expose or fabricate credentials.

## Execution Notes

- This directory is not a Git repository, so the commit steps normally required by the planning workflow cannot be performed.
- Execute inline in the current session because delegated agents were not requested.
