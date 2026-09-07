ALTER TABLE crm."Customer" ADD COLUMN "assigneeId" TEXT REFERENCES crm."UserProfile"(id) ON DELETE SET NULL;
CREATE INDEX "Customer_assigneeId_idx" ON crm."Customer"("assigneeId");
ALTER TABLE crm."Conversation" ADD COLUMN "lastIncomingAt" TIMESTAMP(3), ADD COLUMN "lastOutgoingAt" TIMESTAMP(3), ADD COLUMN "activitySyncedAt" TIMESTAMP(3);
CREATE INDEX "Conversation_lastIncomingAt_idx" ON crm."Conversation"("lastIncomingAt");
-- Recover activity only from actual cached message timestamps, never from CRM updatedAt.
WITH activity AS (
 SELECT cache."conversationId",
 max((message->>'createdAt')::timestamptz AT TIME ZONE 'UTC') FILTER (WHERE message->>'direction'='incoming') AS incoming,
 max((message->>'createdAt')::timestamptz AT TIME ZONE 'UTC') FILTER (WHERE message->>'direction'='outgoing') AS outgoing
 FROM crm."ConversationMessageCache" cache CROSS JOIN LATERAL jsonb_array_elements(cache.payload->'messages') message
 WHERE message->>'createdAt' ~ '^\d{4}-\d{2}-\d{2}T' AND (message->>'createdAt')::timestamptz <= CURRENT_TIMESTAMP
 GROUP BY cache."conversationId"
)
UPDATE crm."Conversation" c SET "lastIncomingAt"=activity.incoming,"lastOutgoingAt"=activity.outgoing,"activitySyncedAt"=CURRENT_TIMESTAMP
FROM activity WHERE c.id=activity."conversationId";

CREATE TABLE crm."AutomationRule" (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT false,
 stage crm."FunnelStage" NOT NULL, category TEXT, action TEXT NOT NULL CHECK (action IN ('TASK','MESSAGE_DRAFT')),
 content TEXT NOT NULL, "dueHours" INTEGER NOT NULL DEFAULT 24 CHECK ("dueHours" BETWEEN 0 AND 720),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE crm."AutomationRun" (
 id TEXT PRIMARY KEY, "ruleId" TEXT NOT NULL REFERENCES crm."AutomationRule"(id) ON DELETE CASCADE,
 "customerId" TEXT NOT NULL REFERENCES crm."Customer"(id) ON DELETE CASCADE,
 stage crm."FunnelStage" NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AutomationRun_customerId_createdAt_idx" ON crm."AutomationRun"("customerId","createdAt");
CREATE TABLE crm."FunnelTransition" (
 id TEXT PRIMARY KEY, "customerId" TEXT NOT NULL REFERENCES crm."Customer"(id) ON DELETE CASCADE,
 "fromStage" crm."FunnelStage", "toStage" crm."FunnelStage" NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "FunnelTransition_createdAt_toStage_idx" ON crm."FunnelTransition"("createdAt","toStage");
ALTER TABLE crm."AutomationRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm."AutomationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm."FunnelTransition" ENABLE ROW LEVEL SECURITY;

-- Capture only actual future changes, regardless of whether CRM, bot or logistics caused them.
-- Tasks/drafts are transactional. This trigger never sends a message or calls an external API.
CREATE FUNCTION crm.capture_funnel_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE transition_id TEXT; rule_row RECORD; run_id TEXT;
BEGIN
 IF TG_OP = 'UPDATE' AND OLD."funnelStage" IS NOT DISTINCT FROM NEW."funnelStage" THEN RETURN NEW; END IF;
 transition_id := gen_random_uuid()::text;
 INSERT INTO crm."FunnelTransition"(id,"customerId","fromStage","toStage") VALUES
 (transition_id,NEW.id,CASE WHEN TG_OP='UPDATE' THEN OLD."funnelStage" ELSE NULL END,NEW."funnelStage");
 FOR rule_row IN SELECT * FROM crm."AutomationRule" WHERE enabled AND stage=NEW."funnelStage"
   AND (category IS NULL OR category=ANY(NEW."interestCategories")) LOOP
   run_id := gen_random_uuid()::text;
   INSERT INTO crm."AutomationRun"(id,"ruleId","customerId",stage,content,status)
   VALUES(run_id,rule_row.id,NEW.id,NEW."funnelStage",rule_row.content,CASE WHEN rule_row.action='TASK' THEN 'TASK_CREATED' ELSE 'DRAFT' END);
   IF rule_row.action='TASK' THEN
     INSERT INTO crm."Task"(id,title,description,type,status,"dueAt","customerId","assigneeId","createdAt","updatedAt")
     VALUES(run_id,left(rule_row.content,180),'Regla: '||rule_row.name,'FOLLOW_UP','OPEN',CURRENT_TIMESTAMP + make_interval(hours=>rule_row."dueHours"),NEW.id,(SELECT id FROM crm."UserProfile" WHERE id=NEW."assigneeId" AND "isActive"),CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
   END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER customer_funnel_transition AFTER INSERT OR UPDATE OF "funnelStage" ON crm."Customer"
FOR EACH ROW EXECUTE FUNCTION crm.capture_funnel_transition();
