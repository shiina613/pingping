# X-O Challenger Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a server-authoritative X-O Challenger for seven PingPing members with realtime BO3/BO5 tournaments, safe citizen-point wallets, spectator pools, equal-stake direct bets, and a host-controlled test-to-live release.

**Architecture:** PostgreSQL and narrow Supabase RPCs own all authoritative state and money changes. Public committed state reaches browsers through Supabase Realtime; private wallet and bet state comes from an authenticated snapshot. `src/xo.js` remains pure domain logic, `src/xo-api.js` owns remote I/O, and `src/xo-arena.js` owns X-O UI state/rendering so `app.js` only integrates the feature.

**Tech Stack:** Vanilla ES modules, Vite 8, `@supabase/supabase-js` 2.110, PostgreSQL/PLpgSQL, Supabase CLI 2.109.1, pgTAP, Node test runner, Bash contract tests, Playwright 1.61.1.

## Global Constraints

- Follow [the approved design](../specs/2026-07-13-xo-challenger-release-design.md) exactly; do not add matchmaking, bots, Elo, real-money wagering, chat integration, or multiple simultaneous tournaments.
- Tùng (`member_id = 'tung'`) is the only host.
- One lucky member skips the group stage; the other six play five rounds of three BO3 matches, then top three plus lucky enter BO5 playoffs.
- Board starts 9×9, expands three cells on each touched edge, caps each axis at 36, and wins on a contiguous line of at least five.
- Live rating deltas are group `+36/-18` and playoff `+360/-180`; test matches never change live ratings.
- Live monthly grant is exactly 36 citizen points; test and live wallets remain separate.
- Client code never authorizes moves, results, balances, or payouts.
- Direct table writes are denied; all mutations use idempotent RPCs with UUID request IDs.
- Preserve unrelated dirty working-tree changes and stage only files named by the current task.
- Pin new dependencies exactly and commit `package-lock.json`.

---

### Task 1: Reproducible Supabase and browser-test foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `supabase/config.toml`
- Create: `tests/run-e2e.sh`
- Create: `tests/run-xo-concurrency.sh`

**Interfaces:**
- Produces: `npm run supabase:start`, `npm run supabase:stop`, `npm run test:db`, `npm run test:e2e`, and `npm run test:release` commands used by later tasks.
- Consumes: existing `npm test` regression suite.

- [ ] **Step 1: Add a failing script-contract test**

Add to `tests/module-graph.test.js`:

```js
test('release test scripts pin Supabase CLI and Playwright', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.devDependencies.supabase, '2.109.1');
  assert.equal(pkg.devDependencies['@playwright/test'], '1.61.1');
  assert.equal(pkg.scripts['test:db'], 'supabase test db --local supabase/tests');
  assert.equal(pkg.scripts['test:e2e'], 'bash tests/run-e2e.sh');
  assert.equal(pkg.scripts['test:concurrency'], 'bash tests/run-xo-concurrency.sh');
  assert.match(pkg.scripts['test:release'], /test:db/);
  assert.match(pkg.scripts['test:release'], /test:concurrency/);
  assert.match(pkg.scripts['test:release'], /test:e2e/);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test --test-name-pattern='release test scripts' tests/module-graph.test.js`  
Expected: FAIL because `devDependencies.supabase` is undefined.

- [ ] **Step 3: Pin tools and initialize local Supabase**

Run:

```bash
npm install --save-dev --save-exact supabase@2.109.1 @playwright/test@1.61.1
npx supabase init
npx playwright install chromium
```

Set the scripts in `package.json` to:

```json
{
  "scripts": {
    "test": "node --test tests/*.test.js && bash tests/frontend-contract.sh",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "test:db": "supabase test db --local supabase/tests",
    "test:e2e": "bash tests/run-e2e.sh",
    "test:concurrency": "bash tests/run-xo-concurrency.sh",
    "test:release": "npm test && npm run test:db && npm run test:concurrency && npm run test:e2e"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "supabase": "2.109.1",
    "vite": "^8.1.3"
  }
}
```

Append `.superpowers/` and `test-results/` to `.gitignore`. Keep the generated `supabase/config.toml` defaults except set `project_id = "pingping"`.

Create executable `tests/run-e2e.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

status="$(supabase status -o env)"
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="$(sed -n 's/^ANON_KEY="\(.*\)"$/\1/p' <<<"$status")"
test -n "$SUPABASE_ANON_KEY"
exec playwright test
```

Create executable `tests/run-xo-concurrency.sh` with the same status parsing and a Node-test final command:

```bash
#!/usr/bin/env bash
set -euo pipefail

status="$(supabase status -o env)"
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="$(sed -n 's/^ANON_KEY="\(.*\)"$/\1/p' <<<"$status")"
test -n "$SUPABASE_ANON_KEY"
exec node --test tests/xo-concurrency.test.js
```

- [ ] **Step 4: Verify GREEN and local CLI discovery**

Run:

```bash
node --test --test-name-pattern='release test scripts' tests/module-graph.test.js
npx supabase test db --help
npm test
```

Expected: focused test PASS; help lists `--local`; all existing tests PASS.

- [ ] **Step 5: Commit the test foundation**

```bash
git add .gitignore package.json package-lock.json supabase/config.toml tests/run-e2e.sh tests/run-xo-concurrency.sh tests/module-graph.test.js
git commit -m "test: add X-O release test foundation"
```

---

### Task 2: Complete pure X-O domain contracts

**Files:**
- Modify: `src/xo.js`
- Modify: `tests/xo.test.js`

**Interfaces:**
- Produces: `getGameOutcome(state)`, `expandBoundsForMove(bounds, point)`, `createRoundRobin(memberIds)`, `getPlayoffPairings(luckyId, standings)`, `allocatePoolPayouts(bets, winnerId)`, and `xoErrorMessage(code)`.
- Consumes: bounds shaped as `{ minRow, maxRow, minCol, maxCol }`; bets shaped as `{ id, member_id, pick_member_id, stake }`.

- [ ] **Step 1: Write failing tests for release rules**

Add these cases to `tests/xo.test.js`:

```js
test('six players produce five rounds with three unique matches each', () => {
  const rounds = createRoundRobin(['a', 'b', 'c', 'd', 'e', 'f']);
  assert.equal(rounds.length, 5);
  assert.ok(rounds.every(round => round.length === 3));
  assert.equal(new Set(rounds.flat().map(([a, b]) => [a, b].sort().join(':'))).size, 15);
});

test('playoff pairs rank one with lucky and rank two with rank three', () => {
  assert.deepEqual(getPlayoffPairings('lucky', [
    { member_id: 'one', wins: 5 },
    { member_id: 'two', wins: 4 },
    { member_id: 'three', wins: 3 }
  ]), [['one', 'lucky'], ['two', 'three']]);
});

test('pool allocation conserves escrow with deterministic remainder', () => {
  const payouts = allocatePoolPayouts([
    { id: 'a', member_id: 'm1', pick_member_id: 'x', stake: 2 },
    { id: 'b', member_id: 'm2', pick_member_id: 'x', stake: 1 },
    { id: 'c', member_id: 'm3', pick_member_id: 'o', stake: 2 }
  ], 'x');
  assert.deepEqual(payouts, [
    { bet_id: 'a', member_id: 'm1', payout: 3 },
    { bet_id: 'b', member_id: 'm2', payout: 2 },
    { bet_id: 'c', member_id: 'm3', payout: 0 }
  ]);
  assert.equal(payouts.reduce((sum, row) => sum + row.payout, 0), 5);
});

test('six contiguous marks are still a connect-five win', () => {
  const state = createEmptyBoard();
  state.moves = [0, 1, 2, 3, 4, 5].map(col => ({ row: 4, col, mark: 'x' }));
  assert.equal(getGameOutcome(state).winner, 'x');
});

test('stable RPC errors map to Vietnamese copy', () => {
  assert.equal(xoErrorMessage('NOT_YOUR_TURN'), 'Chưa đến lượt của bạn.');
  assert.equal(xoErrorMessage('INSUFFICIENT_BALANCE'), 'Bạn không đủ điểm công dân.');
  assert.equal(xoErrorMessage('UNKNOWN_CODE'), 'Không thể thực hiện thao tác X-O.');
});
```

Import the new functions at the top of the test file.

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test tests/xo.test.js`  
Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement the pure contracts**

Add the named exports to `src/xo.js`. Use the circle method for `createRoundRobin`: hold the first ID fixed, pair mirrored positions, then rotate the remaining IDs once per round. Reject input unless it contains exactly six distinct IDs.

Change win detection from `line.length === XO_WIN_LENGTH` to `line.length >= XO_WIN_LENGTH`. Implement largest-remainder payout with exact integer arithmetic:

```js
export function allocatePoolPayouts(bets = [], winnerMemberId) {
  const winners = bets.filter(bet => bet.pick_member_id === winnerMemberId);
  const total = sumStake(bets);
  const winningStake = sumStake(winners);
  if (!winningStake || winningStake === total) {
    return bets.map(bet => ({
      bet_id: bet.id,
      member_id: bet.member_id,
      payout: Number(bet.stake)
    }));
  }
  const rows = winners.map(bet => {
    const numerator = Number(bet.stake) * total;
    return { bet, payout: Math.floor(numerator / winningStake), remainder: numerator % winningStake };
  });
  let unassigned = total - rows.reduce((sum, row) => sum + row.payout, 0);
  rows.sort((a, b) => b.remainder - a.remainder || String(a.bet.id).localeCompare(String(b.bet.id)));
  for (let index = 0; index < unassigned; index += 1) rows[index].payout += 1;
  const payoutById = new Map(rows.map(row => [row.bet.id, row.payout]));
  return bets.map(bet => ({ bet_id: bet.id, member_id: bet.member_id, payout: payoutById.get(bet.id) || 0 }));
}
```

Implement `xoErrorMessage` with this complete map and the exact fallback shown in the test:

```js
const XO_ERROR_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: 'Phiên đăng nhập không hợp lệ.',
  FEATURE_NOT_AVAILABLE: 'X-O Challenger chưa mở cho tài khoản này.',
  ONLY_TUNG_CAN_HOST: 'Chỉ Tùng có quyền điều hành giải.',
  NOT_YOUR_TURN: 'Chưa đến lượt của bạn.',
  INVALID_CELL: 'Ô cờ không hợp lệ.',
  OCCUPIED_CELL: 'Ô cờ này đã được đánh.',
  GAME_NOT_ACTIVE: 'Ván đấu không còn hoạt động.',
  BETTING_LOCKED: 'Cược đã khóa sau nước đi đầu tiên.',
  INSUFFICIENT_BALANCE: 'Bạn không đủ điểm công dân.',
  REQUEST_ID_REUSED: 'Yêu cầu đã được dùng cho thao tác khác.'
});
```

- [ ] **Step 4: Verify domain tests and regression**

Run:

```bash
node --test tests/xo.test.js
npm test
```

Expected: all X-O and portal tests PASS.

- [ ] **Step 5: Commit domain rules**

```bash
git add src/xo.js tests/xo.test.js
git commit -m "feat: complete X-O release domain rules"
```

---

### Task 3: Replace the prototype schema with authoritative tables and RLS

**Files:**
- Modify: `supabase/migrations/20260708223000_xo_arena.sql`
- Create: `supabase/tests/xo_schema.test.sql`
- Modify: `tests/schema.test.js`

**Interfaces:**
- Produces: the tables and constraints listed in the design spec, plus private schema helpers callable only by later X-O RPCs.
- Consumes: `public.members(id, login_code)` from existing migrations.

- [ ] **Step 1: Write failing pgTAP schema/security tests**

Create `supabase/tests/xo_schema.test.sql` with this complete assertion set:

```sql
begin;
select plan(23);
select has_table('public', 'xo_settings');
select has_table('public', 'xo_testers');
select has_table('public', 'xo_tournaments');
select has_table('public', 'xo_tournament_players');
select has_table('public', 'xo_matches');
select has_table('public', 'xo_games');
select has_table('public', 'xo_moves');
select has_table('public', 'xo_ratings');
select has_table('public', 'citizen_wallets');
select has_table('public', 'citizen_point_ledger');
select has_table('public', 'xo_pool_bets');
select has_table('public', 'xo_pool_totals');
select has_table('public', 'xo_side_bets');
select has_table('public', 'xo_command_log');
select col_is_pk('public', 'citizen_wallets', array['member_id', 'scope']);
select col_is_unique('public', 'xo_moves', array['game_id', 'move_number']);
select col_is_unique('public', 'xo_moves', array['game_id', 'row', 'col']);
select policies_are('public', 'citizen_wallets', array[]::text[]);
select policies_are('public', 'citizen_point_ledger', array[]::text[]);
select policies_are('public', 'xo_pool_bets', array[]::text[]);
select policies_are('public', 'xo_side_bets', array[]::text[]);
select table_privs_are('public', 'citizen_wallets', 'anon', array[]::text[]);
select table_privs_are('public', 'xo_moves', 'anon', array['SELECT']);
select finish();
rollback;
```

- [ ] **Step 2: Start/reset local Supabase and confirm RED**

Run:

```bash
npm run supabase:start
npx supabase db reset --local
npx supabase test db --local supabase/tests/xo_schema.test.sql
```

Expected: FAIL because prototype tables and constraints do not match the release schema.

- [ ] **Step 3: Implement schema, grants, RLS, and publication**

Rewrite `20260708223000_xo_arena.sql` because it has not shipped. Use explicit enums as `text check (...)`, integer bounds columns on `xo_games`, immutable rows in `xo_moves`, a non-negative wallet check, composite wallet primary key, and the exact unique constraints asserted above.

Create `private.xo_assert_member(p_member_id text, p_login_code text) returns void` as `security definer set search_path = ''`; it raises `INVALID_CREDENTIALS` unless `public.members` contains the pair. Revoke all privileges on schema `private` from `public`, `anon`, and `authenticated`.

For each public-state table—`xo_settings`, `xo_tournaments`, `xo_tournament_players`, `xo_matches`, `xo_games`, `xo_moves`, `xo_ratings`, `xo_pool_totals`—enable RLS, grant only `select` to `anon`, and create one `for select to anon using (true)` policy. For every sensitive table, enable RLS but create no direct policy or grant.

Add public-state tables to Realtime idempotently with one loop:

```sql
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'xo_tournaments','xo_tournament_players','xo_matches','xo_games',
    'xo_moves','xo_ratings','xo_pool_totals'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;
```

- [ ] **Step 4: Verify schema and security GREEN**

Run:

```bash
npx supabase db reset --local
npx supabase test db --local supabase/tests/xo_schema.test.sql
npm test
```

Expected: pgTAP reports all 23 assertions successful; regression tests PASS. Update `tests/schema.test.js` to assert the new table names and the absence of direct anon wallet/bet grants instead of accepting the prototype grants.

- [ ] **Step 5: Commit schema**

```bash
git add supabase/migrations/20260708223000_xo_arena.sql supabase/tests/xo_schema.test.sql tests/schema.test.js
git commit -m "feat: add authoritative X-O schema and RLS"
```

---

### Task 4: Add release controls, snapshots, and tournament scheduling RPCs

**Files:**
- Modify: `supabase/migrations/20260708223000_xo_arena.sql`
- Create: `supabase/tests/xo_tournament.test.sql`

**Interfaces:**
- Produces:
  - `xo_get_snapshot(text, text) returns jsonb`
  - `xo_set_testers(text, text, uuid, text[]) returns jsonb`
  - `xo_set_release_mode(text, text, uuid, text) returns jsonb`
  - `xo_create_tournament(text, text, uuid) returns jsonb`
  - `xo_cancel_tournament(text, text, uuid, uuid, text) returns jsonb`
- Consumes: Task 2 round-robin ordering contract and Task 3 schema/private authenticator.

- [ ] **Step 1: Write failing tournament pgTAP tests**

Create `supabase/tests/xo_tournament.test.sql`. In a transaction, call the RPCs with seeded member credentials and assert:

```sql
select throws_ok(
  $$ select public.xo_create_tournament('hau', 'PP-HAU-2026', gen_random_uuid()) $$,
  '42501', 'ONLY_TUNG_CAN_HOST'
);

select lives_ok(
  $$ select public.xo_create_tournament('tung', 'PP-TUNG-2026', '00000000-0000-4000-8000-000000000001') $$
);

select is((select count(*) from public.xo_tournament_players), 7::bigint, 'all members join');
select is((select count(*) from public.xo_matches where stage = 'group'), 15::bigint, '15 group matches');
select is((select count(distinct round_number) from public.xo_matches where stage = 'group'), 5::bigint, 'five rounds');
select is((select count(*) from public.xo_matches where round_number = 1 and status = 'pending'), 3::bigint, 'round one opens');
select is((select count(*) from public.xo_matches where round_number > 1 and status = 'scheduled'), 12::bigint, 'later rounds wait');
select is((select count(*) from public.xo_games where game_number = 1 and status = 'active'), 3::bigint, 'open matches have game one');
select is((public.xo_get_snapshot('tung', 'PP-TUNG-2026')->>'visible')::boolean, true, 'host sees test');
```

Add these explicit assertions after the creation checks:

```sql
select is(
  public.xo_create_tournament('tung','PP-TUNG-2026','00000000-0000-4000-8000-000000000001')->>'tournamentId',
  (select id::text from public.xo_tournaments limit 1),
  'exact retry returns stored tournament'
);
select is((select count(*) from public.xo_tournaments), 1::bigint, 'retry creates no row');
select throws_ok(
  $$ select public.xo_set_release_mode('tung','PP-TUNG-2026','00000000-0000-4000-8000-000000000001','live') $$,
  '22023', 'REQUEST_ID_REUSED'
);
select is((public.xo_get_snapshot('hau','PP-HAU-2026')->>'visible')::boolean, false, 'non-tester hidden');
select throws_ok(
  $$ select public.xo_set_release_mode('tung','PP-TUNG-2026',gen_random_uuid(),'live') $$,
  '22023', 'TEST_GATE_INCOMPLETE'
);
select throws_ok(
  $$ select public.xo_cancel_tournament('hau','PP-HAU-2026',gen_random_uuid(),(select id from public.xo_tournaments limit 1),'no') $$,
  '42501', 'ONLY_TUNG_CAN_HOST'
);
select lives_ok(
  $$ select public.xo_cancel_tournament('tung','PP-TUNG-2026',gen_random_uuid(),(select id from public.xo_tournaments limit 1),'test cleanup') $$
);
```

- [ ] **Step 2: Run focused DB test and confirm RED**

Run: `npx supabase test db --local supabase/tests/xo_tournament.test.sql`  
Expected: FAIL because the RPCs do not exist.

- [ ] **Step 3: Implement host, idempotency, snapshot, and schedule functions**

Add private helpers:

```sql
private.xo_begin_command(
  p_member_id text,
  p_command_name text,
  p_request_id uuid,
  p_payload jsonb
) returns jsonb

private.xo_finish_command(
  p_member_id text,
  p_command_name text,
  p_request_id uuid,
  p_result jsonb
) returns jsonb
```

`xo_begin_command` hashes `p_payload::text` with `digest(..., 'sha256')`, inserts the command row, returns a stored result for an exact retry, and raises `REQUEST_ID_REUSED` for a hash/name mismatch. Enable `pgcrypto` in the migration.

`xo_create_tournament` must authenticate, require Tùng, lock the singleton settings row, reject an active tournament, choose one lucky member, insert all seven players, reset seven test wallets to 36 only in test mode, and generate this circle schedule in SQL from an ordered six-member array:

```text
round 1: [0,5] [1,4] [2,3]
round 2: [0,4] [5,3] [1,2]
round 3: [0,3] [4,2] [5,1]
round 4: [0,2] [3,1] [4,5]
round 5: [0,1] [2,5] [3,4]
```

Only round-one matches are `pending`; the rest are `scheduled`. Each group match has `target_wins=2`. Insert game one for each pending match in the same transaction, choose its `first_member_id` randomly from the two participants, set `next_member_id` to the same member, and initialize bounds to `0..8` on both axes.

`xo_get_snapshot` returns exactly these top-level keys:

```json
{
  "visible": true,
  "releaseMode": "test",
  "currentUser": {},
  "tournament": {},
  "participants": [],
  "matches": [],
  "games": [],
  "moves": [],
  "ratings": [],
  "poolTotals": [],
  "wallet": { "scope": "test", "balance": 36, "recentLedger": [] },
  "myBets": { "pool": [], "side": [] }
}
```

Return `visible=false` with empty private arrays for authenticated members outside the test allowlist. In live mode, grant the monthly 36 points once before constructing the wallet object.

`xo_set_testers` requires Tùng, replaces the allowlist with the supplied distinct valid member IDs, and always retains Tùng. `xo_set_release_mode('live')` requires one completed test tournament and rejects any active tournament. `xo_cancel_tournament` requires Tùng, rejects a tournament with any settled match, marks unfinished matches/games cancelled, and increments revisions; Task 6 adds escrow refunds before those status updates.

Revoke function execution from `public, anon, authenticated`, then grant only the public RPC signatures to `anon`.

- [ ] **Step 4: Verify tournament RPCs and full DB suite**

Run:

```bash
npx supabase db reset --local
npm run test:db
```

Expected: schema and tournament pgTAP suites PASS.

- [ ] **Step 5: Commit tournament commands**

```bash
git add supabase/migrations/20260708223000_xo_arena.sql supabase/tests/xo_tournament.test.sql
git commit -m "feat: add X-O tournament and release RPCs"
```

---

### Task 5: Implement authoritative moves, series, rounds, and playoffs

**Files:**
- Modify: `supabase/migrations/20260708223000_xo_arena.sql`
- Create: `supabase/tests/xo_game.test.sql`

**Interfaces:**
- Produces: `xo_make_move(text, text, uuid, uuid, integer, integer) returns jsonb` where the UUIDs are request ID and game ID.
- Consumes: pending/active matches from Task 4 and schema rows from Task 3.

- [ ] **Step 1: Write failing game-engine pgTAP tests**

Inside the test transaction, add all seven seeded members to `xo_testers`, create a tournament, and prepare a game with these psql variables:

```sql
insert into public.xo_testers(member_id) select id from public.members on conflict do nothing;
select public.xo_create_tournament('tung','PP-TUNG-2026',gen_random_uuid());
select m.id as match_id, m.player_x_id as x_id, m.player_o_id as o_id, g.id as game_id
from public.xo_matches m
join public.xo_games g on g.match_id = m.id and g.status = 'active'
where m.status = 'pending'
order by m.round_number, m.id limit 1 \gset
select login_code as x_code from public.members where id = :'x_id' \gset
select login_code as o_code from public.members where id = :'o_id' \gset
update public.xo_games set first_member_id = :'x_id', next_member_id = :'x_id' where id = :'game_id';
```

Then assert:

```sql
select throws_ok(
  format($$ select public.xo_make_move(%L,%L,gen_random_uuid(),%L,0,0) $$, :'o_id', :'o_code', :'game_id'),
  '22023', 'NOT_YOUR_TURN'
);
select throws_ok(
  format($$ select public.xo_make_move(%L,%L,gen_random_uuid(),%L,20,20) $$, :'x_id', :'x_code', :'game_id'),
  '22023', 'INVALID_CELL'
);
select lives_ok(
  format($$ select public.xo_make_move(%L,%L,'00000000-0000-4000-8000-000000000101',%L,0,0) $$, :'x_id', :'x_code', :'game_id')
);
select is((select count(*) from public.xo_moves where game_id = :'game_id'), 1::bigint, 'one immutable move');
select isnt((select next_member_id from public.xo_games where id = :'game_id'), :'x_id', 'turn switches');
select is((select min_row from public.xo_games where id = :'game_id'), -3, 'top edge expands');
select is((select min_col from public.xo_games where id = :'game_id'), -3, 'left edge expands');
```

Define this pgTAP-local helper and call it against four fresh game fixtures with `(start_row,start_col,d_row,d_col)` values `(4,0,0,1)`, `(0,4,1,0)`, `(0,0,1,1)`, and `(0,4,1,-1)`:

```sql
create function pg_temp.win_line(
  p_game_id uuid,
  p_x_id text,
  p_x_code text,
  p_o_id text,
  p_o_code text,
  p_start_row integer,
  p_start_col integer,
  p_d_row integer,
  p_d_col integer
) returns void language plpgsql as $$
declare i integer;
begin
  for i in 0..3 loop
    perform public.xo_make_move(p_x_id,p_x_code,gen_random_uuid(),p_game_id,p_start_row+i*p_d_row,p_start_col+i*p_d_col);
    perform public.xo_make_move(p_o_id,p_o_code,gen_random_uuid(),p_game_id,8,i);
  end loop;
  perform public.xo_make_move(p_x_id,p_x_code,gen_random_uuid(),p_game_id,p_start_row+4*p_d_row,p_start_col+4*p_d_col);
end;
$$;
```

After each call assert `xo_games.status='completed'` and `winner_id=p_x_id`. For the BO3 fixture, call `pg_temp.win_line` on game one, select the newly created active game, call it again, then assert match score `2-0`, match status `completed`, and settlement status `settled`. Complete all three matches in group round one with the same helper and assert exactly three round-two matches become `pending`. Directly complete the remaining group fixtures through the public move RPC; assert two playoff round-one BO5 rows. Complete both semifinals; assert one playoff round-two final. Complete the final; assert `xo_tournaments.status='completed'` and `champion_id` equals the final winner.

- [ ] **Step 2: Run focused game tests and confirm RED**

Run: `npx supabase test db --local supabase/tests/xo_game.test.sql`  
Expected: FAIL because the authoritative engine is missing.

- [ ] **Step 3: Implement one locked move transaction**

Implement `xo_make_move` with this locked order:

```sql
select * into v_game from public.xo_games where id = p_game_id for update;
select * into v_match from public.xo_matches where id = v_game.match_id for update;
```

Validate active scope/tester access, active game, turn, integer bounds, and unique cell. Insert `move_number = coalesce(max(move_number), 0) + 1` while the game row is locked. Compute X/O from `first_member_id`. Expand each touched bound with `greatest/least` so each axis never exceeds 36.

Detect a win from the new move only. For each direction `(1,0)`, `(0,1)`, `(1,1)`, `(1,-1)`, count same-member moves in both positive and negative directions plus the new move; win when any total is at least five.

On the first move, set `xo_matches.locked_at`, cancel/refund unaccepted side proposals, and increment `revision`. On a game win, update the series score. If the target is not reached, insert the next active game with the other member first. If the target is reached, call private `xo_complete_match(match_id)`.

`xo_complete_match` updates player standings, applies live rating deltas only for live tournaments, opens the next group round, or creates playoff rows exactly as designed. Whenever it changes a match from `scheduled` to `pending` or creates a playoff match, it also inserts game one with random first member and `0..8` bounds. Semifinals have `round_number=1`; the final has `round_number=2`; every playoff match has `target_wins=3`.

For this task, add a minimal private `xo_settle_match` that applies rating changes for live matches with no bet rows and sets `settlement_status='settled'`. It must raise `BETTING_ENGINE_NOT_READY` if bet rows exist. Task 6 replaces that guard with complete wallet settlement while preserving the same function signature and transaction boundary.

- [ ] **Step 4: Verify game engine and idempotency**

Run:

```bash
npx supabase db reset --local
npx supabase test db --local supabase/tests/xo_game.test.sql
npm run test:db
```

Expected: all game, schema, and tournament tests PASS; replaying a request ID does not insert a second move.

- [ ] **Step 5: Commit authoritative game engine**

```bash
git add supabase/migrations/20260708223000_xo_arena.sql supabase/tests/xo_game.test.sql
git commit -m "feat: add authoritative X-O game engine"
```

---

### Task 6: Implement safe wallets, pool bets, direct bets, and settlement

**Files:**
- Modify: `supabase/migrations/20260708223000_xo_arena.sql`
- Create: `supabase/tests/xo_betting.test.sql`
- Create: `tests/xo-concurrency.test.js`

**Interfaces:**
- Produces:
  - `xo_place_pool_bet(text, text, uuid, uuid, text, integer) returns jsonb`
  - `xo_propose_side_bet(text, text, uuid, uuid, integer) returns jsonb`
  - `xo_respond_side_bet(text, text, uuid, uuid, text) returns jsonb`
- Consumes: match locking and private `xo_complete_match` from Task 5; command idempotency from Task 4.

- [ ] **Step 1: Write failing wallet and betting tests**

In `supabase/tests/xo_betting.test.sql`, assert that a match participant cannot pool-bet their own match, a spectator stake is escrowed once, insufficient funds fails, a second position fails, first move locks betting, a rejected/cancelled side proposal refunds once, only the opponent may accept, accepted stake is equal, and winner settlement conserves total escrow.

Use this conservation assertion after settlement:

```sql
select is(
  (select sum(amount) from public.citizen_point_ledger where match_id = :'match_id'),
  0::bigint,
  'all match debits and credits net to zero'
);
select is(
  (select count(*) from public.xo_matches where id = :'match_id' and settlement_status = 'settled'),
  1::bigint,
  'match settles once'
);
```

In `tests/xo-concurrency.test.js`, define `const integrationTest = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? test : test.skip;` so ordinary `npm test` skips external DB work. Under `integrationTest`, send two simultaneous 30-point pool bets from the same 36-point test wallet using two request IDs, and assert exactly one succeeds and the snapshot balance is 6—not negative.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
npx supabase test db --local supabase/tests/xo_betting.test.sql
npm run test:concurrency
```

Expected: FAIL because betting RPCs and settlement are incomplete.

- [ ] **Step 3: Implement escrow and settlement transactions**

Every placement/acceptance must lock the wallet row before checking balance:

```sql
select * into v_wallet
from public.citizen_wallets
where member_id = p_member_id and scope = v_tournament.scope
for update;
if v_wallet.balance < p_stake then
  raise exception using errcode = '22023', message = 'INSUFFICIENT_BALANCE';
end if;
```

Debit wallet, insert ledger, insert/update the bet, update `xo_pool_totals`, and increment match revision in one transaction. Use unique constraints to enforce one pool position and one direct proposal per match.

Add private `xo_settle_match(p_match_id uuid)` and call it only from `xo_complete_match`. Lock the match, require `settlement_status='pending'`, set it to `settling`, allocate pool payouts using integer numerator/remainder ordering equivalent to Task 2, credit wallets and ledger, pay two equal side stakes to the winner, then set `settled`. Test tournaments write only test wallets; live tournaments also apply ratings in the same outer transaction.

Add private refund functions used by rejected/cancelled side bets, first-move cancellation of unaccepted proposals, and tournament cancellation. Each refund changes status before crediting so a retry cannot pay twice.

- [ ] **Step 4: Verify betting, concurrency, and conservation**

Run:

```bash
npx supabase db reset --local
npx supabase test db --local supabase/tests/xo_betting.test.sql
npm run test:concurrency
npm run test:db
```

Expected: all assertions PASS; one concurrent bet succeeds, one returns `INSUFFICIENT_BALANCE`, and balance remains 6.

- [ ] **Step 5: Commit wallet and betting engine**

```bash
git add supabase/migrations/20260708223000_xo_arena.sql supabase/tests/xo_betting.test.sql tests/xo-concurrency.test.js
git commit -m "feat: add safe X-O wallets and betting"
```

---

### Task 7: Add the X-O API client and Realtime state synchronization

**Files:**
- Create: `src/xo-api.js`
- Create: `tests/xo-api.test.js`
- Modify: `tests/module-graph.test.js`

**Interfaces:**
- Produces class `XoApi`:
  - `setSession(session)`
  - `getSnapshot()`
  - `createTournament()`, `cancelTournament(id, reason)`
  - `setReleaseMode(mode)`, `setTesters(ids)`
  - `makeMove(gameId, row, col)`
  - `placePoolBet(matchId, pickMemberId, stake)`
  - `proposeSideBet(matchId, stake)`, `respondSideBet(betId, action)`
  - `subscribe(onPublicChange)`, `unsubscribe()`
- Consumes: exact RPC names/signatures from Tasks 4–6 and a Supabase client.

- [ ] **Step 1: Write failing API-client tests**

Create a fake Supabase client that records `.rpc()` and `.channel()` calls. Assert:

```js
test('makeMove reuses one request ID after an unknown result', async () => {
  const client = createFakeClient([{ error: new Error('network') }, { data: { status: 'moved' } }]);
  const api = new XoApi(client, () => '00000000-0000-4000-8000-000000000201');
  api.setSession({ member: { id: 'tung' }, code: 'PP-TUNG-2026' });
  await assert.rejects(api.makeMove('game-1', 0, 0));
  await api.makeMove('game-1', 0, 0);
  assert.equal(client.calls[0].args.p_request_id, client.calls[1].args.p_request_id);
});

test('confirmed commands receive a fresh request ID', async () => {
  const api = new XoApi(createFakeClient([{ data: {} }, { data: {} }]), sequentialUuid);
  api.setSession({ member: { id: 'tung' }, code: 'PP-TUNG-2026' });
  await api.makeMove('game-1', 0, 0);
  await api.makeMove('game-1', 0, 1);
  assert.notEqual(client.calls[0].args.p_request_id, client.calls[1].args.p_request_id);
});
```

Also assert that `getSnapshot()` requires a session, RPC errors map through `xoErrorMessage`, and `subscribe()` listens to tournaments, players, matches, games, moves, ratings, and pool totals.

- [ ] **Step 2: Run API tests and confirm RED**

Run: `node --test tests/xo-api.test.js`  
Expected: FAIL because `src/xo-api.js` does not exist.

- [ ] **Step 3: Implement `XoApi`**

Store one pending command key made from command name plus stable payload JSON. Generate a UUID only when that key is first attempted; remove it only after a confirmed RPC response. Always add `p_member_id`, `p_login_code`, and `p_request_id` to mutation calls.

`subscribe(onPublicChange)` creates one channel named `xo-arena`, registers `postgres_changes` listeners for the seven realtime tables, invokes `onPublicChange({ table, eventType, row })`, and reports channel status through a second optional callback. `unsubscribe()` removes the channel.

- [ ] **Step 4: Verify API and module graph**

Run:

```bash
node --test tests/xo-api.test.js tests/module-graph.test.js
npm test
```

Expected: API contract and all regressions PASS.

- [ ] **Step 5: Commit API synchronization**

```bash
git add src/xo-api.js tests/xo-api.test.js tests/module-graph.test.js
git commit -m "feat: add X-O API and realtime client"
```

---

### Task 8: Replace prototype UI with role-aware realtime arena

**Files:**
- Create: `src/xo-arena.js`
- Create: `tests/xo-arena.test.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `index.css`
- Modify: `config.js`
- Modify: `tests/frontend-contract.sh`

**Interfaces:**
- Produces class `XoArena` with `setSession(session)`, `refresh()`, `render()`, `connect()`, and `destroy()`.
- Consumes: `XoApi` from Task 7, member names from `TeamPortal.members`, and existing toast/modal styles.

- [ ] **Step 1: Write failing role/render contract tests**

In `tests/xo-arena.test.js`, test pure exported helpers from the new module:

```js
test('arena role distinguishes player, spectator, and host', () => {
  assert.equal(getArenaRole({ memberId: 'tung', hostId: 'tung', match: { player_x_id: 'hau', player_o_id: 'hung' } }), 'host');
  assert.equal(getArenaRole({ memberId: 'hau', hostId: 'tung', match: { player_x_id: 'hau', player_o_id: 'hung' } }), 'player');
  assert.equal(getArenaRole({ memberId: 'thach', hostId: 'tung', match: { player_x_id: 'hau', player_o_id: 'hung' } }), 'spectator');
});

test('board input requires online own turn with no pending command', () => {
  assert.equal(canPlayCell({ online: true, pending: false, memberId: 'hau', nextMemberId: 'hau', occupied: false, gameStatus: 'active' }), true);
  assert.equal(canPlayCell({ online: false, pending: false, memberId: 'hau', nextMemberId: 'hau', occupied: false, gameStatus: 'active' }), false);
});
```

Update `tests/frontend-contract.sh` to require IDs for tournament status, connectivity, schedule, match score, wallet, pool form, side-bet form, host controls, standings, bracket, and leaderboard; remove checks for local reset/mock-only UI.

- [ ] **Step 2: Run UI contracts and confirm RED**

Run:

```bash
node --test tests/xo-arena.test.js
bash tests/frontend-contract.sh
```

Expected: FAIL because the arena module and release DOM do not exist.

- [ ] **Step 3: Implement the focused arena controller and markup**

Move X-O state, event handlers, rendering, and Realtime lifecycle out of `TeamPortal` into `XoArena`. `TeamPortal` constructs it after the collaboration client exists, passes session changes on login/restore/logout, and calls `refresh()` when switching to the X-O tab.

`XoArena.refresh()` fetches the snapshot, hides navigation when `visible=false`, selects the signed-in member's active match first, and renders public/private panels. Realtime events update public arrays or trigger a debounced authenticated snapshot refresh when match revision changes.

Replace the local “Làm mới bàn” action with schedule selection. Render cells from `snapshot.moves` and bounds from the active game; clicking an enabled cell calls `api.makeMove` and leaves the board disabled until confirmation.

Render role controls exactly as follows:

- player in pending own match: direct-bet propose/respond controls;
- spectator in pending match: one pool pick/stake form;
- locked match: read-only pool totals and direct-bet status;
- host: tester allowlist, create/cancel, and test-to-live actions;
- everyone: schedule, standings, bracket, ratings, connectivity, test/live label, and private wallet.

Remove `xoArenaEnabled` and `xoArenaTesterIds` authorization decisions from `config.js`; server snapshot visibility replaces them. Keep the tab hidden until an authenticated snapshot says it is visible.

Allow Playwright to inject local Supabase settings before `config.js` executes without changing production defaults:

```js
const testConfig = window.__PINGPING_TEST_CONFIG__ || {};
window.PINGPING_CONFIG = Object.freeze({
  supabaseUrl: testConfig.supabaseUrl || 'https://fkambrjgfgeppolbjbpg.supabase.co',
  supabaseKey: testConfig.supabaseKey || 'sb_publishable_hQrmRoDzu44kbgFKY5FgJw_MIriO0MI'
});
```

Add CSS for pending/offline/locked states, 36×36 horizontal scrolling, stacked mobile cards below 900px, focus-visible cells, and disabled-cell contrast. Preserve the existing portal theme tokens.

- [ ] **Step 4: Verify UI contracts and regressions**

Run:

```bash
node --test tests/xo-arena.test.js
bash tests/frontend-contract.sh
npm test
npx vite build
```

Expected: all tests PASS; no mock standings, fixed “36 điểm test”, or local-only move path remains in `app.js`.

- [ ] **Step 5: Commit release UI**

```bash
git add src/xo-arena.js tests/xo-arena.test.js app.js index.html index.css config.js tests/frontend-contract.sh
git commit -m "feat: connect X-O release UI to realtime state"
```

---

### Task 9: Add multi-session E2E, security verification, and release runbook

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/xo-challenger.spec.js`
- Create: `docs/xo-challenger-release.md`
- Modify: `README.md`

**Interfaces:**
- Produces: repeatable release-gate command `npm run test:release` and an operator checklist for Tùng.
- Consumes: local Supabase, all RPCs, `XoArena`, and Vite app from Tasks 1–8.

- [ ] **Step 1: Write the failing browser story**

Configure Playwright with `baseURL: 'http://127.0.0.1:4173'`, Chromium desktop plus a 390×844 mobile project, and a Vite web server command `npx vite --host 127.0.0.1 --port 4173`.

In `tests/e2e/xo-challenger.spec.js`, create three browser contexts. The story must:

Before opening any page, inject the local endpoint into each context:

```js
await context.addInitScript(({ supabaseUrl, supabaseKey }) => {
  window.__PINGPING_TEST_CONFIG__ = { supabaseUrl, supabaseKey };
}, {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});
```

1. Log in Tùng, add required testers, and create a test tournament.
2. Determine one pending match from the rendered schedule and log in its two players plus a non-participant spectator.
3. Place a spectator pool bet and an equal-stake direct bet accepted by the opponent.
4. Make alternating moves until X has five horizontally.
5. Assert all contexts receive the game result and updated series score without reload.
6. Assert the pool form locks after the first move.
7. Complete the remaining game(s), then assert wallet payouts, ledger summary, standings, and match settlement appear exactly once.
8. Disconnect/reconnect one page and assert snapshot recovery.
9. On mobile, assert the board is horizontally scrollable and wallet/bet cards stack below it.

Use `data-testid` selectors added in Task 8; do not select by Vietnamese prose.

- [ ] **Step 2: Run the E2E story and confirm RED**

Run:

```bash
npx supabase db reset --local
npm run test:e2e
```

Expected: FAIL on the first missing/mismatched end-to-end behavior.

- [ ] **Step 3: Fix only E2E integration gaps and write the runbook**

Resolve selector, refresh, subscription, and test-fixture gaps without weakening assertions. Create `docs/xo-challenger-release.md` with these exact operator phases:

```text
1. Local gate: npm run test:release
2. Security gate: supabase db advisors --local
3. Deploy migration while release_mode remains test
4. Tùng adds test participants and completes one full test tournament
5. Verify test ledger conservation and unchanged live wallets/ratings
6. Tùng switches release_mode to live
7. Verify all seven members can open X-O Challenger
8. Rollback: switch mode to test; do not reverse completed payouts manually
```

Update README feature and test sections to link the runbook and list `npm run test:release`.

- [ ] **Step 4: Run the complete release gate**

Run:

```bash
npx supabase db reset --local
npm run test:release
npx supabase db advisors --local
git diff --check
```

Expected: unit, contract, pgTAP, concurrency, browser, and regression suites PASS; advisors report no X-O security errors; diff check is clean.

- [ ] **Step 5: Commit E2E and runbook**

```bash
git add playwright.config.js tests/e2e/xo-challenger.spec.js docs/xo-challenger-release.md README.md
git commit -m "test: add X-O Challenger release gate"
```

---

## Final verification and handoff

- [ ] Confirm `git status --short` contains no unintended files and all pre-existing unrelated changes remain untouched.
- [ ] Record the exact output summary of `npm run test:release` and `npx supabase db advisors --local`.
- [ ] Keep database `release_mode='test'`; deployment does not authorize switching production to live.
- [ ] Hand the committed runbook to Tùng for the manual full-tournament test and explicit live promotion.
