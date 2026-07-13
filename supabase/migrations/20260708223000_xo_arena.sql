create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.xo_settings (
  id boolean primary key default true check (id),
  release_mode text not null default 'test' check (release_mode in ('test', 'live')),
  updated_at timestamptz not null default now()
);

insert into public.xo_settings (id, release_mode)
values (true, 'test')
on conflict (id) do nothing;

create table public.xo_testers (
  member_id text primary key references public.members(id) on delete cascade,
  added_by text not null references public.members(id),
  created_at timestamptz not null default now()
);

insert into public.xo_testers (member_id, added_by)
values ('tung', 'tung')
on conflict (member_id) do nothing;

create table public.xo_tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'X-O Challenger',
  host_id text not null references public.members(id),
  lucky_member_id text not null references public.members(id),
  scope text not null check (scope in ('test', 'live')),
  stage text not null default 'group' check (stage in ('group', 'playoff', 'completed', 'cancelled')),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  current_round integer not null default 1 check (current_round between 1 and 7),
  champion_id text references public.members(id),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz
);

create unique index xo_one_active_tournament_idx
  on public.xo_tournaments ((status)) where status = 'active';

create table public.xo_tournament_players (
  tournament_id uuid not null references public.xo_tournaments(id) on delete cascade,
  member_id text not null references public.members(id),
  is_lucky boolean not null default false,
  group_eligible boolean not null default true,
  seed integer check (seed between 1 and 7),
  match_wins integer not null default 0 check (match_wins >= 0),
  match_losses integer not null default 0 check (match_losses >= 0),
  game_wins integer not null default 0 check (game_wins >= 0),
  final_placement integer check (final_placement between 1 and 7),
  primary key (tournament_id, member_id),
  check (is_lucky = not group_eligible)
);

create unique index xo_one_lucky_player_idx
  on public.xo_tournament_players (tournament_id) where is_lucky;

create table public.xo_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.xo_tournaments(id) on delete cascade,
  stage text not null check (stage in ('group', 'semifinal', 'final')),
  round_number integer not null check (round_number between 1 and 7),
  bracket_slot integer check (bracket_slot between 1 and 2),
  player_x_id text not null references public.members(id),
  player_o_id text not null references public.members(id),
  target_wins integer not null check (target_wins in (2, 3)),
  player_x_wins integer not null default 0 check (player_x_wins >= 0),
  player_o_wins integer not null default 0 check (player_o_wins >= 0),
  status text not null default 'pending' check (status in ('scheduled', 'pending', 'active', 'completed', 'cancelled')),
  winner_id text references public.members(id),
  betting_locked_at timestamptz,
  settlement_status text not null default 'pending' check (settlement_status in ('pending', 'settling', 'settled', 'refunded')),
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  check (player_x_id <> player_o_id),
  check (winner_id is null or winner_id in (player_x_id, player_o_id)),
  unique (tournament_id, stage, round_number, bracket_slot)
);

create table public.xo_games (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.xo_matches(id) on delete cascade,
  game_number integer not null check (game_number > 0),
  first_member_id text not null references public.members(id),
  next_member_id text references public.members(id),
  winner_id text references public.members(id),
  status text not null default 'active' check (status in ('active', 'completed', 'draw', 'cancelled')),
  min_row integer not null default 0,
  max_row integer not null default 8,
  min_col integer not null default 0,
  max_col integer not null default 8,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (match_id, game_number),
  check (min_row <= max_row and max_row - min_row + 1 between 9 and 36),
  check (min_col <= max_col and max_col - min_col + 1 between 9 and 36)
);

create unique index xo_one_active_game_per_match_idx
  on public.xo_games (match_id) where status = 'active';

create table public.xo_moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.xo_games(id) on delete cascade,
  move_number integer not null check (move_number > 0),
  member_id text not null references public.members(id),
  mark text not null check (mark in ('x', 'o')),
  row integer not null,
  col integer not null,
  created_at timestamptz not null default now(),
  unique (game_id, move_number),
  unique (game_id, row, col)
);

create table public.xo_ratings (
  member_id text primary key references public.members(id) on delete cascade,
  rating integer not null default 0,
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  updated_at timestamptz not null default now()
);

insert into public.xo_ratings (member_id)
select id from public.members
on conflict (member_id) do nothing;

create table public.citizen_wallets (
  member_id text not null references public.members(id) on delete cascade,
  scope text not null check (scope in ('test', 'live')),
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (member_id, scope)
);

create table public.citizen_point_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.members(id),
  scope text not null check (scope in ('test', 'live')),
  amount integer not null,
  reason text not null check (reason in (
    'monthly_grant', 'test_reset', 'pool_escrow', 'pool_payout', 'pool_refund',
    'side_escrow', 'side_payout', 'side_refund'
  )),
  tournament_id uuid references public.xo_tournaments(id),
  match_id uuid references public.xo_matches(id),
  bet_id uuid,
  grant_month date,
  request_id uuid,
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);

create unique index citizen_monthly_grant_idx
  on public.citizen_point_ledger (member_id, scope, grant_month)
  where reason = 'monthly_grant';

create table public.xo_pool_bets (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.xo_tournaments(id),
  match_id uuid not null references public.xo_matches(id),
  member_id text not null references public.members(id),
  pick_member_id text not null references public.members(id),
  stake integer not null check (stake > 0),
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'settled', 'refunded')),
  payout integer not null default 0 check (payout >= 0),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (match_id, member_id)
);

create table public.xo_pool_totals (
  match_id uuid not null references public.xo_matches(id) on delete cascade,
  pick_member_id text not null references public.members(id),
  total_stake integer not null default 0 check (total_stake >= 0),
  updated_at timestamptz not null default now(),
  primary key (match_id, pick_member_id)
);

create table public.xo_side_bets (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.xo_tournaments(id),
  match_id uuid not null unique references public.xo_matches(id),
  proposer_id text not null references public.members(id),
  opponent_id text not null references public.members(id),
  stake integer not null check (stake > 0),
  status text not null default 'proposed' check (status in (
    'proposed', 'accepted', 'rejected', 'cancelled', 'settled', 'refunded'
  )),
  winner_id text references public.members(id),
  payout integer not null default 0 check (payout >= 0),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  settled_at timestamptz,
  check (proposer_id <> opponent_id),
  check (winner_id is null or winner_id in (proposer_id, opponent_id))
);

create table public.xo_command_log (
  member_id text not null references public.members(id),
  command_name text not null,
  request_id uuid not null,
  payload_hash text not null,
  status text not null default 'started' check (status in ('started', 'completed')),
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (member_id, command_name, request_id),
  unique (member_id, request_id)
);

create or replace function private.xo_assert_member(p_member_id text, p_login_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.members
    where id = p_member_id and login_code = p_login_code
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_CREDENTIALS';
  end if;
end;
$$;

create or replace function private.xo_reject_move_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = 'XO_MOVES_ARE_IMMUTABLE';
end;
$$;

create trigger xo_moves_immutable
before update or delete on public.xo_moves
for each row execute function private.xo_reject_move_mutation();

revoke all on function private.xo_assert_member(text, text) from public, anon, authenticated;
revoke all on function private.xo_reject_move_mutation() from public, anon, authenticated;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'xo_settings', 'xo_testers', 'xo_tournaments', 'xo_tournament_players',
    'xo_matches', 'xo_games', 'xo_moves', 'xo_ratings', 'citizen_wallets',
    'citizen_point_ledger', 'xo_pool_bets', 'xo_pool_totals', 'xo_side_bets',
    'xo_command_log'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', v_table);
  end loop;

  foreach v_table in array array[
    'xo_settings', 'xo_tournaments', 'xo_tournament_players', 'xo_matches',
    'xo_games', 'xo_moves', 'xo_ratings', 'xo_pool_totals'
  ] loop
    execute format('grant select on table public.%I to anon', v_table);
    execute format(
      'create policy "anon_select_%s" on public.%I for select to anon using (true)',
      v_table, v_table
    );
  end loop;
end $$;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'xo_tournaments','xo_tournament_players','xo_matches','xo_games',
    'xo_moves','xo_ratings','xo_pool_totals'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';

create or replace function private.xo_open_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.xo_matches%rowtype;
  v_first text;
begin
  select * into strict v_match from public.xo_matches where id = p_match_id for update;
  v_first := case when random() < 0.5 then v_match.player_x_id else v_match.player_o_id end;
  update public.xo_matches set status = 'pending', revision = revision + 1 where id = p_match_id;
  insert into public.xo_games (match_id, game_number, first_member_id, next_member_id)
  values (p_match_id, 1, v_first, v_first);
end;
$$;

create or replace function private.xo_settle_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.xo_matches%rowtype;
  v_scope text;
  v_winner_delta integer;
  v_loser_delta integer;
  v_loser_id text;
begin
  select * into strict v_match from public.xo_matches where id = p_match_id for update;
  if v_match.settlement_status = 'settled' then return; end if;
  if exists (select 1 from public.xo_pool_bets where match_id = p_match_id)
    or exists (select 1 from public.xo_side_bets where match_id = p_match_id) then
    raise exception using errcode = '55000', message = 'BETTING_ENGINE_NOT_READY';
  end if;
  select scope into v_scope from public.xo_tournaments where id = v_match.tournament_id;
  if v_scope = 'live' then
    v_winner_delta := case when v_match.stage = 'group' then 36 else 360 end;
    v_loser_delta := case when v_match.stage = 'group' then -18 else -180 end;
    v_loser_id := case when v_match.winner_id = v_match.player_x_id then v_match.player_o_id else v_match.player_x_id end;
    update public.xo_ratings set rating = rating + v_winner_delta, wins = wins + 1, updated_at = now()
    where member_id = v_match.winner_id;
    update public.xo_ratings set rating = rating + v_loser_delta, losses = losses + 1, updated_at = now()
    where member_id = v_loser_id;
  end if;
  update public.xo_matches set settlement_status = 'settled', revision = revision + 1 where id = p_match_id;
end;
$$;

create or replace function private.xo_complete_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.xo_matches%rowtype;
  v_winner_id text;
  v_loser_id text;
  v_next record;
  v_lucky_id text;
  v_ranked text[];
  v_match_id uuid;
  v_semifinal_winners text[];
begin
  select * into strict v_match from public.xo_matches where id = p_match_id for update;
  if v_match.status = 'completed' then return; end if;
  v_winner_id := case when v_match.player_x_wins >= v_match.target_wins then v_match.player_x_id else v_match.player_o_id end;
  v_loser_id := case when v_winner_id = v_match.player_x_id then v_match.player_o_id else v_match.player_x_id end;

  update public.xo_matches
  set status = 'completed', winner_id = v_winner_id, completed_at = now(), revision = revision + 1
  where id = p_match_id;

  if v_match.stage = 'group' then
    update public.xo_tournament_players
    set match_wins = match_wins + 1, game_wins = game_wins +
      case when member_id = v_match.player_x_id then v_match.player_x_wins else v_match.player_o_wins end
    where tournament_id = v_match.tournament_id and member_id = v_winner_id;
    update public.xo_tournament_players
    set match_losses = match_losses + 1, game_wins = game_wins +
      case when member_id = v_match.player_x_id then v_match.player_x_wins else v_match.player_o_wins end
    where tournament_id = v_match.tournament_id and member_id = v_loser_id;
  end if;

  perform private.xo_settle_match(p_match_id);

  if v_match.stage = 'group' and not exists (
    select 1 from public.xo_matches
    where tournament_id = v_match.tournament_id and stage = 'group'
      and round_number = v_match.round_number and status <> 'completed'
  ) then
    if v_match.round_number < 5 then
      update public.xo_tournaments set current_round = v_match.round_number + 1 where id = v_match.tournament_id;
      for v_next in
        select id from public.xo_matches
        where tournament_id = v_match.tournament_id and stage = 'group'
          and round_number = v_match.round_number + 1 and status = 'scheduled'
      loop
        perform private.xo_open_match(v_next.id);
      end loop;
    else
      select array_agg(member_id order by match_wins desc, game_wins desc, match_losses asc, member_id)
      into v_ranked
      from public.xo_tournament_players
      where tournament_id = v_match.tournament_id and group_eligible;
      select lucky_member_id into v_lucky_id from public.xo_tournaments where id = v_match.tournament_id;
      update public.xo_tournaments set stage = 'playoff', current_round = 6 where id = v_match.tournament_id;

      insert into public.xo_matches (
        tournament_id, stage, round_number, bracket_slot, player_x_id, player_o_id, target_wins, status
      ) values (
        v_match.tournament_id, 'semifinal', 1, 1, v_ranked[1], v_lucky_id, 3, 'scheduled'
      ) returning id into v_match_id;
      insert into public.xo_pool_totals (match_id, pick_member_id) values (v_match_id, v_ranked[1]), (v_match_id, v_lucky_id);
      perform private.xo_open_match(v_match_id);

      insert into public.xo_matches (
        tournament_id, stage, round_number, bracket_slot, player_x_id, player_o_id, target_wins, status
      ) values (
        v_match.tournament_id, 'semifinal', 1, 2, v_ranked[2], v_ranked[3], 3, 'scheduled'
      ) returning id into v_match_id;
      insert into public.xo_pool_totals (match_id, pick_member_id) values (v_match_id, v_ranked[2]), (v_match_id, v_ranked[3]);
      perform private.xo_open_match(v_match_id);
    end if;
  elsif v_match.stage = 'semifinal' and not exists (
    select 1 from public.xo_matches
    where tournament_id = v_match.tournament_id and stage = 'semifinal' and status <> 'completed'
  ) then
    select array_agg(winner_id order by bracket_slot) into v_semifinal_winners
    from public.xo_matches where tournament_id = v_match.tournament_id and stage = 'semifinal';
    insert into public.xo_matches (
      tournament_id, stage, round_number, bracket_slot, player_x_id, player_o_id, target_wins, status
    ) values (
      v_match.tournament_id, 'final', 2, 1, v_semifinal_winners[1], v_semifinal_winners[2], 3, 'scheduled'
    ) returning id into v_match_id;
    insert into public.xo_pool_totals (match_id, pick_member_id)
    values (v_match_id, v_semifinal_winners[1]), (v_match_id, v_semifinal_winners[2]);
    perform private.xo_open_match(v_match_id);
    update public.xo_tournaments set current_round = 7 where id = v_match.tournament_id;
  elsif v_match.stage = 'final' then
    update public.xo_tournaments
    set status = 'completed', stage = 'completed', champion_id = v_winner_id, completed_at = now()
    where id = v_match.tournament_id;
    update public.xo_tournament_players set final_placement = 1
    where tournament_id = v_match.tournament_id and member_id = v_winner_id;
  end if;
end;
$$;

create or replace function public.xo_make_move(
  p_member_id text,
  p_login_code text,
  p_request_id uuid,
  p_game_id uuid,
  p_row integer,
  p_col integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cached jsonb;
  v_result jsonb;
  v_game public.xo_games%rowtype;
  v_match public.xo_matches%rowtype;
  v_tournament public.xo_tournaments%rowtype;
  v_mark text;
  v_move_number integer;
  v_width integer;
  v_height integer;
  v_dir record;
  v_step integer;
  v_line integer;
  v_won boolean := false;
  v_other_id text;
  v_next_first text;
  v_next_game integer;
begin
  perform private.xo_assert_member(p_member_id, p_login_code);
  v_cached := private.xo_begin_command(
    p_member_id, 'make_move', p_request_id,
    jsonb_build_object('gameId', p_game_id, 'row', p_row, 'col', p_col)
  );
  if v_cached is not null then return v_cached; end if;

  select * into v_game from public.xo_games where id = p_game_id for update;
  if not found or v_game.status <> 'active' then
    raise exception using errcode = '22023', message = 'GAME_NOT_ACTIVE';
  end if;
  select * into strict v_match from public.xo_matches where id = v_game.match_id for update;
  select * into strict v_tournament from public.xo_tournaments where id = v_match.tournament_id;
  if v_tournament.status <> 'active' or (
    v_tournament.scope = 'test' and not exists (select 1 from public.xo_testers where member_id = p_member_id)
  ) then
    raise exception using errcode = '42501', message = 'FEATURE_NOT_AVAILABLE';
  end if;
  if p_member_id <> v_game.next_member_id then
    raise exception using errcode = '22023', message = 'NOT_YOUR_TURN';
  end if;
  if p_row < v_game.min_row or p_row > v_game.max_row or p_col < v_game.min_col or p_col > v_game.max_col then
    raise exception using errcode = '22023', message = 'INVALID_CELL';
  end if;
  if exists (select 1 from public.xo_moves where game_id = p_game_id and row = p_row and col = p_col) then
    raise exception using errcode = '22023', message = 'OCCUPIED_CELL';
  end if;

  select coalesce(max(move_number), 0) + 1 into v_move_number from public.xo_moves where game_id = p_game_id;
  v_mark := case when p_member_id = v_game.first_member_id then 'x' else 'o' end;
  v_other_id := case when p_member_id = v_match.player_x_id then v_match.player_o_id else v_match.player_x_id end;
  insert into public.xo_moves (game_id, move_number, member_id, mark, row, col)
  values (p_game_id, v_move_number, p_member_id, v_mark, p_row, p_col);

  v_height := v_game.max_row - v_game.min_row + 1;
  v_width := v_game.max_col - v_game.min_col + 1;
  if p_row = v_game.min_row then v_game.min_row := v_game.min_row - least(3, 36 - v_height); end if;
  if p_row = v_game.max_row then v_game.max_row := v_game.max_row + least(3, 36 - v_height); end if;
  if p_col = v_game.min_col then v_game.min_col := v_game.min_col - least(3, 36 - v_width); end if;
  if p_col = v_game.max_col then v_game.max_col := v_game.max_col + least(3, 36 - v_width); end if;

  for v_dir in select * from (values (1,0),(0,1),(1,1),(1,-1)) d(dr,dc) loop
    v_line := 1;
    for v_step in 1..35 loop
      exit when not exists (select 1 from public.xo_moves where game_id = p_game_id and member_id = p_member_id and row = p_row + v_step*v_dir.dr and col = p_col + v_step*v_dir.dc);
      v_line := v_line + 1;
    end loop;
    for v_step in 1..35 loop
      exit when not exists (select 1 from public.xo_moves where game_id = p_game_id and member_id = p_member_id and row = p_row - v_step*v_dir.dr and col = p_col - v_step*v_dir.dc);
      v_line := v_line + 1;
    end loop;
    if v_line >= 5 then v_won := true; exit; end if;
  end loop;

  if v_move_number = 1 then
    update public.xo_matches
    set status = 'active', started_at = coalesce(started_at, now()), betting_locked_at = now(), revision = revision + 1
    where id = v_match.id;
  end if;

  if v_won then
    update public.xo_games
    set status = 'completed', winner_id = p_member_id, next_member_id = null,
      min_row = v_game.min_row, max_row = v_game.max_row, min_col = v_game.min_col, max_col = v_game.max_col,
      completed_at = now()
    where id = p_game_id;
    if p_member_id = v_match.player_x_id then
      update public.xo_matches set player_x_wins = player_x_wins + 1, revision = revision + 1 where id = v_match.id
      returning player_x_wins into v_match.player_x_wins;
    else
      update public.xo_matches set player_o_wins = player_o_wins + 1, revision = revision + 1 where id = v_match.id
      returning player_o_wins into v_match.player_o_wins;
    end if;
    if greatest(v_match.player_x_wins, v_match.player_o_wins) >= v_match.target_wins then
      perform private.xo_complete_match(v_match.id);
    else
      select coalesce(max(game_number), 0) + 1 into v_next_game from public.xo_games where match_id = v_match.id;
      v_next_first := case when v_game.first_member_id = v_match.player_x_id then v_match.player_o_id else v_match.player_x_id end;
      insert into public.xo_games (match_id, game_number, first_member_id, next_member_id)
      values (v_match.id, v_next_game, v_next_first, v_next_first);
    end if;
  else
    update public.xo_games
    set next_member_id = v_other_id,
      min_row = v_game.min_row, max_row = v_game.max_row, min_col = v_game.min_col, max_col = v_game.max_col
    where id = p_game_id;
  end if;

  v_result := jsonb_build_object('gameId', p_game_id, 'moveNumber', v_move_number, 'winnerId', case when v_won then p_member_id else null end);
  return private.xo_finish_command(p_member_id, 'make_move', p_request_id, v_result);
end;
$$;

revoke all on function private.xo_open_match(uuid) from public, anon, authenticated;
revoke all on function private.xo_settle_match(uuid) from public, anon, authenticated;
revoke all on function private.xo_complete_match(uuid) from public, anon, authenticated;
revoke all on function public.xo_make_move(text, text, uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.xo_make_move(text, text, uuid, uuid, integer, integer) to anon;

notify pgrst, 'reload schema';

create or replace function private.xo_begin_command(
  p_member_id text,
  p_command_name text,
  p_request_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text := encode(extensions.digest(coalesce(p_payload, 'null'::jsonb)::text, 'sha256'), 'hex');
  v_command public.xo_command_log%rowtype;
begin
  select * into v_command
  from public.xo_command_log
  where member_id = p_member_id and request_id = p_request_id
  for update;

  if found then
    if v_command.command_name <> p_command_name or v_command.payload_hash <> v_hash then
      raise exception using errcode = '22023', message = 'REQUEST_ID_REUSED';
    end if;
    if v_command.status = 'completed' then
      return v_command.result;
    end if;
    raise exception using errcode = '55000', message = 'COMMAND_IN_PROGRESS';
  end if;

  insert into public.xo_command_log (member_id, command_name, request_id, payload_hash)
  values (p_member_id, p_command_name, p_request_id, v_hash);
  return null;
end;
$$;

create or replace function private.xo_finish_command(
  p_member_id text,
  p_command_name text,
  p_request_id uuid,
  p_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.xo_command_log
  set status = 'completed', result = p_result, completed_at = now()
  where member_id = p_member_id
    and command_name = p_command_name
    and request_id = p_request_id
    and status = 'started';
  if not found then
    raise exception using errcode = '55000', message = 'COMMAND_NOT_STARTED';
  end if;
  return p_result;
end;
$$;

create or replace function public.xo_get_snapshot(p_member_id text, p_login_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_visible boolean;
  v_tournament_id uuid;
  v_month date := date_trunc('month', current_date)::date;
  v_balance integer;
begin
  perform private.xo_assert_member(p_member_id, p_login_code);
  select release_mode into v_mode from public.xo_settings where id = true;
  v_visible := v_mode = 'live' or exists (
    select 1 from public.xo_testers where member_id = p_member_id
  );

  if not v_visible then
    return jsonb_build_object(
      'visible', false, 'releaseMode', v_mode, 'currentUser', '{}'::jsonb,
      'tournament', '{}'::jsonb, 'participants', '[]'::jsonb,
      'matches', '[]'::jsonb, 'games', '[]'::jsonb, 'moves', '[]'::jsonb,
      'ratings', '[]'::jsonb, 'poolTotals', '[]'::jsonb,
      'wallet', jsonb_build_object('scope', v_mode, 'balance', 0, 'recentLedger', '[]'::jsonb),
      'myBets', jsonb_build_object('pool', '[]'::jsonb, 'side', '[]'::jsonb)
    );
  end if;

  if v_mode = 'live' then
    insert into public.citizen_wallets (member_id, scope, balance)
    values (p_member_id, 'live', 0)
    on conflict (member_id, scope) do nothing;

    perform 1 from public.citizen_wallets
    where member_id = p_member_id and scope = 'live'
    for update;

    if not exists (
      select 1 from public.citizen_point_ledger
      where member_id = p_member_id and scope = 'live'
        and reason = 'monthly_grant' and grant_month = v_month
    ) then
      update public.citizen_wallets
      set balance = balance + 36, updated_at = now()
      where member_id = p_member_id and scope = 'live'
      returning balance into v_balance;
      insert into public.citizen_point_ledger (
        member_id, scope, amount, reason, grant_month, balance_after
      ) values (p_member_id, 'live', 36, 'monthly_grant', v_month, v_balance);
    end if;
  end if;

  select id into v_tournament_id
  from public.xo_tournaments
  order by (status = 'active') desc, created_at desc
  limit 1;

  select balance into v_balance from public.citizen_wallets
  where member_id = p_member_id and scope = v_mode;

  return jsonb_build_object(
    'visible', true,
    'releaseMode', v_mode,
    'currentUser', coalesce((select to_jsonb(m) - 'login_code' from public.members m where id = p_member_id), '{}'::jsonb),
    'tournament', coalesce((select to_jsonb(t) from public.xo_tournaments t where id = v_tournament_id), '{}'::jsonb),
    'participants', coalesce((select jsonb_agg(to_jsonb(p) order by p.seed, p.member_id) from public.xo_tournament_players p where tournament_id = v_tournament_id), '[]'::jsonb),
    'matches', coalesce((select jsonb_agg(to_jsonb(m) order by m.round_number, m.created_at) from public.xo_matches m where tournament_id = v_tournament_id), '[]'::jsonb),
    'games', coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at) from public.xo_games g join public.xo_matches m on m.id = g.match_id where m.tournament_id = v_tournament_id), '[]'::jsonb),
    'moves', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.xo_moves x join public.xo_games g on g.id = x.game_id join public.xo_matches m on m.id = g.match_id where m.tournament_id = v_tournament_id), '[]'::jsonb),
    'ratings', coalesce((select jsonb_agg(to_jsonb(r) order by r.rating desc, r.member_id) from public.xo_ratings r), '[]'::jsonb),
    'poolTotals', coalesce((select jsonb_agg(to_jsonb(pt) order by pt.match_id, pt.pick_member_id) from public.xo_pool_totals pt join public.xo_matches m on m.id = pt.match_id where m.tournament_id = v_tournament_id), '[]'::jsonb),
    'wallet', jsonb_build_object(
      'scope', v_mode, 'balance', coalesce(v_balance, 0),
      'recentLedger', coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from (select * from public.citizen_point_ledger where member_id = p_member_id and scope = v_mode order by created_at desc limit 20) l), '[]'::jsonb)
    ),
    'myBets', jsonb_build_object(
      'pool', coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from public.xo_pool_bets b where member_id = p_member_id and tournament_id = v_tournament_id), '[]'::jsonb),
      'side', coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from public.xo_side_bets b where (proposer_id = p_member_id or opponent_id = p_member_id) and tournament_id = v_tournament_id), '[]'::jsonb)
    )
  );
end;
$$;

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

  delete from public.xo_testers;
  insert into public.xo_testers (member_id, added_by)
  select distinct id, p_member_id
  from unnest(array_append(coalesce(p_tester_ids, array[]::text[]), 'tung')) requested(id);
  select jsonb_build_object('testerIds', jsonb_agg(member_id order by member_id)) into v_result
  from public.xo_testers;
  return private.xo_finish_command(p_member_id, 'set_testers', p_request_id, v_result);
end;
$$;

create or replace function public.xo_set_release_mode(
  p_member_id text,
  p_login_code text,
  p_request_id uuid,
  p_release_mode text
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
  if p_release_mode not in ('test', 'live') then
    raise exception using errcode = '22023', message = 'INVALID_RELEASE_MODE';
  end if;
  v_cached := private.xo_begin_command(p_member_id, 'set_release_mode', p_request_id, jsonb_build_object('releaseMode', p_release_mode));
  if v_cached is not null then return v_cached; end if;

  perform 1 from public.xo_settings where id = true for update;
  if p_release_mode = 'live' and (
    exists (select 1 from public.xo_tournaments where status = 'active')
    or not exists (select 1 from public.xo_tournaments where scope = 'test' and status = 'completed')
  ) then
    raise exception using errcode = '22023', message = 'TEST_GATE_INCOMPLETE';
  end if;
  update public.xo_settings set release_mode = p_release_mode, updated_at = now() where id = true;
  v_result := jsonb_build_object('releaseMode', p_release_mode);
  return private.xo_finish_command(p_member_id, 'set_release_mode', p_request_id, v_result);
end;
$$;

create or replace function public.xo_create_tournament(
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
  v_result jsonb;
  v_mode text;
  v_lucky_id text;
  v_tournament_id uuid;
  v_group_ids text[];
  v_pair record;
  v_match_id uuid;
  v_old_balance integer;
  v_new_balance integer;
begin
  perform private.xo_assert_member(p_member_id, p_login_code);
  if p_member_id <> 'tung' then
    raise exception using errcode = '42501', message = 'ONLY_TUNG_CAN_HOST';
  end if;
  v_cached := private.xo_begin_command(p_member_id, 'create_tournament', p_request_id, '{}'::jsonb);
  if v_cached is not null then return v_cached; end if;

  select release_mode into v_mode from public.xo_settings where id = true for update;
  if exists (select 1 from public.xo_tournaments where status = 'active') then
    raise exception using errcode = '55000', message = 'TOURNAMENT_ALREADY_ACTIVE';
  end if;

  select id into v_lucky_id from public.members order by random() limit 1;
  insert into public.xo_tournaments (host_id, lucky_member_id, scope)
  values (p_member_id, v_lucky_id, v_mode)
  returning id into v_tournament_id;

  insert into public.xo_tournament_players (
    tournament_id, member_id, is_lucky, group_eligible, seed
  )
  select v_tournament_id, id, id = v_lucky_id, id <> v_lucky_id,
    row_number() over (order by id)::integer
  from public.members;

  if v_mode = 'test' then
    for v_pair in select id as member_id from public.members loop
      select balance into v_old_balance from public.citizen_wallets
      where member_id = v_pair.member_id and scope = 'test'
      for update;
      v_old_balance := coalesce(v_old_balance, 0);
      insert into public.citizen_wallets (member_id, scope, balance)
      values (v_pair.member_id, 'test', 36)
      on conflict (member_id, scope) do update set balance = 36, updated_at = now()
      returning balance into v_new_balance;
      insert into public.citizen_point_ledger (
        member_id, scope, amount, reason, tournament_id, request_id, balance_after
      ) values (
        v_pair.member_id, 'test', 36 - v_old_balance, 'test_reset',
        v_tournament_id, p_request_id, v_new_balance
      );
    end loop;
  end if;

  select array_agg(id order by id) into v_group_ids
  from public.members where id <> v_lucky_id;

  for v_pair in
    select * from (values
      (1,1,6),(1,2,5),(1,3,4),
      (2,1,5),(2,6,4),(2,2,3),
      (3,1,4),(3,5,3),(3,6,2),
      (4,1,3),(4,4,2),(4,5,6),
      (5,1,2),(5,3,6),(5,4,5)
    ) schedule(round_number, player_x_index, player_o_index)
  loop
    insert into public.xo_matches (
      tournament_id, stage, round_number, player_x_id, player_o_id,
      target_wins, status, bracket_slot
    ) values (
      v_tournament_id, 'group', v_pair.round_number,
      v_group_ids[v_pair.player_x_index], v_group_ids[v_pair.player_o_index],
      2, case when v_pair.round_number = 1 then 'pending' else 'scheduled' end,
      null
    ) returning id into v_match_id;

    insert into public.xo_pool_totals (match_id, pick_member_id)
    values
      (v_match_id, v_group_ids[v_pair.player_x_index]),
      (v_match_id, v_group_ids[v_pair.player_o_index]);

    if v_pair.round_number = 1 then
      insert into public.xo_games (match_id, game_number, first_member_id, next_member_id)
      select v_match_id, 1, first_id, first_id
      from (select case when random() < 0.5
        then v_group_ids[v_pair.player_x_index]
        else v_group_ids[v_pair.player_o_index]
      end as first_id) chosen;
    end if;
  end loop;

  v_result := jsonb_build_object('tournamentId', v_tournament_id, 'luckyMemberId', v_lucky_id);
  return private.xo_finish_command(p_member_id, 'create_tournament', p_request_id, v_result);
end;
$$;

create or replace function public.xo_cancel_tournament(
  p_member_id text,
  p_login_code text,
  p_request_id uuid,
  p_tournament_id uuid,
  p_reason text
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
  v_cached := private.xo_begin_command(
    p_member_id, 'cancel_tournament', p_request_id,
    jsonb_build_object('tournamentId', p_tournament_id, 'reason', p_reason)
  );
  if v_cached is not null then return v_cached; end if;

  perform 1 from public.xo_tournaments where id = p_tournament_id and status = 'active' for update;
  if not found then
    raise exception using errcode = '22023', message = 'TOURNAMENT_NOT_ACTIVE';
  end if;
  if exists (
    select 1 from public.xo_matches
    where tournament_id = p_tournament_id and settlement_status = 'settled'
  ) then
    raise exception using errcode = '55000', message = 'SETTLED_TOURNAMENT_CANNOT_CANCEL';
  end if;

  update public.xo_games g set status = 'cancelled', next_member_id = null, completed_at = now()
  from public.xo_matches m
  where g.match_id = m.id and m.tournament_id = p_tournament_id and g.status = 'active';
  update public.xo_matches
  set status = 'cancelled', settlement_status = 'refunded', revision = revision + 1
  where tournament_id = p_tournament_id and status in ('scheduled', 'pending', 'active');
  update public.xo_tournaments
  set status = 'cancelled', stage = 'cancelled', cancellation_reason = p_reason, cancelled_at = now()
  where id = p_tournament_id;

  v_result := jsonb_build_object('tournamentId', p_tournament_id, 'status', 'cancelled');
  return private.xo_finish_command(p_member_id, 'cancel_tournament', p_request_id, v_result);
end;
$$;

revoke all on function private.xo_begin_command(text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function private.xo_finish_command(text, text, uuid, jsonb) from public, anon, authenticated;

revoke all on function public.xo_get_snapshot(text, text) from public, anon, authenticated;
revoke all on function public.xo_set_testers(text, text, uuid, text[]) from public, anon, authenticated;
revoke all on function public.xo_set_release_mode(text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.xo_create_tournament(text, text, uuid) from public, anon, authenticated;
revoke all on function public.xo_cancel_tournament(text, text, uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.xo_get_snapshot(text, text) to anon;
grant execute on function public.xo_set_testers(text, text, uuid, text[]) to anon;
grant execute on function public.xo_set_release_mode(text, text, uuid, text) to anon;
grant execute on function public.xo_create_tournament(text, text, uuid) to anon;
grant execute on function public.xo_cancel_tournament(text, text, uuid, uuid, text) to anon;

notify pgrst, 'reload schema';
