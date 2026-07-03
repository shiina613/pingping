# PingPing Portal Frontend Redesign

## Objective

Redesign the existing PingPing team portal as a refined operational workspace. Preserve all current data, features, IDs, storage keys, and integrations while replacing the cyberpunk glass aesthetic with a calm, premium interface that works equally well in light and dark themes.

## Design Read

This is a full visual overhaul of an internal competition-management portal for a seven-person AI team. The interface should prioritize fast scanning, reliable operation, and long-session readability. The visual language is a calm workspace with restrained premium detailing, implemented in the existing vanilla HTML, CSS, and JavaScript stack.

Design dials:

- `DESIGN_VARIANCE: 5`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 5`

## Existing-State Audit

### Brand and visual tokens

- Current palette uses a near-black base with many unrelated accents, gradients, glows, and translucent glass surfaces.
- Outfit and Inter are loaded from Google Fonts. Display text frequently uses gradients.
- Radius values range from 8px to 18px plus pills.
- Light mode exists as an override on the dark-first token set.

### Information architecture

The primary navigation contains seven stable views:

1. Bảng điều khiển
2. Cuộc thi
3. Phân chia Đội hình
4. Lịch trình
5. Tiến độ (Kanban)
6. Thành viên
7. Cấu hình

These labels, tab identifiers, and user flows will remain unchanged.

### Functional baseline

- Competition data, allocations, member profiles, tasks, and theme preference use the existing JavaScript controller and localStorage keys.
- Supabase synchronization is optional and configured in the Settings view.
- Existing interactions include tab navigation, countdowns, allocation editing, Kanban operations, modals, calendar export, profile editing, and theme switching.

### Patterns to preserve

- Single-page tab navigation and current information architecture.
- Existing competition color identity where it conveys which competition an item belongs to.
- Functional IDs and data attributes used by `app.js`.
- Current Vietnamese copy unless a small correction is necessary for clarity or accessibility.

### Patterns to retire

- Glassmorphism on nearly every container.
- Purple-blue ambient gradients, glow shadows, and gradient text.
- Multiple competing accent colors used as decoration rather than meaning.
- Excessive inline styling and repeated hand-authored presentation rules.
- Emoji avatars as the dominant visual treatment where a restrained text or image treatment is clearer.
- Dense desktop navigation that risks wrapping at intermediate widths.

### Redesign mode

Full visual overhaul with strict preservation of information architecture, content, storage schema, JavaScript hooks, and integrations.

## Visual System

### Theme model

The page supports both light and dark themes with semantic CSS variables. Light is the initial visual emphasis, but the first visit respects the operating-system preference. A manual selection is persisted using the existing theme storage mechanism.

- Light surfaces: cool off-white page, white elevated surfaces, silver-gray dividers, graphite text.
- Dark surfaces: deep graphite page, smoke-gray elevated surfaces, soft cool dividers, near-white text.
- Pure black and pure white are avoided for large surfaces.
- Sections remain within one coherent theme at any moment.

### Color

- Cobalt is the single interface accent for selection, primary actions, focus rings, and interactive emphasis.
- Competition colors remain only where they encode competition identity.
- Success, warning, and error colors remain semantic and are not decorative accents.
- All body text, controls, and states target WCAG AA contrast.

### Typography

- Use a modern sans-serif system stack to avoid a new runtime dependency and external font request.
- Headings use weight, tracking, and spacing for hierarchy. Gradient text is removed.
- Numeric data uses tabular numerals for stable scanning.
- Labels use sentence case by default; uppercase micro-labels are minimized.

### Shape and depth

- Standard surfaces use a 12px radius.
- Compact controls use an 8px radius.
- Pill radius is reserved for filters and status chips.
- Shadows are subtle and tinted to the theme. Borders and whitespace carry most hierarchy.

## Layout

### Global shell

- Sticky header height stays at or below 72px on desktop.
- Brand remains left-aligned, tabs occupy the central region, and theme control stays on the right.
- Desktop navigation remains one line. At narrower widths it becomes a horizontal scroll region with visible focus and active states.
- Main content uses a wider but bounded workspace suitable for operational data.

### Dashboard

- Four primary metrics form a compact responsive summary row.
- The nearest deadline is the strongest operational element.
- Allocation summary and upcoming timeline follow in a balanced two-column layout, collapsing to one column below 900px.
- Decorative cards are removed where spacing and dividers communicate structure sufficiently.

### Remaining views

- Every view receives a consistent page header and optional toolbar pattern.
- Competition, timeline, Kanban, member, planner, and settings content retain their current behavior and DOM hooks.
- Forms use labels above inputs, persistent helper or error regions, and clear focus states.
- Modals use the same tokens, radius rules, and keyboard-visible controls as the main interface.

### Responsive behavior

- Multi-column layouts explicitly collapse below 768px or 900px according to content needs.
- Main padding reduces on small screens without compressing control hit areas.
- Tables and timeline-like content use contained horizontal scrolling only when reflow would destroy meaning.
- The page uses `min-height: 100dvh` for viewport stability.

## Interaction and State Design

- Motion is limited to hierarchy and feedback: tab entry, button press, focus, modal transition, and subtle hover elevation.
- Animations use transform and opacity only.
- `prefers-reduced-motion: reduce` removes nonessential motion.
- Loading states mirror their final content shape.
- Empty states explain what is absent and provide a relevant next action when one exists.
- Errors appear beside the affected control or synchronization area, not only in developer console output.
- Supabase synchronization state uses one consistent status treatment.
- Primary actions have tactile pressed states and never wrap on desktop.

## Architecture and Change Boundaries

The implementation remains dependency-free and uses the existing files:

- `index.html`: semantic structure, class cleanup, accessibility attributes, and removal of presentation-only inline styles.
- `index.css`: semantic theme tokens, component rules, responsive behavior, reduced-motion handling, and the full visual overhaul.
- `app.js`: only targeted changes required for theme initialization, generated markup classes, state messaging, and accessibility. Business logic remains intact.

No framework or design-system package will be introduced. Although the installed taste skill is aimed primarily at marketing pages rather than dashboards, its visual consistency and accessibility rules apply here; dashboard structure stays grounded in the existing operational workflow.

## Data and Compatibility Constraints

- Do not rename routes, tab values, element IDs, form field names, or data attributes consumed by JavaScript.
- Do not change localStorage keys or stored object shapes.
- Do not change Supabase configuration fields or synchronization semantics.
- Do not silently rewrite legal or integration-related text.
- Existing user data must remain readable after the redesign.

## Verification

### Functional checks

- Open and operate all seven tabs.
- Add, move, and remove Kanban tasks.
- Edit member profiles and avatar selections.
- Change and save team allocations.
- Export the calendar.
- Configure and exercise Supabase status paths without exposing credentials.
- Reload and confirm persisted state.

### Visual and accessibility checks

- Verify light, dark, and first-visit system preference behavior.
- Test desktop, tablet, and mobile widths.
- Confirm desktop navigation stays on one line and mobile navigation remains usable.
- Check keyboard navigation, visible focus, modal behavior, control labels, and button contrast.
- Confirm reduced-motion behavior.
- Check that no visible em dash or en dash remains in page copy.

### Regression boundaries

- Competition calculations and countdown dates remain unchanged.
- Existing local data is not reset during testing.
- Generated content keeps stable IDs and event bindings.

## Acceptance Criteria

- The portal presents a coherent premium light theme and an equally complete dark theme.
- Cobalt is the sole decorative interaction accent; other colors communicate real status or competition identity.
- No gradient text, ambient purple glow, or universal glass-card treatment remains.
- All existing workflows and stored data continue to function.
- Every view is usable on mobile and keyboard-accessible.
- Motion is restrained and respects reduced-motion preferences.
- No new production dependency is required.
