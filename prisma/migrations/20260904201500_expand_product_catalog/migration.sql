-- Product data is the commercial source of truth.  Shipping belongs to the
-- product because private courier pricing can differ by item.
alter table crm."Product"
  add column if not exists "shortDescription" text,
  add column if not exists "botDescription" text,
  add column if not exists category text,
  add column if not exists "shippingCents" integer not null default 0,
  add column if not exists "costCents" integer,
  add column if not exists "isAvailableForBot" boolean not null default false,
  add column if not exists "warrantyMonths" integer not null default 12,
  add column if not exists "technicalSpecs" jsonb,
  add column if not exists "imageUrls" text[] not null default '{}',
  add column if not exists "includedItems" text[] not null default '{}';

update crm."Product"
set
  category = 'Celulares',
  "shortDescription" = 'Celular Android con 8 GB RAM (4+4) y 128 GB de almacenamiento.',
  "botDescription" = 'Infinix Smart 10 negro. Informar precio, garantía y especificaciones solo según la consulta.',
  "shippingCents" = 700000,
  "isAvailableForBot" = true,
  "warrantyMonths" = 12,
  "technicalSpecs" = '{"ram":"8 GB (4+4)","storage":"128 GB","display":"120 Hz","battery":"5000 mAh","color":"Negro"}'::jsonb,
  "includedItems" = array['Cargador', 'Film', 'Funda']
where sku = 'INFINIX-SMART-10-NEGRO';
