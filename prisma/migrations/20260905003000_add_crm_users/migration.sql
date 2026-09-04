do $$ begin
  create type crm."UserRole" as enum ('ADMIN', 'SALES', 'LOGISTICS');
exception when duplicate_object then null;
end $$;

create table if not exists crm."UserProfile" (
  id text primary key,
  email text not null unique,
  "displayName" text,
  role crm."UserRole" not null default 'SALES',
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table crm."UserProfile" enable row level security;
