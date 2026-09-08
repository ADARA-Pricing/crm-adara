import { expect, it } from "vitest";
import { logisticsViewWhere, logisticsViews } from "./logistics-board";
const today = new Date("2026-09-08T03:00:00Z");
it("uses scheduled Argentina day boundaries", () => { expect(logisticsViewWhere("today", today)).toMatchObject({ deliveryDate: { gte: today, lt: new Date("2026-09-09T03:00:00Z") } }); });
it("keeps future preparation separate from shipped and delivered", () => { const where = logisticsViewWhere("next", today); expect(where).toMatchObject({ deliveryDate: { gte: new Date("2026-09-09T03:00:00Z") } }); expect(JSON.stringify(where)).not.toMatch(/SHIPPED|DELIVERED/); });
it("uses existing statuses without modifying transitions", () => { expect(logisticsViewWhere("finished", today)).toEqual({ status: "DELIVERED" }); expect(logisticsViewWhere("transit", today)).toEqual({ status: "SHIPPED" }); });
it("keeps unscheduled and overdue work in pending view", () => { expect(logisticsViewWhere("active", today)).not.toHaveProperty("deliveryDate"); expect(logisticsViews).toHaveLength(5); });
