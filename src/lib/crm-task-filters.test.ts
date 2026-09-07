import { expect, it } from "vitest";
import { taskTimingFilter } from "./crm-task-filters";
const now = new Date("2026-09-08T01:00:00Z");
it("limits today's active tasks to the Argentina calendar day", () => { expect(taskTimingFilter("today", now)).toEqual({ status: { in: ["OPEN", "IN_PROGRESS"] }, dueAt: { gte: new Date("2026-09-07T03:00:00Z"), lt: new Date("2026-09-08T03:00:00Z") } }); });
it("uses strict overdue and inclusive upcoming boundary", () => { expect(taskTimingFilter("overdue", now).dueAt).toEqual({ lt: now }); expect(taskTimingFilter("upcoming", now).dueAt).toEqual({ gte: now, lte: new Date("2026-09-15T01:00:00Z") }); });
it("excludes completed tasks from active views", () => { expect(taskTimingFilter("completed", now)).toEqual({ status: "DONE" }); expect(taskTimingFilter("unknown", now)).toEqual({}); });
