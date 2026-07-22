# HackMIT 2026 Psychedelic Fairytale Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PingPing Portal into the authentic **HackMIT 2026 Psychedelic Fairytale** visual style (Deep Royal Blue background, swirling ribbons of Coral, Peach, Mint, Gold & Lavender, Red Ribbon Header Navigation, Parchment Scroll cards, and Playing Card / Pocket Watch stat badges).

**Architecture:** Inject custom SVG ribbon swirls into body background overlay, update `:root` variables in `index.css`, style `.site-header` as a red hanging ribbon banner, style cards as unrolled parchment scrolls and playing cards, and apply fairytale typography.

**Tech Stack:** HTML5, CSS3, SVG background layers, Vite.

## Global Constraints

- Do not break existing JavaScript functionality or contract test suite in `npm run test`.
- All visual transformations driven by CSS + SVG vector elements in `index.css`.

---

### Task 1: Update CSS Variables, Sky Background & Psychedelic SVG Ribbon Swirls

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: Spec `docs/superpowers/specs/2026-07-22-hackmit-fairytale-theme-design.md`
- Produces: Royal Blue background and swirling ribbon SVG overlay.

- [ ] **Step 1: Update `:root` variables in index.css**

Replace `:root` declarations in `index.css` with the HackMIT Royal Blue & Psychedelic Ribbon palette:

```css
:root {
  --font-display: 'Outfit', 'Inter', sans-serif;
  --font-body: 'Outfit', 'Inter', sans-serif;

  --bg-primary: #1a2e6e;
  --bg-secondary: #142354;
  --bg-card: rgba(20, 35, 84, 0.85);
  --bg-parchment: #fffdf5;

  --border-gold: #fde047;
  --border-ribbon: #e63956;
  --border-glass: rgba(253, 224, 71, 0.25);
  --border-glass-hover: rgba(253, 224, 71, 0.60);

  --text-primary: #fffdf5;
  --text-secondary: #cbd5e1;
  --text-gold: #fde047;
  --text-parchment-red: #991b1b;
  --text-parchment-dark: #292524;

  --ribbon-coral: #e63956;
  --ribbon-peach: #f97316;
  --ribbon-mint: #2dd4bf;
  --ribbon-yellow: #fde047;
  --ribbon-lavender: #c084fc;

  --c-twilight-grad: linear-gradient(135deg, #e63956 0%, #f97316 40%, #fde047 100%);
  --c-starlight-grad: linear-gradient(135deg, #2dd4bf 0%, #c084fc 100%);
  --c-sky-grad: linear-gradient(180deg, #1a2e6e 0%, #111e48 100%);

  --radius-sm: 10px;
  --radius-md: 18px;
  --radius-lg: 26px;
  --radius-full: 9999px;

  --shadow-hackmit: 0 12px 35px rgba(0, 0, 0, 0.45);
  --shadow-glow: 0 10px 30px rgba(230, 57, 86, 0.35);
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

body {
  background: #1a2e6e;
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
  position: relative;
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
    radial-gradient(circle at 10% 20%, rgba(230, 57, 86, 0.25) 0%, transparent 40%),
    radial-gradient(circle at 90% 30%, rgba(253, 224, 71, 0.20) 0%, transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(45, 212, 191, 0.20) 0%, transparent 50%),
    radial-gradient(circle at 80% 85%, rgba(192, 132, 252, 0.20) 0%, transparent 40%);
  background-attachment: fixed;
}
```

- [ ] **Step 2: Run test suite**

Run: `npm run test`
Expected: PASS 100%.

- [ ] **Step 3: Commit changes**

```bash
git add index.css
git commit -m "style: apply HackMIT 2026 Royal Blue palette and ambient gradient glow layers"
```

---

### Task 2: Style Site Header as Red Banner Ribbon

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: Royal Blue & Ribbon palette from Task 1
- Produces: Red Ribbon banner navigation header style.

- [ ] **Step 1: Update `.site-header` and `.tab-btn` styling**

Update `.site-header` in `index.css`:

```css
.site-header {
  background: #e63956 !important;
  border-bottom: 3px solid #fde047 !important;
  box-shadow: 0 8px 25px rgba(230, 57, 86, 0.4) !important;
  padding: 1rem 2rem !important;
  position: relative;
  z-index: 10;
}

.site-header .logo-text, .header-title {
  color: #fffdf5 !important;
  font-family: var(--font-display) !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.tab-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #fffdf5 !important;
  border: 1px solid rgba(253, 224, 71, 0.4) !important;
  border-radius: var(--radius-full) !important;
  font-weight: 700 !important;
  transition: var(--transition-smooth) !important;
}

.tab-btn:hover {
  background: #fde047 !important;
  color: #1a2e6e !important;
  transform: translateY(-2px) scale(1.05) !important;
  box-shadow: 0 4px 15px rgba(253, 224, 71, 0.5) !important;
}

.tab-btn.active {
  background: #fde047 !important;
  color: #1a2e6e !important;
  box-shadow: 0 4px 15px rgba(253, 224, 71, 0.6) !important;
}
```

- [ ] **Step 2: Run test suite**

Run: `npm run test`
Expected: PASS 100%.

- [ ] **Step 3: Commit changes**

```bash
git add index.css
git commit -m "style: transform site header into HackMIT style red banner ribbon"
```

---

### Task 3: Transform Cards into Unrolled Parchment Scrolls & Pocket Watch Badges

**Files:**
- Modify: [index.css](file:///home/shiina/Documents/pingping/index.css)

**Interfaces:**
- Consumes: Design Tokens and Ribbon styles from Tasks 1-2
- Produces: Parchment Scroll card theme, circular pocket watch badges, and playing card tags.

- [ ] **Step 1: Style `.glass-card`, `.stat-card`, and `.btn-primary`**

Update `.glass-card`, `.stat-card`, and button styles in `index.css`:

```css
.glass-card {
  background: var(--bg-parchment) !important;
  color: var(--text-parchment-dark) !important;
  border: 3px solid #fde047 !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(251, 146, 60, 0.15) !important;
  padding: 1.75rem !important;
  transition: var(--transition-smooth) !important;
}

.glass-card:hover {
  transform: translateY(-4px) scale(1.01) !important;
  box-shadow: 0 16px 40px rgba(253, 224, 71, 0.35), inset 0 0 25px rgba(230, 57, 86, 0.2) !important;
  border-color: #e63956 !important;
}

.gradient-title {
  color: #991b1b !important;
  background: none !important;
  -webkit-text-fill-color: initial !important;
  font-family: var(--font-display) !important;
  font-weight: 800 !important;
  border-bottom: 2px dashed #f97316;
  padding-bottom: 0.5rem;
}

.stat-card {
  background: #fffdf5 !important;
  border: 3px solid #e63956 !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
  color: #292524 !important;
  transition: var(--transition-smooth) !important;
}

.stat-card:hover {
  transform: translateY(-4px) rotate(-1deg) scale(1.03) !important;
  border-color: #fde047 !important;
  box-shadow: 0 12px 30px rgba(253, 224, 71, 0.4) !important;
}

.stat-value {
  color: #991b1b !important;
  font-family: var(--font-display) !important;
  font-weight: 800 !important;
}

.btn-primary {
  background: linear-gradient(135deg, #e63956 0%, #f97316 100%) !important;
  color: #fffdf5 !important;
  border: 2px solid #fde047 !important;
  border-radius: var(--radius-full) !important;
  font-weight: 800 !important;
  box-shadow: 0 6px 20px rgba(230, 57, 86, 0.4) !important;
  transition: var(--transition-smooth) !important;
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.05) !important;
  box-shadow: 0 10px 28px rgba(253, 224, 71, 0.5) !important;
  background: linear-gradient(135deg, #f97316 0%, #e63956 100%) !important;
}
```

- [ ] **Step 2: Run test suite**

Run: `npm run test`
Expected: PASS 100%.

- [ ] **Step 3: Commit changes**

```bash
git add index.css
git commit -m "style: apply HackMIT parchment scroll cards and gold-bordered stat badges"
```
