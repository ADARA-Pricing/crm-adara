import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidBotpressWebhook } from "@/lib/webhook-auth";

export const runtime = "nodejs";

const statements = [
  'alter table crm."Order" add column if not exists "reviewedAt" timestamptz',
  'alter table crm."Order" add column if not exists "assignedCourier" text',
  'alter table crm."Order" add column if not exists "deliveryTimeWindow" text',
  'alter table crm."Order" add column if not exists "logisticsNote" text',
  'alter table crm."Order" add column if not exists "deliveredAt" timestamptz',
  'create table if not exists crm."OrderActivity" (id text primary key, "orderId" text not null references crm."Order"(id) on delete cascade, action text not null, detail text, "createdAt" timestamptz not null default now())',
  'create index if not exists "OrderActivity_orderId_createdAt_idx" on crm."OrderActivity" ("orderId", "createdAt")',
  'create table if not exists crm."AcquisitionAttribution" (id text primary key, "customerId" text not null references crm."Customer"(id) on delete cascade, source text, referrer text, "utmSource" text, "utmCampaign" text, "utmContent" text, "campaignId" text, "campaignName" text, "adsetId" text, "adsetName" text, "adId" text, "adName" text, "capturedAt" timestamptz not null default now())',
  'alter table crm."Order" add column if not exists "attributionId" text',
  'create index if not exists "AcquisitionAttribution_customerId_capturedAt_idx" on crm."AcquisitionAttribution" ("customerId", "capturedAt")',
  'create index if not exists "AcquisitionAttribution_campaignId_idx" on crm."AcquisitionAttribution" ("campaignId")',
  'create index if not exists "AcquisitionAttribution_adsetId_idx" on crm."AcquisitionAttribution" ("adsetId")',
  'create index if not exists "AcquisitionAttribution_adId_idx" on crm."AcquisitionAttribution" ("adId")',
  'do $$ begin if not exists (select 1 from pg_constraint where conname = \'Order_attributionId_fkey\') then alter table crm."Order" add constraint "Order_attributionId_fkey" foreign key ("attributionId") references crm."AcquisitionAttribution"(id) on delete set null; end if; end $$'
];

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidBotpressWebhook(request.headers.get("x-adara-signature"), rawBody)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
  const columns = await prisma.$queryRawUnsafe<{ column_name: string }[]>("select column_name from information_schema.columns where table_schema = 'crm' and table_name = 'Order' and column_name in ('reviewedAt', 'assignedCourier', 'deliveryTimeWindow', 'logisticsNote', 'deliveredAt', 'attributionId')");
  if (columns.length !== 6) return NextResponse.json({ error: "Schema verification failed" }, { status: 500 });
  return NextResponse.json({ repaired: true });
}
