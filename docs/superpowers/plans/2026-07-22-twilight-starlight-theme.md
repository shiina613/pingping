# Twilight Starlight Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PingPing Portal's CSS theme to the "Twilight Starlight" aesthetic (Late Twilight Sky gradient, starlight accents, pure CSS star animations, bouncy cartoon micro-interactions) without altering HTML structure or JavaScript logic.

**Architecture:** Update CSS custom properties (`:root`) in `index.css`, replace background definitions with the late twilight gradient, add keyframe animations for twinkling stars and floating elements, and refine component styles (cards, buttons, inputs) with glassmorphism and bouncy hover interactions.

**Tech Stack:** HTML5, CSS3 (CSS Custom Properties, Keyframe Animations, Backdrop Filter), Vite (Dev Server).

## Global Constraints

- Do not modify HTML structure in `index.html` unless strictly necessary for class names.
- Do not alter JavaScript state or logic in `app.js` or `collaboration-controller.js`.
- All visual changes must be driven by CSS custom properties and utility/component rules in `index.css`.

---

### Task 1: Update CSS Design Tokens & Base Background

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css#L1-L60)

**Interfaces:**
- Consumes: Design spec at `docs/superpowers/specs/2026-07-22-twilight-starlight-theme-design.md`
- Produces: Base `:root` variables and body background for Twilight Starlight theme.

- [ ] **Step 1: Check existing CSS variables in index.css**

Inspect lines 1-60 of `index.css` to verify existing variable names (`--bg-primary`, `--bg-secondary`, `--bg-card`, `--accent-blue`, etc.).

- [ ] **Step 2: Update `:root` variables and body background**

Replace `:root` declarations in `index.css` with:

```css
:root {
  /* Fonts */
  --font-display: 'Fredoka', 'Outfit', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Twilight Starlight Dark Palette */
  --bg-primary: #19142d;
  --bg-secondary: #231b3c;
  --bg-card: rgba(35, 27, 55, 0.65);
  --bg-glass: rgba(45, 33, 70, 0.45);
  --border-glass: rgba(255, 180, 200, 0.18);
  --border-glass-hover: rgba(255, 180, 200, 0.40);

  --text-primary: #fff8f6;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;

  /* Accents */
  --accent-gold: #fba147;
  --accent-magenta: #e040fb;
  --accent-cyan: #38bdf8;
  --accent-emerald: #34d399;
  --accent-rose: #f43f5e;
  --accent-amber: #f59e0b;
  --accent-purple: #a855f7;

  /* Gradients */
  --c-twilight-grad: linear-gradient(135deg, #e040fb 0%, #fba147 100%);
  --c-starlight-grad: linear-gradient(135deg, #38bdf8 0%, #e040fb 100%);
  --c-sky-grad: linear-gradient(180deg, #1c1635 0%, #4a2040 60%, #2c1a36 100%);

  /* UI Specs */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 9999px;
  --shadow-twilight: 0 10px 30px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 10px 30px rgba(224, 64, 251, 0.25);
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

body {
  background: var(--c-sky-grad);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
}
```

- [ ] **Step 3: Run dev server or verify CSS syntax**

Run: `npm run test` or check syntax to ensure no syntax errors.

- [ ] **Step 4: Commit changes**

```bash
git add index.css
git commit -m "style: update CSS design tokens and sky gradient background for Twilight Starlight theme"
```

---

### Task 2: Add Pure CSS Twinkling Stars & Floating Animations

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: Base `:root` variables from Task 1
- Produces: `@keyframes twinkle`, `@keyframes float`, and `.starlight-bg` background layer.

- [ ] **Step 1: Append Keyframe Animations and Star Background to index.css**

Add the following animations to `index.css`:

```css
/* ==========================================================================
   TWILIGHT STARLIGHT ANIMATIONS & BACKGROUND
   ========================================================================== */

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 0.95; transform: scale(1.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 40px 70px, #fba147, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 90px 40px, #e040fb, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 160px 120px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 230px 190px, #38bdf8, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 300px 60px, #fba147, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 370px 150px, #ffffff, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 400px 300px;
  animation: twinkle 4s ease-in-out infinite alternate;
}
```

- [ ] **Step 2: Verify animation styles syntax**

Inspect CSS to ensure pseudo-element `body::before` does not block pointer events.

- [ ] **Step 3: Commit changes**

```bash
git add index.css
git commit -m "style: add pure CSS twinkling stars background and floating keyframes"
```

---

### Task 3: Refine Card Glassmorphism, Bouncy Hover & Buttons

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: Variables and Keyframes from Tasks 1-2
- Produces: Twilight Glassmorphism card styles, bouncy button interactions, and glowing borders.

- [ ] **Step 1: Update Card & Glass Panel CSS Rules**

In `index.css`, update card/panel rules:

```css
.card, .glass-card, .panel, .sidebar {
  background: var(--bg-card) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass) !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-twilight) !important;
  transition: var(--transition-smooth);
}

.card:hover, .glass-card:hover {
  border-color: var(--border-glass-hover) !important;
  box-shadow: var(--shadow-glow) !important;
  transform: translateY(-4px) scale(1.01);
}

.btn-primary, button.primary {
  background: var(--c-twilight-grad) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: var(--radius-full) !important;
  font-family: var(--font-display) !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(224, 64, 251, 0.35) !important;
  transition: var(--transition-smooth) !important;
}

.btn-primary:hover, button.primary:hover {
  transform: translateY(-2px) scale(1.04) !important;
  box-shadow: 0 8px 25px rgba(224, 64, 251, 0.5) !important;
}

.btn-primary:active, button.primary:active {
  transform: translateY(1px) scale(0.98) !important;
}
```

- [ ] **Step 2: Run automated test suite**

Run: `npm run test`
Expected: All tests pass cleanly.

- [ ] **Step 3: Commit changes**

```bash
git add index.css
git commit -m "style: apply twilight glassmorphism and bouncy hover interactions to cards and buttons"
```
