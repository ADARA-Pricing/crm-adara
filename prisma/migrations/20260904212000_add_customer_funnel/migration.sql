do $$ begin
  create type crm."FunnelStage" as enum (
    'FIRST_CONTACT',
    'INTERESTED',
    'VERY_INTERESTED',
    'COORDINATE_DELIVERY',
    'LOCAL_PICKUP',
    'COMPLETED',
    'ABANDONED'
  );
exception
  when duplicate_object then null;
end $$;

alter table crm."Customer"
  add column if not exists "funnelStage" crm."FunnelStage" not null default 'FIRST_CONTACT',
  add column if not exists "funnelNote" text,
  add column if not exists "funnelUpdatedAt" timestamptz not null default now();

create index if not exists "Customer_funnelStage_funnelUpdatedAt_idx"
  on crm."Customer" ("funnelStage", "funnelUpdatedAt" desc);
