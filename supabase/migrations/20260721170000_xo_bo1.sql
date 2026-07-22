alter table public.xo_matches drop constraint if exists xo_matches_target_wins_check;
alter table public.xo_matches alter column target_wins set default 1;
update public.xo_matches set target_wins = 1;
alter table public.xo_matches add constraint xo_matches_target_wins_check check (target_wins = 1);

do $$
declare match_row public.xo_matches%rowtype;
begin
  for match_row in
    select * from public.xo_matches
    where status = 'active' and challenger_wins <> opponent_wins
  loop
    perform private.xo_settle_match(
      match_row.id,
      case when match_row.challenger_wins > match_row.opponent_wins
        then match_row.challenger_id else match_row.opponent_id end
    );
    update public.xo_games
    set status = 'draw', completed_at = now()
    where match_id = match_row.id and status = 'active';
  end loop;
end;
$$;
