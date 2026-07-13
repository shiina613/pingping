create index if not exists messages_room_created_at_idx on public.messages (room_id, created_at desc);
