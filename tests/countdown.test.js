import test from 'node:test';
import assert from 'node:assert/strict';

import { getCompetitionCountdowns, getCountdownParts } from '../src/countdown.js';

test('each competition selects its earliest valid future event in input order', () => {
  const competitions = [
    {
      id: 'alpha',
      name: 'Alpha',
      timeline: [
        { label: 'Later', date: '2026-07-08T10:00:00Z' },
        { label: 'Past', date: '2026-07-04T10:00:00Z' },
        { label: 'Sooner', date: '2026-07-06T10:00:00Z' }
      ]
    },
    {
      id: 'beta',
      name: 'Beta',
      timeline: [
        { label: 'Invalid', date: 'not-a-date' },
        { label: 'Next', date: '2026-07-07T10:00:00Z' }
      ]
    }
  ];

  const rows = getCompetitionCountdowns(competitions, new Date('2026-07-05T10:00:00Z'));

  assert.deepEqual(rows.map(row => row.comp.id), ['alpha', 'beta']);
  assert.equal(rows[0].event.label, 'Sooner');
  assert.equal(rows[1].event.label, 'Next');
});

test('a competition with no future event remains as a completed row', () => {
  const competitions = [{
    id: 'done',
    name: 'Done',
    timeline: [{ label: 'Past', date: '2026-07-01T10:00:00Z' }]
  }];

  const [row] = getCompetitionCountdowns(competitions, new Date('2026-07-05T10:00:00Z'));

  assert.equal(row.comp.id, 'done');
  assert.equal(row.event, null);
});

test('competition countdowns put nearest events first and completed rows last', () => {
  const competitions = [
    { id: 'later', timeline: [{ label: 'Later', date: '2026-07-08T10:00:00Z' }] },
    { id: 'done', timeline: [{ label: 'Past', date: '2026-07-01T10:00:00Z' }] },
    { id: 'nearest', timeline: [{ label: 'Nearest', date: '2026-07-06T10:00:00Z' }] },
    { id: 'tie', timeline: [{ label: 'Same time', date: '2026-07-08T10:00:00Z' }] }
  ];

  const rows = getCompetitionCountdowns(competitions, new Date('2026-07-05T10:00:00Z'));

  assert.deepEqual(rows.map(row => row.comp.id), ['nearest', 'later', 'tie', 'done']);
});

test('countdown parts clamp elapsed targets and pad active values', () => {
  const now = new Date('2026-07-05T10:00:00Z');
  const active = getCountdownParts(new Date('2026-07-07T13:04:05Z'), now);
  const elapsed = getCountdownParts(new Date('2026-07-04T10:00:00Z'), now);

  assert.deepEqual(active, { days: '02', hours: '03', minutes: '04', seconds: '05' });
  assert.deepEqual(elapsed, { days: '00', hours: '00', minutes: '00', seconds: '00' });
});
