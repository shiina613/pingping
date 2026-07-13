begin;

select plan(19);

insert into public.xo_testers(member_id, added_by)
select id, 'tung' from public.members on conflict do nothing;
select public.xo_create_tournament('tung','PP-TUNG-2026',gen_random_uuid());

select m.id as match_id, m.player_x_id as x_id, m.player_o_id as o_id, g.id as game_id
from public.xo_matches m
join public.xo_games g on g.match_id = m.id and g.status = 'active'
where m.status = 'pending'
order by m.round_number, m.id limit 1 \gset
select login_code as x_code from public.members where id = :'x_id' \gset
select login_code as o_code from public.members where id = :'o_id' \gset
update public.xo_games set first_member_id = :'x_id', next_member_id = :'x_id' where id = :'game_id';

select throws_ok(
  format($$ select public.xo_make_move(%L,%L,gen_random_uuid(),%L,0,0) $$, :'o_id', :'o_code', :'game_id'),
  '22023', 'NOT_YOUR_TURN'
);
select throws_ok(
  format($$ select public.xo_make_move(%L,%L,gen_random_uuid(),%L,20,20) $$, :'x_id', :'x_code', :'game_id'),
  '22023', 'INVALID_CELL'
);
select lives_ok(
  format($$ select public.xo_make_move(%L,%L,'00000000-0000-4000-8000-000000000101',%L,0,0) $$, :'x_id', :'x_code', :'game_id')
);
select is((select count(*) from public.xo_moves where game_id = :'game_id'), 1::bigint, 'one immutable move');
select isnt((select next_member_id from public.xo_games where id = :'game_id'), :'x_id', 'turn switches');
select is((select min_row from public.xo_games where id = :'game_id'), -3, 'top edge expands');
select is((select min_col from public.xo_games where id = :'game_id'), -3, 'left edge expands');
select is(
  public.xo_make_move(:'x_id', :'x_code', '00000000-0000-4000-8000-000000000101', :'game_id', 0, 0)->>'moveNumber',
  '1', 'exact move retry returns stored result'
);

create function pg_temp.win_game(p_game_id uuid, p_winner_id text)
returns void language plpgsql as $$
declare
  v_loser_id text;
  v_winner_code text;
  v_loser_code text;
  i integer;
begin
  select case when player_x_id = p_winner_id then player_o_id else player_x_id end
  into v_loser_id from public.xo_matches where id = (select match_id from public.xo_games where id = p_game_id);
  select login_code into v_winner_code from public.members where id = p_winner_id;
  select login_code into v_loser_code from public.members where id = v_loser_id;
  update public.xo_games set first_member_id = p_winner_id, next_member_id = p_winner_id where id = p_game_id;
  for i in 0..3 loop
    perform public.xo_make_move(p_winner_id,v_winner_code,gen_random_uuid(),p_game_id,4,i);
    perform public.xo_make_move(v_loser_id,v_loser_code,gen_random_uuid(),p_game_id,8,i);
  end loop;
  perform public.xo_make_move(p_winner_id,v_winner_code,gen_random_uuid(),p_game_id,4,4);
end;
$$;

create function pg_temp.win_match(p_match_id uuid, p_winner_id text)
returns void language plpgsql as $$
declare
  v_game_id uuid;
begin
  loop
    exit when (select status = 'completed' from public.xo_matches where id = p_match_id);
    select id into v_game_id from public.xo_games where match_id = p_match_id and status = 'active';
    perform pg_temp.win_game(v_game_id, p_winner_id);
  end loop;
end;
$$;

select pg_temp.win_game(:'game_id', :'x_id');
select is((select status from public.xo_games where id = :'game_id'), 'completed', 'connect five completes game');
select is((select winner_id from public.xo_games where id = :'game_id'), :'x_id', 'connect five records winner');
select pg_temp.win_match(:'match_id', :'x_id');
select is((select player_x_wins from public.xo_matches where id = :'match_id'), 2, 'BO3 winner reaches two');
select is((select status from public.xo_matches where id = :'match_id'), 'completed', 'series completes');
select is((select settlement_status from public.xo_matches where id = :'match_id'), 'settled', 'series settles once');

do $$
declare v_match record;
begin
  for v_match in select id, player_x_id from public.xo_matches where round_number = 1 and status = 'pending' loop
    perform pg_temp.win_match(v_match.id, v_match.player_x_id);
  end loop;
end $$;
select is((select count(*) from public.xo_matches where stage = 'group' and round_number = 2 and status = 'pending'), 3::bigint, 'round two opens');

do $$
declare v_round integer; v_match record;
begin
  for v_round in 2..5 loop
    for v_match in select id, player_x_id from public.xo_matches where stage = 'group' and round_number = v_round and status = 'pending' loop
      perform pg_temp.win_match(v_match.id, v_match.player_x_id);
    end loop;
  end loop;
end $$;
select is((select count(*) from public.xo_matches where stage = 'semifinal'), 2::bigint, 'two BO5 semifinals created');
select is((select count(*) from public.xo_matches where stage = 'semifinal' and target_wins = 3 and status = 'pending'), 2::bigint, 'semifinals open as BO5');

do $$
declare v_match record;
begin
  for v_match in select id, player_x_id from public.xo_matches where stage = 'semifinal' and status = 'pending' loop
    perform pg_temp.win_match(v_match.id, v_match.player_x_id);
  end loop;
end $$;
select is((select count(*) from public.xo_matches where stage = 'final' and status = 'pending'), 1::bigint, 'final opens');

select id as final_id, player_x_id as champion_id from public.xo_matches where stage = 'final' \gset
select pg_temp.win_match(:'final_id', :'champion_id');
select is((select status from public.xo_tournaments), 'completed', 'tournament completes');
select is((select champion_id from public.xo_tournaments), :'champion_id', 'final winner is champion');

select * from finish();
rollback;
