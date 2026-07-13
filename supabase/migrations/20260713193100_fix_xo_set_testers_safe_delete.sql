create or replace function public.xo_set_testers(
  p_member_id text,
  p_login_code text,
  p_request_id uuid,
  p_tester_ids text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cached jsonb;
  v_result jsonb;
begin
  perform private.xo_assert_member(p_member_id, p_login_code);
  if p_member_id <> 'tung' then
    raise exception using errcode = '42501', message = 'ONLY_TUNG_CAN_HOST';
  end if;
  v_cached := private.xo_begin_command(p_member_id, 'set_testers', p_request_id, to_jsonb(coalesce(p_tester_ids, array[]::text[])));
  if v_cached is not null then return v_cached; end if;

  if exists (
    select 1 from unnest(coalesce(p_tester_ids, array[]::text[])) requested(id)
    where not exists (select 1 from public.members where members.id = requested.id)
  ) then
    raise exception using errcode = '22023', message = 'INVALID_TESTER';
  end if;

  -- PostgREST enables safe-update protection, which rejects DELETE without WHERE.
  delete from public.xo_testers where true;
  insert into public.xo_testers (member_id, added_by)
  select distinct id, p_member_id
  from unnest(array_append(coalesce(p_tester_ids, array[]::text[]), 'tung')) requested(id);
  select jsonb_build_object('testerIds', jsonb_agg(member_id order by member_id)) into v_result
  from public.xo_testers;
  return private.xo_finish_command(p_member_id, 'set_testers', p_request_id, v_result);
end;
$$;

revoke all on function public.xo_set_testers(text, text, uuid, text[]) from public, anon, authenticated;
grant execute on function public.xo_set_testers(text, text, uuid, text[]) to anon;
