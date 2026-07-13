import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlayCell, getArenaRole, selectArenaMatch, shouldShowTestSimulation } from '../src/xo-arena.js';

test('arena role distinguishes player, spectator, and host', () => {
  assert.equal(getArenaRole({ memberId: 'tung', hostId: 'tung', match: { player_x_id: 'hau', player_o_id: 'hung' } }), 'host');
  assert.equal(getArenaRole({ memberId: 'hau', hostId: 'tung', match: { player_x_id: 'hau', player_o_id: 'hung' } }), 'player');
  assert.equal(getArenaRole({ memberId: 'thach', hostId: 'tung', match: { player_x_id: 'hau', player_o_id: 'hung' } }), 'spectator');
  assert.equal(getArenaRole({ memberId: 'tung', hostId: null, match: null }), 'host');
});

test('board input requires online own turn with no pending command', () => {
  assert.equal(canPlayCell({ online: true, pending: false, memberId: 'hau', nextMemberId: 'hau', occupied: false, gameStatus: 'active' }), true);
  assert.equal(canPlayCell({ online: false, pending: false, memberId: 'hau', nextMemberId: 'hau', occupied: false, gameStatus: 'active' }), false);
  assert.equal(canPlayCell({ online: true, pending: true, memberId: 'hau', nextMemberId: 'hau', occupied: false, gameStatus: 'active' }), false);
  assert.equal(canPlayCell({ online: true, pending: false, memberId: 'hau', nextMemberId: 'hau', occupied: true, gameStatus: 'active' }), false);
});

test('arena selects the signed-in member active match before schedule fallback', () => {
  const matches = [
    { id: 'spectator', player_x_id: 'hung', player_o_id: 'thach', status: 'pending' },
    { id: 'mine', player_x_id: 'hau', player_o_id: 'duyanh', status: 'active' }
  ];
  assert.equal(selectArenaMatch(matches, 'hau')?.id, 'mine');
  assert.equal(selectArenaMatch(matches, 'tung')?.id, 'spectator');
});

test('test simulation control is host-only and test-only', () => {
  assert.equal(shouldShowTestSimulation({ role: 'host', releaseMode: 'test' }), true);
  assert.equal(shouldShowTestSimulation({ role: 'host', releaseMode: 'live' }), false);
  assert.equal(shouldShowTestSimulation({ role: 'player', releaseMode: 'test' }), false);
});
