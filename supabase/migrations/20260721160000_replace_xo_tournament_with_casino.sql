-- This runs before the rewritten 20260708223000 migration is repaired and
-- replayed on the existing project. On a clean database the old tournament
-- marker table does not exist, so the migration intentionally does nothing.
do $$
declare
  function_name text;
begin
  if to_regclass('public.xo_settings') is null then
    return;
  end if;

  for function_name in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.proname like 'xo_%'
  loop
    execute format('drop function if exists %s cascade', function_name);
  end loop;

  drop table if exists public.xo_command_log cascade;
  drop table if exists public.xo_moves cascade;
  drop table if exists public.xo_pool_bets cascade;
  drop table if exists public.xo_pool_totals cascade;
  drop table if exists public.xo_side_bets cascade;
  drop table if exists public.xo_testers cascade;
  drop table if exists public.xo_tournament_players cascade;
  drop table if exists public.xo_games cascade;
  drop table if exists public.xo_matches cascade;
  drop table if exists public.xo_tournaments cascade;
  drop table if exists public.xo_settings cascade;
  drop table if exists public.xo_ratings cascade;
  drop table if exists public.citizen_point_ledger cascade;
  drop table if exists public.citizen_wallets cascade;
end;
$$;
