begin;

select plan(23);
insert into public.xo_testers(member_id, added_by)
select id, 'tung' from public.members on conflict do nothing;
select public.xo_create_tournament('tung','PP-TUNG-2026',gen_random_uuid());

select m.id as match_id, m.player_x_id as x_id, m.player_o_id as o_id, g.id as game_id
from public.xo_matches m join public.xo_games g on g.match_id = m.id
where m.status = 'pending' order by m.id limit 1 \gset
select id as spectator_id, login_code as spectator_code from public.members
where id not in (:'x_id', :'o_id') order by id limit 1 \gset
select login_code as x_code from public.members where id = :'x_id' \gset
select login_code as o_code from public.members where id = :'o_id' \gset

select throws_ok(
  format($$select public.xo_place_pool_bet(%L,%L,gen_random_uuid(),%L,%L,5)$$, :'x_id', :'x_code', :'match_id', :'x_id'),
  '42501', 'MATCH_PLAYERS_CANNOT_POOL_BET'
);
select lives_ok(
  format($$select public.xo_place_pool_bet(%L,%L,'00000000-0000-4000-8000-000000000301',%L,%L,10)$$, :'spectator_id', :'spectator_code', :'match_id', :'x_id')
);
select is((select balance from public.citizen_wallets where member_id = :'spectator_id' and scope = 'test'), 26, 'stake enters escrow');
select is((select count(*) from public.xo_pool_bets where match_id = :'match_id' and member_id = :'spectator_id'), 1::bigint, 'one pool position');
select is(
  public.xo_place_pool_bet(:'spectator_id', :'spectator_code', '00000000-0000-4000-8000-000000000301', :'match_id', :'x_id', 10)->>'stake',
  '10', 'pool retry is idempotent'
);
select throws_ok(
  format($$select public.xo_place_pool_bet(%L,%L,gen_random_uuid(),%L,%L,30)$$, :'spectator_id', :'spectator_code', :'match_id', :'o_id'),
  '22023', 'POOL_POSITION_EXISTS'
);

select public.xo_propose_side_bet(:'x_id', :'x_code', gen_random_uuid(), :'match_id', 5) as side_result \gset
select is((select balance from public.citizen_wallets where member_id = :'x_id' and scope = 'test'), 31, 'proposal escrows proposer stake');
select lives_ok(
  format($$select public.xo_respond_side_bet(%L,%L,gen_random_uuid(),%L,'reject')$$, :'o_id', :'o_code', (:'side_result'::jsonb->>'betId'))
);
select is((select balance from public.citizen_wallets where member_id = :'x_id' and scope = 'test'), 36, 'rejection refunds once');

update public.xo_games set first_member_id = :'x_id', next_member_id = :'x_id' where id = :'game_id';
select public.xo_make_move(:'x_id', :'x_code', gen_random_uuid(), :'game_id', 0, 0);
select throws_ok(
  format($$select public.xo_place_pool_bet(%L,%L,gen_random_uuid(),%L,%L,1)$$, :'spectator_id', :'spectator_code', :'match_id', :'o_id'),
  '22023', 'BETTING_LOCKED'
);

select m.id as settle_match_id, m.player_x_id as settle_x_id, m.player_o_id as settle_o_id
from public.xo_matches m where m.status = 'pending' and m.id <> :'match_id' order by m.id limit 1 \gset
select login_code as settle_x_code from public.members where id = :'settle_x_id' \gset
select login_code as settle_o_code from public.members where id = :'settle_o_id' \gset
select id as pool_a_id, login_code as pool_a_code from public.members
where id not in (:'settle_x_id', :'settle_o_id') order by id limit 1 offset 0 \gset
select id as pool_b_id, login_code as pool_b_code from public.members
where id not in (:'settle_x_id', :'settle_o_id') order by id limit 1 offset 1 \gset
select id as pool_c_id, login_code as pool_c_code from public.members
where id not in (:'settle_x_id', :'settle_o_id') order by id limit 1 offset 2 \gset

select public.xo_place_pool_bet(:'pool_a_id', :'pool_a_code', gen_random_uuid(), :'settle_match_id', :'settle_x_id', 2);
select public.xo_place_pool_bet(:'pool_b_id', :'pool_b_code', gen_random_uuid(), :'settle_match_id', :'settle_x_id', 1);
select public.xo_place_pool_bet(:'pool_c_id', :'pool_c_code', gen_random_uuid(), :'settle_match_id', :'settle_o_id', 2);
select is((select sum(total_stake) from public.xo_pool_totals where match_id = :'settle_match_id'), 5::bigint, 'pool totals expose aggregate escrow');

select
  (select balance from public.citizen_wallets where member_id = :'settle_x_id' and scope = 'test') as settle_x_before,
  (select balance from public.citizen_wallets where member_id = :'settle_o_id' and scope = 'test') as settle_o_before \gset
select public.xo_propose_side_bet(:'settle_x_id', :'settle_x_code', gen_random_uuid(), :'settle_match_id', 5) as accepted_side_result \gset
select throws_ok(
  format($$select public.xo_respond_side_bet(%L,%L,gen_random_uuid(),%L,'accept')$$,
    :'settle_x_id', :'settle_x_code', (:'accepted_side_result'::jsonb->>'betId')),
  '42501', 'ONLY_OPPONENT_CAN_RESPOND'
);
select lives_ok(
  format($$select public.xo_respond_side_bet(%L,%L,gen_random_uuid(),%L,'accept')$$,
    :'settle_o_id', :'settle_o_code', (:'accepted_side_result'::jsonb->>'betId'))
);
select is((select status from public.xo_side_bets where match_id = :'settle_match_id'), 'accepted', 'opponent accepts equal stake');
select is((select balance from public.citizen_wallets where member_id = :'settle_x_id' and scope = 'test'), :'settle_x_before'::integer - 5, 'proposer stake remains escrowed');
select is((select balance from public.citizen_wallets where member_id = :'settle_o_id' and scope = 'test'), :'settle_o_before'::integer - 5, 'opponent escrows equal stake');

create function pg_temp.settle_win_game(p_game_id uuid, p_winner_id text)
returns void language plpgsql as $$
declare v_loser_id text; v_winner_code text; v_loser_code text; i integer;
begin
  select case when player_x_id = p_winner_id then player_o_id else player_x_id end into v_loser_id
  from public.xo_matches where id = (select match_id from public.xo_games where id = p_game_id);
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
create function pg_temp.settle_win_match(p_match_id uuid, p_winner_id text)
returns void language plpgsql as $$
declare v_game_id uuid;
begin
  loop
    exit when (select status = 'completed' from public.xo_matches where id = p_match_id);
    select id into v_game_id from public.xo_games where match_id = p_match_id and status = 'active';
    perform pg_temp.settle_win_game(v_game_id, p_winner_id);
  end loop;
end;
$$;
select pg_temp.settle_win_match(:'settle_match_id', :'settle_x_id');

select is((select count(*) from public.xo_matches where id = :'settle_match_id' and settlement_status = 'settled'), 1::bigint, 'match settles once');
select is((select sum(amount) from public.citizen_point_ledger where match_id = :'settle_match_id'), 0::bigint, 'all match debits and credits net to zero');
select is((select sum(payout) from public.xo_pool_bets where match_id = :'settle_match_id'), 5::bigint, 'pool payout conserves escrow');
select is((select payout from public.xo_side_bets where match_id = :'settle_match_id'), 10, 'winner receives both side stakes');
select is(
  (select sum(balance) from public.citizen_wallets where scope = 'test')
    + (select coalesce(sum(stake), 0) from public.xo_pool_bets where status = 'open')
    + (select coalesce(sum(stake), 0) from public.xo_side_bets where status = 'proposed')
    + (select coalesce(sum(stake * 2), 0) from public.xo_side_bets where status = 'accepted'),
  252::bigint,
  'wallet balances plus open escrow are conserved'
);

select m.id as pending_side_match_id, m.player_x_id as pending_side_x_id, m.player_o_id as pending_side_o_id, g.id as pending_side_game_id
from public.xo_matches m join public.xo_games g on g.match_id = m.id and g.status = 'active'
where m.status = 'pending' and m.id not in (:'match_id', :'settle_match_id') order by m.id limit 1 \gset
select login_code as pending_side_x_code from public.members where id = :'pending_side_x_id' \gset
select balance as pending_side_before from public.citizen_wallets where member_id = :'pending_side_x_id' and scope = 'test' \gset
select public.xo_propose_side_bet(:'pending_side_x_id', :'pending_side_x_code', gen_random_uuid(), :'pending_side_match_id', 4);
update public.xo_games set first_member_id = :'pending_side_x_id', next_member_id = :'pending_side_x_id' where id = :'pending_side_game_id';
select public.xo_make_move(:'pending_side_x_id', :'pending_side_x_code', gen_random_uuid(), :'pending_side_game_id', 0, 0);
select is((select status from public.xo_side_bets where match_id = :'pending_side_match_id'), 'cancelled', 'first move cancels unaccepted side proposal');
select is((select balance from public.citizen_wallets where member_id = :'pending_side_x_id' and scope = 'test'), :'pending_side_before'::integer, 'first-move cancellation refunds proposer');

select * from finish();
rollback;
