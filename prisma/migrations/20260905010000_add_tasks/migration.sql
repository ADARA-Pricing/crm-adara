do $$ begin
  create type crm."TaskStatus" as enum ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type crm."TaskType" as enum ('FOLLOW_UP', 'DELIVERY_CONFIRMATION', 'ORDER_REVIEW', 'LOGISTICS', 'OTHER');
exception when duplicate_object then null;
end $$;

create table if not exists crm."Task" (
  id text primary key,
  title text not null,
  description text,
  type crm."TaskType" not null default 'OTHER',
  status crm."TaskStatus" not null default 'OPEN',
  "dueAt" timestamptz,
  "customerId" text references crm."Customer"(id) on delete set null,
  "orderId" text references crm."Order"(id) on delete set null,
  "assigneeId" text references crm."UserProfile"(id) on delete set null,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table crm."Task" enable row level security;
create index if not exists "Task_status_dueAt_idx" on crm."Task" (status, "dueAt");
create index if not exists "Task_assigneeId_status_idx" on crm."Task" ("assigneeId", status);
