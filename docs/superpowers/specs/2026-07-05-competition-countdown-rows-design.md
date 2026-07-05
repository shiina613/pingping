# Competition Countdown Rows Design

## Goal

Show five horizontal countdown rows on the dashboard, one for each competition, replacing the single global countdown card.

## Behavior

- Render competitions in the existing `COMPETITIONS` order.
- For each competition, select the earliest timeline event strictly after the current time.
- Show the competition name, selected event label and Vietnamese date, plus days, hours, minutes, and seconds.
- Refresh all active countdowns once per second.
- When a target passes, recompute all rows so that competition advances to its next event.
- If a competition has no future event, keep its row visible and show `Đã hoàn thành` with zeroed digits.
- Keep the existing global nearest-deadline statistic unchanged.

## Interface

The current single countdown card becomes a vertical list of five full-width rows. Each row preserves the existing countdown visual language: header metadata followed by four numeric units. On narrow screens, metadata wraps and the four units remain in one compact grid.

## Architecture

Pure date selection and countdown arithmetic live in `src/countdown.js` so they can be tested without a DOM. `TeamPortal.setupCountdown()` owns one interval, renders the row markup into `#competition-countdowns`, updates digit text each second, and rebuilds when a target expires.

## Error and edge handling

Invalid timeline dates are ignored. Negative durations clamp to zero. Empty or fully completed timelines render a completed row instead of disappearing.

## Verification

- Unit tests cover per-competition target selection, input order, invalid dates, completed competitions, and duration decomposition.
- The frontend contract confirms the new container exists and legacy single-countdown IDs are gone.
- The full test suite and `git diff --check` must pass.
