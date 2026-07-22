import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('browser entry constants resolve their collaboration dependencies', async () => {
  const constants = await import('../src/constants.js');

  assert.equal(constants.DEFAULT_MEMBERS.length, 7);
});

test('browser entry imports every module binding it uses', () => {
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

  assert.match(source, /import \{ CollaborationController, escapeHtml \} from '\.\/collaboration-controller\.js';/);
  assert.match(source, /import \{ buildCalendar, getTeamSizeWarning \} from '\.\/collaboration\.js';/);
});
