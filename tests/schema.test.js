import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20260629064053_collaboration.sql', import.meta.url), 'utf8');
const notificationSql = readFileSync(new URL('../supabase/migrations/20260629192231_relevant_notifications.sql', import.meta.url), 'utf8');
const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const moderationMigration = readdirSync(migrationsDir).find(name => name.endsWith('_chat_moderation_retention.sql'));
const moderationSql = moderationMigration ? readFileSync(new URL(moderationMigration, migrationsDir), 'utf8') : '';
const retentionCronMigration = readdirSync(migrationsDir).find(name => name.endsWith('_refactor_chat_retention_cron.sql'));
const retentionCronSql = retentionCronMigration ? readFileSync(new URL(retentionCronMigration, migrationsDir), 'utf8') : '';
const xoMigration = readdirSync(migrationsDir).find(name => name.endsWith('_xo_arena.sql'));
const xoSql = xoMigration ? readFileSync(new URL(xoMigration, migrationsDir), 'utf8') : '';
const allMigrationSql = readdirSync(migrationsDir).map(name => readFileSync(new URL(name, migrationsDir), 'utf8')).join('\n');
const dailyCheckinMigration = readdirSync(migrationsDir).find(name => name.endsWith('_citizen_daily_checkin.sql'));
const dailyCheckinSql = dailyCheckinMigration ? readFileSync(new URL(dailyCheckinMigration, migrationsDir), 'utf8') : '';
const checkinPenaltyMigration = readdirSync(migrationsDir).find(name => name.endsWith('_checkin_repeat_penalty.sql'));
const checkinPenaltySql = checkinPenaltyMigration ? readFileSync(new URL(checkinPenaltyMigration, migrationsDir), 'utf8') : '';
const xoResetMigration = readdirSync(migrationsDir).find(name => name.endsWith('_reset_xo_casino_data.sql'));
const xoResetSql = xoResetMigration ? readFileSync(new URL(xoResetMigration, migrationsDir), 'utf8') : '';

for (const table of ['members', 'allocations', 'tasks', 'messages', 'attachments']) {
  test(`schema creates ${table}`, () => {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}`, 'i'));
  });
}

test('schema seeds all seven raw member codes', () => {
  for (const code of ['PP-TUNG-2026', 'PP-TUNGANH-2026', 'PP-HAU-2026', 'PP-TUANTRAN-2026', 'PP-HUNG-2026', 'PP-DUYANH-2026', 'PP-THACH-2026']) {
    assert.match(sql, new RegExp(code));
  }
});

test('schema enables realtime and creates a public 25 MB file bucket', () => {
  assert.match(sql, /supabase_realtime/i);
  assert.match(sql, /chat-files/);
  assert.match(sql, /26214400/);
});

test('schema intentionally allows anonymous reads and writes', () => {
  assert.match(sql, /array\['select','insert','update','delete'\]/i);
  assert.match(sql, /to anon/i);
  assert.match(sql, /using \(true\)/i);
  assert.match(sql, /with check \(true\)/i);
});

test('notification migration creates durable recipient rows and actor columns', () => {
  assert.match(notificationSql, /create table(?: if not exists)? public\.notifications/i);
  assert.match(notificationSql, /recipient_id text not null references public\.members/i);
  assert.match(notificationSql, /read_at timestamptz/i);
  for (const table of ['members', 'allocations', 'tasks']) {
    assert.match(notificationSql, new RegExp(`alter table public\\.${table} add column if not exists updated_by`, 'i'));
  }
});

test('notification migration creates relevant-event triggers', () => {
  for (const trigger of ['notify_new_message', 'notify_task_change', 'notify_allocation_change', 'notify_member_change']) {
    assert.match(notificationSql, new RegExp(trigger, 'i'));
  }
  assert.match(notificationSql, /new\.sender_id/i);
  assert.match(notificationSql, /new\.assignee_id/i);
  assert.match(notificationSql, /jsonb_array_elements_text/i);
});

test('notifications use RLS, Data API grants, and realtime publication', () => {
  assert.match(notificationSql, /alter table public\.notifications enable row level security/i);
  assert.match(notificationSql, /grant select, update on public\.notifications to anon/i);
  assert.match(notificationSql, /create policy "anon_select_notifications"/i);
  assert.match(notificationSql, /supabase_realtime add table public\.notifications/i);
});

test('chat moderation migration adds server-owned mute and message state', () => {
  assert.ok(moderationMigration, 'chat moderation migration is missing');
  assert.match(moderationSql, /chat_muted_until timestamptz/i);
  assert.match(moderationSql, /kind text not null default 'user'/i);
  assert.match(moderationSql, /kind in \('user', 'system'\)/i);
  assert.match(moderationSql, /alter column sender_id drop not null/i);
  assert.match(moderationSql, /create table if not exists private\.attachment_cleanup_queue/i);
});

test('chat send RPC enforces a global rolling limit and five-minute mute', () => {
  assert.match(moderationSql, /function public\.send_chat_message/i);
  assert.match(moderationSql, /for update/i);
  assert.match(moderationSql, /interval '60 seconds'/i);
  assert.match(moderationSql, /interval '5 minutes'/i);
  assert.match(moderationSql, /Thằng SV .* đã bị khóa mõm 5 phút/i);
  assert.match(moderationSql, /where sender_id = p_member_id[\s\S]*kind = 'user'/i);
});

test('chat send RPC prunes rooms, protects writes, and skips system notifications', () => {
  assert.match(moderationSql, /row_number\(\) over \(partition by room_id order by created_at desc, id desc\)/i);
  assert.match(moderationSql, /revoke insert on public\.messages from anon/i);
  assert.match(moderationSql, /revoke execute on function public\.send_chat_message[\s\S]*from public/i);
  assert.match(moderationSql, /grant execute on function public\.send_chat_message[\s\S]*to anon/i);
  assert.match(moderationSql, /if new\.kind <> 'user' then[\s\S]*return new/i);
});

test('chat replies expose a to-one computed relationship for PostgREST', () => {
  assert.match(allMigrationSql, /function public\.reply_to\(public\.messages\)/i);
  assert.match(allMigrationSql, /returns setof public\.messages rows 1/i);
  assert.match(allMigrationSql, /where message\.id = source\.reply_to_id/i);
});

test('retention cron migration preserves reply-aware send RPC', () => {
  assert.ok(retentionCronMigration, 'retention cron migration is missing');
  assert.match(retentionCronSql, /p_reply_to_id uuid default null/i);
  assert.match(retentionCronSql, /INVALID_REPLY_TARGET/i);
  assert.match(retentionCronSql, /attachment_id, reply_to_id, kind, created_at/i);
  assert.match(retentionCronSql, /send_chat_message\(text, text, text, text, uuid, uuid\)/i);
});

test('xo casino migration creates match, wallet, and bet tables without tournaments', () => {
  assert.ok(xoMigration, 'xo casino migration is missing');
  for (const table of ['xo_matches', 'xo_games', 'xo_ratings', 'citizen_wallets', 'citizen_point_ledger', 'xo_bets']) {
    assert.match(xoSql, new RegExp(`create table if not exists public\\.${table}`, 'i'));
  }
  assert.doesNotMatch(xoSql, /xo_tournaments|xo_tournament_players|playoff|lucky_member/i);
  assert.match(xoSql, /challenger_id text not null/i);
  assert.match(xoSql, /opponent_id text not null/i);
  assert.match(xoSql, /wager integer not null/i);
  assert.match(xoSql, /target_wins integer not null default 1/i);
  assert.match(xoSql, /balance integer not null default 0/i);
  assert.match(xoSql, /moves jsonb not null default '\[\]'::jsonb/i);
  assert.match(xoSql, /bounds jsonb not null/i);
  assert.match(xoSql, /36/i);
});

test('xo casino migration exposes challenge RPCs and realtime tables', () => {
  for (const fn of ['xo_grant_monthly_citizen_points', 'xo_create_challenge', 'xo_respond_challenge', 'xo_place_bet', 'xo_make_move']) {
    assert.match(xoSql, new RegExp(`function public\\.${fn}`, 'i'));
    assert.match(xoSql, new RegExp(`grant execute on function public\\.${fn}[\\s\\S]*to anon`, 'i'));
  }
  assert.match(xoSql, /CHALLENGE_YOURSELF/i);
  assert.match(xoSql, /winner.*36/i);
  assert.match(xoSql, /loser.*-18/i);
  assert.match(xoSql, /unique \(member_id, grant_month\)/i);
  assert.match(xoSql, /alter publication supabase_realtime add table public\.xo_matches/i);
});

test('daily citizen check-in grants once per Vietnam day with weekend bonus', () => {
  assert.ok(dailyCheckinMigration, 'daily check-in migration is missing');
  assert.match(dailyCheckinSql, /function public\.xo_daily_checkin/i);
  assert.match(dailyCheckinSql, /Asia\/Ho_Chi_Minh/i);
  assert.match(dailyCheckinSql, /isodow[\s\S]*\(6, 7\)[\s\S]*36[\s\S]*18/i);
  assert.match(dailyCheckinSql, /unique \(member_id, grant_date\)/i);
  assert.match(dailyCheckinSql, /on conflict \(member_id, grant_date\) do nothing/i);
  assert.match(dailyCheckinSql, /grant execute on function public\.xo_daily_checkin[\s\S]*to anon/i);
});

test('repeat daily check-in deducts 360 points on the server', () => {
  assert.ok(checkinPenaltyMigration, 'check-in penalty migration is missing');
  assert.match(checkinPenaltySql, /v_inserted > 0[\s\S]*else[\s\S]*balance - 360/i);
  assert.match(checkinPenaltySql, /-360, 'daily_checkin_penalty'/i);
  assert.match(checkinPenaltySql, /drop constraint if exists citizen_wallets_balance_check/i);
});

test('xo reset clears casino history and restores equal starting wallets', () => {
  assert.ok(xoResetMigration, 'xo reset migration is missing');
  for (const table of ['citizen_point_ledger', 'xo_matches', 'xo_ratings', 'citizen_wallets']) {
    assert.match(xoResetSql, new RegExp(`delete from public\\.${table}`, 'i'));
  }
  assert.match(xoResetSql, /select id, 36 from public\.members/i);
  assert.match(xoResetSql, /'monthly_grant'/i);
});
