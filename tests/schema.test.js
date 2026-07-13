import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20260629064053_collaboration.sql', import.meta.url), 'utf8');
const notificationSql = readFileSync(new URL('../supabase/migrations/20260629192231_relevant_notifications.sql', import.meta.url), 'utf8');
const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const moderationMigration = readdirSync(migrationsDir).find(name => name.endsWith('_chat_moderation_retention.sql'));
const moderationSql = moderationMigration ? readFileSync(new URL(moderationMigration, migrationsDir), 'utf8') : '';
const allMigrationSql = readdirSync(migrationsDir).map(name => readFileSync(new URL(name, migrationsDir), 'utf8')).join('\n');
const xoMigration = readdirSync(migrationsDir).find(name => name.endsWith('_xo_arena.sql'));
const xoSql = xoMigration ? readFileSync(new URL(xoMigration, migrationsDir), 'utf8') : '';

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

test('X-O migration creates the authoritative release tables', () => {
  assert.ok(xoMigration, 'X-O migration is missing');
  for (const table of [
    'xo_settings', 'xo_testers', 'xo_tournaments', 'xo_tournament_players',
    'xo_matches', 'xo_games', 'xo_moves', 'xo_ratings', 'citizen_wallets',
    'citizen_point_ledger', 'xo_pool_bets', 'xo_pool_totals', 'xo_side_bets',
    'xo_command_log'
  ]) {
    assert.match(xoSql, new RegExp(`create table(?: if not exists)? public\\.${table}`, 'i'));
  }
});

test('X-O wallets and bets are not directly exposed to anonymous clients', () => {
  assert.match(xoSql, /revoke all on table public\.%I from public, anon, authenticated/i);
  assert.doesNotMatch(xoSql, /grant select[^;]*citizen_wallets[^;]*to anon/i);
  assert.doesNotMatch(xoSql, /grant select[^;]*xo_pool_bets[^;]*to anon/i);
  assert.match(xoSql, /grant select on table public\.%I to anon/i);
});
