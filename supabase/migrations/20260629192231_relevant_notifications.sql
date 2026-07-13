create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.members add column if not exists updated_by text references public.members(id) on delete set null;
alter table public.allocations add column if not exists updated_by text references public.members(id) on delete set null;
alter table public.tasks add column if not exists updated_by text references public.members(id) on delete set null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null references public.members(id) on delete cascade,
  actor_id text references public.members(id) on delete set null,
  kind text not null check (kind in ('message', 'task', 'allocation', 'profile')),
  title text not null,
  body text not null default '',
  target_tab text not null check (target_tab in ('chat', 'kanban', 'planner', 'directory')),
  room_id text,
  entity_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
grant select, update on public.notifications to anon;
revoke insert, delete on public.notifications from anon;
drop policy if exists "anon_select_notifications" on public.notifications;
drop policy if exists "anon_update_notifications" on public.notifications;
create policy "anon_select_notifications" on public.notifications for select to anon using (true);
create policy "anon_update_notifications" on public.notifications for update to anon using (true) with check (true);

create or replace function private.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare actor_name text;
begin
  select name into actor_name from public.members where id = new.sender_id;
  insert into public.notifications (recipient_id, actor_id, kind, title, body, target_tab, room_id, entity_id)
  select id, new.sender_id, 'message', coalesce(actor_name, 'Thành viên') || ' gửi tin nhắn',
    case when char_length(new.text) > 90 then left(new.text, 87) || '...' else new.text end,
    'chat', new.room_id, new.id::text
  from public.members where id <> new.sender_id;
  return new;
end;
$$;

create or replace function private.notify_task_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.assignee_id is not null
    and new.assignee_id is distinct from new.updated_by
    and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id or new.column_id is distinct from old.column_id) then
    insert into public.notifications (recipient_id, actor_id, kind, title, body, target_tab, entity_id)
    values (
      new.assignee_id, new.updated_by, 'task',
      case when tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id then 'Bạn được giao một nhiệm vụ' else 'Nhiệm vụ đã đổi trạng thái' end,
      new.title, 'kanban', new.id
    );
  end if;
  return new;
end;
$$;

create or replace function private.allocation_member_ids(document jsonb)
returns table(member_id text)
language sql
immutable
set search_path = public, pg_temp
as $$
  select distinct jsonb_array_elements_text(value)
  from jsonb_each(coalesce(document, '{}'::jsonb))
  where jsonb_typeof(value) = 'array';
$$;

create or replace function private.notify_allocation_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare member_id text;
declare was_member boolean;
declare is_member boolean;
begin
  for member_id in
    select value from (
      select member_id as value from private.allocation_member_ids(old.data)
      union
      select member_id as value from private.allocation_member_ids(new.data)
    ) changed_members
  loop
    was_member := exists(select 1 from private.allocation_member_ids(old.data) x where x.member_id = member_id);
    is_member := exists(select 1 from private.allocation_member_ids(new.data) x where x.member_id = member_id);
    if was_member is distinct from is_member and member_id is distinct from new.updated_by then
      insert into public.notifications (recipient_id, actor_id, kind, title, body, target_tab, entity_id)
      values (
        member_id, new.updated_by, 'allocation',
        case when is_member then 'Bạn được thêm vào đội hình' else 'Bạn đã được gỡ khỏi đội hình' end,
        new.competition_id, 'planner', new.competition_id
      );
    end if;
  end loop;
  return new;
end;
$$;

create or replace function private.notify_member_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.updated_by is not null and new.updated_by <> new.id
    and (new.name, new.role, new.skills, new.avatar) is distinct from (old.name, old.role, old.skills, old.avatar) then
    insert into public.notifications (recipient_id, actor_id, kind, title, body, target_tab, entity_id)
    values (new.id, new.updated_by, 'profile', 'Hồ sơ của bạn đã được cập nhật', new.name, 'directory', new.id);
  end if;
  return new;
end;
$$;

revoke execute on function private.notify_new_message() from public, anon, authenticated;
revoke execute on function private.notify_task_change() from public, anon, authenticated;
revoke execute on function private.allocation_member_ids(jsonb) from public, anon, authenticated;
revoke execute on function private.notify_allocation_change() from public, anon, authenticated;
revoke execute on function private.notify_member_change() from public, anon, authenticated;

drop trigger if exists notify_new_message on public.messages;
create trigger notify_new_message after insert on public.messages for each row execute function private.notify_new_message();
drop trigger if exists notify_task_change on public.tasks;
create trigger notify_task_change after insert or update on public.tasks for each row execute function private.notify_task_change();
drop trigger if exists notify_allocation_change on public.allocations;
create trigger notify_allocation_change after update on public.allocations for each row execute function private.notify_allocation_change();
drop trigger if exists notify_member_change on public.members;
create trigger notify_member_change after update on public.members for each row execute function private.notify_member_change();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
;
