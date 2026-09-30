create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  muscle_group text not null check (
    muscle_group in ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body')
  ),
  equipment text not null check (
    equipment in ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band')
  ),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_compound boolean not null default false
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  goal text not null check (goal in ('strength', 'hypertrophy', 'endurance')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  energy int check (energy between 1 and 5),
  soreness jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create or replace function public.generate_username(user_email text, user_id uuid)
returns text
language sql
immutable
as $$
  select left(
    coalesce(
      nullif(
        btrim(lower(regexp_replace(split_part(coalesce(user_email, 'user'), '@', 1), '[^a-z0-9_]+', '_', 'g')), '_'),
        ''
      ),
      'athlete'
    ),
    20
  ) || '_' || substr(replace(user_id::text, '-', ''), 1, 6);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, public.generate_username(new.email, new.id))
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username)
    values (new.id, 'athlete_' || substr(replace(new.id::text, '-', ''), 1, 10))
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, username)
select u.id, public.generate_username(u.email, u.id)
from auth.users u
on conflict (id) do nothing;

create index if not exists workouts_user_created_idx
  on public.workouts (user_id, created_at desc);

create index if not exists workouts_public_idx
  on public.workouts (created_at desc) where is_public;

create index if not exists checkins_user_date_idx
  on public.checkins (user_id, date desc);

create index if not exists exercises_muscle_group_idx
  on public.exercises (muscle_group);

create index if not exists exercises_equipment_idx
  on public.exercises (equipment);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "exercises_select_public" on public.exercises;
create policy "exercises_select_public"
  on public.exercises for select using (true);

drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own"
  on public.workouts for select using (auth.uid() = user_id);

drop policy if exists "workouts_select_public" on public.workouts;
create policy "workouts_select_public"
  on public.workouts for select using (is_public = true);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own"
  on public.workouts for insert with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own"
  on public.workouts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own"
  on public.workouts for delete using (auth.uid() = user_id);

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_own"
  on public.checkins for select using (auth.uid() = user_id);

drop policy if exists "checkins_insert_own" on public.checkins;
create policy "checkins_insert_own"
  on public.checkins for insert with check (auth.uid() = user_id);

drop policy if exists "checkins_update_own" on public.checkins;
create policy "checkins_update_own"
  on public.checkins for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "checkins_delete_own" on public.checkins;
create policy "checkins_delete_own"
  on public.checkins for delete using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.exercises to anon, authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.checkins to authenticated;
