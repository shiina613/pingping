delete from public.citizen_point_ledger;
delete from public.xo_matches;
delete from public.xo_ratings;
delete from public.citizen_wallets;

insert into public.citizen_wallets(member_id, balance)
select id, 36 from public.members;

insert into public.citizen_point_ledger(member_id, amount, reason, grant_month)
select id, 36, 'monthly_grant', date_trunc('month', now())::date
from public.members;
