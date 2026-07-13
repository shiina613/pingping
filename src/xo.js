export const XO_HOST_ID = 'tung';
export const CITIZEN_MONTHLY_GRANT = 36;
export const XO_INITIAL_SIZE = 9;
export const XO_MAX_SIZE = 36;
export const XO_EXPAND_BY = 3;
export const XO_WIN_LENGTH = 5;

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
  REQUEST_ID_REUSED: 'Yêu cầu đã được dùng cho thao tác khác.',
  TEST_SIMULATION_ONLY: 'Chỉ có thể mô phỏng khi X-O đang ở chế độ test.',
  TEST_SIMULATION_LIMIT: 'Không thể hoàn tất mô phỏng test tự động.'
});

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
  return {
    bounds: expandBoundsForMove(state.bounds, point),
    moves: [...state.moves, { row: point.row, col: point.col, mark }]
  };
}

export function getGameOutcome(state) {
  assertState(state);
  const occupied = new Map(state.moves.map(move => [`${move.row},${move.col}`, move.mark]));
  for (const move of state.moves) {
    for (const [rowStep, colStep] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const line = collectLine(occupied, state.bounds, move, rowStep, colStep);
      if (line.length >= XO_WIN_LENGTH) return { winner: move.mark, draw: false, line };
    }
  }
  return { winner: null, draw: state.moves.length >= boardArea(state.bounds), line: [] };
}

export function expandBoundsForMove(bounds, point) {
  let next = { ...bounds };
  if (point.row === bounds.minRow) next = grow(next, 'minRow', 'rows', -1);
  if (point.row === bounds.maxRow) next = grow(next, 'maxRow', 'rows', 1);
  if (point.col === bounds.minCol) next = grow(next, 'minCol', 'cols', -1);
  if (point.col === bounds.maxCol) next = grow(next, 'maxCol', 'cols', 1);
  return next;
}

export function boardSize(bounds) {
  return {
    rows: bounds.maxRow - bounds.minRow + 1,
    cols: bounds.maxCol - bounds.minCol + 1
  };
}

export function createRoundRobin(memberIds) {
  if (memberIds.length !== 6 || new Set(memberIds).size !== 6) throw new Error('SIX_DISTINCT_MEMBERS_REQUIRED');
  const order = [...memberIds];
  const rounds = [];
  for (let round = 0; round < order.length - 1; round += 1) {
    const pairings = [];
    for (let index = 0; index < order.length / 2; index += 1) {
      pairings.push([order[index], order[order.length - 1 - index]]);
    }
    rounds.push(pairings);
    order.splice(1, 0, order.pop());
  }
  return rounds;
}

export function sortStandings(rows = []) {
  return [...rows].sort((a, b) =>
    Number(b.wins || 0) - Number(a.wins || 0) ||
    Number(b.game_wins || 0) - Number(a.game_wins || 0) ||
    Number(a.losses || 0) - Number(b.losses || 0) ||
    String(a.member_id).localeCompare(String(b.member_id))
  );
}

export function getPlayoffPairings(luckyMemberId, standings = []) {
  const [first, second, third] = sortStandings(standings).filter(row => row.member_id !== luckyMemberId);
  if (!luckyMemberId || !first || !second || !third) throw new Error('PLAYOFF_SEEDS_INCOMPLETE');
  return [[first.member_id, luckyMemberId], [second.member_id, third.member_id]];
}

export function getMatchConfig(stage) {
  return stage === 'playoff' ? { targetWins: 3, label: 'BO5' } : { targetWins: 2, label: 'BO3' };
}

export function getRatingDelta(stage) {
  return stage === 'playoff' ? { winner: 360, loser: -180 } : { winner: 36, loser: -18 };
}

export function allocatePoolPayouts(bets = [], winnerMemberId) {
  const winners = bets.filter(bet => bet.pick_member_id === winnerMemberId);
  const total = sumStake(bets);
  const winningStake = sumStake(winners);
  if (!winningStake || winningStake === total) {
    return bets.map(bet => ({ bet_id: bet.id, member_id: bet.member_id, payout: Number(bet.stake) }));
  }
  const winnerRows = winners.map(bet => {
    const numerator = Number(bet.stake) * total;
    return { bet, payout: Math.floor(numerator / winningStake), remainder: numerator % winningStake };
  });
  const unassigned = total - winnerRows.reduce((sum, row) => sum + row.payout, 0);
  winnerRows.sort((a, b) => b.remainder - a.remainder || String(a.bet.id).localeCompare(String(b.bet.id)));
  for (let index = 0; index < unassigned; index += 1) winnerRows[index].payout += 1;
  const payoutById = new Map(winnerRows.map(row => [row.bet.id, row.payout]));
  return bets.map(bet => ({ bet_id: bet.id, member_id: bet.member_id, payout: payoutById.get(bet.id) || 0 }));
}

export function xoErrorMessage(code) {
  return XO_ERROR_MESSAGES[code] || 'Không thể thực hiện thao tác X-O.';
}

function collectLine(occupied, bounds, move, rowStep, colStep) {
  const points = [{ row: move.row, col: move.col }];
  for (const direction of [-1, 1]) {
    for (let offset = 1; offset < XO_MAX_SIZE; offset += 1) {
      const point = {
        row: move.row + rowStep * offset * direction,
        col: move.col + colStep * offset * direction
      };
      if (!isPointInBounds(bounds, point) || occupied.get(`${point.row},${point.col}`) !== move.mark) break;
      direction < 0 ? points.unshift(point) : points.push(point);
    }
  }
  return points.map(point => toIndex(bounds, point.row, point.col));
}

function grow(bounds, key, sizeKey, direction) {
  const delta = Math.min(XO_EXPAND_BY, XO_MAX_SIZE - boardSize(bounds)[sizeKey]);
  return delta ? { ...bounds, [key]: bounds[key] + delta * direction } : bounds;
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
  return (row - bounds.minRow) * boardSize(bounds).cols + col - bounds.minCol;
}

function sumStake(bets) {
  return bets.reduce((total, bet) => total + Number(bet.stake || 0), 0);
}
