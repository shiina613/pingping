export const CITIZEN_MONTHLY_GRANT = 36;
export const XO_INITIAL_SIZE = 9;
export const XO_MAX_SIZE = 36;
export const XO_EXPAND_BY = 3;
export const XO_WIN_LENGTH = 5;

export function createInitialBounds() {
  return { minRow: 0, maxRow: XO_INITIAL_SIZE - 1, minCol: 0, maxCol: XO_INITIAL_SIZE - 1 };
}

export function createEmptyBoard() {
  return { bounds: createInitialBounds(), moves: [] };
}

export function applyMove(state, point, mark) {
  assertState(state);
  if (!['x', 'o'].includes(mark)) throw new Error('INVALID_MARK');
  if (!isPointInBounds(state.bounds, point)) throw new Error('INVALID_CELL');
  if (state.moves.some(move => move.row === point.row && move.col === point.col)) throw new Error('OCCUPIED_CELL');
  const move = { row: point.row, col: point.col, mark };
  return {
    bounds: expandBoundsForMove(state.bounds, point),
    moves: [...state.moves, move]
  };
}

export function getGameOutcome(state) {
  assertState(state);
  const occupied = new Map(state.moves.map(move => [`${move.row},${move.col}`, move.mark]));
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (const move of state.moves) {
    for (const [dRow, dCol] of directions) {
      const line = collectLine(occupied, state.bounds, move.row, move.col, dRow, dCol, move.mark);
      if (line.length === XO_WIN_LENGTH) {
        return { winner: move.mark, draw: false, line };
      }
    }
  }
  return { winner: null, draw: state.moves.length >= boardArea(state.bounds), line: [] };
}

export function getFourThreat(state, mark) {
  assertState(state);
  if (!['x', 'o'].includes(mark)) throw new Error('INVALID_MARK');
  const occupied = new Map(state.moves.map(move => [`${move.row},${move.col}`, move.mark]));
  const winningCells = new Set();

  for (const move of state.moves.filter(item => item.mark === mark)) {
    for (const [dRow, dCol] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      if (![0, 1, 2, 3].every(offset => occupied.get(`${move.row + dRow * offset},${move.col + dCol * offset}`) === mark)) continue;
      for (const point of [
        { row: move.row - dRow, col: move.col - dCol },
        { row: move.row + dRow * 4, col: move.col + dCol * 4 }
      ]) {
        if (isPointInBounds(state.bounds, point) && !occupied.has(`${point.row},${point.col}`)) {
          winningCells.add(`${point.row},${point.col}`);
        }
      }
    }
  }

  return {
    level: winningCells.size > 1 ? 'unblockable' : winningCells.size === 1 ? 'blockable' : null,
    winningCells: [...winningCells]
  };
}

export function expandBoundsForMove(bounds, point) {
  let next = { ...bounds };
  if (point.row === bounds.minRow) next = growMin(next, 'row');
  if (point.row === bounds.maxRow) next = growMax(next, 'row');
  if (point.col === bounds.minCol) next = growMin(next, 'col');
  if (point.col === bounds.maxCol) next = growMax(next, 'col');
  return next;
}

export function boardSize(bounds) {
  return {
    rows: bounds.maxRow - bounds.minRow + 1,
    cols: bounds.maxCol - bounds.minCol + 1
  };
}

function collectLine(occupied, bounds, row, col, dRow, dCol, mark) {
  const line = [];
  for (let offset = 0; offset < XO_WIN_LENGTH; offset += 1) {
    const nextRow = row + dRow * offset;
    const nextCol = col + dCol * offset;
    if (!isPointInBounds(bounds, { row: nextRow, col: nextCol })) return [];
    if (occupied.get(`${nextRow},${nextCol}`) !== mark) return [];
    line.push(toIndex(bounds, nextRow, nextCol));
  }
  return line;
}

function growMin(bounds, axis) {
  const size = axis === 'row' ? boardSize(bounds).rows : boardSize(bounds).cols;
  const delta = Math.min(XO_EXPAND_BY, XO_MAX_SIZE - size);
  if (!delta) return bounds;
  return axis === 'row'
    ? { ...bounds, minRow: bounds.minRow - delta }
    : { ...bounds, minCol: bounds.minCol - delta };
}

function growMax(bounds, axis) {
  const size = axis === 'row' ? boardSize(bounds).rows : boardSize(bounds).cols;
  const delta = Math.min(XO_EXPAND_BY, XO_MAX_SIZE - size);
  if (!delta) return bounds;
  return axis === 'row'
    ? { ...bounds, maxRow: bounds.maxRow + delta }
    : { ...bounds, maxCol: bounds.maxCol + delta };
}

function assertState(state) {
  if (!state?.bounds || !Array.isArray(state.moves)) throw new Error('INVALID_BOARD');
}

function isPointInBounds(bounds, point) {
  return Number.isInteger(point?.row) && Number.isInteger(point?.col) &&
    point.row >= bounds.minRow && point.row <= bounds.maxRow &&
    point.col >= bounds.minCol && point.col <= bounds.maxCol;
}

function boardArea(bounds) {
  const size = boardSize(bounds);
  return size.rows * size.cols;
}

function toIndex(bounds, row, col) {
  return (row - bounds.minRow) * boardSize(bounds).cols + (col - bounds.minCol);
}

export function getMatchConfig() {
  return { targetWins: 1, label: 'BO1' };
}

export function getRatingDelta() {
  return { winner: 36, loser: -18 };
}

export function settlePoolBets(bets = [], winnerMemberId) {
  const winnerBets = bets.filter(bet => bet.pick_member_id === winnerMemberId);
  const loserBets = bets.filter(bet => bet.pick_member_id !== winnerMemberId);
  const winningPool = sumStake(winnerBets);
  const losingPool = sumStake(loserBets);

  return bets.map(bet => {
    if (bet.pick_member_id !== winnerMemberId) {
      return { member_id: bet.member_id, delta: -Number(bet.stake || 0) };
    }
    if (!winningPool || !losingPool) {
      return { member_id: bet.member_id, delta: 0 };
    }
    const profit = Math.floor((Number(bet.stake || 0) / winningPool) * losingPool);
    return { member_id: bet.member_id, delta: Number(bet.stake || 0) + profit };
  });
}

export function settleSideBet(bet, winnerMemberId) {
  if (!bet) return [];
  const aStake = Number(bet.player_a_stake || 0);
  const bStake = Number(bet.player_b_stake || 0);
  if (winnerMemberId === bet.player_a_id) {
    return [
      { member_id: bet.player_a_id, delta: bStake },
      { member_id: bet.player_b_id, delta: -bStake }
    ];
  }
  return [
    { member_id: bet.player_a_id, delta: -aStake },
    { member_id: bet.player_b_id, delta: aStake }
  ];
}

function sumStake(bets) {
  return bets.reduce((total, bet) => total + Number(bet.stake || 0), 0);
}
