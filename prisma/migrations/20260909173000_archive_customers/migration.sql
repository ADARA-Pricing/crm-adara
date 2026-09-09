ALTER TABLE "crm"."Customer" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "archivedById" TEXT;
CREATE INDEX IF NOT EXISTS "Customer_archivedAt_idx" ON "crm"."Customer"("archivedAt");
CREATE TABLE IF NOT EXISTS "crm"."CustomerArchiveEvent" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerArchiveEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerArchiveEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "crm"."Customer"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "CustomerArchiveEvent_customerId_createdAt_idx" ON "crm"."CustomerArchiveEvent"("customerId", "createdAt");
