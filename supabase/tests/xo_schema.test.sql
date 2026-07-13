begin;

select plan(28);

select has_table('public', 'xo_settings', 'xo_settings');
select has_table('public', 'xo_testers', 'xo_testers');
select has_table('public', 'xo_tournaments', 'xo_tournaments');
select has_table('public', 'xo_tournament_players', 'xo_tournament_players');
select has_table('public', 'xo_matches', 'xo_matches');
select has_table('public', 'xo_games', 'xo_games');
select has_table('public', 'xo_moves', 'xo_moves');
select has_table('public', 'xo_ratings', 'xo_ratings');
select has_table('public', 'citizen_wallets', 'citizen_wallets');
select has_table('public', 'citizen_point_ledger', 'citizen_point_ledger');
select has_table('public', 'xo_pool_bets', 'xo_pool_bets');
select has_table('public', 'xo_pool_totals', 'xo_pool_totals');
select has_table('public', 'xo_side_bets', 'xo_side_bets');
select has_table('public', 'xo_command_log', 'xo_command_log');
select col_is_pk('public', 'citizen_wallets', array['member_id', 'scope']);
select col_is_unique('public', 'xo_moves', array['game_id', 'move_number']);
select col_is_unique('public', 'xo_moves', array['game_id', 'row', 'col']);
select policies_are('public', 'citizen_wallets', array[]::text[]);
select policies_are('public', 'citizen_point_ledger', array[]::text[]);
select policies_are('public', 'xo_pool_bets', array[]::text[]);
select policies_are('public', 'xo_side_bets', array[]::text[]);
select table_privs_are('public', 'citizen_wallets', 'anon', array[]::text[]);
select table_privs_are('public', 'xo_moves', 'anon', array['SELECT']);
select table_privs_are('public', 'members', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']);
select table_privs_are('public', 'allocations', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']);
select table_privs_are('public', 'tasks', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']);
select table_privs_are('public', 'attachments', 'anon', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']);
select table_privs_are('public', 'messages', 'anon', array['SELECT', 'UPDATE', 'DELETE']);

select * from finish();
rollback;
