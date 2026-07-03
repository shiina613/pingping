create extension if not exists pgcrypto;

create table if not exists public.members (
  id text primary key,
  name text not null,
  role text not null default '',
  skills text not null default '',
  color text not null default '#2563eb',
  avatar text not null default '',
  login_code text not null unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.allocations (
  competition_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  competition_id text not null,
  title text not null,
  description text not null default '',
  assignee_id text references public.members(id) on delete set null,
  column_id text not null default 'todo',
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null references public.members(id) on delete cascade,
  name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 26214400),
  storage_path text not null unique,
  public_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (room_id in ('general', 'onevoice', 'thucchien', 'aichallenge', 'buildhub', 'viettel')),
  sender_id text not null references public.members(id) on delete cascade,
  text text not null default '' check (char_length(text) <= 4000),
  attachment_id uuid references public.attachments(id) on delete set null,
  created_at timestamptz not null default now(),
  check (char_length(trim(text)) > 0 or attachment_id is not null)
);

insert into public.members (id, name, role, skills, color, avatar, login_code) values
  ('tung', 'Tùng', 'AI/ML Engineer', 'PyTorch, Computer Vision, CNN, OpenCV, Docker', '#3b82f6', '💻', 'PP-TUNG-2026'),
  ('tunganh', 'Tùng Anh', 'Backend Developer', 'Node.js, Express, MongoDB, Redis, Docker, APIs', '#10b981', '🚀', 'PP-TUNGANH-2026'),
  ('hau', 'Hậu', 'Data Scientist', 'Python, Pandas, Scikit-Learn, SQL, Data Visualization', '#8b5cf6', '📊', 'PP-HAU-2026'),
  ('tuantran', 'Tuấn Trần', 'AI/ML Engineer', 'LLMs, NLP, Hugging Face, LangChain, RAG, PyTorch', '#f59e0b', '🧠', 'PP-TUANTRAN-2026'),
  ('hung', 'Hưng', 'Frontend Developer', 'HTML, CSS, JavaScript, React, CSS Grid, Responsive Design', '#ec4899', '🎨', 'PP-HUNG-2026'),
  ('duyanh', 'Duy Anh', 'PM & AI Engineer', 'Project Management, Speech AI, Edge AI, Agile, Git', '#06b6d4', '🦁', 'PP-DUYANH-2026'),
  ('thach', 'Thạch', 'IoT Specialist', 'Embedded C, ESP32, IoT Sensors, Firmware, Hardware Prototyping', '#ef4444', '⚙️', 'PP-THACH-2026')
on conflict (id) do nothing;

insert into public.allocations (competition_id, data) values
  ('onevoice', '{"members":["tung","tunganh","hau","tuantran","hung","duyanh","thach"]}'),
  ('thucchien', '{"teamA":["hung","duyanh","tuantran"],"teamB":["thach","hau","tunganh"]}'),
  ('aichallenge', '{"teamA":["duyanh","tuantran","hau"],"teamB":["tunganh","tung","thach","hung"]}'),
  ('buildhub', '{"teamA":["duyanh","tunganh","hung"],"teamB":["tuantran","tung","hau","thach"]}'),
  ('viettel', '{"teamA":["duyanh","thach","tuantran"],"teamB":["tung","tunganh","hau"]}')
on conflict (competition_id) do nothing;

insert into public.tasks (id, competition_id, title, description, assignee_id, column_id) values
  ('t-ov-1', 'onevoice', 'Thiết kế kiến trúc Edge AI', 'Lựa chọn mô hình dịch chạy trực tiếp local phù hợp năng lực phần cứng', 'duyanh', 'inprogress'),
  ('t-ov-2', 'onevoice', 'Tối ưu mô hình qua ONNX/TensorRT', 'Thử nghiệm nén lượng tử hóa (Quantization) để đạt RTF < 1.0', 'tuantran', 'todo'),
  ('t-ov-3', 'onevoice', 'Lựa chọn phần cứng Qualcomm', 'Lựa chọn kit phát triển NPU phù hợp thiết bị đeo tay di động', 'thach', 'todo'),
  ('t-tc-1', 'thucchien', 'Lên kịch bản video giới thiệu', 'Quay và dựng clip 30s "Tôi đi thi AI" giới thiệu cá tính đội thi', 'hung', 'done'),
  ('t-tc-2', 'thucchien', 'Thu thập dữ liệu tiếng Việt quốc gia', 'Thu thập tài liệu y tế, hành chính phục vụ tinh chỉnh LLM/SLM', 'hau', 'inprogress'),
  ('t-ac-1', 'aichallenge', 'Nghiên cứu API Meta Llama 3', 'Tìm hiểu cơ chế tích hợp API Meta và cấu hình RAG', 'tung', 'todo'),
  ('t-bh-1', 'buildhub', 'Tạo tài liệu Pitch Deck', 'Thiết kế slide 12 trang theo khung mẫu đề án kinh doanh', 'tunganh', 'inprogress'),
  ('t-vt-1', 'viettel', 'Huấn luyện mạng Neural Reconstruction', 'Tái dựng cấu trúc 3D trạm BTS từ ảnh chụp drone', 'tung', 'todo'),
  ('t-vt-2', 'viettel', 'Tối ưu hóa suy luận LLM', 'Tối ưu hóa throughput sử dụng vLLM hoặc TensorRT-LLM', 'tuantran', 'inprogress')
on conflict (id) do nothing;

alter table public.members enable row level security;
alter table public.allocations enable row level security;
alter table public.tasks enable row level security;
alter table public.attachments enable row level security;
alter table public.messages enable row level security;

do $$
declare
  table_name text;
  action text;
begin
  foreach table_name in array array['members','allocations','tasks','attachments','messages'] loop
    foreach action in array array['select','insert','update','delete'] loop
      execute format('drop policy if exists "anon_%s_%s" on public.%I', action, table_name, table_name);
      if action = 'insert' then
        execute format('create policy "anon_%s_%s" on public.%I for insert to anon with check (true)', action, table_name, table_name);
      elsif action = 'update' then
        execute format('create policy "anon_%s_%s" on public.%I for update to anon using (true) with check (true)', action, table_name, table_name);
      else
        execute format('create policy "anon_%s_%s" on public.%I for %s to anon using (true)', action, table_name, table_name, action);
      end if;
    end loop;
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files', 'chat-files', true, 26214400,
  array[
    'image/png','image/jpeg','image/gif','image/webp','application/pdf','application/zip','application/x-zip-compressed',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set public = true, file_size_limit = 26214400, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anon_chat_files_select" on storage.objects;
drop policy if exists "anon_chat_files_insert" on storage.objects;
create policy "anon_chat_files_select" on storage.objects for select to anon using (bucket_id = 'chat-files');
create policy "anon_chat_files_insert" on storage.objects for insert to anon with check (bucket_id = 'chat-files');

do $$
declare table_name text;
begin
  foreach table_name in array array['members','allocations','tasks','messages','attachments'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
