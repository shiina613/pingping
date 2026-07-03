import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20260701071754_chat_moderation_retention.sql', import.meta.url), 'utf8');
const workerUrl = new URL('../supabase/functions/cleanup-chat-attachments/index.ts', import.meta.url);
let worker = '';
try { worker = readFileSync(workerUrl, 'utf8'); } catch {}

test('cleanup migration exposes service-role-only queue operations', () => {
  assert.match(migration, /function public\.claim_attachment_cleanup/i);
  assert.match(migration, /for update skip locked/i);
  assert.match(migration, /function public\.complete_attachment_cleanup/i);
  assert.match(migration, /function public\.fail_attachment_cleanup/i);
  assert.match(migration, /grant execute on function public\.claim_attachment_cleanup[\s\S]*to service_role/i);
  assert.match(migration, /function private\.queue_orphaned_chat_attachments/i);
  assert.match(migration, /interval '10 minutes'/i);
});

test('cleanup worker authenticates cron and deletes through Storage API', () => {
  assert.ok(worker, 'cleanup Edge Function is missing');
  assert.match(worker, /x-cleanup-secret/i);
  assert.match(worker, /timingSafeEqual/);
  assert.match(worker, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(worker, /rpc\('claim_attachment_cleanup'/);
  assert.match(worker, /storage\.from\(item\.bucket_id\)\.remove\(\[item\.storage_path\]\)/);
  assert.match(worker, /rpc\('complete_attachment_cleanup'/);
  assert.match(worker, /rpc\('fail_attachment_cleanup'/);
});
