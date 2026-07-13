import test from 'node:test';
import assert from 'node:assert/strict';
import { XoApi } from '../src/xo-api.js';

function createFakeClient(responses = []) {
  const calls = [];
  const listeners = [];
  const statuses = [];
  const channel = {
    on(type, filter, callback) {
      listeners.push({ type, filter, callback });
      return channel;
    },
    subscribe(callback) {
      statuses.push(callback);
      callback?.('SUBSCRIBED');
      return channel;
    }
  };
  return {
    calls,
    listeners,
    statuses,
    removed: [],
    async rpc(name, args) {
      calls.push({ name, args });
      return responses.shift() || { data: {} };
    },
    channel(name) {
      assert.equal(name, 'xo-arena');
      return channel;
    },
    async removeChannel(value) {
      this.removed.push(value);
    }
  };
}

function setSession(api) {
  api.setSession({ member: { id: 'tung' }, code: 'PP-TUNG-2026' });
}

test('makeMove reuses one request ID after an unknown result', async () => {
  const client = createFakeClient([{ error: new Error('network') }, { data: { status: 'moved' } }]);
  const api = new XoApi(client, () => '00000000-0000-4000-8000-000000000201');
  setSession(api);
  await assert.rejects(api.makeMove('game-1', 0, 0));
  await api.makeMove('game-1', 0, 0);
  assert.equal(client.calls[0].args.p_request_id, client.calls[1].args.p_request_id);
});

test('confirmed commands receive a fresh request ID', async () => {
  let counter = 0;
  const client = createFakeClient([{ data: {} }, { data: {} }]);
  const api = new XoApi(client, () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`);
  setSession(api);
  await api.makeMove('game-1', 0, 0);
  await api.makeMove('game-1', 0, 1);
  assert.notEqual(client.calls[0].args.p_request_id, client.calls[1].args.p_request_id);
});

test('snapshot requires a session and sends member credentials', async () => {
  const client = createFakeClient([{ data: { visible: true } }]);
  const api = new XoApi(client);
  await assert.rejects(api.getSnapshot(), /Phiên đăng nhập/);
  setSession(api);
  assert.deepEqual(await api.getSnapshot(), { visible: true });
  assert.deepEqual(client.calls[0], {
    name: 'xo_get_snapshot',
    args: { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026' }
  });
});

test('simulate test tournament sends host credentials and a request ID', async () => {
  const client = createFakeClient([{ data: { status: 'completed' } }]);
  const api = new XoApi(client, () => '00000000-0000-4000-8000-000000000301');
  setSession(api);
  assert.deepEqual(await api.simulateTestTournament(), { status: 'completed' });
  assert.deepEqual(client.calls[0], {
    name: 'xo_simulate_test_tournament',
    args: {
      p_member_id: 'tung',
      p_login_code: 'PP-TUNG-2026',
      p_request_id: '00000000-0000-4000-8000-000000000301'
    }
  });
});

test('RPC errors map stable codes to Vietnamese copy', async () => {
  const api = new XoApi(createFakeClient([{ error: { message: 'NOT_YOUR_TURN' } }]));
  setSession(api);
  await assert.rejects(api.makeMove('game-1', 0, 0), /Chưa đến lượt của bạn/);
});

test('subscribe listens to all public arena tables and unsubscribe removes channel', async () => {
  const client = createFakeClient();
  const api = new XoApi(client);
  const statuses = [];
  api.subscribe(() => {}, status => statuses.push(status));
  assert.deepEqual(client.listeners.map(row => row.filter.table), [
    'xo_tournaments', 'xo_tournament_players', 'xo_matches', 'xo_games',
    'xo_moves', 'xo_ratings', 'xo_pool_totals'
  ]);
  assert.deepEqual(statuses, ['SUBSCRIBED']);
  await api.unsubscribe();
  assert.equal(client.removed.length, 1);
});
