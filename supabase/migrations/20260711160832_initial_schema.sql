-- Initial schema for move-mate
-- Tables: profiles, workouts, walk_records, quest_states
-- All user-owned data is protected by Row Level Security (RLS) so that a user
-- can only ever read/write their own rows.
-- `on delete cascade` is used throughout so that deleting an auth.users row
-- cleans up all of that user's application data automatically.

-- ---------------------------------------------------------------------------
-- profiles
-- One row per user, 1:1 with auth.users. Auto-created via trigger on signup.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  -- restrict gender to a known set of values; null allowed (not answered)
  gender text check (gender in ('male', 'female', 'other')),
  -- birth_year must be a plausible year (1900 .. current year)
  birth_year int check (birth_year between 1900 and extract(year from now())::int),
  -- physical measurements must be positive when provided; null allowed
  height_cm numeric check (height_cm > 0),
  weight_kg numeric check (weight_kg > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- workouts
-- Strength-training set records. Queried as history by user over time.
-- ---------------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise text not null,
  weight_kg numeric not null check (weight_kg >= 0), -- 0 allowed (bodyweight)
  reps int not null check (reps > 0),
  set_number int not null check (set_number > 0),
  performed_at timestamptz not null,
  created_at timestamptz default now()
);

-- index for history retrieval: a user's sets ordered by time
create index workouts_user_id_performed_at_idx
  on public.workouts (user_id, performed_at);

-- ---------------------------------------------------------------------------
-- walk_records
-- Completed walk sessions, including the recorded route as JSON.
-- ---------------------------------------------------------------------------
create table public.walk_records (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  distance_meters numeric not null check (distance_meters >= 0),
  duration_seconds int not null check (duration_seconds >= 0),
  calories numeric not null check (calories >= 0),
  -- route stored as a JSON array of coordinates; defaults to empty array
  route jsonb not null default '[]',
  destination_name text,
  recorded_at timestamptz not null,
  created_at timestamptz default now()
);

-- index for history retrieval: a user's walks ordered by time
create index walk_records_user_id_recorded_at_idx
  on public.walk_records (user_id, recorded_at);

-- ---------------------------------------------------------------------------
-- quest_states
-- One row per user tracking daily/weekly mission progress and claimed points.
-- ---------------------------------------------------------------------------
create table public.quest_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_mission_ids text[] not null default '{}',
  daily_completed_ids text[] not null default '{}',
  weekly_mission_id text,
  weekly_completed boolean not null default false,
  weekly_prev_id text,
  claimed_mission_points int not null default 0 check (claimed_mission_points >= 0),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Enable RLS on every table and scope access to the authenticated owner.
-- Without an explicit policy, RLS denies all access by default.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.walk_records enable row level security;
alter table public.quest_states enable row level security;

-- profiles: owner identified by id = auth.uid(); no delete (cascades with user)
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid ());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid ());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid ()) with check (id = auth.uid ());

-- workouts: full CRUD restricted to owner (user_id = auth.uid())
create policy "workouts_select_own" on public.workouts
  for select using (user_id = auth.uid ());
create policy "workouts_insert_own" on public.workouts
  for insert with check (user_id = auth.uid ());
create policy "workouts_update_own" on public.workouts
  for update using (user_id = auth.uid ()) with check (user_id = auth.uid ());
create policy "workouts_delete_own" on public.workouts
  for delete using (user_id = auth.uid ());

-- walk_records: full CRUD restricted to owner (user_id = auth.uid())
create policy "walk_records_select_own" on public.walk_records
  for select using (user_id = auth.uid ());
create policy "walk_records_insert_own" on public.walk_records
  for insert with check (user_id = auth.uid ());
create policy "walk_records_update_own" on public.walk_records
  for update using (user_id = auth.uid ()) with check (user_id = auth.uid ());
create policy "walk_records_delete_own" on public.walk_records
  for delete using (user_id = auth.uid ());

-- quest_states: select/insert/update restricted to owner; no delete
create policy "quest_states_select_own" on public.quest_states
  for select using (user_id = auth.uid ());
create policy "quest_states_insert_own" on public.quest_states
  for insert with check (user_id = auth.uid ());
create policy "quest_states_update_own" on public.quest_states
  for update using (user_id = auth.uid ()) with check (user_id = auth.uid ());

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth.users row is inserted.
-- security definer: runs with the function owner's privileges so it can insert
-- into public.profiles regardless of the signing-up user's RLS context.
-- search_path is pinned to '' (empty) per Supabase guidance to prevent
-- search-path hijacking; all objects are therefore schema-qualified.
-- ---------------------------------------------------------------------------
create function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- prefer full_name, then name, from the OAuth/signup metadata; else null
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();
