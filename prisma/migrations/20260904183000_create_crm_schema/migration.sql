-- CRM Adara lives in its own PostgreSQL schema. It deliberately does not
-- modify the existing public schema used by the pricing application.
create schema if not exists crm;

create type crm."CustomerStatus" as enum ('LEAD', 'ACTIVE', 'INACTIVE');
create type crm."OrderStatus" as enum (
  'DRAFT',
  'AWAITING_CUSTOMER_CONFIRMATION',
  'PENDING_REVIEW',
  'APPROVED_FOR_LOGISTICS',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);
create type crm."ConversationStatus" as enum ('OPEN', 'HUMAN_HANDOFF', 'CLOSED');

create table crm."Customer" (
  id text primary key,
  "whatsappId" text unique,
  phone text unique,
  "fullName" text,
  email text unique,
  status crm."CustomerStatus" not null default 'LEAD',
  notes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table crm."Product" (
  id text primary key,
  sku text not null unique,
  name text not null,
  description text,
  "priceCents" integer not null,
  currency text not null default 'ARS',
  stock integer not null default 0,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table crm."Order" (
  id text primary key,
  "customerId" text not null references crm."Customer"(id),
  status crm."OrderStatus" not null default 'DRAFT',
  "deliveryMethod" text not null,
  "paymentMethod" text not null,
  "recipientName" text not null,
  "deliveryAddress" text not null,
  "postalCode" text,
  locality text not null,
  "requestedDate" timestamptz,
  "shippingCents" integer not null default 0,
  "riskReview" boolean not null default false,
  "reviewReason" text,
  "totalCents" integer not null default 0,
  currency text not null default 'ARS',
  source text not null default 'whatsapp',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index "Order_status_createdAt_idx" on crm."Order" (status, "createdAt" desc);
create index "Order_customerId_idx" on crm."Order" ("customerId");

create table crm."OrderItem" (
  id text primary key,
  "orderId" text not null references crm."Order"(id) on delete cascade,
  "productId" text not null references crm."Product"(id),
  quantity integer not null check (quantity > 0),
  "unitPriceCents" integer not null
);

create index "OrderItem_orderId_idx" on crm."OrderItem" ("orderId");

create table crm."Conversation" (
  id text primary key,
  "customerId" text not null references crm."Customer"(id),
  "botpressId" text unique,
  channel text not null default 'whatsapp',
  status crm."ConversationStatus" not null default 'OPEN',
  summary text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table crm."ConversationEvent" (
  id text primary key,
  "conversationId" text not null references crm."Conversation"(id) on delete cascade,
  direction text not null,
  type text not null,
  payload jsonb not null,
  "createdAt" timestamptz not null default now()
);

create index "ConversationEvent_conversationId_createdAt_idx"
  on crm."ConversationEvent" ("conversationId", "createdAt");

-- Zones are kept separate from the static bot prompt. They support later
-- postal-code coverage checks and operational risk rules without exposing
-- the risk decision to the customer.
create table crm.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  locality text not null,
  locality_normalized text not null unique,
  postal_codes text[] not null default '{}',
  coverage_status text not null default 'PRELIMINARY'
    check (coverage_status in ('PRELIMINARY', 'ACTIVE', 'UNAVAILABLE')),
  risk_level text not null default 'REVIEW'
    check (risk_level in ('REVIEW', 'STANDARD', 'RESTRICTED')),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The first sellable item. Stock stays at zero because it will be managed
-- outside the bot until the stock integration is explicitly enabled.
insert into crm."Product" (id, sku, name, description, "priceCents", stock)
values (
  'infinix-smart-10-negro',
  'INFINIX-SMART-10-NEGRO',
  'Infinix Smart 10 negro',
  '12 meses de garantía.',
  19999900,
  0
);
