import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMove,
  createEmptyBoard,
  createInitialBounds,
  expandBoundsForMove,
  getGameOutcome,
  getFourThreat,
  getMatchConfig,
  getRatingDelta,
  settlePoolBets,
  settleSideBet
} from '../src/xo.js';

test('xo board starts at 9x9 and detects connect-five wins', () => {
  const state = createEmptyBoard();
  const afterMove = applyMove(state, { row: 0, col: 0 }, 'x');
  const horizontalWin = createEmptyBoard();
  const diagonalWin = createEmptyBoard();

  for (const col of [0, 1, 2, 3, 4]) horizontalWin.moves.push({ row: 2, col, mark: 'x' });
  for (const point of [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]) {
    diagonalWin.moves.push({ row: point[0], col: point[1], mark: 'o' });
  }

  assert.deepEqual(state.bounds, { minRow: 0, maxRow: 8, minCol: 0, maxCol: 8 });
  assert.equal(afterMove.moves[0].mark, 'x');
  assert.throws(() => applyMove(afterMove, { row: 0, col: 0 }, 'o'), /OCCUPIED_CELL/);
  assert.deepEqual(getGameOutcome(horizontalWin).line, [18, 19, 20, 21, 22]);
  assert.equal(getGameOutcome(horizontalWin).winner, 'x');
  assert.equal(getGameOutcome(diagonalWin).winner, 'o');
});

test('xo board expands by three cells on touched edges up to 36x36', () => {
  const initial = createInitialBounds();
  const expandedLeft = expandBoundsForMove(initial, { row: 4, col: 0 });
  const expandedCorner = expandBoundsForMove(initial, { row: 8, col: 8 });
  const maxed = expandBoundsForMove({ minRow: -12, maxRow: 23, minCol: -12, maxCol: 23 }, { row: 23, col: 23 });

  assert.deepEqual(expandedLeft, { minRow: 0, maxRow: 8, minCol: -3, maxCol: 8 });
  assert.deepEqual(expandedCorner, { minRow: 0, maxRow: 11, minCol: 0, maxCol: 11 });
  assert.equal(maxed.maxRow - maxed.minRow + 1, 36);
  assert.equal(maxed.maxCol - maxed.minCol + 1, 36);
});

test('four-in-a-row threats distinguish blockable and unblockable losses', () => {
  const blockable = createEmptyBoard();
  blockable.moves.push({ row: 2, col: 1, mark: 'x' });
  for (const col of [2, 3, 4, 5]) blockable.moves.push({ row: 2, col, mark: 'o' });

  const unblockable = createEmptyBoard();
  for (const col of [2, 3, 4, 5]) unblockable.moves.push({ row: 2, col, mark: 'o' });

  assert.deepEqual(getFourThreat(blockable, 'o'), { level: 'blockable', winningCells: ['2,6'] });
  assert.deepEqual(getFourThreat(unblockable, 'o'), { level: 'unblockable', winningCells: ['2,1', '2,6'] });
  assert.deepEqual(getFourThreat(createEmptyBoard(), 'x'), { level: null, winningCells: [] });
});

test('casino matches settle in one game', () => {
  assert.deepEqual(getMatchConfig(), { targetWins: 1, label: 'BO1' });
});

test('casino rating deltas keep the old group-match values', () => {
  assert.deepEqual(getRatingDelta(), { winner: 36, loser: -18 });
});

test('pool bets split losing pool by winning stake and refund empty opposing pools', () => {
  const settled = settlePoolBets([
    { member_id: 'hau', pick_member_id: 'tung', stake: 10 },
    { member_id: 'hung', pick_member_id: 'tung', stake: 30 },
    { member_id: 'thach', pick_member_id: 'duyanh', stake: 20 }
  ], 'tung');

  assert.deepEqual(settled, [
    { member_id: 'hau', delta: 15 },
    { member_id: 'hung', delta: 45 },
    { member_id: 'thach', delta: -20 }
  ]);

  assert.deepEqual(settlePoolBets([{ member_id: 'hau', pick_member_id: 'tung', stake: 12 }], 'tung'), [
    { member_id: 'hau', delta: 0 }
  ]);
});

test('side bet transfers loser stake to the winner', () => {
  assert.deepEqual(settleSideBet({
    player_a_id: 'tung',
    player_b_id: 'hau',
    player_a_stake: 18,
    player_b_stake: 9
  }, 'tung'), [
    { member_id: 'tung', delta: 9 },
    { member_id: 'hau', delta: -9 }
  ]);
});
