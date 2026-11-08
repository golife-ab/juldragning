-- Julklappsdragning schema (service role via Next.js API only)

create extension if not exists "pgcrypto";

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text not null unique,
  organizer_id uuid,
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  display_name text not null,
  assigned_to uuid references public.participants (id),
  created_at timestamptz not null default now(),
  unique (group_id, display_name)
);

create index participants_group_id_idx on public.participants (group_id);

alter table public.groups
  add constraint groups_organizer_id_fkey
  foreign key (organizer_id) references public.participants (id) on delete cascade;

alter table public.groups enable row level security;
alter table public.participants enable row level security;
