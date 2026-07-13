begin;

select plan(16);

select throws_ok(
  $$ select public.xo_create_tournament('hau', 'PP-HAU-2026', gen_random_uuid()) $$,
  '42501', 'ONLY_TUNG_CAN_HOST'
);

select lives_ok(
  $$ select public.xo_create_tournament('tung', 'PP-TUNG-2026', '00000000-0000-4000-8000-000000000001') $$
);

select is((select count(*) from public.xo_tournament_players), 7::bigint, 'all members join');
select is((select count(*) from public.xo_matches where stage = 'group'), 15::bigint, '15 group matches');
select is((select count(distinct round_number) from public.xo_matches where stage = 'group'), 5::bigint, 'five rounds');
select is((select count(*) from public.xo_matches where round_number = 1 and status = 'pending'), 3::bigint, 'round one opens');
select is((select count(*) from public.xo_matches where round_number > 1 and status = 'scheduled'), 12::bigint, 'later rounds wait');
select is((select count(*) from public.xo_games where game_number = 1 and status = 'active'), 3::bigint, 'open matches have game one');
select is((public.xo_get_snapshot('tung', 'PP-TUNG-2026')->>'visible')::boolean, true, 'host sees test');

select is(
  public.xo_create_tournament('tung','PP-TUNG-2026','00000000-0000-4000-8000-000000000001')->>'tournamentId',
  (select id::text from public.xo_tournaments limit 1),
  'exact retry returns stored tournament'
);
select is((select count(*) from public.xo_tournaments), 1::bigint, 'retry creates no row');
select throws_ok(
  $$ select public.xo_set_release_mode('tung','PP-TUNG-2026','00000000-0000-4000-8000-000000000001','live') $$,
  '22023', 'REQUEST_ID_REUSED'
);
select is((public.xo_get_snapshot('hau','PP-HAU-2026')->>'visible')::boolean, false, 'non-tester hidden');
select throws_ok(
  $$ select public.xo_set_release_mode('tung','PP-TUNG-2026',gen_random_uuid(),'live') $$,
  '22023', 'TEST_GATE_INCOMPLETE'
);
select throws_ok(
  $$ select public.xo_cancel_tournament('hau','PP-HAU-2026',gen_random_uuid(),(select id from public.xo_tournaments limit 1),'no') $$,
  '42501', 'ONLY_TUNG_CAN_HOST'
);
select lives_ok(
  $$ select public.xo_cancel_tournament('tung','PP-TUNG-2026',gen_random_uuid(),(select id from public.xo_tournaments limit 1),'test cleanup') $$
);

select * from finish();
rollback;
