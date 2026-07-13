create index if not exists members_updated_by_idx on public.members(updated_by);
create index if not exists allocations_updated_by_idx on public.allocations(updated_by);
create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);
create index if not exists tasks_updated_by_idx on public.tasks(updated_by);
create index if not exists notifications_actor_id_idx on public.notifications(actor_id);
;
