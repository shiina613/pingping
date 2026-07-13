create or replace function public.reply_to(source public.messages)
returns setof public.messages rows 1
language sql
stable
set search_path = ''
as $$
  select message.*
  from public.messages as message
  where message.id = source.reply_to_id;
$$;
revoke execute on function public.reply_to(public.messages) from public, authenticated;
grant execute on function public.reply_to(public.messages) to anon;
notify pgrst, 'reload schema';
