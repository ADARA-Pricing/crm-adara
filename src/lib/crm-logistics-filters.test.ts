import { expect, it } from "vitest";
import { logisticsFilter, logisticsStates } from "./crm-logistics-filters";
const now = new Date("2026-09-08T01:00:00Z");
it("only lists existing active logistics states", () => { expect(logisticsFilter({status:"DELIVERED"}, now).where.status).toEqual({in:[...logisticsStates]}); });
it("keeps pickup as a valid separate modality", () => { expect(logisticsFilter({method:"PICKUP",status:"READY_FOR_PICKUP"}, now).where).toMatchObject({deliveryMethod:"PICKUP",status:"READY_FOR_PICKUP"}); });
it("uses the scheduled date, not requested date, for overdue", () => { expect(logisticsFilter({timing:"overdue"}, now).where.AND).toEqual([{deliveryDate:{lt:new Date("2026-09-07T03:00:00Z")}}]); });
it("combines selected date and timing without overriding either", () => { expect(logisticsFilter({date:"2026-09-07",timing:"unscheduled"}, now).where.AND).toHaveLength(2); });
it("rejects impossible dates", () => { expect(logisticsFilter({date:"2026-02-30"}, now).error).toBeTruthy(); });
it("includes the whole Argentina day", () => { expect(logisticsFilter({timing:"today"}, now).where.AND).toEqual([{deliveryDate:{gte:new Date("2026-09-07T03:00:00Z"),lt:new Date("2026-09-08T03:00:00Z")}}]); });
