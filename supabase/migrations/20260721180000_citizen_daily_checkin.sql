alter table public.citizen_point_ledger add column if not exists grant_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'citizen_point_ledger_member_grant_date_key'
  ) then
    alter table public.citizen_point_ledger
      add constraint citizen_point_ledger_member_grant_date_key unique (member_id, grant_date);
  end if;
end $$;

create or replace function public.xo_daily_checkin(
  p_member_id text, p_login_code text, p_claim boolean
)
returns table(balance integer, points integer, granted boolean, claimed boolean, checkin_date date)
language plpgsql security definer set search_path = ''
as $$
declare
  v_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_points integer := case when extract(isodow from (now() at time zone 'Asia/Ho_Chi_Minh')) in (6, 7) then 36 else 18 end;
  v_inserted integer := 0;
begin
  if not exists (select 1 from public.members where id = p_member_id and login_code = p_login_code) then
    raise exception using errcode = '28000', message = 'INVALID_CREDENTIALS';
  end if;

  insert into public.citizen_wallets(member_id) values (p_member_id) on conflict do nothing;

  if p_claim then
    insert into public.citizen_point_ledger(member_id, amount, reason, grant_date)
    values (p_member_id, v_points, 'daily_checkin', v_date)
    on conflict (member_id, grant_date) do nothing;
    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      update public.citizen_wallets w
      set balance = w.balance + v_points, updated_at = now()
      where w.member_id = p_member_id;
    end if;
  end if;

  return query
  select w.balance, v_points, v_inserted > 0,
    exists (
      select 1 from public.citizen_point_ledger l
      where l.member_id = p_member_id and l.grant_date = v_date
    ),
    v_date
  from public.citizen_wallets w
  where w.member_id = p_member_id;
end;
$$;

revoke all on function public.xo_daily_checkin(text, text, boolean) from public;
grant execute on function public.xo_daily_checkin(text, text, boolean) to anon;
