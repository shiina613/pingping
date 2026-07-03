import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type CleanupItem = {
  attachment_id: string;
  bucket_id: string;
  storage_path: string;
};

function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expectedSecret = Deno.env.get('CLEANUP_SECRET') || '';
  const suppliedSecret = request.headers.get('x-cleanup-secret') || '';
  if (!expectedSecret || !timingSafeEqual(suppliedSecret, expectedSecret)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Worker environment is incomplete' }, 500);

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await client.rpc('claim_attachment_cleanup', { p_limit: 100 });
  if (error) return json({ error: error.message }, 500);

  const items = (data || []) as CleanupItem[];
  let completed = 0;
  let failed = 0;
  for (const item of items) {
    const { error: removeError } = await client.storage.from(item.bucket_id).remove([item.storage_path]);
    if (removeError) {
      failed += 1;
      await client.rpc('fail_attachment_cleanup', {
        p_attachment_id: item.attachment_id,
        p_error: removeError.message
      });
      continue;
    }
    const { error: completeError } = await client.rpc('complete_attachment_cleanup', {
      p_attachment_id: item.attachment_id
    });
    if (completeError) {
      failed += 1;
      await client.rpc('fail_attachment_cleanup', {
        p_attachment_id: item.attachment_id,
        p_error: completeError.message
      });
    } else {
      completed += 1;
    }
  }

  return json({ claimed: items.length, completed, failed });
});
