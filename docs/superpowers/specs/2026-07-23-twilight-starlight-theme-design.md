# Twilight Starlight Theme Redesign Spec

**Date:** 2026-07-23  
**Status:** Approved  
**Scope:** Re-skin and style redesign of PingPing Team Portal without altering HTML layout or JavaScript logic.

---

## 1. Vision & Goals

Transform the PingPing Team Portal visual design into a **Twilight Sunset & Evening Stars** aesthetic:
- **Flattering & Soothing Palette:** Late twilight sky gradient with warm rose-gold, twilight purple, and starlight amber accents.
- **Pure CSS Evening Stars:** Ambient twinkling star background that stays unobtrusively behind UI elements.
- **Modern Typography:** Google Fonts `Outfit` / `Plus Jakarta Sans` for headers and `Be Vietnam Pro` / `Inter` for body content.
- **Refined Glassmorphism:** Twilight translucent cards with hairline borders (`1px rgba(255, 180, 200, 0.15)`).
- **Bouncy Micro-Interactions:** Smooth spring transitions on hover and active states.

---

## 2. Design Tokens (`index.css`)

### 2.1 CSS Custom Properties (`:root`)

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
```

### 2.2 Light Theme Overrides (`body.light-theme`)

```css
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
```

---

## 3. Background & Twinkling Stars Animation

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50% { opacity: 0.90; transform: scale(1.15); }
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

---

## 4. Components & Micro-Interactions

1. **Header & Navigation Tabs**:
   - Translucent frosted glass header (`backdrop-filter: blur(16px)`).
   - Active tab highlighted with sunset gradient pill background and subtle golden glow.
2. **Cards & Containers**:
   - Translucent cards with hairline borders.
   - Smooth transform elevation (`translateY(-4px)`) on hover.
3. **Buttons & Inputs**:
   - Primary action buttons: Sunset gradient background (`--c-twilight-grad`), pill rounded (`--radius-full`), bouncy click effect.
   - Form inputs: Soft golden ring focus indicators (`outline: 2px solid var(--accent-gold)`).

---

## 5. Verification Plan

- Check visual appearance on dev server (`npm run dev`).
- Run test suite (`npm run test`) to ensure no regressions.
