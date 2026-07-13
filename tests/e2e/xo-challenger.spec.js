import { test, expect } from '@playwright/test';

const codes = {
  tung: 'PP-TUNG-2026', tunganh: 'PP-TUNGANH-2026', hau: 'PP-HAU-2026',
  tuantran: 'PP-TUANTRAN-2026', hung: 'PP-HUNG-2026', duyanh: 'PP-DUYANH-2026', thach: 'PP-THACH-2026'
};

async function configure(context) {
  await context.addInitScript(({ supabaseUrl, supabaseKey }) => {
    window.__PINGPING_TEST_CONFIG__ = { supabaseUrl, supabaseKey };
  }, { supabaseUrl: process.env.SUPABASE_URL, supabaseKey: process.env.SUPABASE_ANON_KEY });
}

async function login(page, memberId) {
  await page.goto('/');
  await page.locator('#account-button').click();
  await page.locator('#login-code').fill(codes[memberId]);
  await page.locator('#login-submit').click();
  await expect(page.locator('[data-tab="xo"]')).toBeVisible();
  await page.locator('[data-tab="xo"]').click();
  await expect(page.getByTestId('xo-schedule')).toBeVisible();
}

async function rpc(request, name, args) {
  const response = await request.post(`${process.env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
    },
    data: args
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function snapshot(request, memberId) {
  return rpc(request, 'xo_get_snapshot', { p_member_id: memberId, p_login_code: codes[memberId] });
}

async function selectMatch(page, matchId) {
  await page.locator(`[data-xo-match-id="${matchId}"]`).click();
}

async function clickMove(page, row, col) {
  const cell = page.getByTestId(`xo-cell-${row}-${col}`);
  await expect(cell).toBeEnabled();
  await cell.click();
}

test('three sessions play and settle one realtime X-O series', async ({ browser, request }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile');
  const hostContext = await browser.newContext();
  await configure(hostContext);
  const host = await hostContext.newPage();
  await login(host, 'tung');

  for (const checkbox of await host.locator('#xo-testers-form input[name="testers"]:not(:disabled)').all()) await checkbox.check();
  await host.locator('#xo-testers-form button[type="submit"]').click();
  await expect.poll(async () => (await snapshot(request, 'tunganh')).visible).toBe(true);
  await host.locator('[data-xo-action="create"]').click();
  await expect(host.getByTestId('xo-schedule').locator('[data-xo-match-id]')).toHaveCount(15);

  const hostSnapshot = await snapshot(request, 'tung');
  const match = hostSnapshot.matches.find(row => row.status === 'pending');
  const spectatorId = Object.keys(codes).find(id => id !== 'tung' && ![match.player_x_id, match.player_o_id].includes(id));

  const xContext = await browser.newContext();
  const oContext = await browser.newContext();
  const spectatorContext = await browser.newContext();
  await Promise.all([configure(xContext), configure(oContext), configure(spectatorContext)]);
  const xPage = await xContext.newPage();
  const oPage = await oContext.newPage();
  const spectatorPage = await spectatorContext.newPage();
  await Promise.all([login(xPage, match.player_x_id), login(oPage, match.player_o_id), login(spectatorPage, spectatorId)]);
  await Promise.all([selectMatch(xPage, match.id), selectMatch(oPage, match.id), selectMatch(spectatorPage, match.id)]);

  await spectatorPage.locator('#xo-pool-form select[name="pick"]').selectOption(match.player_x_id);
  await spectatorPage.locator('#xo-pool-form input[name="stake"]').fill('2');
  await spectatorPage.locator('#xo-pool-form button[type="submit"]').click();
  await xPage.locator('#xo-side-bet-form input[name="stake"]').fill('3');
  await xPage.locator('#xo-side-bet-form button[type="submit"]').click();
  await expect(oPage.locator('#xo-bet-status [data-bet-id]')).toContainText('proposed');
  await oPage.locator('#xo-bet-status [data-xo-action="accept"]').click();

  let checkedFirstMoveLock = false;
  for (let gameWins = 0; gameWins < 2; gameWins += 1) {
    let xCol = 0;
    let oMove = 0;
    const safeOMoves = [[8, 0], [8, 2], [8, 4], [7, 1], [7, 3]];
    while (true) {
      const state = await snapshot(request, match.player_x_id);
      const currentMatch = state.matches.find(row => row.id === match.id);
      if (currentMatch.player_x_wins > gameWins) break;
      const game = state.games.find(row => row.match_id === match.id && row.status === 'active');
      if (game.next_member_id === match.player_x_id) {
        await clickMove(xPage, 4, xCol++);
      } else {
        await clickMove(oPage, ...safeOMoves[oMove++]);
      }
      await expect.poll(async () => (await snapshot(request, match.player_x_id)).moves.length).toBeGreaterThan(0);
      if (!checkedFirstMoveLock) {
        await expect.poll(async () => (await snapshot(request, spectatorId)).matches.find(row => row.id === match.id).betting_locked_at).not.toBeNull();
        await expect(spectatorPage.locator('#xo-pool-form')).toBeHidden();
        checkedFirstMoveLock = true;
      }
    }
  }

  await expect(xPage.getByTestId('xo-match-score')).toContainText('2–0');
  await expect(oPage.getByTestId('xo-match-score')).toContainText('2–0');
  await expect(spectatorPage.getByTestId('xo-match-score')).toContainText('2–0');
  await expect(spectatorPage.locator('#xo-pool-form')).toBeHidden();
  const settled = await snapshot(request, spectatorId);
  expect(settled.matches.find(row => row.id === match.id).settlement_status).toBe('settled');
  expect(settled.wallet.recentLedger.filter(row => row.match_id === match.id && row.reason.includes('pool')).length).toBe(2);
  expect(settled.wallet.balance).toBe(36);
  expect(settled.participants.find(row => row.member_id === match.player_x_id).match_wins).toBe(1);
  await expect(host.locator('#xo-standings li')).toHaveCount(6);

  await spectatorContext.setOffline(true);
  await spectatorContext.setOffline(false);
  await spectatorPage.reload();
  await expect(spectatorPage.locator('[data-tab="xo"]')).toBeVisible();
  await spectatorPage.locator('[data-tab="xo"]').click();
  await selectMatch(spectatorPage, match.id);
  await expect(spectatorPage.getByTestId('xo-match-score')).toContainText('2–0');

  await Promise.all([hostContext.close(), xContext.close(), oContext.close(), spectatorContext.close()]);
});

test('mobile arena stacks cards and keeps board horizontally scrollable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await configure(page.context());
  await login(page, 'tung');
  const scroll = page.getByTestId('xo-board-scroll');
  await expect(scroll).toBeVisible();
  expect(await scroll.evaluate(element => getComputedStyle(element).overflowX)).toMatch(/auto|scroll/);
  const layout = page.locator('.xo-layout');
  expect(await layout.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);
});
