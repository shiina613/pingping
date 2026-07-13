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
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
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
  amount integer not null check (amount <> 0),
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
