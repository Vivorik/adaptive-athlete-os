create table if not exists public.exercise_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_name text not null,
  max_reps int not null check (max_reps between 1 and 100),
  max_weight_kg numeric(6, 2) not null check (max_weight_kg between 0 and 1000),
  work_reps int not null check (work_reps between 1 and 100),
  work_weight_kg numeric(6, 2) not null check (work_weight_kg between 0 and 1000),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_name),
  check (work_reps <= max_reps)
);

create index if not exists exercise_progress_user_name_idx
  on public.exercise_progress (user_id, exercise_name);

create index if not exists exercise_progress_public_idx
  on public.exercise_progress (created_at desc) where is_public;

alter table public.exercise_progress enable row level security;

drop policy if exists "exercise_progress_select_own" on public.exercise_progress;
create policy "exercise_progress_select_own"
  on public.exercise_progress for select using (auth.uid() = user_id);

drop policy if exists "exercise_progress_select_public" on public.exercise_progress;
create policy "exercise_progress_select_public"
  on public.exercise_progress for select using (is_public = true);

drop policy if exists "exercise_progress_insert_own" on public.exercise_progress;
create policy "exercise_progress_insert_own"
  on public.exercise_progress for insert with check (auth.uid() = user_id);

drop policy if exists "exercise_progress_update_own" on public.exercise_progress;
create policy "exercise_progress_update_own"
  on public.exercise_progress for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exercise_progress_delete_own" on public.exercise_progress;
create policy "exercise_progress_delete_own"
  on public.exercise_progress for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.exercise_progress to authenticated;
