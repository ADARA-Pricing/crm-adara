ALTER TABLE crm."Conversation" ADD COLUMN IF NOT EXISTS "botPaused" boolean NOT NULL DEFAULT false;
