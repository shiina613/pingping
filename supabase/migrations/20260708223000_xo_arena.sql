create table if not exists public.xo_matches (
  id uuid primary key default gen_random_uuid(),
  challenger_id text not null references public.members(id) on delete cascade,
  opponent_id text not null references public.members(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  wager integer not null check (wager > 0),
  target_wins integer not null default 1 check (target_wins = 1),
  challenger_wins integer not null default 0,
  opponent_wins integer not null default 0,
  winner_id text references public.members(id) on delete set null,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  check (challenger_id <> opponent_id)
);

create table if not exists public.xo_games (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.xo_matches(id) on delete cascade,
  game_number integer not null default 1,
  first_member_id text not null references public.members(id) on delete cascade,
  next_member_id text not null references public.members(id) on delete cascade,
  winner_id text references public.members(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'draw', 'completed')),
  moves jsonb not null default '[]'::jsonb,
  bounds jsonb not null default '{"minRow":0,"maxRow":8,"minCol":0,"maxCol":8}'::jsonb,
  max_board_size integer not null default 36 check (max_board_size = 36),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists xo_one_active_game_per_match_idx
  on public.xo_games(match_id) where status = 'active';

create table if not exists public.xo_ratings (
  member_id text primary key references public.members(id) on delete cascade,
  rating integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.citizen_wallets (
  member_id text primary key references public.members(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.citizen_point_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.members(id) on delete cascade,
  amount integer not null,
  reason text not null,
  grant_month date,
  match_id uuid references public.xo_matches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, grant_month)
);

create table if not exists public.xo_bets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.xo_matches(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  pick_member_id text not null references public.members(id) on delete cascade,
  stake integer not null check (stake > 0),
  status text not null default 'open' check (status in ('open', 'settled', 'refunded', 'lost')),
  payout integer not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, member_id)
);

alter table public.xo_matches enable row level security;
alter table public.xo_games enable row level security;
alter table public.xo_ratings enable row level security;
alter table public.citizen_wallets enable row level security;
alter table public.citizen_point_ledger enable row level security;
alter table public.xo_bets enable row level security;

grant select on public.xo_matches, public.xo_games, public.xo_ratings, public.citizen_wallets, public.xo_bets to anon;

do $$
declare table_name text;
begin
  foreach table_name in array array['xo_matches','xo_games','xo_ratings','citizen_wallets','xo_bets'] loop
    execute format('drop policy if exists "anon_select_%s" on public.%I', table_name, table_name);
    execute format('create policy "anon_select_%s" on public.%I for select to anon using (true)', table_name, table_name);
  end loop;
end $$;

create or replace function public.xo_grant_monthly_citizen_points(p_member_id text, p_login_code text)
returns table(balance integer, granted boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_month date := date_trunc('month', now())::date;
  v_inserted integer := 0;
begin
  if not exists (select 1 from public.members where id = p_member_id and login_code = p_login_code) then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;
  insert into public.citizen_wallets(member_id) values (p_member_id) on conflict do nothing;
  insert into public.citizen_point_ledger(member_id, amount, reason, grant_month)
  values (p_member_id, 36, 'monthly_grant', v_month) on conflict (member_id, grant_month) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.citizen_wallets w set balance = w.balance + 36, updated_at = now() where w.member_id = p_member_id;
  end if;
  return query select w.balance, v_inserted > 0 from public.citizen_wallets w where w.member_id = p_member_id;
end;
$$;

create or replace function public.xo_create_challenge(
  p_member_id text, p_login_code text, p_opponent_id text, p_wager integer
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_match_id uuid;
begin
  if not exists (select 1 from public.members where id = p_member_id and login_code = p_login_code) then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;
  if p_member_id = p_opponent_id then
    raise exception using errcode = '22023', message = 'CHALLENGE_YOURSELF';
  end if;
  if p_wager < 1 or not exists (select 1 from public.citizen_wallets where member_id = p_member_id and balance >= p_wager) then
    raise exception using errcode = '22023', message = 'INSUFFICIENT_BALANCE';
  end if;
  if not exists (select 1 from public.members where id = p_opponent_id) then
    raise exception using errcode = '22023', message = 'INVALID_OPPONENT';
  end if;
  if exists (
    select 1 from public.xo_matches where status in ('pending','active')
      and (p_member_id in (challenger_id, opponent_id) or p_opponent_id in (challenger_id, opponent_id))
  ) then
    raise exception using errcode = '22023', message = 'PLAYER_BUSY';
  end if;

  update public.citizen_wallets set balance = balance - p_wager, updated_at = now() where member_id = p_member_id;
  insert into public.xo_matches(challenger_id, opponent_id, wager)
  values (p_member_id, p_opponent_id, p_wager) returning id into v_match_id;
  insert into public.citizen_point_ledger(member_id, amount, reason, match_id)
  values (p_member_id, -p_wager, 'challenge_escrow', v_match_id);
  return v_match_id;
end;
$$;

create or replace function public.xo_respond_challenge(
  p_member_id text, p_login_code text, p_match_id uuid, p_accept boolean
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare v_match public.xo_matches%rowtype;
begin
  if not exists (select 1 from public.members where id = p_member_id and login_code = p_login_code) then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;
  select * into v_match from public.xo_matches where id = p_match_id for update;
  if not found or v_match.status <> 'pending'
    or (p_accept and v_match.opponent_id <> p_member_id)
    or (not p_accept and p_member_id not in (v_match.challenger_id, v_match.opponent_id)) then
    raise exception using errcode = '22023', message = 'CHALLENGE_NOT_AVAILABLE';
  end if;

  if not p_accept then
    update public.xo_matches set status = 'cancelled', completed_at = now() where id = p_match_id;
    update public.citizen_wallets set balance = balance + v_match.wager, updated_at = now() where member_id = v_match.challenger_id;
    insert into public.citizen_point_ledger(member_id, amount, reason, match_id)
    values (v_match.challenger_id, v_match.wager, 'challenge_refund', p_match_id);
    return 'rejected';
  end if;

  if not exists (select 1 from public.citizen_wallets where member_id = p_member_id and balance >= v_match.wager) then
    raise exception using errcode = '22023', message = 'INSUFFICIENT_BALANCE';
  end if;
  update public.citizen_wallets set balance = balance - v_match.wager, updated_at = now() where member_id = p_member_id;
  insert into public.citizen_point_ledger(member_id, amount, reason, match_id)
  values (p_member_id, -v_match.wager, 'challenge_escrow', p_match_id);
  update public.xo_matches set status = 'active', accepted_at = now() where id = p_match_id;
  insert into public.xo_games(match_id, first_member_id, next_member_id)
  values (p_match_id, v_match.challenger_id, v_match.challenger_id);
  return 'accepted';
end;
$$;

create or replace function public.xo_place_bet(
  p_member_id text, p_login_code text, p_match_id uuid, p_pick_member_id text, p_stake integer
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_bet_id uuid; v_match public.xo_matches%rowtype;
begin
  if not exists (select 1 from public.members where id = p_member_id and login_code = p_login_code) then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;
  select * into v_match from public.xo_matches where id = p_match_id and status = 'active' and locked_at is null;
  if not found then raise exception using errcode = '22023', message = 'BETTING_LOCKED'; end if;
  if p_member_id in (v_match.challenger_id, v_match.opponent_id) then
    raise exception using errcode = '22023', message = 'PLAYERS_CANNOT_POOL_BET';
  end if;
  if p_pick_member_id not in (v_match.challenger_id, v_match.opponent_id) then
    raise exception using errcode = '22023', message = 'INVALID_PICK';
  end if;
  if p_stake < 1 or not exists (select 1 from public.citizen_wallets where member_id = p_member_id and balance >= p_stake) then
    raise exception using errcode = '22023', message = 'INSUFFICIENT_BALANCE';
  end if;
  update public.citizen_wallets set balance = balance - p_stake, updated_at = now() where member_id = p_member_id;
  insert into public.xo_bets(match_id, member_id, pick_member_id, stake)
  values (p_match_id, p_member_id, p_pick_member_id, p_stake) returning id into v_bet_id;
  insert into public.citizen_point_ledger(member_id, amount, reason, match_id)
  values (p_member_id, -p_stake, 'spectator_bet', p_match_id);
  return v_bet_id;
end;
$$;

create or replace function private.xo_settle_match(p_match_id uuid, p_winner_id text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_match public.xo_matches%rowtype;
  v_loser_id text;
  v_winning_pool integer;
  v_losing_pool integer;
  v_paid integer := 0;
  v_total integer;
  v_payout integer;
  v_bet public.xo_bets%rowtype;
begin
  select * into v_match from public.xo_matches where id = p_match_id for update;
  v_loser_id := case when p_winner_id = v_match.challenger_id then v_match.opponent_id else v_match.challenger_id end;
  update public.xo_matches set status = 'completed', winner_id = p_winner_id, completed_at = now() where id = p_match_id;
  update public.citizen_wallets set balance = balance + v_match.wager * 2, updated_at = now() where member_id = p_winner_id;
  insert into public.citizen_point_ledger(member_id, amount, reason, match_id)
  values (p_winner_id, v_match.wager * 2, 'challenge_payout', p_match_id);

  insert into public.xo_ratings(member_id) values (p_winner_id), (v_loser_id) on conflict do nothing;
  update public.xo_ratings set rating = rating + 36, wins = wins + 1, updated_at = now() where member_id = p_winner_id; -- winner +36
  update public.xo_ratings set rating = rating - 18, losses = losses + 1, updated_at = now() where member_id = v_loser_id; -- loser -18

  select coalesce(sum(stake), 0) into v_winning_pool from public.xo_bets where match_id = p_match_id and pick_member_id = p_winner_id and status = 'open';
  select coalesce(sum(stake), 0) into v_losing_pool from public.xo_bets where match_id = p_match_id and pick_member_id <> p_winner_id and status = 'open';
  v_total := v_winning_pool + v_losing_pool;
  if v_winning_pool = 0 or v_losing_pool = 0 then
    for v_bet in select * from public.xo_bets where match_id = p_match_id and status = 'open' loop
      update public.citizen_wallets set balance = balance + v_bet.stake, updated_at = now() where member_id = v_bet.member_id;
      update public.xo_bets set status = 'refunded', payout = v_bet.stake where id = v_bet.id;
    end loop;
    return;
  end if;
  for v_bet in select * from public.xo_bets where match_id = p_match_id and pick_member_id = p_winner_id and status = 'open' order by id loop
    v_payout := floor(v_bet.stake::numeric * v_total / v_winning_pool)::integer;
    v_paid := v_paid + v_payout;
    update public.citizen_wallets set balance = balance + v_payout, updated_at = now() where member_id = v_bet.member_id;
    update public.xo_bets set status = 'settled', payout = v_payout where id = v_bet.id;
    insert into public.citizen_point_ledger(member_id, amount, reason, match_id) values (v_bet.member_id, v_payout, 'spectator_payout', p_match_id);
  end loop;
  if v_paid < v_total then
    select * into v_bet from public.xo_bets where match_id = p_match_id and pick_member_id = p_winner_id order by id limit 1;
    update public.citizen_wallets set balance = balance + v_total - v_paid where member_id = v_bet.member_id;
    update public.xo_bets set payout = payout + v_total - v_paid where id = v_bet.id;
  end if;
  update public.xo_bets set status = 'lost' where match_id = p_match_id and pick_member_id <> p_winner_id and status = 'open';
end;
$$;

create or replace function public.xo_make_move(
  p_member_id text, p_login_code text, p_game_id uuid, p_row integer, p_col integer
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_game public.xo_games%rowtype;
  v_match public.xo_matches%rowtype;
  v_moves jsonb;
  v_mark text;
  v_other text;
  v_won boolean := false;
  v_count integer;
  v_dr integer;
  v_dc integer;
  v_step integer;
  v_game_wins integer;
  v_next_game integer;
  v_min_row integer;
  v_max_row integer;
  v_min_col integer;
  v_max_col integer;
  v_bounds jsonb;
begin
  if not exists (select 1 from public.members where id = p_member_id and login_code = p_login_code) then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;
  select * into v_game from public.xo_games where id = p_game_id for update;
  select * into v_match from public.xo_matches where id = v_game.match_id for update;
  if not found or v_game.status <> 'active' or v_match.status <> 'active' then raise exception using errcode = '22023', message = 'GAME_NOT_ACTIVE'; end if;
  if v_game.next_member_id <> p_member_id then raise exception using errcode = '22023', message = 'NOT_YOUR_TURN'; end if;
  if p_row < (v_game.bounds->>'minRow')::integer or p_row > (v_game.bounds->>'maxRow')::integer
    or p_col < (v_game.bounds->>'minCol')::integer or p_col > (v_game.bounds->>'maxCol')::integer then
    raise exception using errcode = '22023', message = 'INVALID_CELL';
  end if;
  if exists (select 1 from jsonb_array_elements(v_game.moves) move where (move->>'row')::integer = p_row and (move->>'col')::integer = p_col) then
    raise exception using errcode = '22023', message = 'OCCUPIED_CELL';
  end if;

  v_mark := case when p_member_id = v_game.first_member_id then 'x' else 'o' end;
  v_other := case when p_member_id = v_match.challenger_id then v_match.opponent_id else v_match.challenger_id end;
  v_moves := v_game.moves || jsonb_build_array(jsonb_build_object('row', p_row, 'col', p_col, 'mark', v_mark, 'member_id', p_member_id));
  for v_dr, v_dc in select * from (values (1,0),(0,1),(1,1),(1,-1)) direction(dr, dc) loop
    v_count := 1;
    for v_step in 1..4 loop
      exit when not exists (select 1 from jsonb_array_elements(v_moves) move where (move->>'row')::integer = p_row + v_dr * v_step and (move->>'col')::integer = p_col + v_dc * v_step and move->>'mark' = v_mark);
      v_count := v_count + 1;
    end loop;
    for v_step in 1..4 loop
      exit when not exists (select 1 from jsonb_array_elements(v_moves) move where (move->>'row')::integer = p_row - v_dr * v_step and (move->>'col')::integer = p_col - v_dc * v_step and move->>'mark' = v_mark);
      v_count := v_count + 1;
    end loop;
    if v_count >= 5 then v_won := true; exit; end if;
  end loop;

  v_min_row := (v_game.bounds->>'minRow')::integer;
  v_max_row := (v_game.bounds->>'maxRow')::integer;
  v_min_col := (v_game.bounds->>'minCol')::integer;
  v_max_col := (v_game.bounds->>'maxCol')::integer;
  if p_row = v_min_row then v_min_row := v_min_row - least(3, 36 - (v_max_row - v_min_row + 1)); end if;
  if p_row = v_max_row then v_max_row := v_max_row + least(3, 36 - (v_max_row - v_min_row + 1)); end if;
  if p_col = v_min_col then v_min_col := v_min_col - least(3, 36 - (v_max_col - v_min_col + 1)); end if;
  if p_col = v_max_col then v_max_col := v_max_col + least(3, 36 - (v_max_col - v_min_col + 1)); end if;
  v_bounds := jsonb_build_object('minRow', v_min_row, 'maxRow', v_max_row, 'minCol', v_min_col, 'maxCol', v_max_col);

  update public.xo_matches set locked_at = coalesce(locked_at, now()) where id = v_match.id;
  if not v_won then
    update public.xo_games set moves = v_moves, bounds = v_bounds, next_member_id = v_other where id = p_game_id;
    return jsonb_build_object('status', 'moved');
  end if;

  update public.xo_games set moves = v_moves, bounds = v_bounds, status = 'completed', winner_id = p_member_id, completed_at = now() where id = p_game_id;
  if p_member_id = v_match.challenger_id then
    update public.xo_matches set challenger_wins = challenger_wins + 1 where id = v_match.id returning challenger_wins into v_game_wins;
  else
    update public.xo_matches set opponent_wins = opponent_wins + 1 where id = v_match.id returning opponent_wins into v_game_wins;
  end if;
  if v_game_wins >= v_match.target_wins then
    perform private.xo_settle_match(v_match.id, p_member_id);
    return jsonb_build_object('status', 'match_won', 'winnerId', p_member_id);
  end if;
  v_next_game := v_game.game_number + 1;
  insert into public.xo_games(match_id, game_number, first_member_id, next_member_id)
  values (v_match.id, v_next_game, case when v_next_game % 2 = 0 then v_match.opponent_id else v_match.challenger_id end,
    case when v_next_game % 2 = 0 then v_match.opponent_id else v_match.challenger_id end);
  return jsonb_build_object('status', 'game_won', 'winnerId', p_member_id);
end;
$$;

revoke execute on function public.xo_grant_monthly_citizen_points(text, text) from public, anon, authenticated;
revoke execute on function public.xo_create_challenge(text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.xo_respond_challenge(text, text, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.xo_place_bet(text, text, uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.xo_make_move(text, text, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.xo_grant_monthly_citizen_points(text, text) to anon;
grant execute on function public.xo_create_challenge(text, text, text, integer) to anon;
grant execute on function public.xo_respond_challenge(text, text, uuid, boolean) to anon;
grant execute on function public.xo_place_bet(text, text, uuid, text, integer) to anon;
grant execute on function public.xo_make_move(text, text, uuid, integer, integer) to anon;

alter publication supabase_realtime add table public.xo_matches;
alter publication supabase_realtime add table public.xo_games;
alter publication supabase_realtime add table public.xo_ratings;
alter publication supabase_realtime add table public.citizen_wallets;
alter publication supabase_realtime add table public.xo_bets;

notify pgrst, 'reload schema';
