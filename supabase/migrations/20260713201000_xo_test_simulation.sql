create or replace function public.xo_simulate_test_tournament(
  p_member_id text,
  p_login_code text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cached jsonb;
  v_mode text;
  v_tournament public.xo_tournaments%rowtype;
  v_match public.xo_matches%rowtype;
  v_game_id uuid;
  v_result jsonb;
  v_guard integer := 0;
begin
  perform private.xo_assert_member(p_member_id, p_login_code);
  if p_member_id <> 'tung' then
    raise exception using errcode = '42501', message = 'ONLY_TUNG_CAN_HOST';
  end if;

  v_cached := private.xo_begin_command(p_member_id, 'simulate_test_tournament', p_request_id, '{}'::jsonb);
  if v_cached is not null then return v_cached; end if;

  select release_mode into v_mode from public.xo_settings where id = true for update;
  if v_mode <> 'test' then
    raise exception using errcode = '42501', message = 'TEST_SIMULATION_ONLY';
  end if;

  select * into v_tournament
  from public.xo_tournaments
  where status = 'active'
  order by created_at desc
  limit 1
  for update;

  if found and v_tournament.scope <> 'test' then
    raise exception using errcode = '42501', message = 'TEST_SIMULATION_ONLY';
  end if;

  if not found then
    v_result := public.xo_create_tournament(p_member_id, p_login_code, gen_random_uuid());
    select * into strict v_tournament
    from public.xo_tournaments
    where id = (v_result->>'tournamentId')::uuid
    for update;
  end if;

  while v_tournament.status = 'active' loop
    v_guard := v_guard + 1;
    if v_guard > 32 then
      raise exception using errcode = '54001', message = 'TEST_SIMULATION_LIMIT';
    end if;

    select * into v_match
    from public.xo_matches
    where tournament_id = v_tournament.id
      and status in ('scheduled', 'pending', 'active')
    order by
      case stage when 'group' then 1 when 'semifinal' then 2 when 'final' then 3 else 4 end,
      round_number,
      bracket_slot,
      created_at
    limit 1
    for update;

    if not found then
      raise exception using errcode = '55000', message = 'NO_SIMULATABLE_MATCH';
    end if;

    if v_match.status = 'scheduled' then
      perform private.xo_open_match(v_match.id);
    end if;

    select id into v_game_id
    from public.xo_games
    where match_id = v_match.id and status = 'active'
    order by game_number desc
    limit 1
    for update;

    if found then
      update public.xo_games
      set status = 'completed',
        winner_id = v_match.player_x_id,
        next_member_id = null,
        completed_at = now()
      where id = v_game_id;
    end if;

    update public.xo_matches
    set status = case when status = 'scheduled' then 'pending' else status end,
      player_x_wins = target_wins,
      player_o_wins = 0,
      started_at = coalesce(started_at, now()),
      betting_locked_at = coalesce(betting_locked_at, now()),
      revision = revision + 1
    where id = v_match.id;

    perform private.xo_complete_match(v_match.id);

    select * into strict v_tournament
    from public.xo_tournaments
    where id = v_tournament.id
    for update;
  end loop;

  v_result := jsonb_build_object(
    'tournamentId', v_tournament.id,
    'status', v_tournament.status,
    'championId', v_tournament.champion_id
  );
  return private.xo_finish_command(p_member_id, 'simulate_test_tournament', p_request_id, v_result);
end;
$$;

revoke all on function public.xo_simulate_test_tournament(text, text, uuid) from public, anon, authenticated;
grant execute on function public.xo_simulate_test_tournament(text, text, uuid) to anon;

notify pgrst, 'reload schema';
