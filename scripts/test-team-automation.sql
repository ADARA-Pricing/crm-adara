-- Read/write integration test on synthetic records; no persistent changes.
BEGIN;
DO $$
DECLARE lead_id TEXT := 'qa-'||gen_random_uuid()::text; task_rule TEXT := 'qa-'||gen_random_uuid()::text;
 draft_rule TEXT := 'qa-'||gen_random_uuid()::text; rule_off TEXT := 'qa-'||gen_random_uuid()::text;
 count_runs INTEGER;
BEGIN
 INSERT INTO crm."AutomationRule"(id,name,stage,action,content,"updatedAt") VALUES(rule_off,'QA disabled','FIRST_CONTACT','TASK','Should never run',CURRENT_TIMESTAMP);
 INSERT INTO crm."AutomationRule"(id,name,enabled,stage,category,action,content,"updatedAt") VALUES
 (task_rule,'QA task',true,'VERY_INTERESTED','QA-CATEGORY','TASK','QA followup',CURRENT_TIMESTAMP),
 (draft_rule,'QA draft',true,'VERY_INTERESTED','QA-CATEGORY','MESSAGE_DRAFT','QA draft only',CURRENT_TIMESTAMP);
 INSERT INTO crm."Customer"(id,"fullName","interestCategories","updatedAt") VALUES(lead_id,'QA rollback only',ARRAY['QA-CATEGORY'],CURRENT_TIMESTAMP);
 IF EXISTS(SELECT 1 FROM crm."AutomationRun" WHERE "ruleId"=rule_off) THEN RAISE EXCEPTION 'Disabled rule executed'; END IF;
 UPDATE crm."Customer" SET "funnelStage"='VERY_INTERESTED' WHERE id=lead_id;
 SELECT count(*) INTO count_runs FROM crm."AutomationRun" WHERE "customerId"=lead_id;
 IF count_runs<>2 THEN RAISE EXCEPTION 'Expected two runs, got %',count_runs; END IF;
 IF (SELECT count(*) FROM crm."Task" WHERE "customerId"=lead_id)<>1 THEN RAISE EXCEPTION 'Expected one task'; END IF;
 UPDATE crm."Customer" SET "funnelStage"='VERY_INTERESTED' WHERE id=lead_id;
 IF (SELECT count(*) FROM crm."AutomationRun" WHERE "customerId"=lead_id)<>2 THEN RAISE EXCEPTION 'Repeated same stage duplicated rules'; END IF;
 IF (SELECT count(*) FROM crm."FunnelTransition" WHERE "customerId"=lead_id)<>2 THEN RAISE EXCEPTION 'Wrong transition count'; END IF;
 UPDATE crm."Customer" SET "funnelStage"='INTERESTED',"interestCategories"=ARRAY['OTHER'] WHERE id=lead_id;
 UPDATE crm."Customer" SET "funnelStage"='VERY_INTERESTED' WHERE id=lead_id;
 IF (SELECT count(*) FROM crm."AutomationRun" WHERE "customerId"=lead_id)<>2 THEN RAISE EXCEPTION 'Category condition ignored'; END IF;
END $$;
ROLLBACK;
SELECT 'automation_rules_passed_rollback' AS result;
