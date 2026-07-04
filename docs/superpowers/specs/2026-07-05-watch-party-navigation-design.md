# Watch Party navigation design

## Goal

Expose the existing `/watch-party.html` page from the portal's primary navigation.

## Interface

- Add one navigation item labeled `Watch Party`.
- Place it between `Trò chuyện` and `Cấu hình`.
- Reuse the existing `.tab-btn` visual language so it matches the header.
- Use a compact movie/play icon consistent with the current line icons.
- Navigate to `/watch-party.html` in the same browser tab.
- Keep the existing horizontal-scroll behavior on narrow screens.

## Behavior

The item is a normal link, not an internal portal tab. It must not participate in `data-tab` state or require a matching tab panel. Existing internal tab switching remains unchanged.

## Verification

- The frontend contract checks the label, route, placement, and absence of `data-tab` on the link.
- The full test suite and production build pass.
- The deployed route returns HTTP 200.
