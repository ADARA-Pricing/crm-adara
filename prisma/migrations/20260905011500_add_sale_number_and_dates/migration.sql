create sequence if not exists crm.order_sale_number_seq;

alter table crm."Order" add column if not exists "saleNumber" integer;
alter table crm."Order" add column if not exists "saleDate" timestamptz not null default now();
alter table crm."Order" add column if not exists "deliveryDate" timestamptz;

with numbered as (
  select id, row_number() over (order by "createdAt", id)::integer as number
  from crm."Order"
  where "saleNumber" is null
)
update crm."Order" as orders set "saleNumber" = numbered.number from numbered where orders.id = numbered.id;

select setval('crm.order_sale_number_seq', coalesce((select max("saleNumber") from crm."Order"), 1), (select count(*) > 0 from crm."Order"));
alter table crm."Order" alter column "saleNumber" set default nextval('crm.order_sale_number_seq');
alter table crm."Order" alter column "saleNumber" set not null;
create unique index if not exists "Order_saleNumber_key" on crm."Order" ("saleNumber");
