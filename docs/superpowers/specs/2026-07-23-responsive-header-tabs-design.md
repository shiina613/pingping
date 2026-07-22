# Responsive Header Tabs Design

## Goal

Keep every visible primary navigation tab reachable in the header. Show each tab's icon and text when the navigation has enough room; collapse all tab text when the navigation itself becomes too narrow.

## Design

- Wrap each tab's visible text in a `.tab-label` span. Keep icons, the chat unread badge, active state, and existing `data-tab` values unchanged.
- Give every tab an accessible name and tooltip so icon-only mode remains understandable.
- Make `.nav-tabs` an inline-size query container. Its available width, rather than viewport width, controls whether labels are visible.
- At the compact container threshold, hide `.tab-label`, reduce horizontal tab padding, and preserve all visible tab icons in one row.
- Retain horizontal overflow as the final fallback on very narrow screens where even all icons cannot fit.
- Do not add JavaScript resize handling or change tab navigation behavior.

## Responsive States

1. **Full:** Icons and labels are visible whenever the navigation container can fit them.
2. **Compact:** All labels are hidden together when the navigation container crosses the compact threshold. Icons and unread badges remain visible.
3. **Overflow fallback:** On very narrow screens, the existing horizontal scrolling keeps every icon reachable.

## Accessibility

- Each tab button keeps a stable accessible name through `aria-label`.
- Each tab also receives a matching `title` for pointer users in compact mode.
- Keyboard behavior, focusability, selection state, and DOM order remain unchanged.

## Verification

- Add frontend contract assertions for `.tab-label`, accessible tab names, the nav query container, and the compact label-hiding rule.
- Run the contract test first and confirm it fails before implementation.
- Run the complete test suite and production build after implementation.
- Verify full and compact states at representative desktop and mobile widths.

## Scope

Only `index.html`, `index.css`, and the existing frontend contract test are in scope. No new dependencies, JavaScript resize observers, navigation changes, or backend work are required.
