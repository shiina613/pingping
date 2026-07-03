alter table public.members
  add column if not exists chat_muted_until timestamptz;

alter table public.messages
  add column if not exists kind text not null default 'user';

alter table public.messages
  drop constraint if exists messages_kind_check;

alter table public.messages
  add constraint messages_kind_check check (kind in ('user', 'system'));

alter table public.messages
  alter column sender_id drop not null;

create index if not exists messages_sender_rate_idx
  on public.messages (sender_id, created_at desc)
  where kind = 'user';

create table if not exists private.attachment_cleanup_queue (
  attachment_id uuid primary key references public.attachments(id) on delete cascade,
  bucket_id text not null default 'chat-files',
  storage_path text not null unique,
  attempts integer not null default 0,
  last_error text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

revoke all on private.attachment_cleanup_queue from public, anon, authenticated;

create or replace function private.queue_chat_attachment(p_attachment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  queued_rows integer := 0;
begin
  if p_attachment_id is null then
    return false;
  end if;

  insert into private.attachment_cleanup_queue (attachment_id, storage_path)
  select a.id, a.storage_path
  from public.attachments a
  where a.id = p_attachment_id
  on conflict (attachment_id) do nothing;

  get diagnostics queued_rows = row_count;
  return queued_rows > 0;
end;
$$;

create or replace function private.prune_chat_room(p_room_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  with ranked as (
    select m.id, m.attachment_id,
      row_number() over (partition by room_id order by created_at desc, id desc) as position
    from public.messages m
    where m.room_id = p_room_id
  ), doomed as (
    select id, attachment_id from ranked where position > 36
  )
  insert into private.attachment_cleanup_queue (attachment_id, storage_path)
  select distinct a.id, a.storage_path
  from doomed d
  join public.attachments a on a.id = d.attachment_id
  on conflict (attachment_id) do nothing;

  with ranked as (
    select m.id,
      row_number() over (partition by room_id order by created_at desc, id desc) as position
    from public.messages m
    where m.room_id = p_room_id
  )
  delete from public.messages m
  using ranked r
  where m.id = r.id and r.position > 36;
end;
$$;

create or replace function public.send_chat_message(
  p_member_id text,
  p_login_code text,
  p_room_id text,
  p_text text,
  p_attachment_id uuid default null
)
returns table(status text, message_id uuid, muted_until timestamptz, cleanup_queued boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.members%rowtype;
  v_now timestamptz := clock_timestamp();
  v_message_id uuid;
  v_recent_count integer;
  v_cleanup_queued boolean := false;
  v_text text := trim(coalesce(p_text, ''));
begin
  if p_room_id not in ('general', 'onevoice', 'thucchien', 'aichallenge', 'buildhub', 'viettel') then
    raise exception using errcode = '22023', message = 'INVALID_ROOM';
  end if;

  if char_length(v_text) > 4000 or (v_text = '' and p_attachment_id is null) then
    raise exception using errcode = '22023', message = 'INVALID_MESSAGE';
  end if;

  select * into v_member
  from public.members
  where id = p_member_id
  for update;

  if not found or v_member.login_code is distinct from p_login_code then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;

  if p_attachment_id is not null and not exists (
    select 1
    from public.attachments a
    where a.id = p_attachment_id
      and a.sender_id = p_member_id
      and not exists (
        select 1 from public.messages used where used.attachment_id = a.id
      )
  ) then
    raise exception using errcode = '22023', message = 'INVALID_ATTACHMENT';
  end if;

  if v_member.chat_muted_until > v_now then
    v_cleanup_queued := private.queue_chat_attachment(p_attachment_id);
    return query select 'muted'::text, null::uuid, v_member.chat_muted_until, v_cleanup_queued;
    return;
  end if;

  select count(*) into v_recent_count
  from public.messages m
  where sender_id = p_member_id
    and kind = 'user'
    and m.created_at > v_now - interval '60 seconds';

  if v_recent_count >= 18 then
    update public.members
    set chat_muted_until = v_now + interval '5 minutes', updated_at = v_now
    where id = p_member_id
    returning chat_muted_until into v_member.chat_muted_until;

    insert into public.messages (room_id, sender_id, text, kind, created_at)
    values (p_room_id, null, 'Thằng SV ' || v_member.name || ' đã bị khóa mõm 5 phút', 'system', v_now)
    returning id into v_message_id;

    v_cleanup_queued := private.queue_chat_attachment(p_attachment_id);
    perform private.prune_chat_room(p_room_id);
    return query select 'rate_limited'::text, v_message_id, v_member.chat_muted_until, v_cleanup_queued;
    return;
  end if;

  insert into public.messages (room_id, sender_id, text, attachment_id, kind, created_at)
  values (p_room_id, p_member_id, v_text, p_attachment_id, 'user', v_now)
  returning id into v_message_id;

  perform private.prune_chat_room(p_room_id);
  return query select 'sent'::text, v_message_id, null::timestamptz, false;
end;
$$;

revoke execute on function private.queue_chat_attachment(uuid) from public, anon, authenticated;
revoke execute on function private.prune_chat_room(text) from public, anon, authenticated;
revoke execute on function public.send_chat_message(text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.send_chat_message(text, text, text, text, uuid) to anon;

revoke insert on public.messages from anon, authenticated;
drop policy if exists "anon_insert_messages" on public.messages;

create or replace function private.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
begin
  if new.kind <> 'user' then
    return new;
  end if;

  select name into actor_name from public.members where id = new.sender_id;
  insert into public.notifications (recipient_id, actor_id, kind, title, body, target_tab, room_id, entity_id)
  select id, new.sender_id, 'message', coalesce(actor_name, 'Thành viên') || ' gửi tin nhắn',
    case when char_length(new.text) > 90 then left(new.text, 87) || '...' else new.text end,
    'chat', new.room_id, new.id::text
  from public.members where id <> new.sender_id;
  return new;
end;
$$;

revoke execute on function private.notify_new_message() from public, anon, authenticated;

create or replace function private.queue_orphaned_chat_attachments()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  queued_rows integer := 0;
begin
  insert into private.attachment_cleanup_queue (attachment_id, storage_path)
  select a.id, a.storage_path
  from public.attachments a
  where a.created_at < clock_timestamp() - interval '10 minutes'
    and not exists (select 1 from public.messages m where m.attachment_id = a.id)
  on conflict (attachment_id) do nothing;
  get diagnostics queued_rows = row_count;
  return queued_rows;
end;
$$;

create or replace function public.claim_attachment_cleanup(p_limit integer default 100)
returns table(attachment_id uuid, bucket_id text, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.queue_orphaned_chat_attachments();
  return query
  with candidates as (
    select q.attachment_id
    from private.attachment_cleanup_queue q
    where q.completed_at is null
      and (q.claimed_at is null or q.claimed_at < clock_timestamp() - interval '5 minutes')
    order by q.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  )
  update private.attachment_cleanup_queue q
  set claimed_at = clock_timestamp(), attempts = q.attempts + 1
  from candidates c
  where q.attachment_id = c.attachment_id
  returning q.attachment_id, q.bucket_id, q.storage_path;
end;
$$;

create or replace function public.complete_attachment_cleanup(p_attachment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.attachment_cleanup_queue
  set completed_at = clock_timestamp(), claimed_at = null, last_error = null
  where attachment_id = p_attachment_id;
  delete from public.attachments where id = p_attachment_id;
end;
$$;

create or replace function public.fail_attachment_cleanup(p_attachment_id uuid, p_error text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.attachment_cleanup_queue
  set claimed_at = null, last_error = left(coalesce(p_error, 'Unknown cleanup error'), 500)
  where attachment_id = p_attachment_id and completed_at is null;
$$;

revoke execute on function private.queue_orphaned_chat_attachments() from public, anon, authenticated;
revoke execute on function public.claim_attachment_cleanup(integer) from public, anon, authenticated;
revoke execute on function public.complete_attachment_cleanup(uuid) from public, anon, authenticated;
revoke execute on function public.fail_attachment_cleanup(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_attachment_cleanup(integer) to service_role;
grant execute on function public.complete_attachment_cleanup(uuid) to service_role;
grant execute on function public.fail_attachment_cleanup(uuid, text) to service_role;
