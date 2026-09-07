CREATE TABLE IF NOT EXISTS crm."ConversationMessageCache" (
  "conversationId" text PRIMARY KEY REFERENCES crm."Conversation"(id) ON DELETE CASCADE,
  "payload" jsonb NOT NULL,
  "syncedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE crm."ConversationMessageCache" ENABLE ROW LEVEL SECURITY;
