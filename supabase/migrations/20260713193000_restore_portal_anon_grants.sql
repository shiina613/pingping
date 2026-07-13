-- RLS policies do not grant table privileges by themselves. Keep the original
-- anonymous portal contract explicit so a fresh database behaves like production.
revoke all on table
  public.members,
  public.allocations,
  public.tasks,
  public.attachments,
  public.messages
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.members,
  public.allocations,
  public.tasks,
  public.attachments
to anon;

-- Message creation goes through send_chat_message; direct inserts stay blocked.
grant select, update, delete on table public.messages to anon;
