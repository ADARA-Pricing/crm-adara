ALTER TABLE crm."Customer" ADD COLUMN IF NOT EXISTS "whatsappProfileName" text;
ALTER TABLE crm."Customer" ADD COLUMN IF NOT EXISTS "interestCategories" text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS "Customer_interestCategories_gin" ON crm."Customer" USING gin ("interestCategories");
