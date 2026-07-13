# X-O Challenger Release Design

**Date:** 2026-07-13  
**Status:** Awaiting written-spec review  
**Audience:** PingPing maintainers and the seven internal members

## Goal

Release X-O Challenger as a server-authoritative internal tournament. The release includes realtime connect-five games, a six-player group stage plus one lucky playoff entrant, BO3/BO5 series, standings, ratings, citizen-point wallets, spectator pools, direct player bets, and a host-controlled test-to-live rollout.

The release is complete only when a test tournament finishes end-to-end without affecting live balances or ratings, all automated checks pass, and Tùng explicitly switches the feature to live.

## Scope

### Included

- One active tournament at a time.
- Tùng as the only host who can create, cancel, and promote a release from test to live.
- One randomly selected lucky member who skips the group stage.
- Six remaining members in a five-round round robin: three matches per round and 15 group matches total.
- Top three group players plus the lucky member in a four-player playoff.
- Connect-five games on a 9×9 board that expands three cells on a touched edge, capped at 36×36.
- BO3 group matches and BO5 playoff matches.
- Live ratings: group result `+36/-18`; playoff result `+360/-180`.
- Live citizen-point grant of 36 points per member per calendar month.
- Spectator pool betting and equal-stake direct bets between match participants.
- Realtime tournament, match, board, pool-total, standings, bracket, and rating updates.
- Separate test and live wallets. Test matches never alter live wallets or ratings.

### Not included

- Public registration, arbitrary tournament hosts, matchmaking, chat integration, bots, Elo ratings, real-money wagering, or multiple simultaneous tournaments.
- Manual editing of results, moves, ratings, balances, or payouts.
- A third-place playoff.

## Roles and rollout

- **Host:** Tùng can create or cancel a tournament and change release mode. Host operations still use server validation and cannot edit results or money directly.
- **Player:** A member assigned to a match can make a move only when the server says it is their turn. Match players cannot place spectator pool bets on their own match.
- **Spectator:** Any other signed-in member may place one pool position on a pending match.
- **Tester:** In `test` mode, the X-O tab is visible only to members on a server-side tester allowlist managed by Tùng. The initial allowlist contains Tùng. Tùng may temporarily add the participants needed for manual multi-session verification. Test commands reject members outside that allowlist.
- **Live member:** In `live` mode, all seven members can see and use the feature.

The database, rather than `config.js`, owns release mode and the tester allowlist. Client flags may hide navigation while loading but are not authorization controls.

## Architecture

PostgreSQL is the source of truth. The browser sends commands to narrow Supabase RPCs and renders committed state. Each command authenticates the existing PingPing member ID/login-code pair, checks role and state, locks affected rows, performs one transaction, writes audit entries, and returns a structured result.

Supabase Realtime publishes only non-sensitive state. The frontend reloads an authenticated snapshot after reconnecting or after an event that affects private state.

`src/xo.js` remains a pure mirror used for rendering helpers and fast unit tests. Its calculations never authorize a move, finish a match, alter ratings, or settle a wallet.

## Data model

The current unshipped X-O migration will be replaced or amended before deployment so its schema matches this design.

- `xo_settings`: singleton release mode (`test` or `live`) and update timestamp.
- `xo_testers`: members allowed to use test mode.
- `xo_tournaments`: host, lucky member, test/live scope, stage, current round, champion, lifecycle timestamps, and cancellation reason.
- `xo_tournament_players`: tournament membership, group eligibility, seed, standings counters, and final placement.
- `xo_matches`: tournament, stage, round, two players, target wins, series score, status, winner, betting lock, settlement status, and monotonic revision.
- `xo_games`: match, game number, first/next member, integer board bounds, status, winner, and timestamps.
- `xo_moves`: immutable move sequence with unique `(game_id, move_number)` and `(game_id, row, col)` constraints.
- `xo_ratings`: live member rating and win/loss counters. Test matches do not write this table.
- `citizen_wallets`: composite key `(member_id, scope)` where scope is `test` or `live`; balance has a non-negative check.
- `citizen_point_ledger`: immutable debit/credit entries with scope, reason, related tournament/match/bet, request ID, and balance-after value.
- `xo_pool_bets`: one spectator position per member and match, escrowed stake, pick, status, and payout.
- `xo_pool_totals`: public aggregate totals per match and player without bettor identity.
- `xo_side_bets`: one direct proposal per match, proposer, opponent, equal stake, acceptance state, escrow state, and payout.
- `xo_command_log`: unique `(member_id, command_name, request_id)` records, payload hashes, and serialized results for idempotent mutation retries.

Foreign keys, checks, and unique indexes enforce valid states in addition to RPC checks. Sensitive tables—wallets, ledger, command log, and individual bets—have no anonymous direct-read policy.

## Tournament lifecycle

Tùng creates a tournament in the current release scope. The transaction selects one lucky member uniformly from all seven members, records all participants, generates a deterministic round-robin schedule for the other six, and opens round one.

The group stage contains five rounds of three BO3 matches. When all three matches in the current round complete, the server opens the next round. When all 15 matches complete, standings are sorted by:

1. Match wins descending.
2. Game wins descending.
3. Match losses ascending.
4. Member ID ascending as a stable final tie-break.

The playoff bracket is:

- Semifinal 1: group rank 1 versus the lucky member.
- Semifinal 2: group rank 2 versus group rank 3.
- Final: the two semifinal winners.

All playoff matches are BO5. Completing the final records the champion and completes the tournament.

Cancelling a tournament atomically cancels unfinished matches, refunds all unsettled escrow, and prevents further commands. Completed payouts are not reversed automatically; cancellation is rejected after any match settlement unless a future administrative recovery workflow is designed.

## Game rules

Game one chooses the first player randomly. Subsequent games alternate the first player, including replacement games after a draw. The first player uses X and the other uses O.

For each move, the server:

1. Authenticates the member and locks the active game and match.
2. Confirms the member is `next_member_id`.
3. Confirms the integer coordinate is inside the current bounds and unoccupied.
4. Inserts one immutable move.
5. Expands each touched edge by up to three cells without exceeding 36 rows or columns.
6. Detects a contiguous line of at least five marks in four directions.
7. Either switches the next member, records a draw and creates a replacement game, or records the game winner.
8. If the series target is reached, completes and settles the match; otherwise creates the next game.

The first accepted move locks spectator and direct betting for that match. A full 36×36 board with no winning line is a draw. Draws do not increment either player's series score.

## Wallet and betting rules

### Wallet grants

The first authenticated X-O snapshot in `live` mode in a calendar month grants 36 live citizen points once, protected by a unique ledger key. Test-mode snapshots never mutate live wallets. Creating a test tournament resets every participant's test wallet to 36 points, records the reset in the test ledger, and is allowed only when no test tournament is active. Test wallets remain separate from live wallets.

Every balance mutation locks the wallet row, checks sufficient funds, writes an immutable ledger entry, and leaves a non-negative balance. There are no direct client writes to wallet or ledger tables.

### Spectator pool

- Only non-participants may bet on a match.
- A spectator has one pool position per match. It cannot be changed or cancelled after creation.
- Placement subtracts the stake into escrow in the same transaction.
- The first move locks the pool.
- Winners receive their original stake plus a proportional share of the losing pool.
- If either side has no stake, all pool stakes are refunded.
- Integer rounding uses largest remainder allocation, then stable bet ID order. Total payout always equals total escrow.

### Direct player bet

- Either match participant may propose one equal-stake direct bet before the first move. The proposer stake enters escrow immediately.
- The opponent may reject it, or accept it by escrowing the same stake.
- The proposer may cancel only before acceptance; cancellation or rejection refunds the proposer.
- An unaccepted proposal is cancelled and refunded when the first move is made.
- For an accepted bet, the match winner receives both stakes.
- Cancelling the match refunds both stakes.

Match settlement, pool settlement, direct-bet settlement, standings updates, ratings, and ledger writes occur in one idempotent transaction. A settled match cannot settle again.

## RPC boundary

Exact SQL signatures may be refined in the implementation plan, but the command boundary contains these responsibilities:

- Authenticated snapshot and release visibility.
- Host tester-list and release-mode management.
- Tournament create and cancel.
- Monthly grant and current private wallet/ledger summary.
- Move submission.
- Pool-bet placement.
- Direct-bet propose, accept, reject, and cancel.

Every mutation accepts a client-generated UUID request ID. Repeating a completed request returns the stored result; reusing an ID with a different command or payload is rejected.

## Data access and Realtime

Anonymous direct select is limited to public tournament state: settings needed for navigation, tournaments, tournament players, matches, games, moves, ratings, and aggregate pool totals. Direct insert, update, and delete are denied for all X-O tables.

Wallets, ledger entries, tester membership, command logs, and individual bets are returned only by authenticated security-definer RPCs with a fixed empty `search_path` and explicit execute grants. Functions revoke default `PUBLIC` execution before granting the intended role.

Realtime subscriptions cover public tournament state and aggregate pool totals. A match revision change tells affected clients to refresh the authenticated snapshot for private bet or wallet changes.

## UI

The existing X-O tab remains the entry point, but all mock data is removed.

- Header: tournament scope/stage, current round, connectivity, and schedule entry.
- Main match: opponent names, BO3/BO5 score, game number, turn status, expandable board, and pending-command state.
- Side rail: private wallet summary, spectator pool or direct-bet controls according to role, and locked/settled results.
- Lower panels: schedule/results, standings, playoff bracket, and live ratings.
- Host controls: create test/live tournament where permitted, manage test allowlist, cancel/refund a safe unfinished tournament, and promote release mode.

On mobile, cards stack vertically and the expanded board scrolls horizontally. Board input is disabled when it is not the member's turn, a command is pending, the game is complete, or Realtime is disconnected.

The About Update modal describes the final rules and clearly labels test versus live points.

## Error handling

RPCs return stable machine codes such as `INVALID_CREDENTIALS`, `FEATURE_NOT_AVAILABLE`, `NOT_YOUR_TURN`, `INVALID_CELL`, `OCCUPIED_CELL`, `BETTING_LOCKED`, `INSUFFICIENT_BALANCE`, and `REQUEST_ID_REUSED`. The UI maps them to concise Vietnamese messages.

Moves are not rendered optimistically. The board remains disabled until the command result or committed Realtime state arrives. After disconnecting, the UI shows an offline state and fetches a fresh snapshot before enabling commands. It never automatically retries a mutation with an unknown outcome; a user retry reuses the same request ID and is therefore safe.

## Testing

- **Pure unit tests:** board expansion, connect-five in all directions, draw detection, standings, bracket generation, pool allocation, and presentation helpers.
- **Database integration tests:** authentication, authorization, constraints, move turns and bounds, alternating first player, game/match completion, round and playoff transitions, monthly grants, wallet row locking, concurrent bets, refunds, rounding, payout conservation, cancellation rules, and idempotent retries.
- **Migration verification:** apply the complete migration to a clean local Supabase database and run schema/security advisors. Regex-only schema tests are supplementary, not release evidence.
- **Browser E2E:** two player sessions and one spectator session verify Realtime moves, role-specific controls, betting lock on the first move, series completion, settlement, standings, and reconnect behavior on desktop and mobile layouts.
- **Regression:** the existing portal, collaboration, countdown, and frontend-contract suites continue to pass.

## Release gate

Release mode starts as `test`. Before promotion to `live`:

1. All unit, database integration, migration, security-advisor, browser E2E, and regression checks pass.
2. A complete test-scope tournament reaches a champion.
3. Wallet conservation and idempotency checks show no discrepancy.
4. Test activity has not changed live wallets or ratings.
5. Tùng explicitly promotes release mode through the host control.

Promotion exposes the tab to all seven members. It does not convert test balances, bets, matches, or ratings into live data.
