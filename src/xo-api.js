import { xoErrorMessage } from './xo.js';

const PUBLIC_TABLES = Object.freeze([
  'xo_tournaments',
  'xo_tournament_players',
  'xo_matches',
  'xo_games',
  'xo_moves',
  'xo_ratings',
  'xo_pool_totals'
]);

function defaultUuid() {
  return globalThis.crypto.randomUUID();
}

export class XoApi {
  constructor(client, createUuid = defaultUuid) {
    this.client = client;
    this.createUuid = createUuid;
    this.session = null;
    this.pendingRequestIds = new Map();
    this.realtimeChannel = null;
  }

  setSession(session) {
    const previousId = this.session?.member?.id;
    this.session = session || null;
    if (previousId !== this.session?.member?.id) this.pendingRequestIds.clear();
  }

  requireSession() {
    if (!this.session?.member?.id || !this.session?.code) {
      throw new Error(xoErrorMessage('INVALID_CREDENTIALS'));
    }
    return {
      p_member_id: this.session.member.id,
      p_login_code: this.session.code
    };
  }

  async call(name, args) {
    const response = await this.client.rpc(name, args);
    if (response.error) {
      const code = response.error.code || response.error.message || 'UNKNOWN_CODE';
      const error = new Error(xoErrorMessage(code));
      error.code = code;
      error.cause = response.error;
      throw error;
    }
    return response.data;
  }

  async getSnapshot() {
    return this.call('xo_get_snapshot', this.requireSession());
  }

  async mutate(command, payload) {
    const key = `${command}:${JSON.stringify(payload)}`;
    const requestId = this.pendingRequestIds.get(key) || this.createUuid();
    this.pendingRequestIds.set(key, requestId);
    const data = await this.call(`xo_${command}`, {
      ...this.requireSession(),
      p_request_id: requestId,
      ...payload
    });
    this.pendingRequestIds.delete(key);
    return data;
  }

  createTournament() {
    return this.mutate('create_tournament', {});
  }

  cancelTournament(tournamentId, reason) {
    return this.mutate('cancel_tournament', { p_tournament_id: tournamentId, p_reason: reason });
  }

  setReleaseMode(mode) {
    return this.mutate('set_release_mode', { p_release_mode: mode });
  }

  setTesters(memberIds) {
    return this.mutate('set_testers', { p_tester_ids: memberIds });
  }

  simulateTestTournament() {
    return this.mutate('simulate_test_tournament', {});
  }

  makeMove(gameId, row, col) {
    return this.mutate('make_move', { p_game_id: gameId, p_row: row, p_col: col });
  }

  placePoolBet(matchId, pickMemberId, stake) {
    return this.mutate('place_pool_bet', {
      p_match_id: matchId,
      p_pick_member_id: pickMemberId,
      p_stake: stake
    });
  }

  proposeSideBet(matchId, stake) {
    return this.mutate('propose_side_bet', { p_match_id: matchId, p_stake: stake });
  }

  respondSideBet(betId, action) {
    return this.mutate('respond_side_bet', { p_bet_id: betId, p_action: action });
  }

  subscribe(onPublicChange, onStatus) {
    if (this.realtimeChannel) return this.realtimeChannel;
    let channel = this.client.channel('xo-arena');
    for (const table of PUBLIC_TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        payload => onPublicChange?.({
          table,
          eventType: payload.eventType,
          row: payload.new || payload.old
        })
      );
    }
    this.realtimeChannel = channel.subscribe(status => onStatus?.(status));
    return this.realtimeChannel;
  }

  async unsubscribe() {
    if (!this.realtimeChannel) return;
    const channel = this.realtimeChannel;
    this.realtimeChannel = null;
    await this.client.removeChannel(channel);
  }
}
