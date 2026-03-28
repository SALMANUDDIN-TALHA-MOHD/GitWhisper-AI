-- ============================================================
-- GitWhisper AI — Complete Supabase Setup SQL
-- Run ENTIRELY in: Supabase → SQL Editor → New Query
-- Safe to re-run — uses IF NOT EXISTS and DROP IF EXISTS
-- ============================================================


-- ─── 1. Add repo_url column to existing repo_analyses ───
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='repo_analyses' and column_name='repo_url'
  ) then
    alter table public.repo_analyses add column repo_url text;
  end if;
end $$;


-- ─── 2. Create user_profiles table ───
create table if not exists public.user_profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text unique not null,
  full_name    text,
  avatar_url   text,
  provider     text default 'email',
  free_used    integer default 0,
  total_logins integer default 0,
  created_at   timestamptz default now(),
  last_seen    timestamptz default now()
);


-- ─── 3. Create login_history table ───
create table if not exists public.login_history (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  email        text not null,
  provider     text default 'email',
  logged_in_at timestamptz default now()
);


-- ─── 4. Enable RLS on all tables ───
alter table public.user_profiles     enable row level security;
alter table public.login_history     enable row level security;
alter table public.repo_analyses     enable row level security;
alter table public.contact_submissions enable row level security;


-- ─── 5. Drop and recreate all policies cleanly ───
drop policy if exists "Anyone can insert analysis"       on public.repo_analyses;
drop policy if exists "Users see own analyses"           on public.repo_analyses;
drop policy if exists "Users manage own analyses"        on public.repo_analyses;
drop policy if exists "Users delete own analyses"        on public.repo_analyses;
drop policy if exists "Anyone can submit contact"        on public.contact_submissions;
drop policy if exists "Admin sees all contacts"          on public.contact_submissions;
drop policy if exists "Users manage own profile"         on public.user_profiles;
drop policy if exists "Users manage own login history"   on public.login_history;
drop policy if exists "Users see own login history"      on public.login_history;


-- ─── 6. Recreate all RLS policies ───

-- repo_analyses
create policy "Anyone can insert analysis"
  on public.repo_analyses for insert with check (true);

create policy "Users see own analyses"
  on public.repo_analyses for select using (auth.uid() = user_id);

create policy "Users delete own analyses"
  on public.repo_analyses for delete using (auth.uid() = user_id);

-- contact_submissions
create policy "Anyone can submit contact"
  on public.contact_submissions for insert with check (true);

-- user_profiles
create policy "Users manage own profile"
  on public.user_profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- login_history
create policy "Users manage own login history"
  on public.login_history for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── 7. Enable Realtime on tables (for live dashboard updates) ───
-- This allows the Supabase real-time listener to detect changes instantly
alter publication supabase_realtime add table public.repo_analyses;
alter publication supabase_realtime add table public.user_profiles;


-- ─── 8. Auto-create profile trigger on sign-up ───
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url, provider, total_logins, created_at, last_seen)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider','email'),
    1, now(), now()
  )
  on conflict (id) do update set
    last_seen    = now(),
    total_logins = user_profiles.total_logins + 1,
    avatar_url   = coalesce(excluded.avatar_url, user_profiles.avatar_url),
    full_name    = coalesce(excluded.full_name,  user_profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 9. Back-fill profiles for existing users ───
insert into public.user_profiles (id, email, full_name, avatar_url, provider, total_logins, created_at, last_seen)
select
  u.id, u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
  u.raw_user_meta_data->>'avatar_url',
  coalesce(u.raw_app_meta_data->>'provider','email'),
  1, u.created_at, now()
from auth.users u
where not exists (select 1 from public.user_profiles p where p.id = u.id)
on conflict (id) do nothing;


-- ─── 10. Verify ───
select
  'user_profiles'       as table_name, count(*) as rows from public.user_profiles union all
select
  'repo_analyses'       as table_name, count(*) as rows from public.repo_analyses  union all
select
  'contact_submissions' as table_name, count(*) as rows from public.contact_submissions union all
select
  'login_history'       as table_name, count(*) as rows from public.login_history;
