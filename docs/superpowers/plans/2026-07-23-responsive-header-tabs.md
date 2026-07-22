# Responsive Header Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every visible header tab reachable, showing labels when space permits and icons only when the navigation container is narrow.

**Architecture:** Add semantic label spans and stable accessible names to the existing buttons. Use a CSS inline-size container query for the compact state and retain horizontal scrolling as the narrow-screen fallback; no JavaScript is needed.

**Tech Stack:** HTML, CSS container queries, Bash frontend contract tests, Vite, Vercel

## Global Constraints

- Preserve existing tab order, `data-tab` values, unread badges, icons, active state, and navigation behavior.
- Add no dependency or JavaScript resize handling.
- Keep horizontal scrolling as the final fallback when icons cannot fit.

---

### Task 1: Responsive primary navigation

**Files:**
- Modify: `tests/frontend-contract.sh`
- Modify: `index.html:35-89`
- Modify: `index.css:2415-2435`

**Interfaces:**
- Consumes: existing `.nav-tabs`, `.tab-btn`, SVG/emoji icons, and `.tab-unread-badge` markup
- Produces: `.tab-label` text wrappers and CSS compact mode driven by `container-type: inline-size`

- [ ] **Step 1: Write the failing contract test**

Add assertions requiring nine `.tab-label` wrappers, a stable `aria-label` and `title` on the dashboard tab, `container-type: inline-size`, and a container query that hides `.tab-label`.

```bash
test "$(grep -o 'class=\"tab-label\"' index.html | wc -l)" -eq 9
grep -q 'aria-label="Bảng điều khiển" title="Bảng điều khiển"' index.html
grep -q 'container-type: inline-size' index.css
grep -q '@container (max-width:' index.css
grep -q '\.tab-label' index.css
```

- [ ] **Step 2: Run the contract test to verify RED**

Run: `bash tests/frontend-contract.sh`

Expected: FAIL because `.tab-label` does not exist yet.

- [ ] **Step 3: Add the minimal responsive markup and CSS**

Wrap each visible label in `<span class="tab-label">…</span>`, add matching `aria-label` and `title` attributes to each tab, and add:

```css
.nav-tabs {
  container-type: inline-size;
}

@container (max-width: 720px) {
  .tab-btn {
    justify-content: center;
    padding-inline: 10px;
  }

  .tab-label {
    display: none;
  }
}
```

- [ ] **Step 4: Verify GREEN and production build**

Run: `npm test && npm run build`

Expected: 75 tests pass, frontend contract exits successfully, and Vite builds `dist/` without errors.

- [ ] **Step 5: Verify responsive behavior**

Serve the production build and confirm at representative widths that labels are present when the nav container exceeds 720px, labels are hidden below 720px, every icon remains visible/reachable, and horizontal overflow remains available on narrow mobile screens.

- [ ] **Step 6: Commit and deploy**

```bash
git add tests/frontend-contract.sh index.html index.css docs/superpowers/plans/2026-07-23-responsive-header-tabs.md
git commit -m "fix: make header tabs responsive"
npx --yes vercel@latest deploy --prod --yes
```

Verify the production alias returns HTTP 200 and serves the same hashed JS/CSS assets as the local build.
