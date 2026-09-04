alter table crm."Order"
  add column if not exists "reviewedAt" timestamptz,
  add column if not exists "assignedCourier" text,
  add column if not exists "deliveryTimeWindow" text,
  add column if not exists "logisticsNote" text,
  add column if not exists "deliveredAt" timestamptz;

create table if not exists crm."OrderActivity" (
  id text primary key,
  "orderId" text not null references crm."Order"(id) on delete cascade,
  action text not null,
  detail text,
  "createdAt" timestamptz not null default now()
);

create index if not exists "OrderActivity_orderId_createdAt_idx"
  on crm."OrderActivity" ("orderId", "createdAt");
