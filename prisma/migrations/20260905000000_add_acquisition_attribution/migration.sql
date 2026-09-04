create table if not exists crm."AcquisitionAttribution" (
  id text primary key,
  "customerId" text not null references crm."Customer"(id) on delete cascade,
  source text,
  referrer text,
  "utmSource" text,
  "utmCampaign" text,
  "utmContent" text,
  "campaignId" text,
  "campaignName" text,
  "adsetId" text,
  "adsetName" text,
  "adId" text,
  "adName" text,
  "capturedAt" timestamptz not null default now()
);

alter table crm."Order" add column if not exists "attributionId" text;
alter table crm."Order" drop constraint if exists "Order_attributionId_fkey";
alter table crm."Order" add constraint "Order_attributionId_fkey"
  foreign key ("attributionId") references crm."AcquisitionAttribution"(id) on delete set null;

create index if not exists "AcquisitionAttribution_customerId_capturedAt_idx" on crm."AcquisitionAttribution" ("customerId", "capturedAt");
create index if not exists "AcquisitionAttribution_campaignId_idx" on crm."AcquisitionAttribution" ("campaignId");
create index if not exists "AcquisitionAttribution_adsetId_idx" on crm."AcquisitionAttribution" ("adsetId");
create index if not exists "AcquisitionAttribution_adId_idx" on crm."AcquisitionAttribution" ("adId");
