create extension if not exists pgcrypto;

create table if not exists universities (
  id text primary key,
  name text not null,
  short_name text not null,
  country text not null,
  domains text[] not null default '{}'
);

create table if not exists campuses (
  id text primary key,
  university_id text not null references universities(id),
  name text not null,
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  rural boolean not null default false
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  university_id text references universities(id),
  campus_id text references campuses(id),
  career text,
  semester int,
  bio text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists login_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tecnologia', 'investigacion', 'territorio', 'cultura', 'deporte', 'bienestar')),
  description text not null,
  scope text not null default 'campus' check (scope in ('campus', 'red')),
  university_id text references universities(id),
  campus_id text references campuses(id),
  goal_members int not null default 18,
  lat double precision,
  lng double precision,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists community_members (
  community_id uuid references communities(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'miembro' check (role in ('fundador', 'core', 'miembro')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  place text not null default '',
  virtual_url text,
  lat double precision,
  lng double precision,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists event_rsvps (
  event_id uuid references events(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (event_id, user_id)
);

create table if not exists help_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  topic text not null,
  title text not null,
  detail text not null default '',
  mode text not null default 'virtual' check (mode in ('presencial', 'virtual')),
  campus_id text references campuses(id),
  lat double precision,
  lng double precision,
  status text not null default 'abierta' check (status in ('abierta', 'en_curso', 'resuelta')),
  mentor_id uuid references users(id) on delete set null,
  hours numeric(4, 1),
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  problem text not null,
  organization text not null,
  territory text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  ods int[] not null default '{}',
  skills text[] not null default '{}',
  status text not null default 'abierto' check (status in ('abierto', 'en_progreso', 'resuelto')),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  name text not null,
  max_members int not null default 6,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists team_updates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigserial primary key,
  channel text not null,
  author_id uuid references users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_channel_idx on messages (channel, id);

create table if not exists points_log (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  points int not null,
  reason text not null,
  ref_id text,
  created_at timestamptz not null default now()
);
create index if not exists points_user_idx on points_log (user_id);

create table if not exists reports (
  id bigserial primary key,
  reporter_id uuid references users(id) on delete set null,
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);
