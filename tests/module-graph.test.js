import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('browser entry constants resolve their collaboration dependencies', async () => {
  const constants = await import('../src/constants.js');

  assert.equal(constants.DEFAULT_MEMBERS.length, 7);
});

test('browser entry imports every module binding it uses', () => {
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

  assert.match(source, /import \{ CollaborationController \} from '\.\/collaboration-controller\.js';/);
  assert.match(source, /import \{ buildCalendar, getTeamSizeWarning \} from '\.\/collaboration\.js';/);
});

test('release test scripts pin Supabase CLI and Playwright', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(pkg.devDependencies.supabase, '2.109.1');
  assert.equal(pkg.devDependencies['@playwright/test'], '1.61.1');
  assert.equal(pkg.scripts['test:db'], 'supabase test db --local supabase/tests');
  assert.equal(pkg.scripts['test:e2e'], 'bash tests/run-e2e.sh');
  assert.equal(pkg.scripts['test:concurrency'], 'bash tests/run-xo-concurrency.sh');
  assert.match(pkg.scripts['test:release'], /test:db/);
  assert.match(pkg.scripts['test:release'], /test:concurrency/);
  assert.match(pkg.scripts['test:release'], /test:e2e/);
});
