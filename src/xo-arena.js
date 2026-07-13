function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function getArenaRole({ memberId, hostId, match }) {
  if (memberId === 'tung' || (memberId && memberId === hostId)) return 'host';
  if (memberId && [match?.player_x_id, match?.player_o_id].includes(memberId)) return 'player';
  return 'spectator';
}

export function canPlayCell({ online, pending, memberId, nextMemberId, occupied, gameStatus }) {
  return Boolean(online && !pending && memberId && memberId === nextMemberId && !occupied && gameStatus === 'active');
}

export function selectArenaMatch(matches = [], memberId, selectedId) {
  const selected = matches.find(match => match.id === selectedId);
  if (selected) return selected;
  return matches.find(match =>
    ['pending', 'active'].includes(match.status)
    && [match.player_x_id, match.player_o_id].includes(memberId)
  ) || matches.find(match => ['pending', 'active'].includes(match.status)) || matches[0] || null;
}

export class XoArena {
  constructor(api, { members = [], toast } = {}) {
    this.api = api;
    this.members = members;
    this.toast = toast || (() => {});
    this.session = null;
    this.snapshot = null;
    this.selectedMatchId = null;
    this.online = false;
    this.pending = false;
    this.refreshTimer = null;
    this.bound = false;
    this.root = typeof document === 'undefined' ? null : document.getElementById('tab-xo');
    this.nav = typeof document === 'undefined' ? null : document.querySelector('[data-tab="xo"]');
  }

  setSession(session) {
    this.session = session || null;
    this.api.setSession(this.session);
    if (!session) {
      this.snapshot = null;
      if (this.nav) this.nav.hidden = true;
      this.render();
      return;
    }
    this.refresh().catch(error => this.toast(error.message, 'error'));
  }

  memberName(id) {
    return this.members.find(member => member.id === id)?.name || id || 'Chưa xác định';
  }

  async refresh() {
    if (!this.session) return;
    const snapshot = await this.api.getSnapshot();
    this.snapshot = snapshot;
    if (this.nav) this.nav.hidden = !snapshot.visible;
    if (!snapshot.visible && location.hash === '#xo') location.hash = '#dashboard';
    this.render();
  }

  connect() {
    if (!this.bound) this.bindEvents();
    this.api.subscribe(
      () => {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => this.refresh().catch(() => {}), 80);
      },
      status => {
        this.online = status === 'SUBSCRIBED';
        this.renderConnectivity();
        if (this.online) this.refresh().catch(() => {});
      }
    );
  }

  async destroy() {
    clearTimeout(this.refreshTimer);
    await this.api.unsubscribe();
    this.online = false;
  }

  bindEvents() {
    if (!this.root) return;
    this.bound = true;
    this.root.addEventListener('click', event => this.handleClick(event));
    this.root.addEventListener('submit', event => this.handleSubmit(event));
  }

  async run(command) {
    if (this.pending) return;
    this.pending = true;
    this.render();
    try {
      await command();
      await this.refresh();
    } catch (error) {
      this.toast(error.message || 'Không thể thực hiện thao tác X-O.', 'error');
      await this.refresh().catch(() => {});
    } finally {
      this.pending = false;
      this.render();
    }
  }

  handleClick(event) {
    const schedule = event.target.closest('[data-xo-match-id]');
    if (schedule) {
      this.selectedMatchId = schedule.dataset.xoMatchId;
      this.render();
      return;
    }
    const cell = event.target.closest('[data-xo-row]');
    if (cell && !cell.disabled) {
      const game = this.activeGame();
      this.run(() => this.api.makeMove(game.id, Number(cell.dataset.xoRow), Number(cell.dataset.xoCol)));
      return;
    }
    const action = event.target.closest('[data-xo-action]')?.dataset.xoAction;
    if (!action) return;
    const tournament = this.snapshot?.tournament;
    if (action === 'create') this.run(() => this.api.createTournament());
    if (action === 'cancel' && tournament?.id) {
      const reason = prompt('Lý do hủy giải:')?.trim();
      if (reason) this.run(() => this.api.cancelTournament(tournament.id, reason));
    }
    if (action === 'live' && confirm('Mở X-O Challenger cho toàn bộ thành viên?')) {
      this.run(() => this.api.setReleaseMode('live'));
    }
    if (['accept', 'reject', 'cancel-side'].includes(action)) {
      const betId = event.target.closest('[data-bet-id]')?.dataset.betId;
      const response = action === 'cancel-side' ? 'cancel' : action;
      if (betId) this.run(() => this.api.respondSideBet(betId, response));
    }
  }

  handleSubmit(event) {
    const form = event.target;
    if (!form.id?.startsWith('xo-')) return;
    event.preventDefault();
    const data = new FormData(form);
    const match = this.activeMatch();
    if (form.id === 'xo-pool-form' && match) {
      this.run(() => this.api.placePoolBet(match.id, data.get('pick'), Number(data.get('stake'))));
    }
    if (form.id === 'xo-side-bet-form' && match) {
      this.run(() => this.api.proposeSideBet(match.id, Number(data.get('stake'))));
    }
    if (form.id === 'xo-testers-form') {
      this.run(() => this.api.setTesters(data.getAll('testers')));
    }
  }

  activeMatch() {
    return selectArenaMatch(this.snapshot?.matches, this.session?.member?.id, this.selectedMatchId);
  }

  activeGame() {
    const match = this.activeMatch();
    return this.snapshot?.games?.find(game => game.match_id === match?.id && game.status === 'active')
      || this.snapshot?.games?.filter(game => game.match_id === match?.id).at(-1)
      || null;
  }

  renderConnectivity() {
    const element = typeof document === 'undefined' ? null : document.getElementById('xo-connectivity');
    if (!element) return;
    element.textContent = this.online ? 'Trực tuyến' : 'Mất kết nối';
    element.className = `xo-connectivity ${this.online ? 'online' : 'offline'}`;
  }

  render() {
    if (!this.root) return;
    this.renderConnectivity();
    if (!this.session) {
      this.root.querySelector('.xo-arena-shell').hidden = true;
      this.root.querySelector('.xo-empty-state').hidden = false;
      return;
    }
    const shell = this.root.querySelector('.xo-arena-shell');
    const empty = this.root.querySelector('.xo-empty-state');
    if (!this.snapshot?.visible) {
      shell.hidden = true;
      empty.hidden = false;
      empty.textContent = 'X-O Challenger chưa mở cho tài khoản này.';
      return;
    }
    shell.hidden = false;
    empty.hidden = true;
    const tournament = this.snapshot.tournament || {};
    const match = this.activeMatch();
    const game = this.activeGame();
    const memberId = this.session.member.id;
    const isPlayer = [match?.player_x_id, match?.player_o_id].includes(memberId);
    const role = getArenaRole({ memberId, hostId: tournament.host_id, match });
    this.root.classList.toggle('xo-pending', this.pending);
    this.root.classList.toggle('xo-offline', !this.online);

    this.root.querySelector('#xo-tournament-status').innerHTML = `
      <strong>${escapeHtml(tournament.name || 'X-O Challenger')}</strong>
      <span>${escapeHtml(this.snapshot.releaseMode || 'test').toUpperCase()} · ${escapeHtml(tournament.stage || 'Chưa tạo giải')} · Vòng ${escapeHtml(tournament.current_round || '—')}</span>`;
    this.renderSchedule(match);
    this.renderMatch(match, game, memberId);
    this.renderBoard(match, game, memberId);
    this.renderWallet();
    this.renderBetting(match, role, isPlayer);
    this.renderHost(role);
    this.renderTables(tournament);
  }

  renderSchedule(active) {
    const element = this.root.querySelector('#xo-schedule');
    element.innerHTML = (this.snapshot.matches || []).map(match => `
      <button type="button" class="xo-schedule-item ${match.id === active?.id ? 'active' : ''}" data-xo-match-id="${match.id}">
        <span>V${match.round_number} · ${escapeHtml(match.stage)}</span>
        <strong>${escapeHtml(this.memberName(match.player_x_id))} ${match.player_x_wins}–${match.player_o_wins} ${escapeHtml(this.memberName(match.player_o_id))}</strong>
        <small>${escapeHtml(match.status)}</small>
      </button>`).join('') || '<p>Chưa có lịch thi đấu.</p>';
  }

  renderMatch(match, game, memberId) {
    const score = this.root.querySelector('#xo-match-score');
    if (!match) {
      score.innerHTML = '<p>Chưa có trận đấu được chọn.</p>';
      return;
    }
    const turn = game?.next_member_id ? `Lượt: ${this.memberName(game.next_member_id)}` : 'Ván đã kết thúc';
    score.innerHTML = `
      <div><small>${escapeHtml(match.stage)} · BO${match.target_wins * 2 - 1}</small><h2>${escapeHtml(this.memberName(match.player_x_id))} <b>${match.player_x_wins}–${match.player_o_wins}</b> ${escapeHtml(this.memberName(match.player_o_id))}</h2></div>
      <span class="xo-turn ${game?.next_member_id === memberId ? 'mine' : ''}">${escapeHtml(turn)}</span>`;
  }

  renderBoard(match, game, memberId) {
    const board = this.root.querySelector('#xo-board');
    if (!game) {
      board.innerHTML = '<p class="xo-board-empty">Không có ván đang hoạt động.</p>';
      return;
    }
    const moves = (this.snapshot.moves || []).filter(move => move.game_id === game.id);
    const byCell = new Map(moves.map(move => [`${move.row}:${move.col}`, move]));
    const cols = game.max_col - game.min_col + 1;
    const cells = [];
    for (let row = game.min_row; row <= game.max_row; row += 1) {
      for (let col = game.min_col; col <= game.max_col; col += 1) {
        const move = byCell.get(`${row}:${col}`);
        const enabled = canPlayCell({
          online: this.online,
          pending: this.pending,
          memberId,
          nextMemberId: game.next_member_id,
          occupied: Boolean(move),
          gameStatus: game.status
        });
        cells.push(`<button type="button" class="xo-cell ${move?.mark || ''}" data-testid="xo-cell-${row}-${col}" data-xo-row="${row}" data-xo-col="${col}" ${enabled ? '' : 'disabled'} aria-label="Hàng ${row}, cột ${col}${move ? `: ${move.mark.toUpperCase()}` : ''}">${move?.mark?.toUpperCase() || ''}</button>`);
      }
    }
    board.style.setProperty('--xo-cols', cols);
    board.innerHTML = cells.join('');
  }

  renderWallet() {
    const wallet = this.snapshot.wallet || {};
    this.root.querySelector('#xo-wallet').innerHTML = `
      <span>Ví ${escapeHtml(wallet.scope || 'test')}</span>
      <strong>${Number(wallet.balance || 0)} điểm</strong>
      <small>${wallet.recentLedger?.length || 0} giao dịch gần đây</small>`;
  }

  renderBetting(match, role, isPlayer) {
    const locked = !match || match.betting_locked_at || match.status !== 'pending';
    const myPool = this.snapshot.myBets?.pool?.find(bet => bet.match_id === match?.id);
    const mySide = this.snapshot.myBets?.side?.find(bet => bet.match_id === match?.id);
    const pool = this.root.querySelector('#xo-pool-form');
    const side = this.root.querySelector('#xo-side-bet-form');
    pool.hidden = role !== 'spectator' || Boolean(myPool) || locked;
    pool.innerHTML = match ? `
      <label>Chọn người thắng<select name="pick"><option value="${match.player_x_id}">${escapeHtml(this.memberName(match.player_x_id))}</option><option value="${match.player_o_id}">${escapeHtml(this.memberName(match.player_o_id))}</option></select></label>
      <label>Mức cược<input name="stake" type="number" min="1" required value="1"></label>
      <button type="submit" ${this.pending || !this.online ? 'disabled' : ''}>Đặt pool</button>` : '';
    side.hidden = !isPlayer || Boolean(mySide) || locked;
    side.innerHTML = match ? `<label>Cược trực tiếp<input name="stake" type="number" min="1" required value="1"></label><button type="submit" ${this.pending || !this.online ? 'disabled' : ''}>Đề xuất</button>` : '';
    const status = this.root.querySelector('#xo-bet-status');
    const totals = (this.snapshot.poolTotals || []).filter(total => total.match_id === match?.id);
    status.innerHTML = `${totals.map(total => `<span>${escapeHtml(this.memberName(total.pick_member_id))}: <b>${total.total_stake}</b></span>`).join('')}
      ${myPool ? `<span>Pool của bạn: ${myPool.stake} · ${escapeHtml(myPool.status)}</span>` : ''}
      ${mySide ? `<span data-bet-id="${mySide.id}">Cược trực tiếp: ${mySide.stake} · ${escapeHtml(mySide.status)} ${mySide.status === 'proposed' ? `<button type="button" data-xo-action="${mySide.opponent_id === this.session.member.id ? 'accept' : 'cancel-side'}">${mySide.opponent_id === this.session.member.id ? 'Chấp nhận' : 'Hủy'}</button>` : ''}</span>` : ''}`;
  }

  renderHost(role) {
    const host = this.root.querySelector('#xo-host-controls');
    host.hidden = role !== 'host';
    if (role !== 'host') return;
    const active = this.snapshot.tournament?.status === 'active';
    host.innerHTML = `
      <h3>Điều hành</h3>
      <div class="xo-host-actions"><button type="button" data-xo-action="create" ${active ? 'disabled' : ''}>Tạo giải</button><button type="button" data-xo-action="cancel" ${active ? '' : 'disabled'}>Hủy giải</button><button type="button" data-xo-action="live">Mở live</button></div>
      <form id="xo-testers-form"><fieldset><legend>Tester</legend>${this.members.map(member => `<label><input type="checkbox" name="testers" value="${member.id}" ${member.id === 'tung' ? 'checked disabled' : ''}>${escapeHtml(member.name)}</label>`).join('')}</fieldset><button type="submit">Lưu tester</button></form>`;
  }

  renderTables(tournament) {
    const participants = [...(this.snapshot.participants || [])];
    this.root.querySelector('#xo-standings').innerHTML = participants
      .filter(row => row.group_eligible)
      .sort((a, b) => b.match_wins - a.match_wins || b.game_wins - a.game_wins || a.member_id.localeCompare(b.member_id))
      .map((row, index) => `<li><b>${index + 1}</b><span>${escapeHtml(this.memberName(row.member_id))}</span><strong>${row.match_wins}T · ${row.game_wins}V</strong></li>`).join('') || '<li>Chưa có BXH.</li>';
    this.root.querySelector('#xo-bracket').innerHTML = (this.snapshot.matches || []).filter(match => match.stage !== 'group').map(match => `
      <div><small>${escapeHtml(match.stage)}</small><span>${escapeHtml(this.memberName(match.player_x_id))} ${match.player_x_wins}–${match.player_o_wins} ${escapeHtml(this.memberName(match.player_o_id))}</span></div>`).join('') || `<p>Lucky: ${escapeHtml(this.memberName(tournament.lucky_member_id))}</p>`;
    this.root.querySelector('#xo-leaderboard').innerHTML = (this.snapshot.ratings || []).map((row, index) => `<li><b>${index + 1}</b><span>${escapeHtml(this.memberName(row.member_id))}</span><strong>${row.rating}</strong></li>`).join('');
  }
}
