-- 1. Xóa logic gọi prune_chat_room đồng bộ khỏi send_chat_message
create or replace function public.send_chat_message(
  p_member_id text,
  p_login_code text,
  p_room_id text,
  p_text text,
  p_attachment_id uuid default null,
  p_reply_to_id uuid default null
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

  if p_reply_to_id is not null and not exists (
    select 1 from public.messages where id = p_reply_to_id
  ) then
    raise exception using errcode = '22023', message = 'INVALID_REPLY_TARGET';
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
    return query select 'rate_limited'::text, v_message_id, v_member.chat_muted_until, v_cleanup_queued;
    return;
  end if;

  insert into public.messages (room_id, sender_id, text, attachment_id, reply_to_id, kind, created_at)
  values (p_room_id, p_member_id, v_text, p_attachment_id, p_reply_to_id, 'user', v_now)
  returning id into v_message_id;

  return query select 'sent'::text, v_message_id, null::timestamptz, false;
end;
$$;

revoke execute on function public.send_chat_message(text, text, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.send_chat_message(text, text, text, text, uuid, uuid) to anon;

-- 2. Tạo function helper để quét và dọn rác cho toàn bộ các phòng
create or replace function private.prune_all_chat_rooms()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r text;
begin
  foreach r in array array['general', 'onevoice', 'thucchien', 'aichallenge', 'buildhub', 'viettel'] loop
    perform private.prune_chat_room(r);
  end loop;
end;
$$;

revoke execute on function private.prune_all_chat_rooms() from public, anon, authenticated;

-- 3. Kích hoạt pg_cron và lên lịch dọn dẹp hàng ngày lúc 3:00 AM
create extension if not exists pg_cron;

select cron.schedule(
  'prune-chat-rooms-daily',
  '0 3 * * *',
  $$select private.prune_all_chat_rooms();$$
);
