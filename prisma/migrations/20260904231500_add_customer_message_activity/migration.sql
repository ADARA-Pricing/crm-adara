alter table crm."Customer"
  add column if not exists "lastMessagePreview" text,
  add column if not exists "lastMessageAt" timestamptz;
