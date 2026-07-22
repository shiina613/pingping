# Design Spec: Ursa Minor Constellation Member View (Chòm sao Thành viên)

## Overview
Transform the "Thành viên" (Directory) tab in PingPing Portal into an interactive Ursa Minor (Tiểu Hùng Thất Tinh) constellation map. Each of the 7 team members represents a star in the constellation, with **Tùng (Shiina)** as **Polaris (Sao Bắc Cực)**—the anchor star at the tip of the handle. 

Hovering over any star node highlights the star, glows its connecting constellation lines, and reveals a glassmorphic popover with full member details and edit action. A view toggle button allows switching between Constellation View and traditional Grid Card View.

---

## 1. Constellation Geometry & Star Mapping
The 7 team members are mapped to the 7 stars of Ursa Minor (Little Dipper):

| Member ID | Member Name | Constellation Star | Position in Ursa Minor | Visual Accent |
|-----------|-------------|-------------------|------------------------|---------------|
| `tung` | Tùng (Shiina) | Polaris (Sao Bắc Cực) | Handle Tip (Anchor) | Golden-Blue Polaris Aura, ⭐ North Star Badge |
| `tunganh` | Tùng Anh | Yildun | Handle Middle | Luminous Cyan Star Node |
| `hau` | Hậu | Epsilon UMa | Handle Base / Bowl Connector | Luminous Purple Star Node |
| `tuantran` | Tuấn Trần | Zeta UMa | Bowl Top-Left | Luminous Amber Star Node |
| `hung` | Hưng | Eta UMa | Bowl Bottom-Left | Luminous Pink Star Node |
| `duyanh` | Duy Anh | Pherkad | Bowl Bottom-Right (Guardian) | Luminous Teal Star Node |
| `thach` | Thạch | Kochab | Bowl Top-Right (Guardian) | Luminous Red Star Node |

### Layout Vector Math
- **Container**: Responsive SVG container with `viewBox="0 0 1000 520"`.
- **Constellation Lines**:
  - Handle segment: Polaris (`tung`) → Yildun (`tunganh`) → Epsilon (`hau`).
  - Bowl loop segment: Epsilon (`hau`) → Zeta (`tuantran`) → Eta (`hung`) → Pherkad (`duyanh`) → Kochab (`thach`) → Epsilon (`hau`).
- Lines use glowing SVG linear gradient strokes with subtle dash-array animation.

---

## 2. Component Architecture & UI Elements

### 2.1 Tab Header Controls
- Added view mode toggle buttons to `#directory-tab-header`:
  - `✨ Chòm sao` (Constellation View - active by default on desktop)
  - `🎴 Thẻ danh sách` (Grid View - fallback / list mode)

### 2.2 Interactive Star Nodes
Each star node in the SVG map contains:
- Background pulse halo (`<circle class="star-halo">`)
- Star core circle with stroke border (`<circle class="star-core">`)
- Embedded micro avatar / icon image (`<foreignObject>` or SVG avatar clip)
- Member label underneath (`<text class="star-label">`)

### 2.3 Floating Glassmorphic Popover
Hovering over any star node dynamically positions `#constellation-popover` near the star:
- **Styling**: `backdrop-filter: blur(16px)`, dark translucent surface, luminous border gradient.
- **Content**:
  - Member Avatar (large)
  - Name + Polaris Special Badge (if `tung`)
  - Role Title
  - Skills List (`.skill-tag`)
  - `Sửa hồ sơ & Ảnh` button triggering existing `portal.openEditModal(memberId)`.
- **Dismissal**: Smooth 200ms opacity transition when mouse leaves star or popover.

---

## 3. Responsive Strategy
- **Desktop (≥ 768px)**: Defaults to Constellation View, with full interactive SVG canvas and popover.
- **Mobile (< 768px)**: Automatically switches view mode to Grid Card View for touch ergonomics, while preserving the toggle button to view Constellation on demand.

---

## 4. Verification Plan
- Unit test for member array mapping to constellation nodes.
- Test view mode toggle persistence in `localStorage`.
- Test edit modal trigger from both Constellation Popover and Grid View.
- Run `npm test` to ensure 100% test suite pass without breaking existing tests.
