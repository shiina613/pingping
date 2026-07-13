import test from 'node:test';
import assert from 'node:assert/strict';

const integrationTest = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? test : test.skip;

async function rpc(name, args) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || `RPC ${name} failed`);
  return body;
}

integrationTest('concurrent pool bets cannot overdraw one wallet', async () => {
  let snapshot = await rpc('xo_get_snapshot', { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026' });
  if (!snapshot.tournament?.id || snapshot.tournament.status !== 'active') {
    await rpc('xo_create_tournament', {
      p_member_id: 'tung',
      p_login_code: 'PP-TUNG-2026',
      p_request_id: crypto.randomUUID()
    });
    snapshot = await rpc('xo_get_snapshot', { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026' });
  }
  assert.equal(snapshot.visible, true);
  const matches = snapshot.matches.filter(row => ![row.player_x_id, row.player_o_id].includes('tung') && row.status === 'pending').slice(0, 2);
  assert.equal(matches.length, 2, 'two pending spectator matches are required');
  const results = await Promise.allSettled([
    rpc('xo_place_pool_bet', { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026', p_request_id: crypto.randomUUID(), p_match_id: matches[0].id, p_pick_member_id: matches[0].player_x_id, p_stake: 30 }),
    rpc('xo_place_pool_bet', { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026', p_request_id: crypto.randomUUID(), p_match_id: matches[1].id, p_pick_member_id: matches[1].player_x_id, p_stake: 30 })
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /INSUFFICIENT_BALANCE/);
  const after = await rpc('xo_get_snapshot', { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026' });
  assert.equal(after.wallet.balance, 6);
  await rpc('xo_cancel_tournament', {
    p_member_id: 'tung',
    p_login_code: 'PP-TUNG-2026',
    p_request_id: crypto.randomUUID(),
    p_tournament_id: snapshot.tournament.id,
    p_reason: 'concurrency cleanup'
  });
  const refunded = await rpc('xo_get_snapshot', { p_member_id: 'tung', p_login_code: 'PP-TUNG-2026' });
  assert.equal(refunded.wallet.balance, 36);
});
