alter table crm."Customer"
  add column if not exists "deliveryPreference" text,
  add column if not exists locality text,
  add column if not exists "deliveryAddress" text,
  add column if not exists "postalCode" text,
  add column if not exists "requestedDate" timestamptz;
