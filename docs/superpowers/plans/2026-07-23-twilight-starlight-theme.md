# Twilight Starlight Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PingPing Portal's CSS theme to the "Twilight Sunset & Evening Stars" aesthetic (Late Twilight Sky gradient, starlight accents, pure CSS twinkling star animations, bouncy micro-interactions) without altering HTML structure or JavaScript logic.

**Architecture:** Update CSS custom properties (`:root` and `body.light-theme`) in `index.css`, replace background definitions with the late twilight gradient, add keyframe animations for twinkling stars and floating elements, and refine component styles (cards, buttons, inputs) with glassmorphism and bouncy hover interactions.

**Tech Stack:** HTML5, CSS3 (CSS Custom Properties, Keyframe Animations, Backdrop Filter), Vite (Dev Server).

## Global Constraints

- Do not modify HTML structure in `index.html` unless strictly necessary.
- Do not alter JavaScript state or logic in `app.js` or `collaboration-controller.js`.
- All visual changes must be driven by CSS custom properties and utility/component rules in `index.css`.

---

### Task 1: Update CSS Design Tokens & Base Background Palette

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css#L1-L75)

**Interfaces:**
- Consumes: Spec doc at `docs/superpowers/specs/2026-07-23-twilight-starlight-theme-design.md`
- Produces: Base `:root` design tokens and `body` background gradient for Twilight Starlight theme.

- [ ] **Step 1: Inspect existing CSS design tokens in index.css**

Inspect lines 1-75 of `index.css` to verify variable declarations.

- [ ] **Step 2: Update `:root` variables and body background in index.css**

Replace `:root` and `body` styling in `index.css` with:

```css
:root {
  /* Fonts */
  --font-display: 'Outfit', 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Be Vietnam Pro', 'Inter', sans-serif;

  /* Twilight Starlight Dark Palette */
  --bg-primary: #161226;
  --bg-secondary: #23193a;
  --bg-card: rgba(32, 23, 50, 0.70);
  --bg-glass: rgba(42, 28, 64, 0.50);
  
  --border-glass: rgba(255, 180, 200, 0.15);
  --border-glass-hover: rgba(251, 191, 36, 0.40);

  --text-primary: #fff8f6;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;

  /* Accents */
  --accent-gold: #fbbf24;
  --accent-amber: #f59e0b;
  --accent-rose: #fb7185;
  --accent-purple: #c084fc;
  --accent-cyan: #38bdf8;
  --accent-emerald: #34d399;

  /* Gradients */
  --c-twilight-grad: linear-gradient(135deg, #fb7185 0%, #f59e0b 100%);
  --c-starlight-grad: linear-gradient(135deg, #38bdf8 0%, #c084fc 100%);
  --c-sky-grad: linear-gradient(180deg, #141022 0%, #2a1638 50%, #3e1b38 100%);

  /* UI Specs */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 9999px;
  --shadow-twilight: 0 10px 30px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 10px 30px rgba(251, 191, 36, 0.25);
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

body.light-theme {
  --bg-primary: #fdfbf7;
  --bg-secondary: #f4efe6;
  --bg-card: rgba(255, 255, 255, 0.85);
  --bg-glass: rgba(255, 255, 255, 0.65);
  --border-glass: rgba(60, 40, 80, 0.10);
  --border-glass-hover: rgba(245, 158, 11, 0.30);
  
  --text-primary: #1e1b2e;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  
  --shadow-glow: 0 8px 30px rgba(245, 158, 11, 0.15);
}

body {
  background: var(--c-sky-grad);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
}
```

- [ ] **Step 3: Verify CSS changes**

Run: `npm run test` or build check to verify CSS validity.
Expected: PASS

- [ ] **Step 4: Commit Task 1**

```bash
git add index.css
git commit -m "style: update design tokens and sky gradient background for Twilight Starlight theme"
```

---

### Task 2: Add Pure CSS Twinkling Evening Stars Animation

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: `:root` design tokens from Task 1
- Produces: `@keyframes twinkle` animation and `body::before` starlight background layer.

- [ ] **Step 1: Add Twinkling Stars Pseudo-Element to index.css**

Add the `@keyframes twinkle` animation and `body::before` rule:

```css
/* ==========================================================================
   TWILIGHT STARLIGHT ANIMATIONS & BACKGROUND
   ========================================================================== */

@keyframes twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50% { opacity: 0.90; transform: scale(1.15); }
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
    radial-gradient(2px 2px at 25px 35px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 45px 75px, #fbbf24, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 95px 45px, #fb7185, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 165px 125px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 235px 195px, #38bdf8, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 305px 65px, #f59e0b, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 375px 155px, #ffffff, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 400px 300px;
  animation: twinkle 4s ease-in-out infinite alternate;
}
```

- [ ] **Step 2: Verify CSS validity**

Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Commit Task 2**

```bash
git add index.css
git commit -m "style: add pure CSS twinkling evening stars background animation"
```

---

### Task 3: Refine Glassmorphism Panels, Buttons & Header Navigation

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: Design tokens and keyframe animations from Tasks 1-2
- Produces: Polished glassmorphism styles for cards, tabs, and buttons.

- [ ] **Step 1: Update Card & Glass Panel styling in index.css**

Update card, panel, button, and header styles:

```css
.site-header {
  background: var(--bg-glass) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-glass) !important;
}

.tab-btn.active {
  background: var(--c-twilight-grad) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35) !important;
}

.card, .glass-card, .panel, .sidebar-card {
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
  transform: translateY(-3px);
}

button.primary, .btn-primary {
  background: var(--c-twilight-grad) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: var(--radius-full) !important;
  font-family: var(--font-display) !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3) !important;
  transition: var(--transition-smooth) !important;
}

button.primary:hover, .btn-primary:hover {
  transform: translateY(-2px) scale(1.03) !important;
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.45) !important;
}
```

- [ ] **Step 2: Run test suite**

Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Commit Task 3**

```bash
git add index.css
git commit -m "style: apply twilight glassmorphism and bouncy hover interactions to cards, tabs, and buttons"
```
