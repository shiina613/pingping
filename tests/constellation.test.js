import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MEMBERS } from '../src/constants.js';
import { CONSTELLATION_NODES, CONSTELLATION_LINES, getConstellationMembers } from '../src/constellation-data.js';

test('constellation data maps all 7 members to Ursa Minor stars', () => {
  assert.equal(CONSTELLATION_NODES.length, 7);
  
  const polaris = CONSTELLATION_NODES.find(n => n.isPolaris);
  assert.ok(polaris, 'Polaris star node must exist');
  assert.equal(polaris.id, 'tung');
  assert.equal(polaris.starName, 'Polaris (Sao Bắc Cực)');

  const members = getConstellationMembers(DEFAULT_MEMBERS);
  assert.equal(members.length, 7);
  assert.equal(members[0].isPolaris, true);
  assert.equal(members[0].name, 'Tùng');
});

test('constellation lines connect all 7 stars in Ursa Minor topology', () => {
  assert.equal(CONSTELLATION_LINES.length, 7);
  CONSTELLATION_LINES.forEach(([fromId, toId]) => {
    assert.ok(CONSTELLATION_NODES.some(n => n.id === fromId), `From node ${fromId} should exist`);
    assert.ok(CONSTELLATION_NODES.some(n => n.id === toId), `To node ${toId} should exist`);
  });
});
