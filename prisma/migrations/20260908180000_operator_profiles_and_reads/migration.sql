-- Additive CRM-only data. No changes to bot contracts or public schema.
ALTER TABLE crm."UserProfile" ADD COLUMN "avatarColor" TEXT NOT NULL DEFAULT 'brown';
CREATE TABLE crm."OperatorMessageRead" (
  "userId" TEXT NOT NULL REFERENCES crm."UserProfile"("id") ON DELETE CASCADE,
  "conversationId" TEXT NOT NULL REFERENCES crm."Conversation"("id") ON DELETE CASCADE,
  "messageId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "conversationId", "messageId")
);
ALTER TABLE crm."OperatorMessageRead" ENABLE ROW LEVEL SECURITY;
