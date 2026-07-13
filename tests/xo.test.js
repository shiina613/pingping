import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocatePoolPayouts,
  applyMove,
  boardSize,
  createEmptyBoard,
  createRoundRobin,
  expandBoundsForMove,
  getGameOutcome,
  getMatchConfig,
  getPlayoffPairings,
  getRatingDelta,
  sortStandings,
  xoErrorMessage
} from '../src/xo.js';

test('board starts at 9x9 and rejects occupied cells', () => {
  const state = createEmptyBoard();
  const moved = applyMove(state, { row: 4, col: 4 }, 'x');

  assert.deepEqual(state.bounds, { minRow: 0, maxRow: 8, minCol: 0, maxCol: 8 });
  assert.deepEqual(moved.moves, [{ row: 4, col: 4, mark: 'x' }]);
  assert.throws(() => applyMove(moved, { row: 4, col: 4 }, 'o'), /OCCUPIED_CELL/);
});

test('board expands touched edges by three and caps each axis at 36', () => {
  const initial = createEmptyBoard().bounds;
  assert.deepEqual(expandBoundsForMove(initial, { row: 0, col: 0 }), {
    minRow: -3, maxRow: 8, minCol: -3, maxCol: 8
  });
  const maxed = expandBoundsForMove(
    { minRow: -12, maxRow: 23, minCol: -12, maxCol: 23 },
    { row: 23, col: 23 }
  );
  assert.deepEqual(boardSize(maxed), { rows: 36, cols: 36 });
});

test('connect-five detects horizontal vertical and diagonal wins', () => {
  const states = [
    [0, 1, 2, 3, 4].map(col => ({ row: 2, col, mark: 'x' })),
    [0, 1, 2, 3, 4].map(row => ({ row, col: 2, mark: 'o' })),
    [0, 1, 2, 3, 4].map(value => ({ row: value, col: value, mark: 'x' })),
    [0, 1, 2, 3, 4].map(value => ({ row: value, col: 4 - value, mark: 'o' }))
  ];

  assert.deepEqual(states.map(moves => getGameOutcome({ bounds: createEmptyBoard().bounds, moves }).winner), ['x', 'o', 'x', 'o']);
});

test('six contiguous marks are still a connect-five win', () => {
  const state = createEmptyBoard();
  state.moves = [0, 1, 2, 3, 4, 5].map(col => ({ row: 4, col, mark: 'x' }));

  assert.equal(getGameOutcome(state).winner, 'x');
});

test('six players produce five rounds with three unique matches each', () => {
  const rounds = createRoundRobin(['a', 'b', 'c', 'd', 'e', 'f']);

  assert.equal(rounds.length, 5);
  assert.ok(rounds.every(round => round.length === 3));
  assert.equal(new Set(rounds.flat().map(([a, b]) => [a, b].sort().join(':'))).size, 15);
  assert.throws(() => createRoundRobin(['a', 'a', 'b', 'c', 'd', 'e']), /SIX_DISTINCT_MEMBERS_REQUIRED/);
});

test('standings and playoff pair rank one with lucky and rank two with rank three', () => {
  const standings = sortStandings([
    { member_id: 'three', wins: 3, game_wins: 8, losses: 2 },
    { member_id: 'one', wins: 5, game_wins: 10, losses: 0 },
    { member_id: 'two', wins: 4, game_wins: 9, losses: 1 }
  ]);

  assert.deepEqual(standings.map(row => row.member_id), ['one', 'two', 'three']);
  assert.deepEqual(getPlayoffPairings('lucky', standings), [['one', 'lucky'], ['two', 'three']]);
});

test('group and playoff use approved series and rating rules', () => {
  assert.deepEqual(getMatchConfig('group'), { targetWins: 2, label: 'BO3' });
  assert.deepEqual(getMatchConfig('playoff'), { targetWins: 3, label: 'BO5' });
  assert.deepEqual(getRatingDelta('group'), { winner: 36, loser: -18 });
  assert.deepEqual(getRatingDelta('playoff'), { winner: 360, loser: -180 });
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

test('one-sided pool refunds every stake', () => {
  assert.deepEqual(allocatePoolPayouts([
    { id: 'a', member_id: 'm1', pick_member_id: 'x', stake: 12 }
  ], 'x'), [{ bet_id: 'a', member_id: 'm1', payout: 12 }]);
});

test('stable RPC errors map to Vietnamese copy', () => {
  assert.equal(xoErrorMessage('NOT_YOUR_TURN'), 'Chưa đến lượt của bạn.');
  assert.equal(xoErrorMessage('INSUFFICIENT_BALANCE'), 'Bạn không đủ điểm công dân.');
  assert.equal(xoErrorMessage('UNKNOWN_CODE'), 'Không thể thực hiện thao tác X-O.');
});
