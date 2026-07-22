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
