# Ursa Minor Constellation Member View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the "Thành viên" (Directory) tab in PingPing Portal into an interactive Ursa Minor (Tiểu Hùng Thất Tinh) constellation map where each of the 7 members is a star node, with Tùng (Shiina) positioned as Polaris (Sao Bắc Cực).

**Architecture:** An SVG interactive constellation renderer in `app.js` with responsive normalized coordinates (Ursa Minor shape), dynamic SVG glowing lines, interactive star nodes, floating glassmorphic popover card for member details, and a View Mode Toggle switch (Constellation View vs Grid View).

**Tech Stack:** HTML5, CSS3 (Glassmorphism, SVG Gradients/Filter Effects), Vanilla JavaScript ES modules.

## Global Constraints
- Target workspace: `/home/shiina/Documents/pingping`
- Exact 7 member IDs: `tung`, `tunganh`, `hau`, `tuantran`, `hung`, `duyanh`, `thach`
- Tùng (`tung`) must be designated as Polaris (Sao Bắc Cực) with special golden-cyan aura accent.

---

### Task 1: Add Constellation Data Map & Unit Tests

**Files:**
- Create: `src/constellation-data.js`
- Create: `tests/constellation.test.js`

**Interfaces:**
- Consumes: `DEFAULT_MEMBERS` from `src/constants.js`
- Produces: `CONSTELLATION_NODES`, `getMemberConstellationData()`

- [ ] **Step 1: Write failing unit test for constellation star mapping**

```javascript
// tests/constellation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MEMBERS } from '../src/constants.js';
import { CONSTELLATION_NODES, getConstellationMembers } from '../src/constellation-data.js';

test('constellation data maps all 7 members to Ursa Minor stars', () => {
  assert.equal(CONSTELLATION_NODES.length, 7);
  
  const polaris = CONSTELLATION_NODES.find(n => n.isPolaris);
  assert.ok(polaris, 'Polaris star node must exist');
  assert.equal(polaris.id, 'tung');
  assert.equal(polaris.starName, 'Polaris (Sao Bắc Cực)');

  const members = getConstellationMembers(DEFAULT_MEMBERS);
  assert.equal(members.length, 7);
  assert.equal(members[0].isPolaris, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/constellation.test.js`
Expected: FAIL with "Cannot find module '../src/constellation-data.js'"

- [ ] **Step 3: Write minimal `src/constellation-data.js` implementation**

```javascript
// src/constellation-data.js
export const CONSTELLATION_NODES = [
  { id: 'tung', starName: 'Polaris (Sao Bắc Cực)', x: 120, y: 110, isPolaris: true },
  { id: 'tunganh', starName: 'Yildun', x: 260, y: 190, isPolaris: false },
  { id: 'hau', starName: 'Epsilon UMa', x: 420, y: 270, isPolaris: false },
  { id: 'tuantran', starName: 'Zeta UMa', x: 570, y: 180, isPolaris: false },
  { id: 'hung', starName: 'Eta UMa', x: 590, y: 390, isPolaris: false },
  { id: 'duyanh', starName: 'Pherkad', x: 860, y: 410, isPolaris: false },
  { id: 'thach', starName: 'Kochab', x: 840, y: 200, isPolaris: false },
];

export const CONSTELLATION_LINES = [
  ['tung', 'tunganh'],
  ['tunganh', 'hau'],
  ['hau', 'tuantran'],
  ['tuantran', 'thach'],
  ['thach', 'duyanh'],
  ['duyanh', 'hung'],
  ['hung', 'hau'],
];

export function getConstellationMembers(membersList) {
  return CONSTELLATION_NODES.map(node => {
    const member = membersList.find(m => m.id === node.id) || {};
    return { ...member, ...node };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/constellation.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/constellation-data.js tests/constellation.test.js
git commit -m "feat: add Ursa Minor constellation node data and unit tests"
```

---

### Task 2: Implement Constellation Layout & Glassmorphic Styles in HTML/CSS

**Files:**
- Modify: `index.html:244-255`
- Modify: `index.css:220-290`

**Interfaces:**
- Consumes: DOM containers `#team-directory-grid`, `#directory-tab-header`
- Produces: CSS classes `.constellation-map-wrap`, `.star-node`, `.polaris-aura`, `.constellation-popover`

- [ ] **Step 1: Update `index.html` Directory Tab Header & Container**

Add View Mode Toggle buttons and `#constellation-view-container` alongside `#team-directory-grid`:

```html
<!-- Inside index.html around line 245 -->
<div class="directory-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
  <div>
    <h3 class="section-title" style="margin-bottom: 0.25rem;">Thành viên nhóm</h3>
    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">Chòm sao Tiểu Hùng Thất Tinh (Ursa Minor) · 7 thành viên sẵn sàng gán vai trò.</p>
  </div>
  <div class="view-mode-toggle" id="directory-view-toggle">
    <button class="toggle-btn active" data-mode="constellation" title="Chế độ Chòm sao">✨ Chòm sao</button>
    <button class="toggle-btn" data-mode="grid" title="Chế độ Danh sách">🎴 Danh sách</button>
  </div>
</div>

<div id="constellation-view-container" class="constellation-map-wrap">
  <!-- Interactive SVG Map rendered by app.js -->
</div>

<div id="team-directory-grid" class="team-grid" style="display: none;">
  <!-- Fallback Grid rendered by app.js -->
</div>

<div id="constellation-popover" class="constellation-popover-card" style="display: none;"></div>
```

- [ ] **Step 2: Add CSS rules for Constellation Map & Glassmorphic Popover in `index.css`**

```css
/* Constellation Member View Styles */
.constellation-map-wrap {
  position: relative;
  width: 100%;
  min-height: 520px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  backdrop-filter: blur(12px);
  overflow: hidden;
  padding: 1rem;
  box-shadow: inset 0 0 40px rgba(56, 189, 248, 0.05);
}

.constellation-svg {
  width: 100%;
  height: 100%;
  min-height: 480px;
  overflow: visible;
}

.constellation-line {
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  transition: all 0.3s ease;
}

.constellation-line.active {
  stroke: #38bdf8;
  stroke-width: 3;
  stroke-dasharray: none;
  filter: drop-shadow(0 0 8px #38bdf8);
}

.star-node {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.star-node:hover {
  transform: scale(1.18);
}

.polaris-aura {
  animation: polarisPulse 3s ease-in-out infinite alternate;
}

@keyframes polarisPulse {
  0% { r: 24px; opacity: 0.4; }
  100% { r: 36px; opacity: 0.85; filter: drop-shadow(0 0 16px #fbbf24); }
}

.constellation-popover-card {
  position: absolute;
  z-index: 100;
  width: 280px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(16px);
  pointer-events: auto;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.view-mode-toggle {
  display: inline-flex;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.view-mode-toggle .toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, #94a3b8);
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-mode-toggle .toggle-btn.active {
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.35);
}
```

- [ ] **Step 3: Run build/tests to ensure CSS/HTML syntax is clean**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add index.html index.css
git commit -m "feat: add HTML elements and CSS glassmorphism styles for constellation view"
```

---

### Task 3: Implement SVG Rendering & Popover Controllers in `app.js`

**Files:**
- Modify: `app.js:1308-1340`

**Interfaces:**
- Consumes: `CONSTELLATION_NODES`, `CONSTELLATION_LINES`, `getConstellationMembers` from `./src/constellation-data.js`
- Produces: `this.renderDirectory()`, `this.renderConstellationView()`, `this.showStarPopover()`, `this.hideStarPopover()`

- [ ] **Step 1: Import constellation data module in `app.js`**

Add import at top of `app.js`:
```javascript
import { CONSTELLATION_NODES, CONSTELLATION_LINES, getConstellationMembers } from './src/constellation-data.js';
```

- [ ] **Step 2: Update `renderDirectory()` to route based on `this.directoryViewMode`**

```javascript
// Inside PortalApp class in app.js
  renderDirectory() {
    if (!this.directoryViewMode) {
      this.directoryViewMode = window.innerWidth < 768 ? 'grid' : 'constellation';
    }

    const toggleContainer = document.getElementById('directory-view-toggle');
    if (toggleContainer) {
      toggleContainer.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === this.directoryViewMode);
        btn.onclick = () => {
          this.directoryViewMode = btn.dataset.mode;
          this.renderDirectory();
        };
      });
    }

    const constWrap = document.getElementById('constellation-view-container');
    const gridWrap = document.getElementById('team-directory-grid');

    if (this.directoryViewMode === 'constellation') {
      if (constWrap) constWrap.style.display = 'block';
      if (gridWrap) gridWrap.style.display = 'none';
      this.renderConstellationView();
    } else {
      if (constWrap) constWrap.style.display = 'none';
      if (gridWrap) gridWrap.style.display = 'grid';
      this.renderDirectoryGrid();
    }
  }
```

- [ ] **Step 3: Implement `renderConstellationView()` and popover interaction handlers**

```javascript
  renderConstellationView() {
    const container = document.getElementById('constellation-view-container');
    if (!container) return;

    const members = getConstellationMembers(this.members);
    
    // Draw SVG Lines
    let linesHTML = CONSTELLATION_LINES.map(([fromId, toId], idx) => {
      const fromNode = members.find(m => m.id === fromId);
      const toNode = members.find(m => m.id === toId);
      if (!fromNode || !toNode) return '';
      return `<line id="c-line-${fromId}-${toId}" class="constellation-line" x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" />`;
    }).join('');

    // Draw SVG Star Nodes
    let nodesHTML = members.map(m => {
      const isPolaris = m.isPolaris;
      const starColor = isPolaris ? '#fbbf24' : (m.color || '#38bdf8');
      const avatarMarkup = this.renderAvatarMarkup(m, 'member-avatar-sm');
      
      return `
        <g class="star-node" id="star-node-${m.id}" transform="translate(${m.x}, ${m.y})" 
           onmouseenter="portal.showStarPopover(event, '${m.id}')"
           onmouseleave="portal.hideStarPopover(event, '${m.id}')">
          
          ${isPolaris ? `<circle class="polaris-aura" r="30" fill="rgba(251, 191, 36, 0.25)" />` : ''}
          <circle class="star-halo" r="${isPolaris ? 20 : 15}" fill="${starColor}" opacity="0.3" />
          <circle class="star-core" r="${isPolaris ? 10 : 7}" fill="#ffffff" stroke="${starColor}" stroke-width="2" />
          
          <text y="${isPolaris ? 28 : 22}" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="600">
            ${m.name} ${isPolaris ? '⭐' : ''}
          </text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <svg class="constellation-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
        <g id="constellation-lines-group">${linesHTML}</g>
        <g id="constellation-nodes-group">${nodesHTML}</g>
      </svg>
    `;
  }

  showStarPopover(event, memberId) {
    const popover = document.getElementById('constellation-popover');
    const member = this.members.find(m => m.id === memberId);
    if (!popover || !member) return;

    const isPolaris = memberId === 'tung';
    const avatarHTML = this.renderAvatarMarkup(member, 'member-avatar-lg');
    const skillsHTML = member.skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('');

    popover.innerHTML = `
      <div style="text-align: center;">
        ${avatarHTML}
        <h4 style="margin-top: 0.75rem; margin-bottom: 0.25rem; font-size: 1.1rem; color: #ffffff;">
          ${member.name} ${isPolaris ? '<span style="font-size:0.75rem; background:linear-gradient(135deg,#fbbf24,#f59e0b); color:#000; padding:0.1rem 0.4rem; border-radius:0.5rem; margin-left:0.25rem;">Sao Bắc Cực</span>' : ''}
        </h4>
        <span class="member-role" style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:0.75rem;">${member.role}</span>
        
        <div class="member-skills-section" style="margin-bottom: 0.75rem;">
          <div class="skills-list-wrap" style="justify-content:center;">${skillsHTML}</div>
        </div>

        <button class="btn-secondary member-btn-edit" style="width:100%; font-size:0.8rem;" onclick="portal.openEditModal('${member.id}')">
          Sửa hồ sơ & Ảnh
        </button>
      </div>
    `;

    // Position popover relative to container
    const container = document.getElementById('constellation-view-container');
    const rect = container.getBoundingClientRect();
    const nodeElem = document.getElementById(`star-node-${memberId}`);
    
    if (nodeElem) {
      const nodeRect = nodeElem.getBoundingClientRect();
      let left = nodeRect.left - rect.left + 30;
      let top = nodeRect.top - rect.top - 40;
      
      // Keep within bounds
      if (left + 290 > rect.width) left = nodeRect.left - rect.left - 290;
      if (top + 260 > rect.height) top = rect.height - 270;
      if (top < 10) top = 10;

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      popover.style.display = 'block';
      popover.style.opacity = '1';
    }

    // Highlight connecting lines
    CONSTELLATION_LINES.forEach(([fromId, toId]) => {
      if (fromId === memberId || toId === memberId) {
        const line = document.getElementById(`c-line-${fromId}-${toId}`);
        if (line) line.classList.add('active');
      }
    });
  }

  hideStarPopover(event, memberId) {
    const popover = document.getElementById('constellation-popover');
    if (popover) {
      popover.style.opacity = '0';
      setTimeout(() => {
        if (popover.style.opacity === '0') popover.style.display = 'none';
      }, 200);
    }
    document.querySelectorAll('.constellation-line.active').forEach(l => l.classList.remove('active'));
  }
```

- [ ] **Step 4: Rename existing card list renderer to `renderDirectoryGrid()`**

Update existing `renderDirectory()` code to `renderDirectoryGrid()` in `app.js`.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: implement Ursa Minor SVG rendering and popover interaction in app.js"
```

---

### Task 4: Full Test Verification & Polish

**Files:**
- Test: `tests/constellation.test.js`

- [ ] **Step 1: Execute full test suite**

Run: `npm test`
Expected: All tests pass with 0 errors.

- [ ] **Step 2: Commit final polish**

```bash
git commit --allow-empty -m "chore: complete Ursa Minor constellation member view implementation"
```
