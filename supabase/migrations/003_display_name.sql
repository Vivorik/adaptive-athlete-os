alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  drop constraint if exists profiles_display_name_length;

alter table public.profiles
  add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) between 1 and 40);

-- Имя для уже заведённых аккаунтов берём из части почты до @.
update public.profiles p
set display_name = left(
      initcap(
        regexp_replace(
          split_part(u.email, '@', 1),
          '[^[:alnum:]]+', ' ', 'g'
        )
      ),
      40
    )
from auth.users u
where u.id = p.id
  and p.display_name is null
  and nullif(trim(split_part(u.email, '@', 1)), '') is not null;

-- Регистрация присылает имя в user_metadata, но внешние клиенты могут его
-- не прислать: тогда остаётся часть почты до @.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');

  if requested_name is not null then
    requested_name := left(requested_name, 40);
  else
    requested_name := nullif(
      left(
        initcap(
          regexp_replace(
            split_part(new.email, '@', 1),
            '[^[:alnum:]]+', ' ', 'g'
          )
        ),
        40
      ),
      ''
    );
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, public.generate_username(new.email, new.id), requested_name)
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    insert into public.profiles (id, username, display_name)
    values (
      new.id,
      'athlete_' || substr(replace(new.id::text, '-', ''), 1, 10),
      requested_name
    )
    on conflict (id) do nothing;

    return new;
end;
$$;
